SET ROLE artistready_owner;
SET search_path=artistready,pg_catalog;

CREATE PROCEDURE read_my_profile(p_owner text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.get_my_profile(p_owner);
END $$;

CREATE PROCEDURE read_profile(p_artist text,p_viewer text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.get_profile(p_artist,p_viewer);
END $$;

CREATE PROCEDURE read_artists(p_viewer text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.list_artists(p_viewer);
END $$;

CREATE PROCEDURE read_search(p_viewer text,p_filter jsonb,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.search_artists(p_viewer,p_filter);
END $$;

CREATE PROCEDURE read_my_preferences(p_owner text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.get_my_preferences(p_owner);
END $$;

CREATE PROCEDURE read_preferences(p_artist text,p_viewer text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.get_preferences(p_artist,p_viewer);
END $$;

CREATE PROCEDURE read_body_types(p_fit text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.list_body_types(p_fit);
END $$;

CREATE PROCEDURE read_craft_roles(p_craft text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.list_craft_roles(p_craft);
END $$;

CREATE PROCEDURE read_skills(INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.list_skills();
END $$;

CREATE PROCEDURE read_languages(INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.list_languages();
END $$;

CREATE PROCEDURE read_preference_options(INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 p_result:=artistready.list_preference_options();
END $$;

CREATE PROCEDURE read_media(p_owner text,p_id text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 SELECT jsonb_build_object('id',m.id,'owner_id',m.owner_id,'kind',m.kind,
  'storage_key',m.storage_key,'name',m.name,'mime',m.mime,'size',m.size,
  'created_at',m.created_at)
 INTO p_result FROM artistready.profile_media m WHERE m.owner_id=p_owner AND m.id=p_id;
END $$;

CREATE PROCEDURE read_photo_count(p_owner text,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
BEGIN
 SELECT to_jsonb(count(*)) INTO p_result FROM artistready.profile_media
 WHERE owner_id=p_owner AND kind='photo';
END $$;

REVOKE ALL ON PROCEDURE read_my_profile(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_my_profile(text,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_profile(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_profile(text,text,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_artists(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_artists(text,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_search(text,jsonb,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_search(text,jsonb,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_my_preferences(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_my_preferences(text,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_preferences(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_preferences(text,text,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_body_types(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_body_types(text,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_craft_roles(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_craft_roles(text,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_skills(jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_skills(jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_languages(jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_languages(jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_preference_options(jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_preference_options(jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_media(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_media(text,text,jsonb) TO artistready_api;
REVOKE ALL ON PROCEDURE read_photo_count(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE read_photo_count(text,jsonb) TO artistready_api;
RESET ROLE;

