import { env as workerEnv } from 'cloudflare:workers';
import { getProfileRuntime } from '../../../../../lib/profile-runtime';
import { profileSchema } from '@/lib/profile-validation';
import { empty, type Draft } from '@/lib/profile-model';
import { preferencesSchema, blankPreferences } from '@/lib/artist-preferences';
import { loadProfiles, loadPreferences, saveProfile, savePreferences, type ProfileRow } from '@/lib/profile-relational';
import { getMyProfile, getMedia, getPhotoCount, getIndiaStates, getIndiaCities, listProfiles, searchProfiles, getPreferences, getMyPreferences, saveMyPreferences, saveMyProfile, saveProfileSection, upsertMedia, removeMedia, type PostgresBinding } from '@/lib/postgres-profile';
import { profileSectionKeys, type ProfileSection } from '@/lib/profile-sections';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const hash=async(s:string|ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',typeof s==='string'?new TextEncoder().encode(s):s))).map(b=>b.toString(16).padStart(2,'0')).join('');
type MediaRow={id:string;owner_id:string;kind:'photo'|'video';storage_key:string;name:string;mime:string;size:number;created_at:string};
function viewMedia(m:MediaRow){return {id:m.id,kind:m.kind,name:m.name,mime:m.mime,size:m.size,created:Date.parse(m.created_at),url:`/api/profile/files/${m.owner_id}/${m.id}`};}
async function boundedBody(request:Request,limit:number){
 if(Number(request.headers.get('content-length'))>limit)throw new Error('File or profile is too large.');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();
 const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('File or profile is too large.');}chunks.push(value);}
 const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}return body;
}
async function handle(request:Request){
 try{
  const subject=request.headers.get('oai-authenticated-user-id');
  if(!subject)return json({error:'Sign in with your site account to access your profile.'},401);
  const env=getProfileRuntime()||workerEnv;
  const postgres=(env as typeof env&{POSTGRES?:PostgresBinding}).POSTGRES;
  if(!env.BUCKET||(!postgres&&!env.DB))return json({error:'Profile storage is unavailable. Your browser copy is safe.'},503);
  const db=env.DB!,bucket=env.BUCKET,owner=await hash(subject);
  const url=new URL(request.url),path=url.pathname.replace(/^\/api\/profile\/?/,'').split('/').filter(Boolean);
  if(request.method!=='GET'){
   const origin=request.headers.get('origin');
   if(!origin||origin!==url.origin)return json({error:'Please save from the Artistready website.'},403);
  }
  if(request.method==='GET'&&path[0]==='locations'&&postgres){
   if(path.length===2&&path[1]==='states')return json(await getIndiaStates(postgres));
   if(path.length===2&&path[1]==='cities'){
    const code=url.searchParams.get('state')||'';
    if(!/^[A-Z]{2,3}$/.test(code))return json({error:'Choose a state first.'},400);
    return json(await getIndiaCities(postgres,code));
   }
  }
  if(request.method==='GET'&&path[0]==='me'){
   if(postgres)return json(await getMyProfile(postgres,owner));
   const row=await db.prepare('SELECT id,name,role,city,version,updated_at FROM profiles WHERE id=?').bind(owner).first<ProfileRow>();
   const media=await db.prepare('SELECT * FROM profile_media WHERE owner_id=? ORDER BY created_at,id').bind(owner).all<MediaRow>();
   const drafts=await loadProfiles(db,row?[row]:[]);
   return json({id:owner,draft:drafts.get(owner)??null,version:row?.version??null,updatedAt:row?.updated_at??null,media:media.results.map(viewMedia)});
  }
  // Public profile lists never include preferences. Individual reads enforce audience here.
  if(request.method==='GET'&&path.length===2&&path[0]==='preferences'&&/^[a-f0-9]{64}$/.test(path[1])){
   const target=path[1];
   if(postgres){const result=await getPreferences(postgres,target,owner);return result?json(result):json({error:'Preferences not available.'},404);}
   const row=await loadPreferences(db,target);
   if(!row)return json({error:'Preferences not available.'},404);
   const preferences=row.preferences;
   let allowed=target===owner||preferences.visibility==='everyone';
   if(!allowed&&preferences.visibility==='managers')allowed=!!await db.prepare('SELECT account_id FROM verified_managers WHERE account_id=? AND is_active=1').bind(owner).first();
   if(!allowed)return json({error:'Preferences not available.'},404);
   // Adult self-attestation is private account information, not a shared preference.
   return json({preferences:target===owner?preferences:{visibility:preferences.visibility,answers:preferences.answers},version:target===owner?row.version:null,updatedAt:row.updatedAt});
  }
  if(path.length===1&&path[0]==='preferences'){
   if(request.method==='GET'){
    if(postgres)return json(await getMyPreferences(postgres,owner));
    const row=await loadPreferences(db,owner);
    return json({preferences:row?.preferences??blankPreferences,version:row?.version??null,updatedAt:row?.updatedAt??null});
   }
   if(request.method==='PUT'){
    const body=JSON.parse(new TextDecoder().decode(await boundedBody(request,50_000)));
    const parsed=preferencesSchema.safeParse(body.preferences);
    if(!parsed.success)return json({error:parsed.error.issues[0]?.message||'Check your preferences.'},400);
    if(body.version!==null&&(!Number.isInteger(body.version)||body.version<1))return json({error:'Reload preferences before saving.'},400);
    if(postgres)return json(await saveMyPreferences(postgres,owner,parsed.data,body.version));
    if(!await db.prepare('SELECT id FROM profiles WHERE id=?').bind(owner).first())return json({error:'Save your artist profile first.'},400);
    const now=new Date().toISOString();
    if(!await savePreferences(db,owner,parsed.data,body.version,now))return json({error:'Preferences changed in another tab. Close and reload the page before editing again.'},409);
    return json({preferences:parsed.data,version:body.version===null?1:body.version+1,updatedAt:now});
   }
  }
  if(request.method==='GET'&&path[0]==='search'){
   const params=url.searchParams;
   if(postgres){
    const minHeight=params.get('minHeightInches'),maxHeight=params.get('maxHeightInches');
    for(const raw of [minHeight,maxHeight])if(raw!==null&&(!Number.isInteger(Number(raw))||Number(raw)<36||Number(raw)>96))return json({error:'Invalid height range.'},400);
    if(minHeight!==null&&maxHeight!==null&&Number(minHeight)>Number(maxHeight))return json({error:'Invalid height range.'},400);
    const minAge=Number(params.get('minAge')||18),maxAge=Number(params.get('maxAge')||60);
    if(!Number.isInteger(minAge)||!Number.isInteger(maxAge)||minAge<18||maxAge>60||minAge>maxAge)return json({error:'Invalid age range.'},400);
    const filter={city:params.get('city'),category:params.get('category'),roles:params.getAll('role').slice(0,20),gender:params.get('gender'),bodyBuild:params.get('bodyBuild'),minHeightInches:minHeight,maxHeightInches:maxHeight,available:params.get('available'),minAge,maxAge,languages:params.getAll('language').slice(0,30),skills:[...new Set(params.getAll('skill'))].slice(0,30),q:(params.get('q')||'').trim().slice(0,100),sort:params.get('sort'),offset:Math.min(Math.max(Number(params.get('offset')||0)||0,0),10000),countOnly:params.get('countOnly')};
    const result=await searchProfiles(postgres,owner,filter);
    return json(params.get('countOnly')==='true'?{total:(result as {total:number}).total}:result);
   }
   const categorySql="CASE p.role WHEN 'Actor' THEN 'Actors' WHEN 'Actress' THEN 'Actresses' WHEN 'Director' THEN 'Directors' WHEN 'Writer' THEN 'Writers' ELSE 'Crew' END";
   const where:string[]=['p.id <> ?'];const values:(string|number)[]=[owner];
   const city=params.get('city');if(city&&city!=='All locations'){where.push('p.city = ?');values.push(city);}
   const category=params.get('category');if(category&&category!=='All'){where.push(`${categorySql} = ?`);values.push(category);}
   const roles=params.getAll('role').slice(0,20);if(roles.length){where.push(`${categorySql} IN (${roles.map(()=>'?').join(',')})`);values.push(...roles);}
   const gender=params.get('gender');if(gender&&gender!=='All'){where.push('d.gender = ?');values.push(gender);}
   const bodyBuild=params.get('bodyBuild');if(bodyBuild){where.push('m.body_build=?');values.push(bodyBuild);}
   const minHeight=params.get('minHeightInches'),maxHeight=params.get('maxHeightInches');
   if(minHeight!==null&&maxHeight!==null&&Number(minHeight)>Number(maxHeight))return json({error:'Invalid height range.'},400);
   for(const [raw,operator] of [[minHeight,'>='],[maxHeight,'<=']] as const){if(raw!==null){const inches=Number(raw);if(!Number.isInteger(inches)||inches<36||inches>96)return json({error:'Invalid height range.'},400);where.push(`m.height_inches ${operator} ?`);values.push(inches);}}
   if(params.get('available')==='true')where.push('d.available = 1');
   const minAge=Number(params.get('minAge')||18),maxAge=Number(params.get('maxAge')||60);
   if(!Number.isInteger(minAge)||!Number.isInteger(maxAge)||minAge<18||maxAge>60||minAge>maxAge)return json({error:'Invalid age range.'},400);
   if(minAge!==18||maxAge!==60){where.push("d.age_from <> '' AND CAST(d.age_from AS INTEGER) >= ?");values.push(minAge);if(maxAge!==60){where.push('CAST(d.age_from AS INTEGER) <= ?');values.push(maxAge);}}
   const languages=params.getAll('language').slice(0,30);if(languages.length){where.push(`EXISTS (SELECT 1 FROM artist_languages l WHERE l.artist_id=p.id AND l.value IN (${languages.map(()=>'?').join(',')}))`);values.push(...languages);}
   const skills=[...new Set(params.getAll('skill'))].slice(0,30);for(const skill of skills){where.push('EXISTS (SELECT 1 FROM artist_skills k WHERE k.artist_id=p.id AND k.value=?)');values.push(skill);}
   const search=(params.get('q')||'').trim().toLowerCase().slice(0,100);
   if(search){where.push(`(LOWER(p.name || ' ' || p.role || ' ' || p.city) LIKE ? ESCAPE '\\' OR EXISTS(SELECT 1 FROM artist_casting_roles r WHERE r.artist_id=p.id AND LOWER(r.value) LIKE ? ESCAPE '\\') OR EXISTS(SELECT 1 FROM artist_additional_roles r WHERE r.artist_id=p.id AND LOWER(r.value) LIKE ? ESCAPE '\\') OR EXISTS(SELECT 1 FROM artist_skills k WHERE k.artist_id=p.id AND LOWER(k.value) LIKE ? ESCAPE '\\') OR EXISTS(SELECT 1 FROM artist_languages l WHERE l.artist_id=p.id AND LOWER(l.value) LIKE ? ESCAPE '\\'))`);const term='%'+search.replace(/[\\%_]/g,c=>'\\'+c)+'%';values.push(term,term,term,term,term);}
   const condition=where.length?'WHERE '+where.join(' AND '):'';
   const from='FROM profiles p JOIN artist_profile_details d ON d.artist_id=p.id JOIN artist_measurements m ON m.artist_id=p.id';
   const count=await db.prepare(`SELECT COUNT(*) AS n ${from} ${condition}`).bind(...values).first<{n:number}>();
   if(params.get('countOnly')==='true')return json({total:count?.n??0});
   const order=params.get('sort')==='Name A–Z'?'p.name COLLATE NOCASE ASC':params.get('sort')==='Experience'?'CAST(d.experience AS INTEGER) DESC, p.updated_at DESC':'p.updated_at DESC';
   const limit=50,offset=Math.min(Math.max(Number(params.get('offset')||0)||0,0),10000);
   const rows=await db.prepare(`SELECT p.id,p.name,p.role,p.city,p.version,p.updated_at ${from} ${condition} ORDER BY ${order} LIMIT ? OFFSET ?`).bind(...values,limit,offset).all<ProfileRow>();
   const ids=rows.results.map(row=>row.id);
   const drafts=await loadProfiles(db,rows.results);
   const media=ids.length?await db.prepare(`SELECT * FROM profile_media WHERE owner_id IN (${ids.map(()=>'?').join(',')}) ORDER BY created_at,id`).bind(...ids).all<MediaRow>():{results:[] as MediaRow[]};
   return json({total:count?.n??0,artists:rows.results.map(row=>{const draft=drafts.get(row.id)!;const files=media.results.filter(m=>m.owner_id===row.id);const cover=files.find(m=>m.id===draft.coverId)||files.find(m=>m.kind==='photo');const image=cover?viewMedia(cover).url:draft.photo||'my-profile-placeholder';return {id:row.id,name:draft.name,role:draft.role,additionalRoles:draft.additionalRoles,category:draft.role==='Actor'?'Actors':draft.role==='Actress'?'Actresses':draft.role==='Director'?'Directors':draft.role==='Writer'?'Writers':'Crew',city:draft.city,image,tagline:draft.bio,languages:draft.languages,skills:draft.skills,available:draft.available,credits:draft.credits.length,experience:parseInt(draft.experience)||0,age:draft.ageFrom?Number(draft.ageFrom):null,gender:draft.gender,bodyBuild:draft.bodyBuild,genres:draft.skills.slice(0,3)};})});
  }
  if(request.method==='GET'&&path[0]==='artists'){
   if(postgres)return json(await listProfiles(postgres,owner));
   const rows=await db.prepare('SELECT id,name,role,city,version,updated_at FROM profiles ORDER BY updated_at DESC LIMIT 200').all<ProfileRow>();
   const drafts=await loadProfiles(db,rows.results);
   const media=await db.prepare('SELECT * FROM profile_media WHERE owner_id IN (SELECT id FROM profiles ORDER BY updated_at DESC LIMIT 200) ORDER BY created_at,id').all<MediaRow>();
   return json({profiles:rows.results.map(row=>{const draft=drafts.get(row.id)!;if(row.id!==owner){if(!draft.showBookingContact){draft.bookingEmail='';draft.bookingPhone='';}draft.genderDescription='';}return {id:row.id,draft,version:row.version,media:media.results.filter(m=>m.owner_id===row.id).map(viewMedia),isOwner:row.id===owner};})});
  }
  if(request.method==='PUT'&&path.length===2&&path[0]==='sections'){
   const section=path[1] as ProfileSection;
   if(!Object.hasOwn(profileSectionKeys,section))return json({error:'Unknown profile section.'},404);
   const body=JSON.parse(new TextDecoder().decode(await boundedBody(request,2_000_000)));
   if(!Number.isInteger(body.version)||body.version<1)return json({error:'Reload your profile before saving.'},400);
   const patch=body.patch;
   const allowed=new Set<string>(profileSectionKeys[section]);
   if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length||Object.keys(patch).some(key=>!allowed.has(key)))return json({error:'Invalid section fields.'},400);
   const current=postgres?await getMyProfile(postgres,owner) as {draft:Draft|null}|undefined:null;
   const row=postgres?null:await db.prepare('SELECT id,name,role,city,version,updated_at FROM profiles WHERE id=?').bind(owner).first<ProfileRow>();
   const existing=postgres?current?.draft:(await loadProfiles(db,row?[row]:[])).get(owner);
   if(!existing)return json({error:'Create your profile before editing sections.'},404);
   const parsed=profileSchema.safeParse({...empty,...existing,...patch});
   if(!parsed.success)return json({error:parsed.error.issues[0]?.message||'Check the section fields.'},400);
   if(postgres)return json(await saveProfileSection(postgres,owner,section,patch,body.version));
   const now=new Date().toISOString();
   if(!await saveProfile(db,owner,parsed.data as Draft,body.version,now))return json({error:'This profile changed in another tab. Reload to see the latest version; your browser draft has been kept.'},409);
   return json({id:owner,draft:parsed.data,version:body.version+1,updatedAt:now});
  }
  if(request.method==='PUT'&&path[0]==='me'){
   const body=JSON.parse(new TextDecoder().decode(await boundedBody(request,2_000_000)));
   const parsed=profileSchema.safeParse({...empty,...body.draft});
   if(!parsed.success)return json({error:parsed.error.issues[0]?.message||'Check the profile fields.'},400);
   if(body.version!==null&&(!Number.isInteger(body.version)||body.version<1))return json({error:'Refresh your profile before saving.'},400);
   if(postgres)return json(await saveMyProfile(postgres,owner,parsed.data as Draft,body.version));
   const now=new Date().toISOString();
   await db.prepare('INSERT OR IGNORE INTO profile_accounts(id,created_at) VALUES (?,?)').bind(owner,now).run();
   if(!await saveProfile(db,owner,parsed.data as Draft,body.version,now))return json({error:'This profile changed in another tab. Reload to see the latest version; your browser draft has been kept.'},409);
   return json({id:owner,draft:parsed.data,version:body.version===null?1:body.version+1,updatedAt:now});
  }
  if(path[0]==='media'&&/^(showreel|[a-zA-Z0-9_-]{1,80})$/.test(path[1]||'')){
   const id=path[1],key=owner+':'+id;
   const old=postgres?await getMedia(postgres,owner,id):await db.prepare('SELECT * FROM profile_media WHERE key=? AND owner_id=?').bind(key,owner).first<MediaRow>();
   if(request.method==='DELETE'){
    if(old){if(postgres)await removeMedia(postgres,owner,id);else await db.prepare('DELETE FROM profile_media WHERE key=? AND owner_id=?').bind(key,owner).run();await bucket.delete(old.storage_key);}return json({ok:true});
   }
   if(request.method==='PUT'){
    const kind=id==='showreel'?'video':'photo',mime=request.headers.get('content-type')||'';
    const allowed=kind==='photo'?['image/jpeg','image/png','image/webp']:['video/mp4','video/webm'];
    if(!allowed.includes(mime))return json({error:'Choose a JPG, PNG, WebP photo or MP4 / WebM video.'},400);
    const bytes=await boundedBody(request,kind==='photo'?5_000_000:49_999_999);
    if(!bytes.length)return json({error:'The selected file is empty.'},400);
    const ascii=(start:number,end:number)=>new TextDecoder().decode(bytes.slice(start,end));
    const valid=mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:mime==='image/png'?bytes[0]===137&&ascii(1,4)==='PNG':mime==='image/webp'?ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP':mime==='video/mp4'?ascii(4,8)==='ftyp':bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163;
    if(!valid)return json({error:'The file contents do not match the selected image or video format.'},400);
    if(kind==='photo'&&!old){const count=postgres?await getPhotoCount(postgres,owner):(await db.prepare("SELECT COUNT(*) AS n FROM profile_media WHERE owner_id=? AND kind='photo'").bind(owner).first<{n:number}>())?.n??0;if(count>=20)return json({error:'You can upload up to 20 photos.'},400);}
    const now=old?.created_at||new Date().toISOString(),storageKey=`profiles/${owner}/${id}/${await hash(bytes.buffer as ArrayBuffer)}`;
    const name=(request.headers.get('x-file-name')?decodeURIComponent(request.headers.get('x-file-name')!):kind).slice(0,180);
    if(!postgres)await db.prepare('INSERT OR IGNORE INTO profile_accounts(id,created_at) VALUES (?,?)').bind(owner,now).run();
    await bucket.put(storageKey,bytes,{httpMetadata:{contentType:mime}});
    if(postgres)await upsertMedia(postgres,owner,{id,kind,storage_key:storageKey,name,mime,size:bytes.byteLength});
    else await db.prepare('INSERT INTO profile_media(key,owner_id,id,kind,storage_key,name,mime,size,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET storage_key=excluded.storage_key,name=excluded.name,mime=excluded.mime,size=excluded.size').bind(key,owner,id,kind,storageKey,name,mime,bytes.byteLength,now).run();
    if(old&&old.storage_key!==storageKey)await bucket.delete(old.storage_key);
    return json(viewMedia({id,owner_id:owner,kind,storage_key:storageKey,name,mime,size:bytes.byteLength,created_at:now}));
   }
  }
  if(request.method==='GET'&&path[0]==='files'&&/^[a-f0-9]{64}$/.test(path[1]||'')){
   const row=postgres?await getMedia(postgres,path[1],path[2]||''):await db.prepare('SELECT m.* FROM profile_media m WHERE m.owner_id=? AND m.id=?').bind(path[1],path[2]||'').first<MediaRow>();
   if(!row)return json({error:'File not found.'},404);
   if(row.owner_id!==owner){
    if(postgres){const profile=await getMyProfile(postgres,row.owner_id) as {draft?:Draft|null}|undefined;if(!profile?.draft)return json({error:'File not found.'},404);}
    else if(!await db.prepare('SELECT id FROM profiles WHERE id=?').bind(row.owner_id).first())return json({error:'File not found.'},404);
   }
   const object=await bucket.get(row.storage_key,{range:request.headers});if(!object)return json({error:'File not found.'},404);
   const headers=new Headers({'Content-Type':row.mime,'Cache-Control':'private, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'});
   headers.set('Content-Length',String(object.range&&'length'in object.range?object.range.length:object.size));
   if(request.headers.has('range')&&object.range&&'offset'in object.range&&'length'in object.range)headers.set('Content-Range',`bytes ${object.range.offset}-${object.range.offset!+object.range.length!-1}/${object.size}`);
   return new Response(object.body,{status:request.headers.has("range")&&object.range?206:200,headers});
  }
  return json({error:'Not found.'},404);
 }catch(error){const message=error instanceof Error?error.message:'';if(message.includes('too large'))return json({error:message},413);if(error&&typeof error==='object'&&'code' in error&&(error as {code:string}).code==='40001')return json({error:'This profile changed in another tab. Reload to see the latest version; your browser draft has been kept.'},409);return json({error:'Could not save or load your profile. Please retry; the browser copy has not been removed.'},500);}
}
export const GET=handle;export const PUT=handle;export const DELETE=handle;


