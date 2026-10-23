import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const adminUrl = process.env.ARTISTREADY_PG_ADMIN_URL;
if (!adminUrl) throw new Error('Set ARTISTREADY_PG_ADMIN_URL to a PostgreSQL administrator URL for the postgres database.');
const url = new URL(adminUrl);
if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('A PostgreSQL connection URL is required.');
url.pathname = '/postgres';

async function connect(connectionString) {
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  await client.connect();
  return client;
}

const admin = await connect(url.toString());
try {
  await admin.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='artistready_owner') THEN
      CREATE ROLE artistready_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='artistready_api') THEN
      CREATE ROLE artistready_api NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
    END IF;
  END $$`);
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname='artistready'");
  if (!exists.rowCount) await admin.query("CREATE DATABASE artistready OWNER artistready_owner ENCODING 'UTF8' TEMPLATE template0");
} finally {
  await admin.end();
}

url.pathname = '/artistready';
const db = await connect(url.toString());
try {
  await db.query(`REVOKE ALL ON DATABASE artistready FROM PUBLIC;
    GRANT CONNECT ON DATABASE artistready TO artistready_api;
    REVOKE CREATE ON SCHEMA public FROM PUBLIC;
    CREATE SCHEMA IF NOT EXISTS artistready AUTHORIZATION artistready_owner;`);
  await db.query(`SET ROLE artistready_owner;
    CREATE TABLE IF NOT EXISTS artistready.schema_migrations (
      version text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT current_timestamp
    );
    RESET ROLE;`);

  const sqlDir = fileURLToPath(new URL('../postgresql/sql/', import.meta.url));
  const migrations = readdirSync(sqlDir).filter(name => /^\d{3}_.+\.sql$/.test(name)).sort();
  for (const name of migrations) {
    const version = name.slice(0, 3);
    const sql = readFileSync(fileURLToPath(new URL(`../postgresql/sql/${name}`, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const previous = await db.query('SELECT checksum FROM artistready.schema_migrations WHERE version=$1', [version]);
    if (previous.rowCount) {
      if (previous.rows[0].checksum !== checksum) throw new Error(`Applied migration ${name} was changed. Add a new migration instead.`);
      console.log(`Already applied ${name}`);
      continue;
    }
    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO artistready.schema_migrations(version,checksum) VALUES($1,$2)', [version, checksum]);
      await db.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (error) {
      await db.query('ROLLBACK');
      throw new Error(`Migration ${name} failed: ${error.message}`, { cause: error });
    }
  }
  const result = await db.query('SELECT count(*)::integer AS count FROM artistready.schema_migrations');
  console.log(`artistready database ready (${result.rows[0].count} migrations).`);
} finally {
  await db.end();
}
