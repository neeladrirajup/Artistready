'use client';
import { useEffect,useRef,useState } from 'react';
import { X } from 'lucide-react';
import { type Draft } from './create-profile';
import { CreditFields, MilestoneFields, ClothingFields } from './profile-career-fields';
export function ProfileDetailsEditor({draft,section,onSave,onClose}:{draft:Draft;section:'credits'|'training'|'measurements';onSave:(value:Draft)=>boolean;onClose:()=>void}){
 const [editing,setEditing]=useState(draft),[error,setError]=useState('');
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const before=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.showModal();return()=>{ref.current?.close();document.body.style.overflow=before;};},[]);
 const fit=editing.measurementFit||(editing.gender==='Male'||editing.gender==='Transgender man'?'male':editing.gender==='Female'||editing.gender==='Transgender woman'?'female':'neutral');
 const fields=[['heightFeet','Height (feet)'],['heightInches','Height (inches)'],['weight','Weight (kg)'],[fit==='female'?'bust':'chest',fit==='female'?'Bust (inches)':fit==='male'?'Chest (inches)':'Chest / bust (inches)'],['waist','Natural waist (inches)'],['hip','Full hip / seat (inches)']] as [keyof Draft,string][];
 return <dialog ref={ref} className="casting-modal created-details-modal" aria-label={section==='credits'?'Edit project credits':section==='training'?'Edit training and recognition':'Edit measurements and sizes'} onCancel={e=>{e.preventDefault();onClose();}}><div className="casting-modal-panel"><header><h2>{section==='credits'?'Project credits':section==='training'?'Training & recognition':'Measurements & wardrobe'}</h2><button autoFocus onClick={onClose} aria-label="Close editor"><X size={20}/></button></header><form className="ob-fields" onSubmit={e=>{e.preventDefault();if(onSave(editing))onClose();else setError('Your changes could not be saved. Please check browser storage and try again.');}}>
 {section==='credits'&&<CreditFields value={editing.credits} onChange={credits=>setEditing({...editing,credits})}/>}
 {section==='training'&&<><MilestoneFields kind="Training" value={editing.training} onChange={training=>setEditing({...editing,training})}/><MilestoneFields kind="Recognition" value={editing.recognition} onChange={recognition=>setEditing({...editing,recognition})}/></>}
 {section==='measurements'&&<><label>Measurement fit<select value={fit} onChange={e=>setEditing({...editing,measurementFit:e.target.value})}><option value="male">Male fit</option><option value="female">Female fit</option><option value="neutral">Neutral / custom fit</option></select></label><div className="ob-two">{fields.map(([field,label])=><label key={field}>{label}<input type="number" min="0" max={field==='heightFeet'?8:field==='heightInches'?11:300} step={field==='heightFeet'||field==='heightInches'?1:0.1} value={String(editing[field])} onChange={e=>setEditing({...editing,[field]:e.target.value})}/></label>)}</div><ClothingFields value={editing.clothing} onChange={clothing=>setEditing({...editing,clothing})}/></>}
 {error&&<p role="alert" className="ob-notice">{error}</p>}<div className="created-editor-actions"><p>Saved on this device only.</p><button type="button" className="button glass" onClick={onClose}>Cancel</button><button type="submit" className="button gold">Save changes</button></div></form></div></dialog>;
}
