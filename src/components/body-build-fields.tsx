'use client';
import type { Draft } from '@/lib/profile-model';
import { bodyBuildOptions } from '@/lib/body-build';
export function BodyBuildFields({value,fit,onChange}:{value:Draft;fit:string;onChange:(value:Draft)=>void}){
 const options=bodyBuildOptions(fit);
 return <><label>Body build · {fit==='male'?'Male fit':fit==='female'?'Female fit':'Neutral / custom fit'} <small>Optional</small><select value={value.bodyBuild} onChange={e=>onChange({...value,bodyBuild:e.target.value,bodyBuildDescription:''})}><option value="">Not specified</option>{options.map(([code,label])=><option key={code} value={code}>{label}</option>)}{value.bodyBuild&&!options.some(o=>o[0]===value.bodyBuild)&&<option value={value.bodyBuild}>Previously selected build · choose a new option</option>}</select></label>{value.bodyBuild==='self_describe'&&<label>Describe your body build<input required maxLength={120} value={value.bodyBuildDescription} onChange={e=>onChange({...value,bodyBuildDescription:e.target.value})}/></label>}<p className="ob-field-note">Self-described build for casting and wardrobe. Choose the fit that works for you; no answer is assumed.</p></>;
}
