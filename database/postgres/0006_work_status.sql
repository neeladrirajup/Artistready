BEGIN;

ALTER TABLE artistready.profile_details
  ADD COLUMN IF NOT EXISTS "workStatus" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS occupation text NOT NULL DEFAULT '';

ALTER PROCEDURE artistready.write_profile_fields(text,jsonb)
  RENAME TO write_profile_fields_before_work_status;

CREATE PROCEDURE artistready.write_profile_fields(IN p_owner text, IN p_document jsonb)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog', 'artistready'
AS $procedure$
DECLARE selected_status text := coalesce(p_document->>'workStatus','');
        selected_occupation text := btrim(coalesce(p_document->>'occupation',''));
BEGIN
  IF selected_status NOT IN ('','full_time_actor','presently_working','not_working','prefer_not_to_say') THEN
    RAISE EXCEPTION 'Unknown work status' USING ERRCODE='22023';
  END IF;
  IF selected_status='presently_working' AND (selected_occupation='' OR length(selected_occupation)>120) THEN
    RAISE EXCEPTION 'Current occupation is required when presently working' USING ERRCODE='22023';
  END IF;
  CALL artistready.write_profile_fields_before_work_status(p_owner,p_document);
  UPDATE artistready.profile_details
     SET "workStatus"=selected_status,
         occupation=CASE WHEN selected_status='presently_working' THEN selected_occupation ELSE '' END
   WHERE artist_id=p_owner;
END $procedure$;

GRANT EXECUTE ON PROCEDURE artistready.write_profile_fields(text,jsonb)
  TO artistready_api;

COMMIT;
