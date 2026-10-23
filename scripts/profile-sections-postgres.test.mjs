import assert from 'node:assert/strict';
import pg from 'pg';
import {empty} from '../src/lib/profile-model.ts';
import {profileSectionKeys} from '../src/lib/profile-sections.ts';

if(!process.env.PGPASSWORD)throw new Error('Load the local PostgreSQL credential first.');
const owner=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('section-test-'+crypto.randomUUID()))).toString('hex');
const client=new pg.Client({host:'127.0.0.1',port:5432,user:'postgres',database:'artistready',password:process.env.PGPASSWORD,connectionTimeoutMillis:5000});
await client.connect();
try{
 await client.query('BEGIN');
 await client.query('SET ROLE artistready_api');
 const initial={...empty,name:'Section procedure test',role:'Actor',city:'Hyderabad'};
 let result=await client.query('CALL artistready.save_profile($1,$2::jsonb,NULL,NULL)',[owner,JSON.stringify(initial)]);
 let version=result.rows[0].p_result.version;
 assert.equal(version,1);
 for(const [section,keys] of Object.entries(profileSectionKeys)){
  const before=(await client.query('SELECT artistready.get_my_profile($1) AS result',[owner])).rows[0].result.draft;
  const key=keys[0],patch={[key]:before[key]};
  result=await client.query(`CALL artistready.save_${section}($1,$2::jsonb,$3,NULL)`,[owner,JSON.stringify(patch),version]);
  version++;
  assert.equal(result.rows[0].p_result.version,version,section);
  const after=result.rows[0].p_result.draft;
  assert.deepEqual(after,before,`${section} altered another profile field`);
 }
 await client.query('SAVEPOINT invalid_field');
 await assert.rejects(client.query('CALL artistready.save_about($1,$2::jsonb,$3,NULL)',[owner,JSON.stringify({skills:['Forbidden']}),version]),{code:'22023'});
 await client.query('ROLLBACK TO SAVEPOINT invalid_field');
 await assert.rejects(client.query('CALL artistready.save_about($1,$2::jsonb,$3,NULL)',[owner,JSON.stringify({bio:'Stale'}),version-1]),{code:'40001'});
 await client.query('ROLLBACK');
 console.log(`Passed ${Object.keys(profileSectionKeys).length} section procedures, field isolation and version rejection.`);
}catch(error){try{await client.query('ROLLBACK')}catch{}throw error}
finally{await client.end()}
