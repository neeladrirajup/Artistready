-- One value per column or related row. JSONB is used only as the API wire format.
SET ROLE artistready_owner;
SET search_path=artistready,pg_catalog;

ALTER TABLE profiles ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
CREATE TABLE profile_details (
 artist_id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
 "bodyBuild" text NOT NULL DEFAULT '', "bodyBuildDescription" text NOT NULL DEFAULT '',
 "bookingAvailableFrom" text NOT NULL DEFAULT '', "bookingTravel" text NOT NULL DEFAULT '',
 "bookingLocations" text NOT NULL DEFAULT '', "bookingRepresentative" text NOT NULL DEFAULT '',
 "bookingEmail" text NOT NULL DEFAULT '', "bookingPhone" text NOT NULL DEFAULT '',
 "bookingNotes" text NOT NULL DEFAULT '', "showBookingContact" boolean NOT NULL DEFAULT false,
 gender text NOT NULL DEFAULT '', "genderDescription" text NOT NULL DEFAULT '',
 "ageFrom" text NOT NULL DEFAULT '', "ageTo" text NOT NULL DEFAULT '',
 "coverId" text NOT NULL DEFAULT '', bio text NOT NULL DEFAULT '', experience text NOT NULL DEFAULT '',
 available boolean NOT NULL DEFAULT true, photo text NOT NULL DEFAULT '', reel text NOT NULL DEFAULT ''
);
CREATE TABLE artist_measurements (
 artist_id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
 "measurementFit" text NOT NULL DEFAULT '', "bodyBuild" text NOT NULL DEFAULT '',
 "bodyBuildDescription" text NOT NULL DEFAULT '',
 height text NOT NULL DEFAULT '', "heightFeet" text NOT NULL DEFAULT '', "heightInches" text NOT NULL DEFAULT '',
 height_inches integer, weight_kg numeric, chest_in numeric, bust_in numeric, waist_in numeric, hip_in numeric
);
CREATE INDEX artist_measurements_height ON artist_measurements(height_inches);
CREATE TABLE profile_call_sheets (
 artist_id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
 "shootingStatus" text NOT NULL DEFAULT '', project text NOT NULL DEFAULT '',
 "shootFrom" text NOT NULL DEFAULT '', "shootTo" text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT ''
);
CREATE TABLE profile_call_dates (
 artist_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order integer NOT NULL,
 id text NOT NULL, "from" text NOT NULL, "to" text NOT NULL, status text NOT NULL, notes text NOT NULL,
 PRIMARY KEY(artist_id,id)
);
CREATE TABLE profile_list_values (
 artist_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 list_name text NOT NULL CHECK(list_name IN ('castingRoles','additionalRoles','skills','languages','pinnedMedia','reelLinks')),
 sort_order integer NOT NULL, value text NOT NULL,
 PRIMARY KEY(artist_id,list_name,sort_order)
);
CREATE INDEX profile_list_values_search ON profile_list_values(list_name,value,artist_id);
CREATE TABLE profile_map_values (
 artist_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 map_name text NOT NULL CHECK(map_name IN ('skillCategories','clothing')),
 item_key text NOT NULL, value text NOT NULL,
 PRIMARY KEY(artist_id,map_name,item_key)
);
CREATE TABLE profile_entries (
 artist_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 entry_kind text NOT NULL CHECK(entry_kind IN ('credits','training','recognition','education')),
 id text NOT NULL, sort_order integer NOT NULL,
 title text NOT NULL DEFAULT '', type text NOT NULL DEFAULT '', role text NOT NULL DEFAULT '',
 year text NOT NULL DEFAULT '', director text NOT NULL DEFAULT '', production text NOT NULL DEFAULT '',
 trailer text NOT NULL DEFAULT '', organisation text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
 qualification text NOT NULL DEFAULT '', institution text NOT NULL DEFAULT '',
 PRIMARY KEY(artist_id,entry_kind,id)
);
CREATE TABLE profile_preference_settings (
 artist_id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
 visibility text NOT NULL DEFAULT 'only_me' CHECK(visibility IN ('only_me','managers','everyone')),
 adult_confirmed boolean NOT NULL DEFAULT false,
 version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE profile_preference_answers (
 artist_id text NOT NULL REFERENCES profile_preference_settings(artist_id) ON DELETE CASCADE,
 code text NOT NULL, choice text NOT NULL CHECK(choice IN ('okay','not_okay','discuss_first','not_disclosed')),
 notes text NOT NULL DEFAULT '',PRIMARY KEY(artist_id,code)
);

CREATE PROCEDURE write_profile_fields(p_owner text,p_document jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE item jsonb; kind text;
BEGIN
 INSERT INTO artistready.profile_details VALUES(
  p_owner,coalesce(p_document->>'bodyBuild',''),coalesce(p_document->>'bodyBuildDescription',''),
  coalesce(p_document->>'bookingAvailableFrom',''),coalesce(p_document->>'bookingTravel',''),
  coalesce(p_document->>'bookingLocations',''),coalesce(p_document->>'bookingRepresentative',''),
  coalesce(p_document->>'bookingEmail',''),coalesce(p_document->>'bookingPhone',''),
  coalesce(p_document->>'bookingNotes',''),coalesce((p_document->>'showBookingContact')::boolean,false),
  coalesce(p_document->>'gender',''),coalesce(p_document->>'genderDescription',''),
  coalesce(p_document->>'ageFrom',''),coalesce(p_document->>'ageTo',''),
  coalesce(p_document->>'coverId',''),coalesce(p_document->>'bio',''),coalesce(p_document->>'experience',''),
  coalesce((p_document->>'available')::boolean,true),coalesce(p_document->>'photo',''),coalesce(p_document->>'reel','')
 ) ON CONFLICT(artist_id) DO UPDATE SET
  "bodyBuild"=excluded."bodyBuild","bodyBuildDescription"=excluded."bodyBuildDescription",
  "bookingAvailableFrom"=excluded."bookingAvailableFrom","bookingTravel"=excluded."bookingTravel",
  "bookingLocations"=excluded."bookingLocations","bookingRepresentative"=excluded."bookingRepresentative",
  "bookingEmail"=excluded."bookingEmail","bookingPhone"=excluded."bookingPhone",
  "bookingNotes"=excluded."bookingNotes","showBookingContact"=excluded."showBookingContact",
  gender=excluded.gender,"genderDescription"=excluded."genderDescription",
  "ageFrom"=excluded."ageFrom","ageTo"=excluded."ageTo","coverId"=excluded."coverId",
  bio=excluded.bio,experience=excluded.experience,available=excluded.available,
  photo=excluded.photo,reel=excluded.reel;
 INSERT INTO artistready.artist_measurements VALUES(
  p_owner,coalesce(p_document->>'measurementFit',''),coalesce(p_document->>'bodyBuild',''),
  coalesce(p_document->>'bodyBuildDescription',''),
  CASE WHEN coalesce(p_document->>'heightFeet','')='' THEN '' ELSE
   (p_document->>'heightFeet')||' ft '||coalesce(nullif(p_document->>'heightInches',''),'0')||' in' END,
  coalesce(p_document->>'heightFeet',''),coalesce(p_document->>'heightInches',''),
  CASE WHEN coalesce(p_document->>'heightFeet','')='' THEN NULL ELSE
   (p_document->>'heightFeet')::integer*12+coalesce(nullif(p_document->>'heightInches','')::integer,0) END,
  nullif(p_document->>'weight','')::numeric,nullif(p_document->>'chest','')::numeric,
  nullif(p_document->>'bust','')::numeric,nullif(p_document->>'waist','')::numeric,
  nullif(p_document->>'hip','')::numeric
 ) ON CONFLICT(artist_id) DO UPDATE SET
  "measurementFit"=excluded."measurementFit","bodyBuild"=excluded."bodyBuild",
  "bodyBuildDescription"=excluded."bodyBuildDescription",height=excluded.height,
  "heightFeet"=excluded."heightFeet","heightInches"=excluded."heightInches",
  height_inches=excluded.height_inches,weight_kg=excluded.weight_kg,
  chest_in=excluded.chest_in,bust_in=excluded.bust_in,waist_in=excluded.waist_in,hip_in=excluded.hip_in;
 INSERT INTO artistready.profile_call_sheets VALUES(p_owner,
  coalesce(p_document->'callSheet'->>'shootingStatus',''),
  coalesce(p_document->'callSheet'->>'project',''),
  coalesce(p_document->'callSheet'->>'shootFrom',''),
  coalesce(p_document->'callSheet'->>'shootTo',''),
  coalesce(p_document->'callSheet'->>'notes',''))
 ON CONFLICT(artist_id) DO UPDATE SET "shootingStatus"=excluded."shootingStatus",
  project=excluded.project,"shootFrom"=excluded."shootFrom","shootTo"=excluded."shootTo",notes=excluded.notes;
 DELETE FROM artistready.profile_call_dates WHERE artist_id=p_owner;
 INSERT INTO artistready.profile_call_dates
 SELECT p_owner,ord-1,value->>'id',coalesce(value->>'from',''),coalesce(value->>'to',''),
  coalesce(value->>'status',''),coalesce(value->>'notes','')
 FROM jsonb_array_elements(coalesce(p_document->'callSheet'->'dates','[]'::jsonb)) WITH ORDINALITY AS e(value,ord);
 DELETE FROM artistready.profile_list_values WHERE artist_id=p_owner;
 FOREACH kind IN ARRAY ARRAY['castingRoles','additionalRoles','skills','languages','pinnedMedia','reelLinks'] LOOP
  INSERT INTO artistready.profile_list_values
  SELECT p_owner,kind,ord-1,value#>>'{}'
  FROM jsonb_array_elements(coalesce(p_document->kind,'[]'::jsonb)) WITH ORDINALITY AS e(value,ord);
 END LOOP;
 DELETE FROM artistready.profile_map_values WHERE artist_id=p_owner;
 FOREACH kind IN ARRAY ARRAY['skillCategories','clothing'] LOOP
  INSERT INTO artistready.profile_map_values
  SELECT p_owner,kind,key,value#>>'{}' FROM jsonb_each(coalesce(p_document->kind,'{}'::jsonb));
 END LOOP;
 DELETE FROM artistready.profile_entries WHERE artist_id=p_owner;
 FOREACH kind IN ARRAY ARRAY['credits','training','recognition','education'] LOOP
  INSERT INTO artistready.profile_entries(
   artist_id,entry_kind,id,sort_order,title,type,role,year,director,production,
   trailer,organisation,notes,qualification,institution)
  SELECT p_owner,kind,value->>'id',ord-1,
   coalesce(value->>'title',''),coalesce(value->>'type',''),coalesce(value->>'role',''),
   coalesce(value->>'year',''),coalesce(value->>'director',''),coalesce(value->>'production',''),
   coalesce(value->>'trailer',''),coalesce(value->>'organisation',''),
   coalesce(value->>'notes',''),coalesce(value->>'qualification',''),
   coalesce(value->>'institution','')
  FROM jsonb_array_elements(coalesce(p_document->kind,'[]'::jsonb)) WITH ORDINALITY AS e(value,ord);
 END LOOP;
END $$;

-- Backfill the existing local snapshot before removing its JSONB column.
DO $backfill$ DECLARE p record; BEGIN
 FOR p IN SELECT id,document FROM artistready.profiles LOOP
  CALL artistready.write_profile_fields(p.id,p.document);
 END LOOP;
END $backfill$;

DROP TRIGGER IF EXISTS profiles_sync_skills ON profiles;
DROP TRIGGER IF EXISTS profiles_sync_languages ON profiles;
DROP TRIGGER IF EXISTS profiles_sync_body_type ON profiles;
DROP FUNCTION IF EXISTS get_my_profile(text);
DROP FUNCTION IF EXISTS list_artists(text);
DROP FUNCTION IF EXISTS get_profile(text,text);
DROP PROCEDURE IF EXISTS save_profile(text,jsonb,integer,jsonb);
DROP PROCEDURE IF EXISTS import_snapshot(jsonb);
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_check;
ALTER TABLE profiles DROP COLUMN document;

CREATE FUNCTION profile_draft(p_artist text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT to_jsonb(p)-'id'-'version'-'created_at'-'updated_at'-'is_archived'
  || coalesce(to_jsonb(d)-'artist_id','{}'::jsonb)
  || coalesce(to_jsonb(m)-'artist_id'-'height'-'height_inches'-'weight_kg'-'chest_in'-'bust_in'-'waist_in'-'hip_in','{}'::jsonb)
  || jsonb_build_object(
   'weight',coalesce(m.weight_kg::text,''),'chest',coalesce(m.chest_in::text,''),
   'bust',coalesce(m.bust_in::text,''),'waist',coalesce(m.waist_in::text,''),
   'hip',coalesce(m.hip_in::text,''),
   'callSheet',coalesce(to_jsonb(c)-'artist_id','{}'::jsonb)||jsonb_build_object('dates',
    coalesce((SELECT jsonb_agg(to_jsonb(x)-'artist_id'-'sort_order' ORDER BY x.sort_order)
     FROM artistready.profile_call_dates x WHERE x.artist_id=p.id),'[]'::jsonb)),
   'castingRoles',coalesce((SELECT jsonb_agg(x.value ORDER BY x.sort_order) FROM artistready.profile_list_values x WHERE x.artist_id=p.id AND x.list_name='castingRoles'),'[]'::jsonb),
   'additionalRoles',coalesce((SELECT jsonb_agg(x.value ORDER BY x.sort_order) FROM artistready.profile_list_values x WHERE x.artist_id=p.id AND x.list_name='additionalRoles'),'[]'::jsonb),
   'skills',coalesce((SELECT jsonb_agg(x.value ORDER BY x.sort_order) FROM artistready.profile_list_values x WHERE x.artist_id=p.id AND x.list_name='skills'),'[]'::jsonb),
   'languages',coalesce((SELECT jsonb_agg(x.value ORDER BY x.sort_order) FROM artistready.profile_list_values x WHERE x.artist_id=p.id AND x.list_name='languages'),'[]'::jsonb),
   'pinnedMedia',coalesce((SELECT jsonb_agg(x.value ORDER BY x.sort_order) FROM artistready.profile_list_values x WHERE x.artist_id=p.id AND x.list_name='pinnedMedia'),'[]'::jsonb),
   'reelLinks',coalesce((SELECT jsonb_agg(x.value ORDER BY x.sort_order) FROM artistready.profile_list_values x WHERE x.artist_id=p.id AND x.list_name='reelLinks'),'[]'::jsonb),
   'skillCategories',coalesce((SELECT jsonb_object_agg(x.item_key,x.value) FROM artistready.profile_map_values x WHERE x.artist_id=p.id AND x.map_name='skillCategories'),'{}'::jsonb),
   'clothing',coalesce((SELECT jsonb_object_agg(x.item_key,x.value) FROM artistready.profile_map_values x WHERE x.artist_id=p.id AND x.map_name='clothing'),'{}'::jsonb),
   'credits',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'type',x.type,'role',x.role,'year',x.year,'director',x.director,'production',x.production,'trailer',x.trailer) ORDER BY x.sort_order) FROM artistready.profile_entries x WHERE x.artist_id=p.id AND x.entry_kind='credits'),'[]'::jsonb),
   'training',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'organisation',x.organisation,'year',x.year,'notes',x.notes) ORDER BY x.sort_order) FROM artistready.profile_entries x WHERE x.artist_id=p.id AND x.entry_kind='training'),'[]'::jsonb),
   'recognition',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.id,'title',x.title,'organisation',x.organisation,'year',x.year,'notes',x.notes) ORDER BY x.sort_order) FROM artistready.profile_entries x WHERE x.artist_id=p.id AND x.entry_kind='recognition'),'[]'::jsonb),
   'education',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.id,'qualification',x.qualification,'institution',x.institution,'year',x.year,'notes',x.notes) ORDER BY x.sort_order) FROM artistready.profile_entries x WHERE x.artist_id=p.id AND x.entry_kind='education'),'[]'::jsonb)
  )
 FROM artistready.profiles p
 LEFT JOIN artistready.profile_details d ON d.artist_id=p.id
 LEFT JOIN artistready.artist_measurements m ON m.artist_id=p.id
 LEFT JOIN artistready.profile_call_sheets c ON c.artist_id=p.id
 WHERE p.id=p_artist
$$;

CREATE FUNCTION get_profile(p_profile text,p_viewer text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT jsonb_build_object('id',p_profile,'draft',CASE WHEN p.id IS NULL THEN NULL
  WHEN p_profile=p_viewer THEN artistready.profile_draft(p_profile)
  ELSE CASE WHEN d."showBookingContact" THEN artistready.profile_draft(p_profile)
   ELSE artistready.profile_draft(p_profile)||'{"bookingEmail":"","bookingPhone":""}'::jsonb END
   ||'{"genderDescription":""}'::jsonb END,
  'version',p.version,'updatedAt',p.updated_at,'isOwner',p_profile=p_viewer,
  'media',CASE WHEN p.id IS NULL THEN '[]'::jsonb ELSE artistready.media_result(p_profile) END)
 FROM (SELECT 1) anchor LEFT JOIN artistready.profiles p ON p.id=p_profile AND NOT p.is_archived
 LEFT JOIN artistready.profile_details d ON d.artist_id=p.id
$$;
CREATE FUNCTION get_my_profile(p_owner text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT artistready.get_profile(p_owner,p_owner)
$$;
CREATE FUNCTION list_artists(p_viewer text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT jsonb_build_object('profiles',coalesce(jsonb_agg(artistready.get_profile(p.id,p_viewer) ORDER BY p.updated_at DESC),'[]'::jsonb))
 FROM (SELECT id,updated_at FROM artistready.profiles WHERE NOT is_archived ORDER BY updated_at DESC LIMIT 200) p
$$;
CREATE PROCEDURE save_profile(p_owner text,p_document jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE next_version integer;
BEGIN
 IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' OR
  coalesce(length(btrim(p_document->>'name')),0) NOT BETWEEN 1 AND 80 OR
  coalesce(length(btrim(p_document->>'role')),0) NOT BETWEEN 1 AND 120 OR
  coalesce(length(btrim(p_document->>'city')),0) NOT BETWEEN 1 AND 120 THEN
  RAISE EXCEPTION 'Valid profile name, role and city are required' USING ERRCODE='22023';
 END IF;
 INSERT INTO artistready.profile_accounts(id) VALUES(p_owner) ON CONFLICT DO NOTHING;
 IF p_expected_version IS NULL THEN
  INSERT INTO artistready.profiles(id,name,role,city) VALUES(p_owner,p_document->>'name',p_document->>'role',p_document->>'city')
   ON CONFLICT DO NOTHING RETURNING version INTO next_version;
 ELSE
  UPDATE artistready.profiles SET name=p_document->>'name',role=p_document->>'role',city=p_document->>'city',
   version=version+1,updated_at=clock_timestamp() WHERE id=p_owner AND version=p_expected_version AND NOT is_archived
   RETURNING version INTO next_version;
 END IF;
 IF next_version IS NULL THEN RAISE EXCEPTION 'Profile changed; reload before saving' USING ERRCODE='40001'; END IF;
 CALL artistready.write_profile_fields(p_owner,p_document);
 p_result:=artistready.get_my_profile(p_owner);
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA artistready FROM PUBLIC,artistready_api;
REVOKE ALL ON FUNCTION profile_draft(text),get_profile(text,text),get_my_profile(text),list_artists(text) FROM PUBLIC;
REVOKE ALL ON PROCEDURE write_profile_fields(text,jsonb),save_profile(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_profile(text,text),get_my_profile(text),list_artists(text) TO artistready_api;
GRANT EXECUTE ON PROCEDURE save_profile(text,jsonb,integer,jsonb) TO artistready_api;
RESET ROLE;
