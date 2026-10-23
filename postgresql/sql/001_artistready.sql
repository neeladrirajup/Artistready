-- Local PostgreSQL schema. Apply through migrate-artistready.ps1; no credentials.
SET ROLE artistready_owner;
SET search_path = artistready, pg_catalog;

CREATE TABLE profile_accounts (
 id text PRIMARY KEY CHECK (id ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT current_timestamp
);
CREATE TABLE profiles (
 id text PRIMARY KEY REFERENCES profile_accounts(id),
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 80),
 role text NOT NULL CHECK (length(btrim(role)) BETWEEN 1 AND 120),
 city text NOT NULL CHECK (length(btrim(city)) BETWEEN 1 AND 120),
 document jsonb NOT NULL CHECK (jsonb_typeof(document)='object'),
 version integer NOT NULL DEFAULT 1 CHECK (version>0),
 created_at timestamptz NOT NULL DEFAULT current_timestamp,
 updated_at timestamptz NOT NULL DEFAULT current_timestamp,
 CHECK (document->>'name'=name AND document->>'role'=role AND document->>'city'=city)
);
CREATE TABLE profile_media (
 key text GENERATED ALWAYS AS (owner_id || ':' || id) STORED PRIMARY KEY,
 owner_id text NOT NULL REFERENCES profile_accounts(id),
 id text NOT NULL CHECK (id ~ '^[a-zA-Z0-9_-]{1,80}$'),
 kind text NOT NULL CHECK (kind IN ('photo','video')),
 storage_key text NOT NULL,
 name text NOT NULL,
 mime text NOT NULL,
 size bigint NOT NULL CHECK (size>0),
 created_at timestamptz NOT NULL DEFAULT current_timestamp,
 UNIQUE (owner_id,id),
 CHECK (storage_key LIKE 'profiles/' || owner_id || '/' || id || '/%'),
 CHECK ((kind='photo' AND id<>'showreel' AND mime IN ('image/jpeg','image/png','image/webp') AND size<=5000000)
     OR (kind='video' AND id='showreel' AND mime IN ('video/mp4','video/webm') AND size<50000000))
);
CREATE INDEX profiles_updated_at ON profiles(updated_at DESC);
CREATE TABLE source_imports (
 checksum text PRIMARY KEY CHECK (checksum ~ '^[a-f0-9]{64}$'),
 source_project text NOT NULL,
 profile_count integer NOT NULL,
 media_count integer NOT NULL,
 imported_at timestamptz NOT NULL DEFAULT current_timestamp
);

CREATE FUNCTION media_result(p_owner text) RETURNS jsonb
LANGUAGE sql STABLE SET search_path=pg_catalog,artistready AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',id,'kind',kind,'name',name,'mime',mime,'size',size,
  'created',floor(extract(epoch FROM created_at)*1000),
  'url','/api/profile/files/'||owner_id||'/'||id
 ) ORDER BY created_at,id),'[]'::jsonb)
 FROM artistready.profile_media WHERE owner_id=p_owner
$$;

-- The API must obtain owner/viewer IDs from authenticated identity, never a form.
CREATE FUNCTION get_profile(p_profile text,p_viewer text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT jsonb_build_object('id',p_profile,'draft',
  CASE WHEN p.id IS NULL THEN NULL WHEN p_profile=p_viewer THEN p.document
  ELSE (CASE WHEN coalesce((p.document->>'showBookingContact')::boolean,false)
   THEN p.document ELSE p.document || '{"bookingEmail":"","bookingPhone":""}'::jsonb END)
   || '{"genderDescription":""}'::jsonb END,
  'version',p.version,'updatedAt',p.updated_at,'isOwner',p_profile=p_viewer,
  'media',CASE WHEN p.id IS NOT NULL OR p_profile=p_viewer
              THEN artistready.media_result(p_profile) ELSE '[]'::jsonb END)
 FROM (SELECT 1) anchor LEFT JOIN artistready.profiles p ON p.id=p_profile
$$;
CREATE FUNCTION get_my_profile(p_owner text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT artistready.get_profile(p_owner,p_owner)
$$;
CREATE FUNCTION list_artists(p_viewer text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT jsonb_build_object('profiles',coalesce(jsonb_agg(
  artistready.get_profile(p.id,p_viewer) ORDER BY p.updated_at DESC),'[]'::jsonb))
 FROM (SELECT id,updated_at FROM artistready.profiles ORDER BY updated_at DESC LIMIT 200) p
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
 IF p_expected_version IS NOT NULL AND p_expected_version<1 THEN
  RAISE EXCEPTION 'Invalid expected profile version' USING ERRCODE='22023';
 END IF;
 INSERT INTO artistready.profile_accounts(id) VALUES(p_owner) ON CONFLICT DO NOTHING;
 IF p_expected_version IS NULL THEN
  INSERT INTO artistready.profiles(id,name,role,city,document)
   VALUES(p_owner,p_document->>'name',p_document->>'role',p_document->>'city',p_document)
   ON CONFLICT DO NOTHING RETURNING version INTO next_version;
 ELSE
  UPDATE artistready.profiles SET name=p_document->>'name',role=p_document->>'role',
   city=p_document->>'city',document=p_document,version=version+1,updated_at=clock_timestamp()
   WHERE id=p_owner AND version=p_expected_version RETURNING version INTO next_version;
 END IF;
 IF next_version IS NULL THEN
  RAISE EXCEPTION 'Profile changed; reload before saving' USING ERRCODE='40001';
 END IF;
 p_result:=artistready.get_my_profile(p_owner);
END
$$;

CREATE PROCEDURE save_media(p_owner text,p_media jsonb,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 -- Serialize photo-count checks and writes for an account.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_owner,0));
 INSERT INTO artistready.profile_accounts(id) VALUES(p_owner) ON CONFLICT DO NOTHING;
 IF p_media->>'kind'='photo' AND NOT EXISTS(
  SELECT 1 FROM artistready.profile_media WHERE owner_id=p_owner AND id=p_media->>'id'
 ) AND (SELECT count(*) FROM artistready.profile_media WHERE owner_id=p_owner AND kind='photo')>=20 THEN
  RAISE EXCEPTION 'A profile can contain up to 20 photos' USING ERRCODE='23514';
 END IF;
 INSERT INTO artistready.profile_media(owner_id,id,kind,storage_key,name,mime,size)
 VALUES(p_owner,p_media->>'id',p_media->>'kind',p_media->>'storage_key',
        p_media->>'name',p_media->>'mime',(p_media->>'size')::bigint)
 ON CONFLICT(owner_id,id) DO UPDATE SET storage_key=excluded.storage_key,
  name=excluded.name,mime=excluded.mime,size=excluded.size;
 p_result:=artistready.media_result(p_owner);
END
$$;
CREATE PROCEDURE delete_media(p_owner text,p_id text,INOUT p_storage_key text DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 DELETE FROM artistready.profile_media WHERE owner_id=p_owner AND id=p_id
  RETURNING storage_key INTO p_storage_key;
 -- The trusted API can now remove the returned object from R2.
END
$$;

-- Administrative, additive snapshot import. Existing differing local rows are
-- rejected, not overwritten; the entire CALL runs in one transaction.
CREATE PROCEDURE import_snapshot(p_snapshot jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE item jsonb; existing artistready.profiles%ROWTYPE; file_row artistready.profile_media%ROWTYPE;
BEGIN
 IF EXISTS(SELECT 1 FROM artistready.source_imports WHERE checksum=p_snapshot->>'checksum') THEN RETURN; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_snapshot->'accounts') LOOP
  INSERT INTO artistready.profile_accounts(id,created_at)
   VALUES(item->>'id',(item->>'created_at')::timestamptz) ON CONFLICT DO NOTHING;
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(p_snapshot->'profiles') LOOP
  SELECT * INTO existing FROM artistready.profiles WHERE id=item->>'id' FOR UPDATE;
  IF FOUND THEN
   IF existing.document IS DISTINCT FROM item->'document' OR existing.version<>(item->>'version')::integer THEN
    RAISE EXCEPTION 'Existing local profile differs; import stopped without overwriting it';
   END IF;
  ELSE
   INSERT INTO artistready.profiles(id,name,role,city,document,version,created_at,updated_at)
   VALUES(item->>'id',item->>'name',item->>'role',item->>'city',item->'document',
          (item->>'version')::integer,(item->>'created_at')::timestamptz,(item->>'updated_at')::timestamptz);
  END IF;
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(p_snapshot->'media') LOOP
  SELECT * INTO file_row FROM artistready.profile_media WHERE owner_id=item->>'owner_id' AND id=item->>'id';
  IF FOUND THEN
   IF file_row.storage_key IS DISTINCT FROM item->>'storage_key' OR file_row.size<>(item->>'size')::bigint THEN
    RAISE EXCEPTION 'Existing local media differs; import stopped without overwriting it';
   END IF;
  ELSE
   INSERT INTO artistready.profile_media(owner_id,id,kind,storage_key,name,mime,size,created_at)
   VALUES(item->>'owner_id',item->>'id',item->>'kind',item->>'storage_key',item->>'name',
          item->>'mime',(item->>'size')::bigint,(item->>'created_at')::timestamptz);
  END IF;
 END LOOP;
 INSERT INTO artistready.source_imports(checksum,source_project,profile_count,media_count)
 VALUES(p_snapshot->>'checksum',p_snapshot->>'source_project',
        jsonb_array_length(p_snapshot->'profiles'),jsonb_array_length(p_snapshot->'media'));
END
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA artistready FROM PUBLIC,artistready_api;
REVOKE ALL ON ALL ROUTINES IN SCHEMA artistready FROM PUBLIC,artistready_api;
GRANT USAGE ON SCHEMA artistready TO artistready_api;
GRANT EXECUTE ON FUNCTION get_profile(text,text),get_my_profile(text),list_artists(text) TO artistready_api;
GRANT EXECUTE ON PROCEDURE save_profile(text,jsonb,integer,jsonb),save_media(text,jsonb,jsonb),delete_media(text,text,text) TO artistready_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA artistready REVOKE EXECUTE ON ROUTINES FROM PUBLIC;
RESET ROLE;
