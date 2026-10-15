'use client';

import { useState } from 'react';
import { Activity, Footprints, Ruler, Shirt, UserRound } from 'lucide-react';

type Measurement = { label: string; value: number; kind?: 'weight' };
const groups: { title: string; description: string; icon: typeof Ruler; items: Measurement[] }[] = [
  { title: 'Body overview', description: 'Overall proportions', icon: UserRound, items: [
    { label: 'Height', value: 168 }, { label: 'Weight', value: 56, kind: 'weight' },
    { label: 'Chest / bust', value: 86 }, { label: 'Underbust', value: 75 },
    { label: 'Natural waist', value: 66 }, { label: 'High hip', value: 81 }, { label: 'Full hip / seat', value: 91 },
  ] },
  { title: 'Upper body', description: 'Neck, shoulders, arms & torso', icon: Shirt, items: [
    { label: 'Neck circumference', value: 32 }, { label: 'Shoulder width', value: 38 },
    { label: 'Across front chest', value: 33 }, { label: 'Across back', value: 35 },
    { label: 'Upper arm / biceps', value: 26 }, { label: 'Forearm circumference', value: 23 },
    { label: 'Wrist circumference', value: 15 }, { label: 'Armhole circumference', value: 39 },
    { label: 'Sleeve length', value: 57 }, { label: 'Front waist length', value: 42 },
    { label: 'Back waist length', value: 40 }, { label: 'Torso girth', value: 148 },
  ] },
  { title: 'Lower body', description: 'Waist to ankle', icon: Activity, items: [
    { label: 'Waist to hip', value: 20 }, { label: 'Inseam', value: 76 },
    { label: 'Outseam / waist to ankle', value: 101 }, { label: 'Crotch depth / seated rise', value: 25 },
    { label: 'Total crotch length', value: 65 }, { label: 'Thigh circumference', value: 52 },
    { label: 'Knee circumference', value: 35 }, { label: 'Calf circumference', value: 34 },
    { label: 'Ankle circumference', value: 21 },
  ] },
  { title: 'Head, hands & feet', description: 'Finishing and accessory measurements', icon: Footprints, items: [
    { label: 'Head circumference', value: 55 }, { label: 'Hand length', value: 17 },
    { label: 'Hand circumference', value: 18 }, { label: 'Foot length', value: 24 },
    { label: 'Foot width', value: 9 },
  ] },
];

export function ProfileMeasurements() {
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  function format(item: Measurement) {
    if (item.kind === 'weight') return unit === 'metric' ? item.value + ' kg' : (item.value * 2.2046226218).toFixed(1) + ' lb';
    return unit === 'metric' ? item.value + ' cm' : (item.value / 2.54).toFixed(1) + ' in';
  }

  return <section className="profile-measurements" aria-labelledby="measurements-heading">
    <div className="section-heading measurement-heading"><div><h2 id="measurements-heading">Measurements</h2><p>Body proportions, fit & wardrobe sizing</p></div>
      <div className="measurement-unit-switch" role="group" aria-label="Measurement units">
        <button aria-pressed={unit === 'metric'} onClick={() => setUnit('metric')}>Metric <small>cm / kg</small></button>
        <button aria-pressed={unit === 'imperial'} onClick={() => setUnit('imperial')}>Imperial <small>in / lb</small></button>
      </div>
    </div>
    <div className="measurement-note"><Ruler size={18} /><p>Illustrative sample measurements for this design preview. These are not the artist’s actual measurements.</p></div>
    <div className="measurement-summary">{groups[0].items.filter(item => ['Height', 'Weight', 'Chest / bust', 'Natural waist', 'Full hip / seat'].includes(item.label)).map(item => <div key={item.label}><span>{item.label}</span><strong>{format(item)}</strong></div>)}</div>
    <div className="measurement-groups">{groups.map(group => <section className="measurement-card" key={group.title}><header><group.icon size={22} /><div><h3>{group.title}</h3><p>{group.description}</p></div></header><dl>{group.items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{format(item)}</dd></div>)}</dl></section>)}</div>
    <section className="measurement-card clothing-sizes"><header><Shirt size={22} /><div><h3>Clothing & footwear sizes</h3><p>Sample sizes · Confirm fit with each wardrobe supplier</p></div></header><dl><div><dt>Top / T-shirt</dt><dd>S · International</dd></div><div><dt>Dress</dt><dd>8 · UK</dd></div><div><dt>Trouser waist</dt><dd>{unit === 'metric' ? '66 cm' : '26.0 in'}</dd></div><div><dt>Jacket / suit</dt><dd>36 · EU</dd></div><div><dt>Shoes</dt><dd>5 · UK / India</dd></div><div><dt>Gloves</dt><dd>S · International</dd></div></dl></section>
    <p className="measurement-footnote">Circumference is measured around the body; lengths and widths are measured point to point. Clothing size labels keep their original sizing system when units change. All values are sample data; no personal measurements are collected.</p>
  </section>;
}
