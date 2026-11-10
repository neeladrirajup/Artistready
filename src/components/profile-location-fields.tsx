'use client';
import { useEffect, useState } from 'react';
import type { Draft } from '@/lib/profile-model';
import { profileRequest } from '@/lib/profile-api';

type StateChoice={id:number;code:string;name:string;isUnionTerritory:boolean};
type CityChoice={id:number;stateId:number;name:string};

export function ProfileLocationFields({value,onChange}:{value:Draft;onChange:(value:Draft)=>void}){
 const [states,setStates]=useState<StateChoice[]>([]);
 const [cities,setCities]=useState<CityChoice[]>([]);
 const [error,setError]=useState('');
 const local=import.meta.env.VITE_ARTISTREADY_LOCAL_POSTGRES==='1';
 useEffect(()=>{
  if(!local)return;
  let live=true;
  profileRequest<StateChoice[]>('locations/states').then(rows=>{if(live)setStates(rows);}).catch(()=>{if(live)setError('State choices could not be loaded. Please retry.');});
  return()=>{live=false;};
 },[local]);
 useEffect(()=>{
  if(!local||!value.stateCode){setCities([]);return;}
  let live=true;
  setCities([]);
  profileRequest<CityChoice[]>('locations/cities?state='+encodeURIComponent(value.stateCode))
   .then(rows=>{if(live){setCities(rows);setError('');}})
   .catch(()=>{if(live)setError('City choices could not be loaded. Please retry.');});
  return()=>{live=false;};
 },[local,value.stateCode]);
 if(!local)return <label>Based in <span className="required-mark" aria-hidden="true">*</span><input required maxLength={80} value={value.city} onChange={e=>onChange({...value,city:e.target.value})} autoComplete="address-level2"/></label>;
 return <>
  <label>State or union territory <span className="required-mark" aria-hidden="true">*</span><select required value={value.stateCode} onChange={e=>onChange({...value,stateCode:e.target.value,city:''})} autoComplete="address-level1"><option value="">Select a state or territory</option>{states.map(state=><option key={state.id} value={state.code}>{state.name}</option>)}</select></label>
  <label>City or town <span className="required-mark" aria-hidden="true">*</span><select required disabled={!value.stateCode||!cities.length} value={value.city} onChange={e=>onChange({...value,city:e.target.value})} autoComplete="address-level2"><option value="">{value.stateCode?'Select a city or town':'Select a state first'}</option>{cities.map(city=><option key={city.id} value={city.name}>{city.name}</option>)}</select></label>
  {error&&<p role="alert" className="ob-field-note">{error}</p>}
 </>;
}
