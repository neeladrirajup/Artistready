# Artistready database

A working **local SQLite database** for development. Requires Node.js 24; uses the built-in `node:sqlite` module without an extra database service or dependency.

```sh
npm run db:setup
npm run db:status
npm run db:test
```

`db:setup` creates `data/artist-ready.sqlite`, applies migrations, and adds the eight sample artists already present in the project. It is safe to run again: seeding does not overwrite edits. `db:migrate` applies schema only; `db:seed` adds sample content separately. `ARTIST_READY_DB_PATH` optionally selects another local database file. Files under `public`, `out` or `sources` are rejected.

## Tables

| Data | Tables |
| --- | --- |
| Account ownership and provider identity | `accounts`, `auth_identities` |
| Artist basics, availability, publication status | `artists` |
| Additional roles, languages, skill categories, genres | `artist_roles`, `artist_languages`, `artist_skills`, `artist_genres` |
| Height, weight, chest/bust, waist, hips and clothing sizes | `artist_measurements`, `artist_wardrobe` |
| Projects, characters and production details | `artist_credits` |
| Education, training and recognition | `artist_milestones` |
| Dates, locations, travel, representation and notes | `artist_booking` |
| Booking email, phone and display preference | `artist_booking_contacts` |
| Photos, uploaded videos and portfolio links | `artist_media` |
| Up to three highlights owned by the same artist | `artist_pinned_media` |
| Shortlists | `saved_artists` |
| Applied migration history and checksums | `schema_migrations` |

Foreign keys and checks enforce relational ownership, unique account/profile links, valid age ranges, one profile photo, three pinned positions and the current photo/video size limits. The 20-photo UI limit must also be enforced by a future server in the same transaction as inserts. Timestamps use UTC. Server update operations must explicitly update `updated_at`.

Migrations are ordered SQL files. **Never modify an applied migration.** Add a new numbered file for subsequent changes. Application is transactional and records a checksum; equivalent Windows/Unix line endings are normalized. Test fixtures use an in-memory database and do not modify development records.

## Current integration boundary

The live Next.js site still exports static files. Its existing browser-local profiles and IndexedDB uploads are **not automatically copied to this database**, and its UI does not yet read or write SQLite. No real accounts, booking contacts, passwords or OTPs are seeded.

Before enabling shared live data:

1. Add a server runtime/API and connect authenticated account identities from the chosen login provider.
2. Apply these migrations to the chosen hosted database, adapting dialect/runtime as needed. This SQLite schema is a starting point for Cloudflare D1; it is not PostgreSQL/SQL Server migration SQL.
3. Enforce authorization on every read/write. Foreign keys are not authentication or row-level access control. Owner-only responses may include private fields; public discovery queries must filter published profiles and omit hidden booking contacts and identities.
4. Store upload bytes in private object storage; keep only validated keys and metadata here. Validate actual media type, size, URL schemes and ownership server-side, and serve private files through controlled access.
5. Offer an explicit import from the existing browser draft/media after sign-in. Preserve the original browser data until a server-confirmed import succeeds.

Never put a database file, its journal files or a backup in `public`/`out`, a published archive, Git or the source ZIP. The `data` folder is ignored. Close all connections before making a filesystem backup, or use SQLite's supported online backup mechanism; copying only a live WAL-mode `.sqlite` file can omit recent data. This database has no application-level encryption; protect the machine and backups accordingly.

## Developer access

```js
import { openDatabase } from './database/index.mjs';
const db = openDatabase();
try {
  const artists = db.prepare(`
    SELECT id, slug, professional_name, primary_role, city
    FROM artists WHERE visibility = ? ORDER BY professional_name
  `).all('published');
  console.log(artists);
} finally { db.close(); }
```

Keep this module on the server or in development scripts. Never import it into a client component.
