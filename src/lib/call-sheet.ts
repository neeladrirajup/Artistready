import { z } from 'zod';
const date=z.string().refine(value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value,'Choose a valid date.');
const optionalDate=z.union([z.literal(''),date]);
export const dateStatuses=[['available','Available'],['tentative','Tentative'],['booked','Booked'],['unavailable','Unavailable']] as const;
export const callSheetSchema=z.object({
 shootingStatus:z.enum(['','shooting','not_shooting']),project:z.string().trim().max(120),
 shootFrom:optionalDate,shootTo:optionalDate,notes:z.string().trim().max(600),
 dates:z.array(z.object({id:z.string().min(1).max(80),from:date,to:date,status:z.enum(['available','tentative','booked','unavailable']),notes:z.string().trim().max(300)})).max(50),
}).superRefine((value,ctx)=>{
 if(value.shootingStatus!=='shooting'&&(value.project||value.shootFrom||value.shootTo))ctx.addIssue({code:'custom',message:'Choose Currently shooting to add current project details.'});
 if(!!value.shootFrom!==!!value.shootTo||value.shootFrom>value.shootTo)ctx.addIssue({code:'custom',message:'Enter a valid current-shoot start and end date.'});
 const seen=new Set();for(const entry of value.dates){if(seen.has(entry.id))ctx.addIssue({code:'custom',message:'Duplicate date entry.'});seen.add(entry.id);if(entry.from>entry.to)ctx.addIssue({code:'custom',message:'A date range must end on or after its start date.'});}
 const sorted=[...value.dates].sort((a,b)=>a.from.localeCompare(b.from));for(let i=1;i<sorted.length;i++)if(sorted[i].from<=sorted[i-1].to)ctx.addIssue({code:'custom',message:'Date ranges overlap. Use separate, non-overlapping ranges.'});
 if(value.shootingStatus==='shooting'&&value.shootFrom&&value.dates.some(d=>d.status==='available'&&d.from<=value.shootTo&&d.to>=value.shootFrom))ctx.addIssue({code:'custom',message:'Available dates overlap your current shoot. Adjust the dates or mark them tentative.'});
});
export type CallSheet=z.infer<typeof callSheetSchema>;
export const emptyCallSheet:CallSheet={shootingStatus:'',project:'',shootFrom:'',shootTo:'',notes:'',dates:[]};
export function formatShootDate(value:string){return new Date(value+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}
