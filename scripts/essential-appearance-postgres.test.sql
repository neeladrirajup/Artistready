BEGIN;
SET ROLE artistready_api;
DO $test$
DECLARE owner text := md5(random()::text) || md5(random()::text);
        result jsonb;
        version integer;
BEGIN
  CALL artistready.save_profile(owner,'{"name":"Essential test artist","role":"Actor","city":"Hyderabad"}'::jsonb,NULL,result);
  version := (result->>'version')::integer;
  CALL artistready.save_essentials(owner,'{"maritalStatus":"Single"}'::jsonb,version,result);
  version := (result->>'version')::integer;
  CALL artistready.save_essentials(owner,'{"workStatus":"presently_working","occupation":"Teacher"}'::jsonb,version,result);
  IF result->'draft'->>'workStatus' <> 'presently_working' OR result->'draft'->>'occupation' <> 'Teacher' THEN
    RAISE EXCEPTION 'Work status or occupation was not saved';
  END IF;
  version := (result->>'version')::integer;
  CALL artistready.save_essentials(owner,'{"workStatus":"full_time_actor","occupation":""}'::jsonb,version,result);
  IF result->'draft'->>'occupation' <> '' THEN
    RAISE EXCEPTION 'Previous occupation was not cleared';
  END IF;
  version := (result->>'version')::integer;
  CALL artistready.save_measurements(owner,'{"hairStyle":"Curly","hairColor":"Blond"}'::jsonb,version,result);
  IF result->'draft'->>'maritalStatus' <> 'Single' OR result->'draft'->>'hairStyle' <> 'Curly' OR result->'draft'->>'hairColor' <> 'Blond' THEN
    RAISE EXCEPTION 'Marital status or hair details were not saved';
  END IF;
  IF result->'draft'->>'name' <> 'Essential test artist' THEN
    RAISE EXCEPTION 'Unrelated essential field changed';
  END IF;
END $test$;
ROLLBACK;
