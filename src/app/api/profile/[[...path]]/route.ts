import { env as workerEnv } from 'cloudflare:workers';
import { getProfileRuntime } from '../../../../../lib/profile-runtime';
import { profileSchema } from '@/lib/profile-validation';
import { empty, type Draft } from '@/lib/profile-model';
import { preferencesSchema, blankPreferences } from '@/lib/artist-preferences';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const hash=async(s:string|ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',typeof s==='string'?new TextEncoder().encode(s):s))).map(b=>b.toString(16).padStart(2,'0')).join('');
type Row={id:string;document:string;version:number;updated_at:string};
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
  if(!env.DB||!env.BUCKET)return json({error:'Profile storage is unavailable. Your browser copy is safe.'},503);
  const db=env.DB,bucket=env.BUCKET,owner=await hash(subject);
  const url=new URL(request.url),path=url.pathname.replace(/^\/api\/profile\/?/,'').split('/').filter(Boolean);
  if(request.method!=='GET'){
   const origin=request.headers.get('origin');
   if(!origin||origin!==url.origin)return json({error:'Please save from the Artistready website.'},403);
  }
  if(request.method==='GET'&&path[0]==='me'){
   const row=await db.prepare('SELECT id,document,version,updated_at FROM profiles WHERE id=?').bind(owner).first<Row>();
   const media=await db.prepare('SELECT * FROM profile_media WHERE owner_id=? ORDER BY created_at,id').bind(owner).all<MediaRow>();
   return json({id:owner,draft:row?JSON.parse(row.document):null,version:row?.version??null,updatedAt:row?.updated_at??null,media:media.results.map(viewMedia)});
  }
  // Public profile lists never include preferences. Individual reads enforce audience here.
  if(request.method==='GET'&&path.length===2&&path[0]==='preferences'&&/^[a-f0-9]{64}$/.test(path[1])){
   const target=path[1];
   const row=await db.prepare('SELECT document,version,updated_at FROM artist_preferences WHERE artist_id=?').bind(target).first<Row>();
   if(!row)return json({error:'Preferences not available.'},404);
   const preferences={...blankPreferences,...JSON.parse(row.document)};
   let allowed=target===owner||preferences.visibility==='everyone';
   if(!allowed&&preferences.visibility==='managers')allowed=!!await db.prepare('SELECT account_id FROM verified_managers WHERE account_id=? AND is_active=1').bind(owner).first();
   if(!allowed)return json({error:'Preferences not available.'},404);
   // Adult self-attestation is private account information, not a shared preference.
   return json({preferences:target===owner?preferences:{visibility:preferences.visibility,answers:preferences.answers},version:target===owner?row.version:null,updatedAt:row.updated_at});
  }
  if(path.length===1&&path[0]==='preferences'){
   if(request.method==='GET'){
    const row=await db.prepare('SELECT document,version,updated_at FROM artist_preferences WHERE artist_id=?').bind(owner).first<Row>();
    return json({preferences:row?{...blankPreferences,...JSON.parse(row.document)}:blankPreferences,version:row?.version??null,updatedAt:row?.updated_at??null});
   }
   if(request.method==='PUT'){
    const body=JSON.parse(new TextDecoder().decode(await boundedBody(request,50_000)));
    const parsed=preferencesSchema.safeParse(body.preferences);
    if(!parsed.success)return json({error:parsed.error.issues[0]?.message||'Check your preferences.'},400);
    if(body.version!==null&&(!Number.isInteger(body.version)||body.version<1))return json({error:'Reload preferences before saving.'},400);
    if(!await db.prepare('SELECT id FROM profiles WHERE id=?').bind(owner).first())return json({error:'Save your artist profile first.'},400);
    const now=new Date().toISOString(),doc=JSON.stringify(parsed.data);
    const result=body.version===null
     ?await db.prepare('INSERT OR IGNORE INTO artist_preferences(artist_id,document,version,created_at,updated_at) VALUES(?,?,1,?,?)').bind(owner,doc,now,now).run()
     :await db.prepare('UPDATE artist_preferences SET document=?,version=version+1,updated_at=? WHERE artist_id=? AND version=?').bind(doc,now,owner,body.version).run();
    if(!result.meta.changes)return json({error:'Preferences changed in another tab. Close and reload the page before editing again.'},409);
    return json({preferences:parsed.data,version:body.version===null?1:body.version+1,updatedAt:now});
   }
  }
  if(request.method==='GET'&&path[0]==='artists'){
   const rows=await db.prepare('SELECT id,document,version,updated_at FROM profiles ORDER BY updated_at DESC LIMIT 200').all<Row>();
   const media=await db.prepare('SELECT * FROM profile_media WHERE owner_id IN (SELECT id FROM profiles ORDER BY updated_at DESC LIMIT 200) ORDER BY created_at,id').all<MediaRow>();
   return json({profiles:rows.results.map(row=>{const draft={...empty,...JSON.parse(row.document)} as Draft;if(row.id!==owner){if(!draft.showBookingContact){draft.bookingEmail='';draft.bookingPhone='';}draft.genderDescription='';}return {id:row.id,draft,version:row.version,media:media.results.filter(m=>m.owner_id===row.id).map(viewMedia),isOwner:row.id===owner};})});
  }
  if(request.method==='PUT'&&path[0]==='me'){
   const body=JSON.parse(new TextDecoder().decode(await boundedBody(request,2_000_000)));
   const parsed=profileSchema.safeParse({...empty,...body.draft});
   if(!parsed.success)return json({error:parsed.error.issues[0]?.message||'Check the profile fields.'},400);
   if(body.version!==null&&(!Number.isInteger(body.version)||body.version<1))return json({error:'Refresh your profile before saving.'},400);
   const now=new Date().toISOString(),doc=JSON.stringify(parsed.data);
   await db.prepare('INSERT OR IGNORE INTO profile_accounts(id,created_at) VALUES (?,?)').bind(owner,now).run();
   let result;
   if(body.version===null) result=await db.prepare('INSERT OR IGNORE INTO profiles(id,name,role,city,document,version,created_at,updated_at) VALUES (?,?,?,?,?,1,?,?)').bind(owner,parsed.data.name,parsed.data.role,parsed.data.city,doc,now,now).run();
   else result=await db.prepare('UPDATE profiles SET name=?,role=?,city=?,document=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(parsed.data.name,parsed.data.role,parsed.data.city,doc,now,owner,body.version).run();
   if(!result.meta.changes)return json({error:'This profile changed in another tab. Reload to see the latest version; your browser draft has been kept.'},409);
   return json({id:owner,draft:parsed.data,version:body.version===null?1:body.version+1,updatedAt:now});
  }
  if(path[0]==='media'&&/^(showreel|[a-zA-Z0-9_-]{1,80})$/.test(path[1]||'')){
   const id=path[1],key=owner+':'+id;
   const old=await db.prepare('SELECT * FROM profile_media WHERE key=? AND owner_id=?').bind(key,owner).first<MediaRow>();
   if(request.method==='DELETE'){
    if(old){await db.prepare('DELETE FROM profile_media WHERE key=? AND owner_id=?').bind(key,owner).run();await bucket.delete(old.storage_key);}return json({ok:true});
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
    if(kind==='photo'&&!old){const count=await db.prepare("SELECT COUNT(*) AS n FROM profile_media WHERE owner_id=? AND kind='photo'").bind(owner).first<{n:number}>();if((count?.n??0)>=20)return json({error:'You can upload up to 20 photos.'},400);}
    const now=old?.created_at||new Date().toISOString(),storageKey=`profiles/${owner}/${id}/${await hash(bytes.buffer as ArrayBuffer)}`;
    const name=(request.headers.get('x-file-name')?decodeURIComponent(request.headers.get('x-file-name')!):kind).slice(0,180);
    await db.prepare('INSERT OR IGNORE INTO profile_accounts(id,created_at) VALUES (?,?)').bind(owner,now).run();
    await bucket.put(storageKey,bytes,{httpMetadata:{contentType:mime}});
    await db.prepare('INSERT INTO profile_media(key,owner_id,id,kind,storage_key,name,mime,size,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET storage_key=excluded.storage_key,name=excluded.name,mime=excluded.mime,size=excluded.size').bind(key,owner,id,kind,storageKey,name,mime,bytes.byteLength,now).run();
    if(old&&old.storage_key!==storageKey)await bucket.delete(old.storage_key);
    return json(viewMedia({id,owner_id:owner,kind,storage_key:storageKey,name,mime,size:bytes.byteLength,created_at:now}));
   }
  }
  if(request.method==='GET'&&path[0]==='files'&&/^[a-f0-9]{64}$/.test(path[1]||'')){
   const row=await db.prepare('SELECT m.* FROM profile_media m WHERE m.owner_id=? AND m.id=? AND (m.owner_id=? OR EXISTS(SELECT 1 FROM profiles p WHERE p.id=m.owner_id))').bind(path[1],path[2]||'',owner).first<MediaRow>();
   if(!row)return json({error:'File not found.'},404);
   const object=await bucket.get(row.storage_key,{range:request.headers});if(!object)return json({error:'File not found.'},404);
   const headers=new Headers({'Content-Type':row.mime,'Cache-Control':'private, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'});
   headers.set('Content-Length',String(object.range&&'length'in object.range?object.range.length:object.size));
   if(request.headers.has('range')&&object.range&&'offset'in object.range&&'length'in object.range)headers.set('Content-Range',`bytes ${object.range.offset}-${object.range.offset!+object.range.length!-1}/${object.size}`);
   return new Response(object.body,{status:request.headers.has("range")&&object.range?206:200,headers});
  }
  return json({error:'Not found.'},404);
 }catch(error){const message=error instanceof Error?error.message:'';if(message.includes('too large'))return json({error:message},413);return json({error:'Could not save or load your profile. Please retry; the browser copy has not been removed.'},500);}
}
export const GET=handle;export const PUT=handle;export const DELETE=handle;


