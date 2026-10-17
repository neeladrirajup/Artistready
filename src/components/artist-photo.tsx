'use client';
import { useId } from 'react';
import { artwork } from '@/lib/artists';

export function ArtistPhoto({ image, className = '', alt = '', fit = 'cover' }: { image: string; className?: string; alt?: string; fit?: 'cover' | 'contain' }) {
  const crop = artwork[image] || artwork.saanvi;
  const clipId = useId().replace(/:/g, '');
  if(image.startsWith('blob:')||image.startsWith('data:image/')||image.startsWith('/api/profile/files/'))return <div className={'art-frame '+className}><img className="created-image" src={image} alt={alt}/></div>;
  if(image==='my-profile-placeholder')return <div className={'art-frame created-photo-placeholder '+className} role="img" aria-label={alt||'Your profile photo'}><span>YOUR<br/>SPOTLIGHT</span></div>;
  return <div className={'art-frame ' + className} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={!alt}>
    <svg viewBox={[crop.x, crop.y, crop.w, crop.h].join(' ')} preserveAspectRatio={fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'} aria-hidden="true">
      <defs><clipPath id={clipId}><rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} /></clipPath></defs>
      <image href={'/references/' + crop.file + '.png'} x="0" y="0" width="941" height="1672" clipPath={'url(#' + clipId + ')'} />
    </svg>
  </div>;
}
