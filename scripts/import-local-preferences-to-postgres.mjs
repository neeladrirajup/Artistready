import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import pg from 'pg';

const state='.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const file=readdirSync(state).find(name=>name.endsWith('.sqlite')&&name!=='metadata.sqlite');
if(!file)throw new Error('Local app database not found.');
if(!process.env.PGPASSWORD)throw new Error('Run with the local PostgreSQL credential loaded.');
const sqlite=new DatabaseSync(join(state,file),{readOnly:true});
const rows=sqlite.prepare('SELECT artist_id,visibility,adult_confirmed,version,created_at,updated_at FROM artist_preferences').all();
const client=new pg.Client({host:'127.0.0.1',port:5432,user:'postgres',database:'artistready',password:process.env.PGPASSWORD,connectionTimeoutMillis:5000});
await client.connect();
let imported=0;
try{
 await client.query('BEGIN');
 for(const row of rows){
  const answers={};
  for(const answer of sqlite.prepare('SELECT code,choice,notes FROM artist_preference_answers WHERE artist_id=?').all(row.artist_id))answers[answer.code]={choice:answer.choice,notes:answer.notes};
  const existing=await client.query('SELECT version FROM artistready.profile_preference_settings WHERE artist_id=$1',[row.artist_id]);
  if(existing.rowCount){if(existing.rows[0].version!==row.version)throw new Error(`PostgreSQL preferences already differ for ${row.artist_id}`);continue;}
  await client.query('SET ROLE artistready_api');
  await client.query('CALL artistready.save_preferences($1,$2::jsonb,NULL,NULL)',[row.artist_id,JSON.stringify({visibility:row.visibility,adultConfirmed:!!row.adult_confirmed,answers})]);
  await client.query('RESET ROLE');
  await client.query('UPDATE artistready.profile_preference_settings SET version=$2,created_at=$3,updated_at=$4 WHERE artist_id=$1',[row.artist_id,row.version,row.created_at,row.updated_at]);
  imported++;
 }
 if(process.argv.includes('--dry-run'))await client.query('ROLLBACK');else await client.query('COMMIT');
 console.log(JSON.stringify({mode:process.argv.includes('--dry-run')?'dry-run':'applied',sourcePreferences:rows.length,imported}));
}catch(error){await client.query('ROLLBACK');throw error}
finally{await client.end();sqlite.close()}
