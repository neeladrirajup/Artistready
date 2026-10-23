import { Client } from 'pg';
import type { Draft } from './profile-model';
import type { ProfileSection } from './profile-sections';

export type PostgresBinding={connectionString:string};
export type StoredMedia={id:string;owner_id:string;kind:'photo'|'video';storage_key:string;name:string;mime:string;size:number;created_at:string};

async function withDatabase<T>(binding:PostgresBinding,work:(client:Client)=>Promise<T>):Promise<T>{
 const client=new Client({connectionString:binding.connectionString,connectionTimeoutMillis:5000});
 await client.connect();
 try{
  await client.query('SET ROLE artistready_api');
  return await work(client);
 }finally{await client.end()}
}

// PostgreSQL decodes the JSONB output parameter; the route uses Response.json.
async function callJson<T>(binding:PostgresBinding,statement:string,args:unknown[]):Promise<T>{
 return withDatabase(binding,async client=>{
  const result=await client.query<{p_result:T}>(statement,args);
  return result.rows[0]?.p_result;
 });
}

export const getMyProfile=(binding:PostgresBinding,owner:string)=>
 callJson<unknown>(binding,'CALL artistready.read_my_profile($1,NULL)',[owner]);
export const getProfile=(binding:PostgresBinding,artist:string,viewer:string)=>
 callJson<unknown>(binding,'CALL artistready.read_profile($1,$2,NULL)',[artist,viewer]);
export const listProfiles=(binding:PostgresBinding,viewer:string)=>
 callJson<unknown>(binding,'CALL artistready.read_artists($1,NULL)',[viewer]);
export const searchProfiles=(binding:PostgresBinding,viewer:string,filter:Record<string,unknown>)=>
 callJson<unknown>(binding,'CALL artistready.read_search($1,$2::jsonb,NULL)',[viewer,JSON.stringify(filter)]);
export const getPreferences=(binding:PostgresBinding,artist:string,viewer:string)=>
 callJson<unknown>(binding,'CALL artistready.read_preferences($1,$2,NULL)',[artist,viewer]);
export const getMyPreferences=(binding:PostgresBinding,owner:string)=>
 callJson<unknown>(binding,'CALL artistready.read_my_preferences($1,NULL)',[owner]);
export const getMedia=(binding:PostgresBinding,owner:string,id:string)=>
 callJson<StoredMedia|null>(binding,'CALL artistready.read_media($1,$2,NULL)',[owner,id]);
export const getPhotoCount=(binding:PostgresBinding,owner:string)=>
 callJson<number>(binding,'CALL artistready.read_photo_count($1,NULL)',[owner]);
export const getIndiaStates=(binding:PostgresBinding)=>
 callJson<unknown>(binding,'CALL artistready.read_india_states(NULL)',[]);
export const getIndiaCities=(binding:PostgresBinding,stateCode:string)=>
 callJson<unknown>(binding,'CALL artistready.read_india_cities($1,NULL)',[stateCode]);

export const saveMyPreferences=(binding:PostgresBinding,owner:string,preferences:unknown,version:number|null)=>
 callJson<unknown>(binding,'CALL artistready.save_preferences($1,$2::jsonb,$3,NULL)',[owner,JSON.stringify(preferences),version]);
export const saveMyProfile=(binding:PostgresBinding,owner:string,draft:Draft,version:number|null)=>
 callJson<unknown>(binding,'CALL artistready.save_profile($1,$2::jsonb,$3,NULL)',[owner,JSON.stringify(draft),version]);
export const saveProfileSection=(binding:PostgresBinding,owner:string,section:ProfileSection,patch:Record<string,unknown>,version:number)=>
 // The route checks section against profileSectionKeys before reaching this call.
 callJson<unknown>(binding,`CALL artistready.save_${section}($1,$2::jsonb,$3,NULL)`,[owner,JSON.stringify(patch),version]);
export const upsertMedia=(binding:PostgresBinding,owner:string,media:{id:string;kind:string;storage_key:string;name:string;mime:string;size:number})=>
 callJson<unknown>(binding,'CALL artistready.save_media($1,$2::jsonb,NULL)',[owner,JSON.stringify(media)]);
export const removeMedia=(binding:PostgresBinding,owner:string,id:string)=>
 withDatabase(binding,async client=>{
  const result=await client.query<{p_storage_key:string|null}>('CALL artistready.delete_media($1,$2,NULL)',[owner,id]);
  return result.rows[0]?.p_storage_key??null;
 });
