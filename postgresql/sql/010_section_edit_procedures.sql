SET ROLE artistready_owner;
SET search_path=artistready,pg_catalog;

-- Each editor has a dedicated database entry point. Only that editor's keys may change.
CREATE PROCEDURE save_profile_section(p_owner text,p_section text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE current_version integer; allowed text[]; key text;
BEGIN
 CASE p_section
  WHEN 'roles' THEN allowed:=ARRAY['castingRoles','additionalRoles'];
  WHEN 'pinned' THEN allowed:=ARRAY['pinnedMedia'];
  WHEN 'booking' THEN allowed:=ARRAY['callSheet','available','bookingAvailableFrom','bookingTravel','bookingLocations','bookingRepresentative','bookingEmail','bookingPhone','bookingNotes','showBookingContact'];
  WHEN 'essentials' THEN allowed:=ARRAY['name','role','castingRoles','city','experience','gender','genderDescription','ageFrom','ageTo','available'];
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

CREATE PROCEDURE save_roles(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'roles',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_pinned(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'pinned',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_booking(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'booking',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_essentials(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'essentials',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_about(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'about',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_skills(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'skills',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_languages(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'languages',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_credits(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'credits',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_training(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'training',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_recognition(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'recognition',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_measurements(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'measurements',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_clothing(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'clothing',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_education(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'education',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_photos(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'photos',p_patch,p_expected_version,p_result);
END $$;

CREATE PROCEDURE save_showreels(p_owner text,p_patch jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 CALL artistready.save_profile_section(p_owner,'showreels',p_patch,p_expected_version,p_result);
END $$;

REVOKE ALL ON PROCEDURE save_profile_section(text,text,jsonb,integer,jsonb) FROM PUBLIC,artistready_api;
REVOKE ALL ON PROCEDURE save_roles(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_roles(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_pinned(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_pinned(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_booking(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_booking(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_essentials(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_essentials(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_about(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_about(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_skills(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_skills(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_languages(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_languages(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_credits(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_credits(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_training(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_training(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_recognition(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_recognition(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_measurements(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_measurements(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_clothing(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_clothing(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_education(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_education(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_photos(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_photos(text,jsonb,integer,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE save_showreels(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE save_showreels(text,jsonb,integer,jsonb) TO artistready_api;
RESET ROLE;

