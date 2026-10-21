# Hosted profile storage

The deployed application uses Cloudflare D1 (`DB`) for account-owned profile
documents and media metadata, and R2 (`BUCKET`) for original photo/video files.
Sites provisions both resources from `.openai/hosting.json`. No database password
or service credential is included in the frontend.

`profiles.document` stores every validated profile field, including project
credits, education, training, recognition, roles, categorized skills, languages,
measurements, wardrobe sizes, booking details and showreel links. Name, role and
city also have structured columns. `profile_media` records file metadata and R2
object references. The stable trusted Sites user ID is hashed into the owning
account key. It is never supplied by a client form. All API requests require the
platform identity; every mutation is scoped to that account and checks Origin.
Other profiles never receive undisplayed booking contact details.

The eight illustrative artists remain clearly identified sample content in
`src/lib/artists.ts`. Registered profiles are fetched from the database and added
to the list. Site access remains controlled by the existing private Sites policy.

Migration `0003_smooth_wallflower.sql` adds `artist_search` plus indexed skill and
language link tables. Database triggers backfill existing profiles and refresh
these search rows whenever a profile is inserted, edited, or deleted. The
`/api/profile/search` endpoint filters registered artists in D1 by location,
craft, gender, playing age, availability, language, skill, and text search. It
returns 50 at a time; the list loads additional matches on request. The full
JSON document remains the source for profile display and editing. Sample artists
are still filtered locally because they are illustrative records, not D1 rows.

## Import and save behavior

Existing browser data is offered through **Import profile & uploads to database**
on My profile. Files upload first with stable IDs, then the complete profile is
saved. Retrying an interrupted import does not duplicate media or overwrite an
existing profile. The original localStorage and IndexedDB copies are retained.
After import, the database is authoritative for reads and section edits. Browser
backups are not silently restored over a saved database profile. Finishing the
new-profile form saves to the same API; Save & finish later keeps a local draft.

Profile versions prevent stale tabs from overwriting newer edits. Uploads and
removals save immediately. Photos allow JPG/PNG/WebP up to 5,000,000 bytes and a
maximum of 20; showreels allow MP4/WebM strictly below 50,000,000 bytes. File
signatures and sizes are validated on the server. R2 objects are served through
authenticated routes, including byte ranges for videos.

## Development

Install dependencies, run `npm run build`, then apply each pending SQL migration:

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_empty_wild_child.sql
```

`npm run dev` starts the portable preview on port 5173, with the starter's local
test sign-in. Production uses Sites authentication, not this test identity.
`npm start -- --port 8787` starts the built Worker on loopback with local storage.
Run `node --test scripts/profile-api.test.mjs` against this built preview to test
ownership, validation, optimistic concurrency, contacts and media. Test fixtures
exist only in the ignored local emulator state. Run `npm run typecheck` too.

Change `db/schema.ts`, run `npm run db:generate`, inspect and commit generated
Drizzle SQL and metadata, then build and publish with Sites. Never edit an
applied migration. Hosted migrations run through Sites before Worker deployment.
Local emulator data is separate from hosted data and is never packaged.

The older `database/` SQLite schema and `data/artist-ready.sqlite` remain a local
prototype/reference; they are not the production storage or an uploaded database
file. No local SQLite file, uploads, account data, or runtime state is committed.
