export const bodyBuildCatalog=[['slim','Slim'],['lean_athletic','Lean / Athletic'],['muscular','Muscular'],['medium','Medium build'],['broad_solid','Broad / Solid'],['full_rounded','Full / Rounded'],['curvy','Curvy'],['self_describe','Prefer to self-describe'],['not_disclosed','Prefer not to disclose']] as const;
export function bodyBuildOptions(fit:string){return bodyBuildCatalog.filter(([code])=>fit!=='male'||code!=='curvy');}
export function bodyBuildLabel(code:string,description:string){return code==='self_describe'?description:bodyBuildCatalog.find(o=>o[0]===code)?.[1]||'';}
