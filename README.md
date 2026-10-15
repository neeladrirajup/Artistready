# Artist Ready — modern design preview

A redesign of the supplied ASP.NET artist portfolio website, using Next.js App Router, React, TypeScript, and Node.js. The original archive and synced sources are unchanged.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Run `npm run typecheck` and `npm run build` to verify. The production build exports static files to `out/` for portable hosting. Remove `output: 'export'` from `next.config.ts` when adding server-side features.

## Included in this preview

- Responsive discovery page with category, location, availability, text search, and sorting.
- Eight illustrative artist profiles with overview, selected credits, and gallery tabs.
- Saved artists persisted in this browser.
- An artist-space form editing the Ananya Rao sample profile, persisted in this browser.
- About page and shareable profile links.

All names, biographies, credits, and availability are sample content. Portraits and illustrative images load from Unsplash; fonts load from Google Fonts. External assets require internet access. Repeated images are placeholders, not verified identities. Local links are only accessible on the device running the server. This preview does not authenticate users, connect to SQL Server, accept uploads, send messages, or store shared records.

## Mapping from the original website

| Original area | New experience / next work |
| --- | --- |
| Profile and basic details | Artist space form and public profile |
| Categories and arts specialties | Discovery categories and profile skills |
| Projects, films, television | Credits tab; connect existing records later |
| Photos and profile picture | Portrait and gallery layout; upload service later |
| Videos | Empty showreel state; media integration later |
| Training and awards | Illustrative profile sections; full editing later |
| Signup and login | Deferred until authentication and database decisions |

## Next phase: application migration

Choose authentication, shared database, and media storage before enabling real accounts. Existing SQL Server can be retained behind a Node.js data layer or migrated after reviewing all tables and procedures. Preserve existing password verification only as a transitional compatibility step and upgrade password hashes at successful sign-in. Add server validation, per-user authorization, upload controls, and migration checks before accepting real users. Existing production data has not been accessed or migrated.
