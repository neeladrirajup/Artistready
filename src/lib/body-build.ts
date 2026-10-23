export const bodyBuildCatalog=[
 ['slim','Slim'],['lean_athletic','Lean / Athletic'],['muscular','Muscular'],
 ['medium','Medium build'],['broad_solid','Broad / Solid'],['stocky','Stocky'],
 ['petite','Petite'],['toned','Toned'],['curvy','Curvy'],['hourglass','Hourglass'],
 ['full_rounded','Full / Rounded'],['self_describe','Prefer to self-describe'],
 ['not_disclosed','Prefer not to disclose'],
] as const;
const maleFit=new Set(['slim','lean_athletic','muscular','medium','broad_solid','stocky','full_rounded','self_describe','not_disclosed']);
const femaleFit=new Set(['petite','slim','toned','curvy','hourglass','medium','full_rounded','self_describe','not_disclosed']);
export function bodyBuildOptions(fit:string){const allowed=fit==='male'?maleFit:fit==='female'?femaleFit:null;return bodyBuildCatalog.filter(([code])=>!allowed||allowed.has(code));}
export function bodyBuildLabel(code:string,description:string){return code==='self_describe'?description:bodyBuildCatalog.find(o=>o[0]===code)?.[1]||'';}
