export const VIDEO_LIMIT = 50_000_000;
export const PHOTO_LIMIT = 5_000_000;
export function mediaError(file: {size:number;type:string}, kind:'photo'|'video') {
 if(kind==='video'){
  if(!['video/mp4','video/webm'].includes(file.type))return 'Choose an MP4 or WebM video.';
  if(file.size>=VIDEO_LIMIT)return 'Your video must be smaller than 50 MB.';
 }else{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return 'Choose JPG, PNG or WebP photos.';
  if(file.size>PHOTO_LIMIT)return 'Each photo must be 5 MB or smaller.';
 }
 if(file.size===0)return 'This file is empty. Please choose another file.';
 return '';
}
