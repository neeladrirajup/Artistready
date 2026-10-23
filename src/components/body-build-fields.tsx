'use client';
import { useEffect, useState } from 'react';
import type { Draft } from '@/lib/profile-model';
import { bodyBuildOptions } from '@/lib/body-build';
export function BodyBuildFields({value,fit,onChange}:{value:Draft;fit:string;onChange:(value:Draft)=>void}){
 const [databaseOptions,setDatabaseOptions]=useState<{fit:string;options:ReadonlyArray<readonly [string,string]>}|null>(null);
 useEffect(()=>{
  if(import.meta.env.VITE_ARTISTREADY_LOCAL_POSTGRES!=='1')return;
  const controller=new AbortController();
  fetch('/api/local/body-types?fit='+encodeURIComponent(fit),{signal:controller.signal})
   .then(response=>{if(!response.ok)throw new Error('Body Type catalog unavailable');return response.json() as Promise<unknown>})
   .then(data=>{if(Array.isArray(data)&&data.every(item=>typeof item?.code==='string'&&typeof item?.label==='string'))setDatabaseOptions({fit,options:data.map(item=>[item.code,item.label] as const)});})
   .catch(()=>{});
  return ()=>controller.abort();
 },[fit]);
 const loaded=databaseOptions?.fit===fit;
 const options=loaded?databaseOptions.options:bodyBuildOptions(fit);
 return <><label>Body build · {fit==='male'?'Male fit':fit==='female'?'Female fit':'Neutral / custom fit'} <small>Optional</small><select value={value.bodyBuild} onChange={e=>onChange({...value,bodyBuild:e.target.value,bodyBuildDescription:''})}><option value="">Not specified</option>{options.map(([code,label])=><option key={code} value={code}>{label}</option>)}{value.bodyBuild&&!options.some(o=>o[0]===value.bodyBuild)&&<option value={value.bodyBuild}>Previously selected build · choose a new option</option>}</select></label>{loaded&&<p className="ob-field-note" role="status">Choices loaded from local PostgreSQL.</p>}{value.bodyBuild==='self_describe'&&<label>Describe your body build <span className="required-mark" aria-hidden="true">*</span><input required maxLength={120} value={value.bodyBuildDescription} onChange={e=>onChange({...value,bodyBuildDescription:e.target.value})}/></label>}<p className="ob-field-note">Self-described build for casting and wardrobe. Choose the fit that works for you; no answer is assumed.</p></>;
}
