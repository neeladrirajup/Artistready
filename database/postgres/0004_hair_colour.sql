BEGIN;

ALTER TABLE artistready.profile_details
  ADD COLUMN IF NOT EXISTS "hairColor" text NOT NULL DEFAULT '';

ALTER PROCEDURE artistready.write_profile_fields(text,jsonb)
  RENAME TO write_profile_fields_before_hair_colour;

CREATE PROCEDURE artistready.write_profile_fields(IN p_owner text, IN p_document jsonb)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog', 'artistready'
AS $procedure$
BEGIN
  CALL artistready.write_profile_fields_before_hair_colour(p_owner,p_document);
  UPDATE artistready.profile_details
     SET "hairColor"=coalesce(p_document->>'hairColor','')
   WHERE artist_id=p_owner;
END $procedure$;

GRANT EXECUTE ON PROCEDURE artistready.write_profile_fields(text,jsonb)
  TO artistready_api;

COMMIT;
