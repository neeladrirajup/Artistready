BEGIN;

ALTER TABLE artistready.profile_details
  ADD COLUMN IF NOT EXISTS "maritalStatus" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "hairStyle" text NOT NULL DEFAULT '';

-- Keep the original field writer intact and extend it through a procedure.
ALTER PROCEDURE artistready.write_profile_fields(text,jsonb)
  RENAME TO write_profile_fields_before_appearance;

CREATE PROCEDURE artistready.write_profile_fields(
  IN p_owner text, IN p_document jsonb)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog', 'artistready'
AS $procedure$
BEGIN
  CALL artistready.write_profile_fields_before_appearance(p_owner,p_document);
  UPDATE artistready.profile_details
     SET "maritalStatus"=coalesce(p_document->>'maritalStatus',''),
         "hairStyle"=coalesce(p_document->>'hairStyle','')
   WHERE artist_id=p_owner;
END $procedure$;

GRANT EXECUTE ON PROCEDURE artistready.write_profile_fields(text,jsonb)
  TO artistready_api;

CREATE OR REPLACE PROCEDURE artistready.save_profile_section(
  IN p_owner text, IN p_section text, IN p_patch jsonb,
  IN p_expected_version integer, INOUT p_result jsonb DEFAULT NULL::jsonb)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog', 'artistready'
AS $procedure$
DECLARE current_version integer; allowed text[]; key text;
BEGIN
 CASE p_section
  WHEN 'roles' THEN allowed:=ARRAY['castingRoles','additionalRoles'];
  WHEN 'pinned' THEN allowed:=ARRAY['pinnedMedia'];
  WHEN 'booking' THEN allowed:=ARRAY['callSheet','available','bookingAvailableFrom','bookingTravel','bookingLocations','bookingRepresentative','bookingEmail','bookingPhone','bookingNotes','showBookingContact'];
  WHEN 'essentials' THEN allowed:=ARRAY['name','role','castingRoles','stateCode','city','experience','gender','genderDescription','maritalStatus','hairStyle','ageFrom','ageTo','available'];
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
END $procedure$;

COMMIT;
