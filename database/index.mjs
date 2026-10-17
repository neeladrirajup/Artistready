import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export const defaultDatabasePath=resolve(root,'data','artist-ready.sqlite');
export function openDatabase(path=process.env.ARTIST_READY_DB_PATH||defaultDatabasePath){
 if(path!==':memory:'){
  path=resolve(path);
  for(const folder of ['public','out','sources']){const child=relative(resolve(root,folder),path);if(child===''||(child!=='..'&&!child.startsWith('..'+sep)&&!isAbsolute(child)))throw new Error('Database files must not be placed in public, out or sources.');}
  mkdirSync(dirname(path),{recursive:true});
 }
 const db=new DatabaseSync(path);db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 if(path!==':memory:')db.exec('PRAGMA journal_mode=WAL;');
 return db;
}
export function migrate(db){
 db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP) STRICT;');
 const directory=fileURLToPath(new URL('./migrations/',import.meta.url));
 const applied=[];
 for(const name of readdirSync(directory).filter(n=>/^\d+.*\.sql$/.test(n)).sort()){
  const sql=readFileSync(resolve(directory,name),'utf8').replaceAll('\r\n','\n'),checksum=createHash('sha256').update(sql).digest('hex');
  const existing=db.prepare('SELECT checksum FROM schema_migrations WHERE name=?').get(name);
  if(existing){if(existing.checksum!==checksum)throw new Error('Applied migration changed: '+name+'. Add a new migration instead.');continue;}
  db.exec('BEGIN IMMEDIATE');
  try{db.exec(sql);db.prepare('INSERT INTO schema_migrations(name,checksum) VALUES (?,?)').run(name,checksum);db.exec('COMMIT');applied.push(name);}catch(error){db.exec('ROLLBACK');throw error;}
 }
 return applied;
}
