SET ROLE artistready_owner;
SET search_path=artistready,pg_catalog;

ALTER TABLE india_cities ADD CONSTRAINT india_cities_id_state_unique UNIQUE(id,state_id);
CREATE TABLE profile_locations (
 artist_id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
 state_id bigint NOT NULL REFERENCES india_states(id),
 city_id bigint NOT NULL,
 CONSTRAINT profile_locations_city_state_fk FOREIGN KEY(city_id,state_id)
  REFERENCES india_cities(id,state_id)
);
CREATE INDEX profile_locations_state_city_idx ON profile_locations(state_id,city_id);

-- Preserve matching locations for profiles saved before the state selector existed.
INSERT INTO profile_locations(artist_id,state_id,city_id)
SELECT p.id,c.state_id,c.id FROM profiles p
JOIN india_cities c ON lower(c.name)=lower(p.city)
WHERE (SELECT count(*) FROM india_cities x WHERE lower(x.name)=lower(p.city))=1;

-- Existing profile operations still use save_profile; this wrapper enforces the
-- selected state/city pair before delegating all other writes to the old routine.
ALTER PROCEDURE save_profile(text,jsonb,integer,jsonb) RENAME TO save_profile_base;
REVOKE ALL ON PROCEDURE save_profile_base(text,jsonb,integer,jsonb) FROM PUBLIC,artistready_api;

CREATE PROCEDURE save_profile(p_owner text,p_document jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE selected_state bigint; selected_city bigint; selected_code text;
BEGIN
 selected_code:=upper(btrim(coalesce(p_document->>'stateCode','')));
 IF selected_code<>'' THEN
  SELECT s.id,c.id INTO selected_state,selected_city
  FROM artistready.india_states s JOIN artistready.india_cities c ON c.state_id=s.id
  WHERE s.code=selected_code AND c.name=p_document->>'city' AND s.is_active AND c.is_active;
  IF selected_city IS NULL THEN
   RAISE EXCEPTION 'Choose a city in the selected state' USING ERRCODE='22023';
  END IF;
 END IF;
 CALL artistready.save_profile_base(p_owner,p_document,p_expected_version,p_result);
 IF selected_city IS NOT NULL THEN
  INSERT INTO artistready.profile_locations(artist_id,state_id,city_id)
  VALUES(p_owner,selected_state,selected_city)
  ON CONFLICT(artist_id) DO UPDATE SET state_id=excluded.state_id,city_id=excluded.city_id;
 ELSIF EXISTS(SELECT 1 FROM artistready.profile_locations WHERE artist_id=p_owner) THEN
  DELETE FROM artistready.profile_locations l WHERE l.artist_id=p_owner
   AND NOT EXISTS(SELECT 1 FROM artistready.india_cities c WHERE c.id=l.city_id AND c.name=p_document->>'city');
 END IF;
 -- The base routine builds its response before the location row is saved.
 p_result:=artistready.get_my_profile(p_owner);
END $$;

CREATE OR REPLACE FUNCTION get_profile(p_profile text,p_viewer text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT jsonb_build_object('id',p_profile,'draft',CASE WHEN p.id IS NULL THEN NULL
  WHEN p_profile=p_viewer THEN artistready.profile_draft(p_profile)||jsonb_build_object('stateCode',coalesce(s.code,''))
  ELSE CASE WHEN d."showBookingContact" THEN artistready.profile_draft(p_profile)
   ELSE artistready.profile_draft(p_profile)||'{"bookingEmail":"","bookingPhone":""}'::jsonb END
   ||'{"genderDescription":""}'::jsonb||jsonb_build_object('stateCode',coalesce(s.code,'')) END,
  'version',p.version,'updatedAt',p.updated_at,'isOwner',p_profile=p_viewer,
  'media',CASE WHEN p.id IS NULL THEN '[]'::jsonb ELSE artistready.media_result(p_profile) END)
 FROM (SELECT 1) anchor LEFT JOIN artistready.profiles p ON p.id=p_profile AND NOT p.is_archived
 LEFT JOIN artistready.profile_details d ON d.artist_id=p.id
 LEFT JOIN artistready.profile_locations l ON l.artist_id=p.id
 LEFT JOIN artistready.india_states s ON s.id=l.state_id
$$;

CREATE OR REPLACE PROCEDURE save_profile_section(p_owner text,p_section text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE current_version integer; allowed text[]; key text;
BEGIN
 CASE p_section
  WHEN 'roles' THEN allowed:=ARRAY['castingRoles','additionalRoles'];
  WHEN 'pinned' THEN allowed:=ARRAY['pinnedMedia'];
  WHEN 'booking' THEN allowed:=ARRAY['callSheet','available','bookingAvailableFrom','bookingTravel','bookingLocations','bookingRepresentative','bookingEmail','bookingPhone','bookingNotes','showBookingContact'];
  WHEN 'essentials' THEN allowed:=ARRAY['name','role','castingRoles','stateCode','city','experience','gender','genderDescription','ageFrom','ageTo','available'];
  WHEN 'about' THEN allowed:=ARRAY['bio'];
  WHEN 'skills' THEN allowed:=ARRAY['skills','skillCategories'];
  WHEN 'languages' THEN allowed:=ARRAY['languages'];
  WHEN 'credits' THEN allowed:=ARRAY['credits'];
  WHEN 'training' THEN allowed:=ARRAY['training'];
  WHEN 'recognition' THEN allowed:=ARRAY['recognition'];
  WHEN 'measurements' THEN allowed:=ARRAY['bodyBuild','bodyBuildDescription','measurementFit','heightFeet','heightInches','weight','chest','bust','waist','hip'];
  WHEN 'clothing' THEN allowed:=ARRAY['clothing'];
  WHEN 'education' THEN allowed:=ARRAY['education'];
  WHEN 'photos' THEN allowed:=ARRAY['photo','coverId'];
  WHEN 'showreels' THEN allowed:=ARRAY['reel','reelLinks'];
  ELSE RAISE EXCEPTION 'Unknown profile section' USING ERRCODE='22023';
 END CASE;
 IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' OR p_patch='{}'::jsonb THEN
  RAISE EXCEPTION 'Section changes must be an object' USING ERRCODE='22023';
 END IF;
 FOR key IN SELECT jsonb_object_keys(p_patch) LOOP
  IF NOT key=ANY(allowed) THEN RAISE EXCEPTION 'Field % is not part of section %',key,p_section USING ERRCODE='22023'; END IF;
 END LOOP;
 SELECT version INTO current_version FROM artistready.profiles WHERE id=p_owner AND NOT is_archived FOR UPDATE;
 IF current_version IS NULL OR p_expected_version IS DISTINCT FROM current_version THEN
  RAISE EXCEPTION 'Profile changed; reload before saving' USING ERRCODE='40001';
 END IF;
 CALL artistready.save_profile(p_owner,artistready.profile_draft(p_owner)||p_patch,p_expected_version,p_result);
END $$;

REVOKE ALL ON TABLE profile_locations FROM PUBLIC,artistready_api;
REVOKE ALL ON PROCEDURE save_profile(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_profile(text,jsonb,integer,jsonb) TO artistready_api;
RESET ROLE;
