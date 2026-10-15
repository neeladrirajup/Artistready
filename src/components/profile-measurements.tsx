import { Ruler, Shirt } from 'lucide-react';

const heightInches = Math.round(168 / 2.54);
const measurements = [
  { label: 'Height', value: Math.floor(heightInches / 12) + ' ft ' + (heightInches % 12) + ' in' },
  { label: 'Weight', value: '56 kg' },
  { label: 'Chest / bust', value: (86 / 2.54).toFixed(1) + ' in' },
  { label: 'Natural waist', value: (66 / 2.54).toFixed(1) + ' in' },
  { label: 'Full hip / seat', value: (91 / 2.54).toFixed(1) + ' in' },
];

export function ProfileMeasurements() {
  return <section className="profile-measurements" aria-labelledby="measurements-heading">
    <div className="section-heading measurement-heading"><div><h2 id="measurements-heading">Measurements</h2><p>Body proportions, fit & wardrobe sizing</p></div></div>
    <div className="measurement-note"><Ruler size={18} /><p>Illustrative sample measurements for this design preview. These are not the artist’s actual measurements.</p></div>
    <div className="measurement-summary">{measurements.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
    <section className="measurement-card clothing-sizes"><header><Shirt size={22} /><div><h3>Clothing & footwear sizes</h3><p>Sample sizes · Confirm fit with each wardrobe supplier</p></div></header><dl><div><dt>Top / T-shirt</dt><dd>S · International</dd></div><div><dt>Dress</dt><dd>8 · UK</dd></div><div><dt>Trouser waist</dt><dd>26.0 in</dd></div><div><dt>Jacket / suit</dt><dd>36 · EU</dd></div><div><dt>Shoes</dt><dd>5 · UK / India</dd></div><div><dt>Gloves</dt><dd>S · International</dd></div></dl></section>
    <p className="measurement-footnote">Height is shown in feet and inches, weight in kilograms, and body circumferences in inches. All values are sample data; no personal measurements are collected.</p>
  </section>;
}
