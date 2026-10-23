SET ROLE artistready_owner;
SET search_path=pg_catalog,artistready;

CREATE TABLE artistready.skills (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120 AND name=btrim(name)),
 category text NOT NULL CHECK (category IN ('Technical','Soft Skills','Artistic Skills','Others')),
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT current_timestamp
);
CREATE UNIQUE INDEX skills_name_unique ON artistready.skills(lower(name));
CREATE TABLE artistready.artist_skills (
 artist_id text NOT NULL REFERENCES artistready.profiles(id) ON DELETE CASCADE,
 skill_id bigint NOT NULL REFERENCES artistready.skills(id),
 category text NOT NULL CHECK (category IN ('Technical','Soft Skills','Artistic Skills','Others')),
 PRIMARY KEY(artist_id,skill_id)
);
CREATE INDEX artist_skills_skill_id ON artistready.artist_skills(skill_id);

INSERT INTO artistready.skills(name,category) VALUES
 ('Acting','Artistic Skills'),('Dance','Artistic Skills'),('Singing','Artistic Skills'),
 ('Writing','Artistic Skills'),('Editing','Technical'),('Photography','Technical'),
 ('Cinematography','Technical'),('Swimming','Technical'),('Driving','Technical'),
 ('Martial arts','Technical'),('Karate','Technical'),('Action','Artistic Skills'),
 ('Drama','Artistic Skills'),('Comedy','Artistic Skills'),('Theatre','Artistic Skills'),
 ('Improvisation','Artistic Skills'),('Voice acting','Artistic Skills'),('Voice-over','Artistic Skills'),
 ('Dubbing','Artistic Skills'),('Mime','Artistic Skills'),('Mimicry','Artistic Skills'),
 ('Classical dance','Artistic Skills'),('Bharatanatyam','Artistic Skills'),('Kuchipudi','Artistic Skills'),
 ('Kathak','Artistic Skills'),('Contemporary dance','Artistic Skills'),('Hip-hop dance','Artistic Skills'),
 ('Choreography','Artistic Skills'),('Classical singing','Artistic Skills'),('Playback singing','Artistic Skills'),
 ('Guitar','Artistic Skills'),('Piano','Artistic Skills'),('Drums','Artistic Skills'),
 ('Screenwriting','Artistic Skills'),('Dialogue writing','Artistic Skills'),('Storytelling','Artistic Skills'),
 ('Directing','Technical'),('Film editing','Technical'),('Color grading','Technical'),
 ('Sound recording','Technical'),('Sound design','Technical'),('Lighting','Technical'),
 ('Camera operation','Technical'),('Drone operation','Technical'),('VFX','Technical'),
 ('Animation','Technical'),('Makeup','Technical'),('Hair styling','Technical'),
 ('Costume design','Artistic Skills'),('Production design','Artistic Skills'),
 ('Stunts','Technical'),('Stage combat','Technical'),('Horse riding','Technical'),
 ('Motorcycle riding','Technical'),('Cycling','Technical'),('Yoga','Technical'),
 ('Communication','Soft Skills'),('Teamwork','Soft Skills'),('Leadership','Soft Skills'),
 ('Time management','Soft Skills'),('Adaptability','Soft Skills'),('Collaboration','Soft Skills'),
 ('Problem solving','Soft Skills'),('Public speaking','Soft Skills');

-- Keep existing profile JSON compatible while maintaining relational skills.
-- Custom skills are added to the master catalog; each artist keeps their own
-- category selection without changing other artists or the master category.
CREATE FUNCTION artistready.sync_artist_skills() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE skill text; category_value text; selected_id bigint;
BEGIN
 IF NEW.document->'skills' IS NOT NULL AND jsonb_typeof(NEW.document->'skills')<>'array' THEN
  RAISE EXCEPTION 'Profile skills must be an array' USING ERRCODE='22023';
 END IF;
 DELETE FROM artistready.artist_skills WHERE artist_id=NEW.id;
 FOR skill IN SELECT DISTINCT btrim(value) FROM jsonb_array_elements_text(coalesce(NEW.document->'skills','[]'::jsonb)) LOOP
  IF length(skill) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Invalid skill name' USING ERRCODE='22023'; END IF;
  category_value:=NEW.document->'skillCategories'->>skill;
  IF category_value IS NOT NULL AND category_value NOT IN ('Technical','Soft Skills','Artistic Skills','Others') THEN
   RAISE EXCEPTION 'Invalid skill category' USING ERRCODE='22023';
  END IF;
  INSERT INTO artistready.skills(name,category) VALUES(skill,coalesce(category_value,'Others'))
   ON CONFLICT(lower(name)) DO NOTHING;
  SELECT id,coalesce(category_value,category) INTO selected_id,category_value FROM artistready.skills WHERE lower(name)=lower(skill);
  INSERT INTO artistready.artist_skills(artist_id,skill_id,category) VALUES(NEW.id,selected_id,category_value)
   ON CONFLICT DO NOTHING;
 END LOOP;
 RETURN NEW;
END
$$;
CREATE TRIGGER profiles_sync_skills AFTER INSERT OR UPDATE OF document ON artistready.profiles
 FOR EACH ROW EXECUTE FUNCTION artistready.sync_artist_skills();

-- Backfill links without changing profile contents, versions or timestamps.
UPDATE artistready.profiles SET document=document;

CREATE FUNCTION artistready.list_skills() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'category',category,'isActive',is_active)
 ORDER BY category,name),'[]'::jsonb) FROM artistready.skills WHERE is_active
$$;
CREATE FUNCTION artistready.get_artist_skills(p_artist text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'category',a.category)
 ORDER BY s.name),'[]'::jsonb) FROM artistready.artist_skills a JOIN artistready.skills s ON s.id=a.skill_id
 WHERE a.artist_id=p_artist
$$;
REVOKE ALL ON artistready.skills,artistready.artist_skills FROM PUBLIC,artistready_api;
REVOKE ALL ON FUNCTION artistready.sync_artist_skills(),artistready.list_skills(),artistready.get_artist_skills(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION artistready.list_skills(),artistready.get_artist_skills(text) TO artistready_api;
RESET ROLE;
