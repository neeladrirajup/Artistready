import { z } from 'zod';
import { empty } from './profile-model';
const text=z.string().max(2000), tag=z.string().max(120);
const url=z.string().max(2048).refine(s=>!s||/^https?:\/\//i.test(s),'Use an http or https link.');
const milestone=z.object({id:tag,title:text,organisation:text,year:tag,notes:text});
const fields:Record<string,z.ZodTypeAny>={};
for(const [key,value] of Object.entries(empty)) fields[key]=typeof value==='boolean'?z.boolean():typeof value==='string'?text:z.array(tag).max(100);
export const profileSchema=z.object({ ...fields,
 name:z.string().trim().min(1).max(80),role:tag.min(1),city:tag.min(1),
 photo:z.string().max(1_500_000).refine(s=>!s||/^data:image\/(jpeg|png|webp);base64,/.test(s)),
 skillCategories:z.record(tag,tag),clothing:z.record(tag,tag),
 pinnedMedia:z.array(z.string().max(2100)).max(3),reel:url,reelLinks:z.array(url).max(30),
 credits:z.array(z.object({id:tag,title:text,type:tag,role:text,year:tag,director:text,production:text,trailer:url})).max(100),
 training:z.array(milestone).max(100),recognition:z.array(milestone).max(100),
 education:z.array(z.object({id:tag,qualification:text,institution:text,year:tag,notes:text})).max(100),
}).superRefine((value,ctx)=>{ const d=value as Record<string,unknown>;
 const number=(key:string,max:number,integer=false)=>{const value=d[key];if(typeof value==='string'&&value!==''&&(!Number.isFinite(Number(value))||Number(value)<0||Number(value)>max||(integer&&!Number.isInteger(Number(value)))))ctx.addIssue({code:'custom',path:[key],message:'Enter a valid '+key});};
 number('ageFrom',100,true);number('ageTo',100,true);number('heightFeet',8,true);number('heightInches',11,true);
 for(const key of ['weight','chest','bust','waist','hip'])number(key,500);
 if(d.ageFrom&&d.ageTo&&Number(d.ageFrom)>Number(d.ageTo))ctx.addIssue({code:'custom',message:'Playing age: From must not exceed To.'});
});

