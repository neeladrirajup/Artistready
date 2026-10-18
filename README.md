# Artistready

Artist portfolios and discovery built with TypeScript, React and the Next.js App Router, running on the Sites-supported Vinext server runtime. The original supplied ASP.NET archive and read-only project sources are unchanged.

## Hosted data

The live application uses Cloudflare D1 (`DB`) for registered profiles and R2 (`BUCKET`) for uploaded photos and videos. Existing browser profiles can be imported from My profile. Original browser copies are retained; after import, profile reads and section edits use the database. Finishing Create profile saves a new profile to the account. Save & finish later keeps a device-local draft.

See [Hosted profile storage](db/README.md) for ownership rules, schema, migrations, import behavior, file limits and test instructions. The older `database/` SQLite prototype is a separate development reference; its data file is not the production database.

The existing Sites audience stays private. Hosted access uses the trusted Sites account identity. The separately styled mobile OTP, Google and recovery screens remain UI demonstrations and do not send SMS or implement an additional identity provider.

## Local development

Use Node.js 24 or newer:

```
npm install
npm run build
```

Apply pending local D1 migrations as described in `db/README.md`, then run:

```
npm run dev
```

Open http://127.0.0.1:5173. The portable starter includes a local test sign-in at `/signin-with-chatgpt?return_to=/`; this simulator is absent from hosted production. Local D1/R2 data lives in ignored `.wrangler/state` and is independent of hosted data.

```
npm run typecheck
npm run build
```

For production-runtime API tests, run the built Worker with `npm start -- --port 8787`, then `node --test scripts/profile-api.test.mjs`. These tests use isolated local fixtures. Legacy SQLite reference checks use `npm run db:test`.

## Experience

- Cinematic charcoal/gold and futuristic navy/cyan/gold themes, responsive discovery, filters, artist cards and shortlists.
- Eight illustrative sample artists remain demonstration content; registered artists come from D1.
- Account profiles support section-by-section editing for essentials, creative roles, biography, categorized skills, separate languages, credits, education, training, recognition, photos, showreels, measurements, wardrobe sizes and booking availability.
- Up to 20 real uploaded photos, a selected profile photo, photo viewer, uploaded showreel below 50 MB, multiple portfolio/video links and up to three pinned highlights.
- Optimistic profile versions prevent stale tabs from overwriting newer saves. Hidden booking contacts are excluded from other viewers' profile responses.
- Private file routes serve R2 images and video byte ranges. Server validation enforces supported file formats and sizes.
- Sample profiles retain their explicitly labelled illustrative photos and measurements. Sample profile edits, shortlists and theme preferences remain browser-local.

## Publishing

The tracked `.openai/hosting.json` retains the existing Site ID and declares D1/R2 bindings. Sites provisions these resources and applies committed Drizzle migrations before deploying the Worker. Build and package with the Sites workflow. No passwords, account records, actual uploaded files, SQLite files or emulator state belong in source archives.

The skills editor includes the 64-entry catalog snapshot in src/lib/skills-catalog.json, exported from the local PostgreSQL skills catalog. It supports search, category filters, selected-skill browsing. The skills window uses catalog selections without a custom skill text box. New catalog selections receive their default category automatically; the selection window does not show per-skill category editors. This published catalog snapshot does not connect the hosted server to laptop PostgreSQL.




Language editing and onboarding share the 40-entry catalog snapshot in src/lib/languages-catalog.json, with South Indian languages first and searchable options. Existing selections remain supported. This catalog snapshot is exported from local PostgreSQL; the live profile API still uses D1.


Internal navigation uses browser anchor links. This avoids the deployed runtime's client-router prefetch/navigation failure. My profile always opens /artists/my-profile, even before account data finishes loading.


Artist preferences use a separate private D1 table, never public profile JSON.
The catalog matches PostgreSQL migration 005 (21 options, four choices).
Only authenticated owners can read/write /api/profile/preferences; there is no
casting-viewer access yet. Saves use version checks and preserve other sections.
Adult-only fields require the artist's explicit 18+ confirmation (self-attestation,
not identity verification). No defaults or answers are inferred from playing age.
Run node scripts/preferences.test.mjs to verify persistence, ownership, privacy,
origin checks, validation, conflict handling and clear-answer behavior in SQLite.
The local PostgreSQL catalog remains separate from hosted D1; there is no live sync.

Preferences now support only_me (default for existing records), managers, and
everyone. Everyone means authenticated viewers who can access this Site; the
Site audience is unchanged. GET /api/profile/preferences/:artistId applies these
rules server-side and omits adult self-attestation from shared results. Writes
remain owner-only. Shared preferences never enter the artist-list response.
verified_managers is an administrator-managed allowlist of hashed authenticated
account IDs, verification timestamps and active flags. No manager grants are
seeded and no client-accessible role assignment endpoint exists. A profile role
or claimed occupation never grants manager access. Managers-only remains private
until an administrator approves manager accounts. Notes follow the same audience
as answers. Tests cover all audiences, revoked managers and cross-owner writes.

Call Sheet & Shoot Schedule is a separately editable section in profile Overview
and Details. The existing profile document stores callSheet (shootingStatus,
optional project/date range, notes and up to 50 availability ranges). It uses the
existing authenticated/versioned profile API and D1 record; no new SQL table or
migration is needed. Existing records default to an unspecified status and no
dates. Ranges support available, tentative, booked and unavailable; invalid dates,
reversed ranges, overlaps and available/current-shoot conflicts are rejected.
Project details are optional and visible with the artist profile. Dates are
calendar dates, not UTC timestamps. Schedule entries never create bookings.
Run node scripts/call-sheet.test.mjs for validation and API persistence checks.

Booking & Availability now includes the current shoot and call sheet dates in
one section with one editor. The booking save whitelist includes callSheet,
so booking details and schedule changes save together with the existing version
check. The separate schedule heading and edit action have been removed. Existing
stored fields and profile data require no migration.

Unified typography: Outfit for the wordmark, headings, body
text, profile details, forms and controls. Shared --heading/--sans tokens apply
across all pages; --serif remains an alias for --heading for existing components.
Google Fonts loads variable weights 400–700 with display=swap and Arial fallbacks.

The owner profile includes Preview -> /artists/my-profile?preview=1. Server page
parameters select a read-only presentation using the same saved data. Preview
hides editor controls, database save status and import actions; edit callbacks
and editor mounting are disabled. Back to editing returns to the owner page.
General-viewer preview omits Only me / Managers only preferences; normal server
visibility authorization remains unchanged. Preview is not a public sharing link.
