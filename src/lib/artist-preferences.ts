import { z } from 'zod';
export const preferenceChoices=[['okay','Okay'],['not_okay','Not okay'],['discuss_first','Discuss first'],['not_disclosed','Prefer not to disclose']] as const;
export const preferenceOptions=[
 ['lip_kissing','Physical contact','On-screen kissing / lip lock',true],
 ['hugging','Physical contact','Hugging',false],
 ['holding_hands','Physical contact','Holding hands',false],
 ['cuddling','Physical contact','Cuddling',true],
 ['simulated_intimacy','Intimate scenes','Simulated intimacy',true],
 ['revealing_costumes','Costumes & nudity','Revealing costumes',true],
 ['swimwear','Costumes & nudity','Swimwear',true],
 ['partial_nudity','Costumes & nudity','Partial nudity',true],
 ['full_nudity','Costumes & nudity','Full nudity',true],
 ['fight_scenes','Action & stunts','Choreographed fight scenes',false],
 ['height_stunts','Action & stunts','Height stunts',false],
 ['water_stunts','Action & stunts','Water stunts',false],
 ['haircut','Appearance changes','Haircut',false],
 ['hair_colour','Appearance changes','Hair colour',false],
 ['shaving','Appearance changes','Shaving / facial hair changes',false],
 ['smoking_depiction','Sensitive roles','Depicting smoking',false],
 ['drinking_depiction','Sensitive roles','Depicting alcohol consumption',false],
 ['strong_language','Sensitive roles','Strong language',false],
 ['night_shoots','Work conditions','Night shoots',false],
 ['travel','Work conditions','Travel for projects',false],
 ['overnight_stays','Work conditions','Overnight stays',false],
] as const;
export const preferenceVisibility=[['only_me','Only me'],['managers','Managers only'],['everyone','Everyone']] as const;
export const preferencesSchema=z.object({visibility:z.enum(['only_me','managers','everyone']).default('only_me'),adultConfirmed:z.boolean(),answers:z.record(z.string(),z.object({choice:z.enum(['okay','not_okay','discuss_first','not_disclosed']),notes:z.string().trim().max(1000)}))}).strict().superRefine((value,ctx)=>{
 for(const code of Object.keys(value.answers)){
  const option=preferenceOptions.find(o=>o[0]===code);
  if(!option)ctx.addIssue({code:'custom',message:'Unknown preference.'});
  else if(option[3]&&!value.adultConfirmed)ctx.addIssue({code:'custom',message:'Confirm you are 18 or older before setting adult preferences.'});
 }
});
export type Preferences=z.infer<typeof preferencesSchema>;
export type PreferencesResponse={preferences:Preferences;version:number|null;updatedAt:string|null};
export const blankPreferences:Preferences={visibility:'only_me',adultConfirmed:false,answers:{}};
