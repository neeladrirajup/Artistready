import { empty, type Draft } from './profile-model';
import type { Preferences } from './artist-preferences';

type DB = D1Database;
type ProfileRow = {id:string;name:string;role:string;city:string;version:number;updated_at:string};
type RecordRow = Record<string, unknown>;
const detailFields = [
 'bodyBuild','bodyBuildDescription','bookingAvailableFrom','bookingTravel','bookingLocations','bookingRepresentative','bookingEmail','bookingPhone','bookingNotes','gender','genderDescription','maritalStatus','workStatus','occupation','hairStyle','hairColor','ageFrom','ageTo','coverId','bio','experience','photo','reel',
] as const;
const detailBooleans = ['showBookingContact','available'] as const;
const callFields = ['shootingStatus','project','shootFrom','shootTo','notes'] as const;
const measurementColumns = {measurementFit:'measurement_fit',bust:'bust_in',heightFeet:'height_feet',heightInches:'height_inch_part',weight:'weight_kg',chest:'chest_in',waist:'waist_in',hip:'hip_in'} as const;
const collectionTables = {
 castingRoles:'artist_casting_roles',additionalRoles:'artist_additional_roles',languages:'artist_languages',skills:'artist_skills',pinnedMedia:'artist_pinned_media',reelLinks:'artist_reel_links',
} as const;
const itemTables = {
 credits:['artist_credits',['id','title','type','role','year','director','production','trailer']],
 training:['artist_training',['id','title','organisation','year','notes']],
 recognition:['artist_recognition',['id','title','organisation','year','notes']],
 education:['artist_education',['id','qualification','institution','year','notes']],
} as const;
const camelToSnake=(s:string)=>s.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
const placeholders=(n:number)=>Array(n).fill('?').join(',');
const inSql=(ids:string[])=>placeholders(ids.length);
const query=async(db:DB,sql:string,ids:string[])=>ids.length?(await db.prepare(sql).bind(...ids).all<RecordRow>()).results:[];

export async function loadProfiles(db:DB, rows:ProfileRow[]) {
 const ids=rows.map(r=>r.id), result=new Map<string,Draft>();
 for(const r of rows)result.set(r.id,{...empty,name:r.name,role:r.role,city:r.city,callSheet:{...empty.callSheet,dates:[]},castingRoles:[],additionalRoles:[],skillCategories:{},pinnedMedia:[],credits:[],training:[],recognition:[],clothing:{},education:[],reelLinks:[],languages:[],skills:[]});
 if(!ids.length)return result;
 const select=(table:string)=>query(db,`SELECT * FROM ${table} WHERE artist_id IN (${inSql(ids)}) ORDER BY sort_order`,ids);
 const [details,measurements,calls,dates,clothing,categories,...collections]=await Promise.all([
  query(db,`SELECT * FROM artist_profile_details WHERE artist_id IN (${inSql(ids)})`,ids),
  query(db,`SELECT * FROM artist_measurements WHERE artist_id IN (${inSql(ids)})`,ids),
  query(db,`SELECT * FROM artist_call_sheets WHERE artist_id IN (${inSql(ids)})`,ids),
  select('artist_call_sheet_dates'),select('artist_clothing_sizes'),select('artist_skill_categories'),
  ...Object.values(collectionTables).map(select),...Object.values(itemTables).map(([table])=>select(table)),
 ]);
 for(const row of details){const draft=result.get(String(row.artist_id));if(!draft)continue;for(const field of detailFields)(draft as unknown as Record<string,unknown>)[field]=row[camelToSnake(field)]??'';for(const field of detailBooleans)(draft as unknown as Record<string,unknown>)[field]=Boolean(row[camelToSnake(field)]);}
 for(const row of measurements){const draft=result.get(String(row.artist_id));if(!draft)continue;for(const [field,column] of Object.entries(measurementColumns))(draft as unknown as Record<string,unknown>)[field]=row[column]==null?'':String(row[column]);}
 for(const row of calls){const draft=result.get(String(row.artist_id));if(!draft)continue;for(const field of callFields)(draft.callSheet as unknown as Record<string,unknown>)[field]=row[camelToSnake(field)]??'';}
 for(const row of dates){const draft=result.get(String(row.artist_id));if(draft)draft.callSheet.dates.push({id:String(row.id),from:String(row.from_date),to:String(row.to_date),status:row.status as Draft['callSheet']['dates'][number]['status'],notes:String(row.notes)});}
 for(const row of clothing){const draft=result.get(String(row.artist_id));if(draft)draft.clothing[String(row.size_key)]=String(row.size_value);}
 for(const row of categories){const draft=result.get(String(row.artist_id));if(draft)draft.skillCategories[String(row.skill)]=String(row.category);}
 let index=0;
 for(const key of Object.keys(collectionTables) as (keyof typeof collectionTables)[]){for(const row of collections[index++]){const draft=result.get(String(row.artist_id));if(draft)(draft[key] as string[]).push(String(row.value));}}
 for(const key of Object.keys(itemTables) as (keyof typeof itemTables)[]){const fields=itemTables[key][1];for(const row of collections[index++]){const draft=result.get(String(row.artist_id));if(draft){const item=Object.fromEntries(fields.map(field=>[field,String(row[camelToSnake(field)]??'')]));(draft[key] as unknown as RecordRow[]).push(item);}}}
 return result;
}

export async function loadPreferences(db:DB,artistId:string):Promise<{preferences:Preferences;version:number;updatedAt:string}|null>{
 const row=await db.prepare('SELECT visibility,adult_confirmed,version,updated_at FROM artist_preferences WHERE artist_id=?').bind(artistId).first<{visibility:Preferences['visibility'];adult_confirmed:number;version:number;updated_at:string}>();
 if(!row)return null;
 const answers=(await db.prepare('SELECT code,choice,notes FROM artist_preference_answers WHERE artist_id=?').bind(artistId).all<{code:string;choice:Preferences['answers'][string]['choice'];notes:string}>()).results;
 return {preferences:{visibility:row.visibility,adultConfirmed:Boolean(row.adult_confirmed),answers:Object.fromEntries(answers.map(r=>[r.code,{choice:r.choice,notes:r.notes}]))},version:row.version,updatedAt:row.updated_at};
}

function replaceRows(db:DB,statements:D1PreparedStatement[],table:string,owner:string,version:number,now:string,rows:unknown[][],columns:string[]){
 const guard='EXISTS (SELECT 1 FROM profiles WHERE id=? AND version=? AND updated_at=?)';
 statements.push(db.prepare(`DELETE FROM ${table} WHERE artist_id=? AND ${guard}`).bind(owner,owner,version,now));
 for(const values of rows)statements.push(db.prepare(`INSERT INTO ${table}(artist_id,${columns.join(',')}) SELECT ?,${placeholders(columns.length)} WHERE ${guard}`).bind(owner,...values,owner,version,now));
}

export async function saveProfile(db:DB,owner:string,draft:Draft,oldVersion:number|null,now:string){
 const nextVersion=(oldVersion??0)+1;
 const statements:D1PreparedStatement[]=[];
 if(oldVersion===null)statements.push(db.prepare('INSERT OR IGNORE INTO profiles(id,name,role,city,version,created_at,updated_at) VALUES(?,?,?,?,1,?,?)').bind(owner,draft.name,draft.role,draft.city,now,now));
 else statements.push(db.prepare('UPDATE profiles SET name=?,role=?,city=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(draft.name,draft.role,draft.city,now,owner,oldVersion));
 const details=[...detailFields.map(f=>draft[f]),...detailBooleans.map(f=>Number(draft[f]))];
 const detailColumns=[...detailFields,...detailBooleans].map(camelToSnake);
 replaceRows(db,statements,'artist_profile_details',owner,nextVersion,now,[details],detailColumns);
 const height=draft.heightFeet===''?'':`${draft.heightFeet} ft ${draft.heightInches||'0'} in`;
 const m=[draft.measurementFit,draft.bodyBuild,draft.bodyBuildDescription,height,draft.heightFeet===''?null:Number(draft.heightFeet),draft.heightInches===''?null:Number(draft.heightInches),draft.heightFeet===''?null:Number(draft.heightFeet)*12+Number(draft.heightInches||0),...(['weight','chest','bust','waist','hip'] as const).map(f=>draft[f]===''?null:Number(draft[f]))];
 replaceRows(db,statements,'artist_measurements',owner,nextVersion,now,[m],['measurement_fit','body_build','body_build_description','height','height_feet','height_inch_part','height_inches','weight_kg','chest_in','bust_in','waist_in','hip_in']);
 replaceRows(db,statements,'artist_call_sheets',owner,nextVersion,now,[[...callFields.map(f=>draft.callSheet[f])]],callFields.map(camelToSnake));
 replaceRows(db,statements,'artist_call_sheet_dates',owner,nextVersion,now,draft.callSheet.dates.map((r,i)=>[i,r.id,r.from,r.to,r.status,r.notes]),['sort_order','id','from_date','to_date','status','notes']);
 replaceRows(db,statements,'artist_clothing_sizes',owner,nextVersion,now,Object.entries(draft.clothing).map(([k,v],i)=>[i,k,v]),['sort_order','size_key','size_value']);
 replaceRows(db,statements,'artist_skill_categories',owner,nextVersion,now,Object.entries(draft.skillCategories).map(([k,v],i)=>[i,k,v]),['sort_order','skill','category']);
 for(const [key,table] of Object.entries(collectionTables) as [keyof typeof collectionTables,string][])replaceRows(db,statements,table,owner,nextVersion,now,draft[key].map((value,i)=>[i,value]),['sort_order','value']);
 for(const [key,[table,fields]] of Object.entries(itemTables) as [keyof typeof itemTables,typeof itemTables[keyof typeof itemTables]][])replaceRows(db,statements,table,owner,nextVersion,now,(draft[key] as unknown as RecordRow[]).map((row,i)=>[i,...fields.map(f=>row[f])]),['sort_order',...fields.map(camelToSnake)]);
 const results=await db.batch(statements);
 return Boolean(results[0].meta.changes);
}

export async function savePreferences(db:DB,owner:string,value:Preferences,oldVersion:number|null,now:string){
 const nextVersion=(oldVersion??0)+1;
 const statements:D1PreparedStatement[]=[oldVersion===null
  ?db.prepare('INSERT OR IGNORE INTO artist_preferences(artist_id,visibility,adult_confirmed,version,created_at,updated_at) VALUES(?,?,?,1,?,?)').bind(owner,value.visibility,Number(value.adultConfirmed),now,now)
  :db.prepare('UPDATE artist_preferences SET visibility=?,adult_confirmed=?,version=version+1,updated_at=? WHERE artist_id=? AND version=?').bind(value.visibility,Number(value.adultConfirmed),now,owner,oldVersion)];
 const guard='EXISTS (SELECT 1 FROM artist_preferences WHERE artist_id=? AND version=? AND updated_at=?)';
 statements.push(db.prepare(`DELETE FROM artist_preference_answers WHERE artist_id=? AND ${guard}`).bind(owner,owner,nextVersion,now));
 for(const [code,answer] of Object.entries(value.answers))statements.push(db.prepare(`INSERT INTO artist_preference_answers(artist_id,code,choice,notes) SELECT ?,?,?,? WHERE ${guard}`).bind(owner,code,answer.choice,answer.notes,owner,nextVersion,now));
 const results=await db.batch(statements);return Boolean(results[0].meta.changes);
}

export type {ProfileRow};
