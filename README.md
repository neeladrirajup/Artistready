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

