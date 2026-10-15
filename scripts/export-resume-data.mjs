import { writeFileSync } from 'node:fs';
import { artists, artwork } from '../src/lib/artists.ts';
writeFileSync(new URL('./resume-data.json', import.meta.url), JSON.stringify({ artists, artwork }, null, 2));
