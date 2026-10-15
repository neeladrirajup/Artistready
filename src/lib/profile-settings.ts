export type ProfileSettings = {
  showreel: string; sceneOne: string; sceneTwo: string; trailerOne: string; trailerTwo: string;
  email: string; representative: string; locations: string; travel: string; availableFrom: string;
  showMeasurements: boolean; showContact: boolean;
};
export function initialSettings(city: string): ProfileSettings {
  return { showreel: '', sceneOne: '', sceneTwo: '', trailerOne: '', trailerTwo: '', email: '', representative: '', locations: city + ', India', travel: 'Open to discussion', availableFrom: '', showMeasurements: true, showContact: false };
}
export function loadSettings(id: string, city: string): ProfileSettings {
  const initial = initialSettings(city);
  try {
    const stored: unknown = JSON.parse(localStorage.getItem('artist-ready:casting:' + id) || 'null');
    if (!stored || typeof stored !== 'object') return initial;
    const values = stored as Record<string, unknown>;
    return Object.fromEntries(Object.entries(initial).map(([key, value]) => [key, typeof values[key] === typeof value ? values[key] : value])) as ProfileSettings;
  } catch { return initial; }
}
export function videoSource(value: string): { type: 'embed' | 'video'; src: string } | null {
  if (!value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    let id = '';
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) id = url.searchParams.get('v') || (url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : '');
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return { type: 'embed', src: 'https://www.youtube-nocookie.com/embed/' + id };
    if (['vimeo.com', 'www.vimeo.com'].includes(url.hostname) && /^\/[0-9]+$/.test(url.pathname)) return { type: 'embed', src: 'https://player.vimeo.com/video/' + url.pathname.slice(1) };
    if (/\.(mp4|webm)$/i.test(url.pathname)) return { type: 'video', src: url.href };
  } catch { /* A malformed URL is not playable. */ }
  return null;
}
