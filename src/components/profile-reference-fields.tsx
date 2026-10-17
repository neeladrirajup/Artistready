'use client';
import type { Draft } from './create-profile';
import { TagFields } from './profile-section-fields';
import type { useOnboardingMedia } from './onboarding-media';
import skillCatalog from '@/lib/skills-catalog.json';
export const skillGroups=['Technical','Soft Skills','Artistic Skills','Others'];
export function SkillsFields({value,onChange}:{value:Draft;onChange:(value:Draft)=>void}){return <><TagFields kind="Skills" value={value.skills} onChange={skills=>onChange({...value,skills,skillCategories:{...value.skillCategories,...Object.fromEntries(skills.filter(skill=>!value.skills.includes(skill)&&!value.skillCategories[skill]).map(skill=>[skill,skillCatalog.find(item=>item.name===skill)?.category||"Others"]))}})}/></>;}
export function RolesFields({value,onChange}:{value:Draft;onChange:(value:Draft)=>void}){return <><p className="ob-field-note">Your primary role is {value.role||"chosen in the craft selector above"}. Add other crafts you work in. You can change the primary role in Essentials.</p><TagFields kind="Creative roles" value={value.additionalRoles} onChange={additionalRoles=>onChange({...value,additionalRoles})}/></>;}
export function PinnedFields({value,media,onChange}:{value:Draft;media:ReturnType<typeof useOnboardingMedia>;onChange:(value:Draft)=>void}){
 const links=[value.reel,...value.reelLinks].filter(url=>new RegExp('^https?://','i').test(url));
 const choices=[...media.photos.map((photo,i)=>({id:'photo:'+photo.id,label:'Photo '+(i+1),url:photo.url})),...(media.video?[{id:'video:showreel',label:'Uploaded showreel',url:''}]:[]),...links.map((url,i)=>({id:'link:'+url,label:'Portfolio / showreel link '+(i+1),url:''}))];
 const selected=value.pinnedMedia.filter(id=>choices.some(c=>c.id===id));
 return <section><p className="ob-field-note">Pin up to 3 highlights from your existing photos, video and portfolio links. These appear near the top of your profile.</p>{!choices.length&&<p className="created-muted">Add photos or showreels first, then return here to choose your highlights.</p>}<div className="reference-pin-options">{choices.map(item=><label key={item.id}>{item.url&&<img src={item.url} alt={item.label}/>}<span>{item.label}</span><input type="checkbox" checked={selected.includes(item.id)} disabled={!selected.includes(item.id)&&selected.length>=3} onChange={e=>onChange({...value,pinnedMedia:e.target.checked?[...selected,item.id]:selected.filter(id=>id!==item.id)})}/></label>)}</div><p className="ob-field-note">{selected.length}/3 highlights selected.</p></section>;
}


