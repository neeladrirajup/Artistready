import { ProfileSectionIcon } from './profile-section-icon';
'use client';
import { useEffect,useRef,useState } from 'react';
import { ArrowRight,Copy,Share2,X } from 'lucide-react';
import { ArtistPhoto } from './artist-photo';
import type { Artist } from '@/lib/artists';

export function RegisteredProfileSharing({artist,profileId}:{artist:Artist;profileId:string}){
 const [open,setOpen]=useState(false),[url,setUrl]=useState(''),[status,setStatus]=useState(''),[canShare,setCanShare]=useState(false);
 useEffect(()=>{setUrl(/^[a-f0-9]{64}$/.test(profileId)?window.location.origin+'/artists/'+profileId:'');setCanShare(typeof navigator.share==='function');},[profileId]);
 async function copy(){try{await navigator.clipboard.writeText(url);setStatus('Profile link copied.');}catch{setStatus('Select the profile link below and copy it.');}}
 async function share(){try{await navigator.share({title:artist.name+' | Artistready',text:'View '+artist.name+'’s artist profile.',url});}catch(error){if(!(error instanceof Error&&error.name==='AbortError'))setStatus('Use Copy link to share this profile.');}}
 return <section className="casting-sharing registered-profile-sharing"><h3><ProfileSectionIcon kind="sharing" small/>Share this profile</h3><p>Pass this portfolio on to casting teams, directors, and creative collaborators.</p><button className="gold-link registered-share-trigger" disabled={!url} onClick={()=>{setStatus('');setOpen(true);}}>Share profile <ArrowRight size={15}/></button><small>{url?'Recipients need permission to access this app. Sharing does not change your privacy settings.':'Save your profile to your account before sharing.'}</small>{open&&<ShareDialog onClose={()=>setOpen(false)}><div className="casting-share-panel"><div className="share-artist-preview"><ArtistPhoto image={artist.image}/><div><h3>{artist.name}</h3><p>{artist.role} · {artist.city}</p></div></div><label className="share-profile-link">Profile link<input readOnly value={url} onFocus={e=>e.target.select()}/></label><div className="casting-modal-actions"><button className="button gold" onClick={()=>void copy()}><Copy size={16}/>Copy link</button>{canShare&&<button className="button glass" onClick={()=>void share()}><Share2 size={16}/>Share…</button>}</div><p className="share-copy-status" role="status">{status}</p><p className="share-access-note">This link opens your saved artist portfolio. Recipients must have access to Artistready; private preferences and hidden booking contacts remain protected.</p></div></ShareDialog>}</section>;
}
function ShareDialog({children,onClose}:{children:React.ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const before=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.showModal();return()=>{ref.current?.close();document.body.style.overflow=before;};},[]);
 return <dialog ref={ref} className="casting-modal" aria-label="Share profile" onCancel={e=>{e.preventDefault();onClose();}}><div className="casting-modal-panel"><header><h2>Share profile</h2><button autoFocus className="circle-button" aria-label="Close share dialog" onClick={onClose}><X size={20}/></button></header>{children}</div></dialog>;
}
