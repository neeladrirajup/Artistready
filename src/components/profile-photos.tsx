'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand, Images, X } from 'lucide-react';
import { type Artist } from '@/lib/artists';
import { ArtistPhoto } from './artist-photo';

export function ProfilePhotos({ artist, preview = false, onViewAll }: { artist: Artist; preview?: boolean; onViewAll?: () => void }) {
  const sampleImages = artist.id === 'ananya-rao'
    ? [{ image: artist.image, label: 'Portrait' }, { image: 'saanvi-editorial', label: 'Editorial' }, { image: 'spotlight', label: 'On set' }]
    : [{ image: artist.image, label: 'Portrait' }];
  const photos = artist.id === 'ananya-rao'
    ? Array.from({ length: 20 }, (_, index) => ({ ...sampleImages[index % sampleImages.length], number: index + 1 }))
    : sampleImages.map((item, index) => ({ ...item, number: index + 1 }));
  const visiblePhotos = preview ? photos.slice(0, 6) : photos;
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = active !== null;

  useEffect(() => {
    const element = dialog.current;
    if (active !== null && element && !element.open) element.showModal();
    else if (active === null && element?.open) element.close();
  }, [active]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function move(direction: number) { setActive(index => index === null ? null : (index + direction + photos.length) % photos.length); }
  const photo = active === null ? null : photos[active];

  return <section className="profile-photos" aria-labelledby="photos-heading">
    <div className="section-heading"><h2 id="photos-heading">Photos</h2><div className="photo-heading-actions"><span className="photo-count"><Images size={15} />{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>{preview && photos.length > visiblePhotos.length && onViewAll && <button className="gold-link" onClick={onViewAll}>View all {photos.length}<ArrowRight size={16} /></button>}</div></div>
    <div className={'profile-photo-grid' + (photos.length > 3 ? ' gallery-many' : '') + (!preview && photos.length > 6 ? ' gallery-expanded' : '')}>{visiblePhotos.map((item, index) => <button className="profile-photo-tile" key={item.image + '-' + item.number} onClick={() => setActive(index)} aria-label={'Open ' + artist.name + ' ' + item.label.toLowerCase() + ' photo ' + item.number}>
      <ArtistPhoto image={item.image} />
      <span className="photo-tile-shade" />
      <span className="photo-tile-caption"><span>{item.label}<small>{String(item.number).padStart(2, '0')}</small></span><Expand size={16} /></span>
    </button>)}</div>
    <p className="photo-gallery-note">{photos.length === 20 ? '20-photo layout demo · Existing sample portraits are repeated to demonstrate the gallery. ' : 'Sample portfolio images · '}Tap a photo to view it larger.</p>
    <dialog ref={dialog} className="photo-viewer" aria-label={artist.name + ' photo viewer'} onClose={() => setActive(null)} onCancel={() => setActive(null)} onClick={event => { if (event.target === event.currentTarget) setActive(null); }} onKeyDown={event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    }}>
      {photo && <div className="photo-viewer-panel">
        <header><div><h2>{artist.name}</h2><p>{photo.label} · Sample portfolio</p></div><button autoFocus className="circle-button" aria-label="Close photo viewer" onClick={() => setActive(null)}><X size={20} /></button></header>
        <ArtistPhoto image={photo.image} className="photo-viewer-image" alt={artist.name + ' — ' + photo.label} fit="contain" />
        <div className="photo-viewer-controls">{photos.length > 1 && <button className="circle-button" aria-label="Previous photo" onClick={() => move(-1)}><ArrowLeft size={20} /></button>}<span aria-live="polite">{active! + 1} / {photos.length} · {photo.label}</span>{photos.length > 1 && <button className="circle-button" aria-label="Next photo" onClick={() => move(1)}><ArrowRight size={20} /></button>}</div>
      </div>}
    </dialog>
  </section>;
}
