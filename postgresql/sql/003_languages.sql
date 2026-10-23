SET ROLE artistready_owner;
SET search_path=pg_catalog,artistready;

CREATE TABLE artistready.languages (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120 AND name=btrim(name)),
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT current_timestamp
);
CREATE UNIQUE INDEX languages_name_unique ON artistready.languages(lower(name));
CREATE TABLE artistready.artist_languages (
 artist_id text NOT NULL REFERENCES artistready.profiles(id) ON DELETE CASCADE,
 language_id bigint NOT NULL REFERENCES artistready.languages(id),
 PRIMARY KEY(artist_id,language_id)
);
CREATE INDEX artist_languages_language_id ON artistready.artist_languages(language_id);

-- Initial catalog includes every current app option and additional languages.
INSERT INTO artistready.languages(name) VALUES
 ('Assamese'),('Bengali'),('Bodo'),('Dogri'),('Gujarati'),('Hindi'),('Kannada'),
 ('Kashmiri'),('Konkani'),('Maithili'),('Malayalam'),('Manipuri'),('Marathi'),
 ('Nepali'),('Odia'),('Punjabi'),('Sanskrit'),('Santali'),('Sindhi'),('Tamil'),
 ('Telugu'),('Urdu'),('English'),('Arabic'),('French'),('German'),('Spanish'),
 ('Italian'),('Portuguese'),('Russian'),('Mandarin'),('Cantonese'),('Japanese'),
 ('Korean'),('Thai'),('Vietnamese'),('Indonesian'),('Malay'),('Turkish'),('Persian');

CREATE FUNCTION artistready.sync_artist_languages() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE language_name text; selected_id bigint;
BEGIN
 IF NEW.document->'languages' IS NOT NULL AND jsonb_typeof(NEW.document->'languages')<>'array' THEN
  RAISE EXCEPTION 'Profile languages must be an array' USING ERRCODE='22023';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.document->'languages','[]'::jsonb)) item
           WHERE jsonb_typeof(item)<>'string') THEN
  RAISE EXCEPTION 'Language names must be strings' USING ERRCODE='22023';
 END IF;
 DELETE FROM artistready.artist_languages WHERE artist_id=NEW.id;
 FOR language_name IN SELECT DISTINCT btrim(value) FROM jsonb_array_elements_text(coalesce(NEW.document->'languages','[]'::jsonb)) LOOP
  IF length(language_name) NOT BETWEEN 1 AND 120 THEN
   RAISE EXCEPTION 'Invalid language name' USING ERRCODE='22023';
  END IF;
  INSERT INTO artistready.languages(name) VALUES(language_name) ON CONFLICT(lower(name)) DO NOTHING;
  SELECT id INTO selected_id FROM artistready.languages WHERE lower(name)=lower(language_name);
  INSERT INTO artistready.artist_languages(artist_id,language_id) VALUES(NEW.id,selected_id) ON CONFLICT DO NOTHING;
 END LOOP;
 RETURN NEW;
END
$$;
CREATE TRIGGER profiles_sync_languages AFTER INSERT OR UPDATE OF document ON artistready.profiles
 FOR EACH ROW EXECUTE FUNCTION artistready.sync_artist_languages();

-- Backfill links without changing profile contents, versions or timestamps.
UPDATE artistready.profiles SET document=document;

CREATE FUNCTION artistready.list_languages() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'isActive',is_active)
 ORDER BY name),'[]'::jsonb) FROM artistready.languages WHERE is_active
$$;
CREATE FUNCTION artistready.get_artist_languages(p_artist text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',l.id,'name',l.name) ORDER BY l.name),'[]'::jsonb)
 FROM artistready.artist_languages a JOIN artistready.languages l ON l.id=a.language_id
 WHERE a.artist_id=p_artist
$$;
REVOKE ALL ON artistready.languages,artistready.artist_languages FROM PUBLIC,artistready_api;
REVOKE ALL ON FUNCTION artistready.sync_artist_languages(),artistready.list_languages(),artistready.get_artist_languages(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION artistready.list_languages(),artistready.get_artist_languages(text) TO artistready_api;
RESET ROLE;
