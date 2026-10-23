SET ROLE artistready_owner;
SET search_path=pg_catalog,artistready;

CREATE TABLE artistready.body_types (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 code text NOT NULL UNIQUE CHECK (code ~ '^[a-z][a-z0-9_]*$'),
 label text NOT NULL UNIQUE CHECK (length(btrim(label)) BETWEEN 1 AND 80),
 sort_order integer NOT NULL UNIQUE,
 male_fit boolean NOT NULL,
 female_fit boolean NOT NULL,
 neutral_fit boolean NOT NULL,
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT current_timestamp,
 CHECK (male_fit OR female_fit OR neutral_fit)
);

INSERT INTO artistready.body_types(code,label,sort_order,male_fit,female_fit,neutral_fit) VALUES
 ('slim','Slim',10,true,true,true),
 ('lean_athletic','Lean / Athletic',20,true,true,true),
 ('muscular','Muscular',30,true,true,true),
 ('medium','Medium build',40,true,true,true),
 ('broad_solid','Broad / Solid',50,true,true,true),
 ('full_rounded','Full / Rounded',60,true,true,true),
 ('curvy','Curvy',70,false,true,true),
 ('self_describe','Prefer to self-describe',80,true,true,true),
 ('not_disclosed','Prefer not to disclose',90,true,true,true);

CREATE TABLE artistready.artist_body_types (
 artist_id text PRIMARY KEY REFERENCES artistready.profiles(id) ON DELETE CASCADE,
 body_type_id bigint NOT NULL REFERENCES artistready.body_types(id),
 fit_code text NOT NULL CHECK (fit_code IN ('male','female','neutral')),
 description text NOT NULL DEFAULT '' CHECK (length(description)<=120),
 CHECK (description='' OR length(btrim(description))>0)
);
CREATE INDEX artist_body_types_body_type_id ON artistready.artist_body_types(body_type_id);

CREATE FUNCTION artistready.sync_artist_body_type() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE selected_code text; selected_fit text; selected_description text; selected_type artistready.body_types%ROWTYPE;
BEGIN
 selected_code:=coalesce(NEW.document->>'bodyBuild','');
 selected_description:=coalesce(NEW.document->>'bodyBuildDescription','');
 selected_fit:=coalesce(nullif(NEW.document->>'measurementFit',''),
  CASE NEW.document->>'gender' WHEN 'Male' THEN 'male' WHEN 'Female' THEN 'female' ELSE 'neutral' END);
 IF selected_fit NOT IN ('male','female','neutral') THEN
  RAISE EXCEPTION 'Invalid measurement fit' USING ERRCODE='22023';
 END IF;
 IF length(selected_description)>120 THEN
  RAISE EXCEPTION 'Body type description is too long' USING ERRCODE='22023';
 END IF;
 IF selected_code='' THEN
  DELETE FROM artistready.artist_body_types WHERE artist_id=NEW.id;
  RETURN NEW;
 END IF;
 SELECT * INTO selected_type FROM artistready.body_types WHERE code=selected_code;
 IF NOT FOUND OR NOT selected_type.is_active THEN
  RAISE EXCEPTION 'Unknown body type' USING ERRCODE='22023';
 END IF;
 IF (selected_fit='male' AND NOT selected_type.male_fit)
    OR (selected_fit='female' AND NOT selected_type.female_fit)
    OR (selected_fit='neutral' AND NOT selected_type.neutral_fit) THEN
  RAISE EXCEPTION 'Body type is unavailable for this measurement fit' USING ERRCODE='22023';
 END IF;
 IF selected_code='self_describe' AND length(btrim(selected_description))=0 THEN
  RAISE EXCEPTION 'Describe your body type or choose another option' USING ERRCODE='22023';
 END IF;
 IF selected_code<>'self_describe' THEN selected_description:=''; END IF;
 INSERT INTO artistready.artist_body_types(artist_id,body_type_id,fit_code,description)
 VALUES(NEW.id,selected_type.id,selected_fit,selected_description)
 ON CONFLICT(artist_id) DO UPDATE SET body_type_id=excluded.body_type_id,
  fit_code=excluded.fit_code,description=excluded.description;
 RETURN NEW;
END
$$;
CREATE TRIGGER profiles_sync_body_type AFTER INSERT OR UPDATE OF document ON artistready.profiles
 FOR EACH ROW EXECUTE FUNCTION artistready.sync_artist_body_type();

-- Backfill links without changing the profile document, version, or timestamps.
UPDATE artistready.profiles SET document=document;

CREATE FUNCTION artistready.list_body_types(p_fit text DEFAULT 'neutral') RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'code',code,'label',label,'sortOrder',sort_order)
  ORDER BY sort_order),'[]'::jsonb)
 FROM artistready.body_types WHERE is_active AND CASE p_fit
  WHEN 'male' THEN male_fit WHEN 'female' THEN female_fit WHEN 'neutral' THEN neutral_fit ELSE false END
$$;
CREATE FUNCTION artistready.get_artist_body_type(p_artist text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT jsonb_build_object('code',b.code,'label',b.label,'fit',a.fit_code,'description',a.description)
 FROM artistready.artist_body_types a JOIN artistready.body_types b ON b.id=a.body_type_id
 WHERE a.artist_id=p_artist
$$;

REVOKE ALL ON artistready.body_types,artistready.artist_body_types FROM PUBLIC,artistready_api;
REVOKE ALL ON FUNCTION artistready.sync_artist_body_type(),artistready.list_body_types(text),artistready.get_artist_body_type(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION artistready.list_body_types(text),artistready.get_artist_body_type(text) TO artistready_api;
RESET ROLE;
