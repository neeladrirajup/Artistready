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

- Futuristic navy/cyan/gold and cinematic charcoal/gold designs based on the supplied mockups; switch styles in the header.
- Responsive discovery with category, location, age, gender, language, skill, availability, text search, and sorting. Languages match any selected language; skills match all selected skills. Applied filters persist for the browser session.
- Eight illustrative artist profiles with Profile, Work, Skills, and Details tabs.
- Film-set and portrait artwork displayed from the user-supplied reference images using SVG viewports. The reference images are copied to public/references without modifying the originals.
- Illustrative Hyderabad map with sample artist links and zoom; no live location or geolocation service.
- Sign-in, create-account, and password-recovery design pages. These explicitly explain that authentication is not connected; credentials are never stored or submitted.
- Saved artists persisted in this browser.
- An artist-space form editing the Saanvi Reddy sample profile, persisted in this browser. Existing route identifiers are retained so previous profile links continue to work.
- About page and shareable profile links.

All names, biographies, credits, availability, ages, and experience are sample content. Fonts load from Google Fonts and have system fallbacks. Repeated portraits are placeholders, not verified identities. No verification badge or follower count is claimed. The profile-strength score is explicitly illustrative. This preview does not authenticate users, connect to SQL Server, accept uploads, send messages, or store shared records.

## Mapping from the original website

| Original area | New experience / next work |
| --- | --- |
| Profile and basic details | Artist space form and public profile |
| Categories and arts specialties | Discovery categories and profile skills |
| Projects, films, television | Credits tab; connect existing records later |
| Photos and profile picture | Portrait and spotlight layout; upload service later |
| Videos | Empty showreel state; media integration later |
| Training and awards | Illustrative profile sections; full editing later |
| Signup and login | Design screens only; authentication and database integration later |

## Next phase: application migration

Choose authentication, shared database, and media storage before enabling real accounts. Existing SQL Server can be retained behind a Node.js data layer or migrated after reviewing all tables and procedures. Preserve existing password verification only as a transitional compatibility step and upgrade password hashes at successful sign-in. Add server validation, per-user authorization, upload controls, and migration checks before accepting real users. Existing production data has not been accessed or migrated.
