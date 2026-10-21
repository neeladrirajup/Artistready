import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const state = join(root, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');

export function ensureLocalD1() {
  let files;
  try { files = readdirSync(state).filter(name => name.endsWith('.sqlite') && name !== 'metadata.sqlite'); }
  catch (error) { if (error?.code === 'ENOENT') return; throw error; }
  // The emulator creates its first database file on demand. Never guess which
  // file to modify if several bindings have populated this directory.
  if (files.length === 0) return;
  if (files.length !== 1) throw new Error('Multiple local D1 files found; apply migrations to the intended database explicitly.');
  const db = new DatabaseSync(join(state, files[0]));
  const exists = name => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name));
  const migrations = [
    { tables: ['profile_accounts', 'profile_media', 'profiles'], file: '0000_empty_wild_child.sql' },
    { tables: ['artist_preferences'], file: '0001_noisy_daredevil.sql' },
    { tables: ['verified_managers'], file: '0002_quiet_pandemic.sql' },
    { tables: ['artist_search', 'artist_search_skills', 'artist_search_languages'], file: '0003_smooth_wallflower.sql' },
  ];
  try {
    db.exec('BEGIN IMMEDIATE');
    for (const migration of migrations) {
      const present = migration.tables.filter(exists);
      if (present.length === migration.tables.length) continue;
      if (present.length) throw new Error(`Incomplete local D1 migration: ${migration.file}`);
      const sql = readFileSync(join(root, 'drizzle', migration.file), 'utf8').replaceAll('--> statement-breakpoint', '\n');
      db.exec(sql);
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  finally { db.close(); }
}
