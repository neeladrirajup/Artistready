import { openDatabase, migrate, defaultDatabasePath } from '../database/index.mjs';
const command=process.argv[2]||'status';
if(!['setup','migrate','seed','status'].includes(command))throw new Error('Use setup, migrate, seed or status.');
const db=openDatabase();
try{
 if(command==='setup'||command==='migrate'){const added=migrate(db);console.log(added.length?'Applied: '+added.join(', '):'Database schema is up to date.');}
 if(command==='setup'||command==='seed'){if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='artists'").get())throw new Error('Run npm run db:migrate first.');const {seed}=await import('../database/seed.mjs');console.log('Sample artists: '+seed(db));}
 console.log('Database: '+(process.env.ARTIST_READY_DB_PATH||defaultDatabasePath));
 const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
 console.table(tables.map(({name})=>({table:name,rows:db.prepare('SELECT count(*) AS count FROM "'+name.replaceAll('"','""')+'"').get().count})));
 if(db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Foreign-key check failed.');
 console.log('Integrity: '+db.prepare('PRAGMA integrity_check').get().integrity_check);
}finally{db.close();}
