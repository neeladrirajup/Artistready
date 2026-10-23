import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

const db=new DatabaseSync(':memory:');
try{
 for(const file of ['0000_empty_wild_child','0001_noisy_daredevil','0002_quiet_pandemic','0003_smooth_wallflower','0004_absent_abomination'])db.exec(readFileSync(`drizzle/${file}.sql`,'utf8'));
 const draft={name:'Test Artist',role:'Actor',city:'Hyderabad',heightFeet:'5',heightInches:'6',weight:'64.5',chest:'34',waist:'30',hip:'35',bodyBuild:'lean_athletic',measurementFit:'male',available:true,skills:['Dance'],languages:['Telugu'],castingRoles:['Hero'],additionalRoles:['Character Artist'],clothing:{top:'M · International'},skillCategories:{Dance:'Performance'},reelLinks:['https://example.test/reel'],pinnedMedia:['photo-1'],credits:[{id:'credit-1',title:'First Film',type:'Feature film',role:'Lead',year:'2026',director:'Director',production:'Studio',trailer:''}],training:[{id:'training-1',title:'Workshop',organisation:'Academy',year:'2025',notes:''}],recognition:[{id:'award-1',title:'Award',organisation:'Festival',year:'2026',notes:''}],education:[{id:'school-1',qualification:'Degree',institution:'College',year:'2022',notes:''}],callSheet:{shootingStatus:'not_shooting',project:'',shootFrom:'',shootTo:'',notes:'',dates:[{id:'date-1',from:'2026-11-01',to:'2026-11-02',status:'available',notes:''}]}};
 db.prepare('INSERT INTO profile_accounts(id,created_at) VALUES (?,?)').run('artist-1','now');
 db.prepare('INSERT INTO profiles(id,name,role,city,document,version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run('artist-1',draft.name,draft.role,draft.city,JSON.stringify(draft),1,'now','now');
 db.prepare('INSERT INTO artist_preferences(artist_id,document,version,created_at,updated_at) VALUES (?,?,?,?,?)').run('artist-1',JSON.stringify({visibility:'managers',adultConfirmed:true,answers:{hugging:{choice:'okay',notes:'With direction'}}}),1,'now','now');
 for(const file of ['0005_relational_profiles','0006_lyrical_deathstrike'])db.exec(readFileSync(`drizzle/${file}.sql`,'utf8'));
 assert.deepEqual({...db.prepare('SELECT height,height_inches,weight_kg,chest_in,waist_in,hip_in FROM artist_measurements WHERE artist_id=?').get('artist-1')},{height:'5 ft 6 in',height_inches:66,weight_kg:64.5,chest_in:34,waist_in:30,hip_in:35});
 for(const [table,value] of [['artist_skills','Dance'],['artist_languages','Telugu'],['artist_casting_roles','Hero'],['artist_additional_roles','Character Artist']])assert.equal(db.prepare(`SELECT value FROM ${table} WHERE artist_id=?`).get('artist-1').value,value);
 assert.equal(db.prepare('SELECT title FROM artist_credits WHERE artist_id=?').get('artist-1').title,'First Film');
 assert.equal(db.prepare('SELECT title FROM artist_training WHERE artist_id=?').get('artist-1').title,'Workshop');
 assert.equal(db.prepare('SELECT title FROM artist_recognition WHERE artist_id=?').get('artist-1').title,'Award');
 assert.equal(db.prepare('SELECT qualification FROM artist_education WHERE artist_id=?').get('artist-1').qualification,'Degree');
 assert.equal(db.prepare('SELECT status FROM artist_call_sheet_dates WHERE artist_id=?').get('artist-1').status,'available');
 assert.equal(db.prepare('SELECT visibility FROM artist_preferences WHERE artist_id=?').get('artist-1').visibility,'managers');
 assert.equal(db.prepare('SELECT choice FROM artist_preference_answers WHERE artist_id=? AND code=?').get('artist-1','hugging').choice,'okay');
 assert.equal(db.prepare("SELECT count(*) AS n FROM pragma_table_info('profiles') WHERE name='document'").get().n,0);
 assert.equal(db.prepare("SELECT count(*) AS n FROM pragma_table_info('artist_preferences') WHERE name='document'").get().n,0);
 assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 console.log('Passed: existing profile and preferences migrated into relational tables without JSON columns.');
}finally{db.close()}
