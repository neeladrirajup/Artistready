import type { Draft } from './profile-model';
import type { ProfileSection } from './profile-sections';
export type CloudMedia={id:string;kind:'photo'|'video';name:string;mime:string;size:number;created:number;url:string};
export type CloudProfile={id:string;draft:Draft|null;version:number|null;media:CloudMedia[];updatedAt?:string;isOwner?:boolean};
export async function profileRequest<T>(path:string,options?:RequestInit):Promise<T>{
 const response=await fetch('/api/profile/'+path,{...options,cache:'no-store',credentials:'same-origin'});
 const body=await response.json() as T & {error?:string};if(!response.ok)throw new Error(body.error||'Profile storage is unavailable. Please retry.');return body;
}
export async function uploadMedia(item:{id:string;kind:'photo'|'video';file:File}){
 return profileRequest<CloudMedia>('media/'+encodeURIComponent(item.id),{method:'PUT',headers:{'Content-Type':item.file.type,'X-File-Name':encodeURIComponent(item.file.name)},body:item.file});
}
export async function saveCloudProfile(draft:Draft,version:number|null){return profileRequest<CloudProfile>('me',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft,version})});}
export async function saveCloudSection(section:ProfileSection,patch:Record<string,unknown>,version:number){return profileRequest<CloudProfile>('sections/'+section,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({patch,version})});}

