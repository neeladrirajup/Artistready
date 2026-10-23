import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import pg from 'pg';
import {loadProfiles} from '../src/lib/profile-relational.ts';

const state='.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const file=readdirSync(state).find(name=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');
if(!file)throw new Error('Local app database not found.');
if(!process.env.PGPASSWORD)throw new Error('Run with the local PostgreSQL credential loaded.');
const sqlite=new DatabaseSync(join(state,file),{readOnly:true});
const database={prepare(query){const statement=sqlite.prepare(query);return {bind(...values){return {all:async()=>({results:statement.all(...values)})}}}}};
const rows=sqlite.prepare('SELECT id,name,role,city,version,created_at,updated_at FROM profiles ORDER BY updated_at').all();
const drafts=await loadProfiles(database,rows);
const media=sqlite.prepare('SELECT owner_id,id,kind,storage_key,name,mime,size FROM profile_media ORDER BY created_at,id').all();
const client=new pg.Client({host:'127.0.0.1',port:5432,user:'postgres',database:'artistready',password:process.env.PGPASSWORD,connectionTimeoutMillis:5000});
await client.connect();
let imported=0,archived=0;
try{
 await client.query('BEGIN');
 for(const row of rows){
  const prior=await client.query('SELECT version FROM artistready.profiles WHERE id=$1',[row.id]);
  if(prior.rowCount){if(prior.rows[0].version!==row.version)throw new Error(`Local PostgreSQL profile ${row.id} already differs; import stopped.`);continue;}
  await client.query('SET ROLE artistready_api');
  await client.query('CALL artistready.save_profile($1,$2::jsonb,NULL,NULL)',[row.id,JSON.stringify(drafts.get(row.id))]);
  await client.query('RESET ROLE');
  await client.query('UPDATE artistready.profiles SET version=$2,created_at=$3,updated_at=$4 WHERE id=$1',[row.id,row.version,row.created_at,row.updated_at]);
  imported++;
 }
 for(const item of media){
  const current=await client.query('SELECT storage_key FROM artistready.profile_media WHERE owner_id=$1 AND id=$2',[item.owner_id,item.id]);
  if(current.rowCount){if(current.rows[0].storage_key!==item.storage_key)throw new Error(`Media ${item.id} already differs; import stopped.`);continue;}
  await client.query('SET ROLE artistready_api');
  await client.query('CALL artistready.save_media($1,$2::jsonb,NULL)',[item.owner_id,JSON.stringify(item)]);
  await client.query('RESET ROLE');
 }
 for(const row of rows){
  const result=await client.query('UPDATE artistready.profiles SET is_archived=true WHERE id<>$1 AND name=$2 AND version<$3 AND NOT is_archived',[row.id,row.name,row.version]);
  archived+=result.rowCount??0;
 }
 if(process.argv.includes('--dry-run'))await client.query('ROLLBACK');else await client.query('COMMIT');
 console.log(JSON.stringify({mode:process.argv.includes('--dry-run')?'dry-run':'applied',sourceProfiles:rows.length,sourceMedia:media.length,imported,archived}));
}catch(error){await client.query('ROLLBACK');throw error}
finally{await client.end();sqlite.close()}
