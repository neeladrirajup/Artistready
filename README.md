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

- Casting-focused profile with a calm visual hierarchy, primary casting enquiry and Share profile actions, and no illustrative profile-strength score on the public profile.
- Profile sharing replaces PDF download actions: an artist preview, canonical profile URL, copy-link confirmation/manual-copy fallback, and native device sharing where available. Site access permissions are preserved; browser-local edits are not transmitted by a profile link.
- Editable browser-local showreel/scene/trailer links, booking email, representative, preferred locations, travel preference, availability date, and visibility settings. Supported videos: HTTPS YouTube, Vimeo, MP4, and WebM. Real media must be supplied; no sample video is falsely presented as a showreel.
- Casting enquiry builder with copy-to-clipboard and optional email-draft action when a booking email is configured and displayed. No message is automatically sent and enquiry text is not persisted.
- Eight downloadable one-page sample casting résumé PDFs under public/resumes. PDFs contain only baseline sample information and exclude browser-local edits, contact information, and private measurements. Regenerate with scripts/export-resume-data.mjs and scripts/create-resumes.py using Node.js and Python with reportlab, pypdf, and pypdfium2.
- Overview uses three distinct existing sample portraits; the full Photos tab retains the explicitly labelled 20-slot repeated-photo layout demonstration.
- Visibility options are local display preferences, not authenticated access controls. Real accounts, shared database/storage, secure media uploads, and account-level privacy still require backend integration.

- Futuristic navy/cyan/gold and cinematic charcoal/gold designs based on the supplied mockups; switch styles in the header.
- Responsive discovery with category, location, age, gender, language, skill, availability, text search, and sorting. Languages match any selected language; skills match all selected skills. Applied filters persist for the browser session.
- Eight illustrative artist profiles with Overview, Work, Photos, Measurements, and Details tabs; skills and languages are included in Overview and Details.
- Responsive photo galleries on the profile overview and Photos tab, with an enlarged viewer, next/previous controls, arrow-key navigation, and Escape to close. Galleries use existing sample artwork; uploading photos is not connected.
- The main sample profile demonstrates a 20-photo portfolio using repeated existing sample portraits, explicitly labelled as a layout demo. The overview shows three selected tiles and a View all 20 button; the Photos tab shows all 20 with sequential numbering. The viewer navigates the full set even from the overview.
- Measurements section on the overview and a dedicated Measurements tab: height in feet and inches, weight in kg, and chest/bust, natural waist, and full hip/seat in inches, plus clothing and footwear sizes. These are a shared illustrative sizing example, not any artist's actual measurements; no personal measurement collection or access-control claims are implemented.
- Film-set and portrait artwork displayed from the user-supplied reference images using SVG viewports. The reference images are copied to public/references without modifying the originals.
- Illustrative Hyderabad map with sample artist links and zoom; no live location or geolocation service.
- Sign-in, create-account, and password-recovery design pages. These explicitly explain that authentication is not connected; credentials are never stored or submitted.
- Saved artists persisted in this browser.
- An artist-space form editing the Saanvi Reddy sample profile, persisted in this browser. Existing route identifiers are retained so previous profile links continue to work.
- About page and shareable profile links.

All names, biographies, credits, availability, ages, and experience are sample content. Fonts load from Google Fonts and have system fallbacks. Repeated portraits are placeholders, not verified identities. No verification badge or follower count is claimed. The illustrative profile-strength score has been removed. This preview does not authenticate users, connect to SQL Server, accept uploads, send messages, or store shared records.

## Mapping from the original website

| Original area | New experience / next work |
| --- | --- |
| Profile and basic details | Artist space form and public profile |
| Categories and arts specialties | Discovery categories and profile skills |
| Projects, films, television | Credits tab; connect existing records later |
| Photos and profile picture | Portrait and spotlight layout; upload service later |
| Videos | Browser-local showreel, scene, and trailer links; account uploads later |
| Training and awards | Illustrative profile sections; full editing later |
| Signup and login | Design screens only; authentication and database integration later |

## Next phase: application migration

Choose authentication, shared database, and media storage before enabling real accounts. Existing SQL Server can be retained behind a Node.js data layer or migrated after reviewing all tables and procedures. Preserve existing password verification only as a transitional compatibility step and upgrade password hashes at successful sign-in. Add server validation, per-user authorization, upload controls, and migration checks before accepting real users. Existing production data has not been accessed or migrated.




## First-time artist setup

The /create-profile page (also available at /signup) provides a cinematic four-step onboarding flow with required essentials, optional story/skills/languages, a portrait and showreel link, optional measurements, and a final review. It includes a live artist card, local draft saving and completion feedback. JPG, PNG and WebP portraits up to 1 MB are read locally and stored with the draft only in this browser; no files are uploaded to a server. Registration, public profile creation and authentication remain unconnected in this design preview. The flow is linked from the main navigation and sign-in page.

