import { artists } from '../src/lib/artists.ts';
export function seed(db){
 db.exec('BEGIN IMMEDIATE');
 try{
  const artist=db.prepare(`INSERT OR IGNORE INTO artists(id,slug,professional_name,primary_role,city,biography,gender,playing_age_from,playing_age_to,experience_label,experience_years,open_to_opportunities,visibility,is_sample,artwork_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'published',1,?)`);
  for(const a of artists){
   artist.run(a.id,a.id,a.name,a.role,a.city,a.tagline,a.gender,Math.max(1,a.age-3),Math.min(100,a.age+3),a.experience+' years',a.experience,Number(a.available),a.image);
   if(!db.prepare('SELECT is_sample FROM artists WHERE id=?').get(a.id)?.is_sample)continue;
   for(const [i,language] of a.languages.entries())db.prepare('INSERT OR IGNORE INTO artist_languages(id,artist_id,language) VALUES (?,?,?)').run(a.id+':language:'+i,a.id,language);
   for(const [i,skill] of a.skills.entries())db.prepare('INSERT OR IGNORE INTO artist_skills(id,artist_id,name,category) VALUES (?,?,?,?)').run(a.id+':skill:'+i,a.id,skill,'Others');
   for(const [i,genre] of a.genres.entries())db.prepare('INSERT OR IGNORE INTO artist_genres(id,artist_id,genre) VALUES (?,?,?)').run(a.id+':genre:'+i,a.id,genre);
   db.prepare('INSERT OR IGNORE INTO artist_booking(artist_id,preferred_locations) VALUES (?,?)').run(a.id,a.city);
  }
  db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
 return db.prepare('SELECT count(*) AS count FROM artists WHERE is_sample=1').get().count;
}
