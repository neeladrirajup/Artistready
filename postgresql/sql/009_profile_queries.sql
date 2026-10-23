SET ROLE artistready_owner;
SET search_path=artistready,pg_catalog;

CREATE TABLE verified_managers (
 account_id text PRIMARY KEY,verified_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 is_active boolean NOT NULL DEFAULT true
);

CREATE FUNCTION get_preferences(p_artist text,p_viewer text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT CASE WHEN p.artist_id IS NULL THEN NULL
  WHEN p.artist_id<>p_viewer AND p.visibility<>'everyone' AND NOT (
   p.visibility='managers' AND EXISTS(SELECT 1 FROM artistready.verified_managers m WHERE m.account_id=p_viewer AND m.is_active)) THEN NULL
  ELSE jsonb_build_object('preferences',jsonb_build_object(
   'visibility',p.visibility,
   'answers',coalesce((SELECT jsonb_object_agg(a.code,jsonb_build_object('choice',a.choice,'notes',a.notes))
    FROM artistready.profile_preference_answers a WHERE a.artist_id=p_artist),'{}'::jsonb))
   || CASE WHEN p.artist_id=p_viewer THEN jsonb_build_object('adultConfirmed',p.adult_confirmed) ELSE '{}'::jsonb END,
   'version',CASE WHEN p.artist_id=p_viewer THEN p.version ELSE NULL END,
   'updatedAt',p.updated_at)
 END
 FROM (SELECT 1) anchor LEFT JOIN artistready.profile_preference_settings p ON p.artist_id=p_artist
$$;
CREATE FUNCTION get_my_preferences(p_owner text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT coalesce(artistready.get_preferences(p_owner,p_owner),
  jsonb_build_object('preferences',jsonb_build_object('visibility','only_me','adultConfirmed',false,'answers','{}'::jsonb),'version',NULL,'updatedAt',NULL))
$$;
CREATE PROCEDURE save_preferences(p_owner text,p_value jsonb,p_expected_version integer,INOUT p_result jsonb DEFAULT NULL)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
DECLARE next_version integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM artistready.profiles WHERE id=p_owner AND NOT is_archived) THEN
  RAISE EXCEPTION 'Save your artist profile first' USING ERRCODE='22023';
 END IF;
 IF coalesce(p_value->>'visibility','') NOT IN ('only_me','managers','everyone') OR
    jsonb_typeof(p_value->'answers') IS DISTINCT FROM 'object' OR
    jsonb_typeof(p_value->'adultConfirmed') IS DISTINCT FROM 'boolean' THEN
  RAISE EXCEPTION 'Invalid preferences' USING ERRCODE='22023';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_each(p_value->'answers') a
  WHERE NOT EXISTS(SELECT 1 FROM artistready.preference_options o WHERE o.code=a.key)
   OR a.value->>'choice' NOT IN ('okay','not_okay','discuss_first','not_disclosed')
   OR length(coalesce(a.value->>'notes',''))>1000) THEN
  RAISE EXCEPTION 'Invalid preference answer' USING ERRCODE='22023';
 END IF;
 IF coalesce((p_value->>'adultConfirmed')::boolean,false)=false AND EXISTS(
  SELECT 1 FROM jsonb_each(p_value->'answers') a
  JOIN artistready.preference_options o ON o.code=a.key WHERE o.adults_only) THEN
  RAISE EXCEPTION 'Confirm you are 18 or older before setting adult preferences' USING ERRCODE='22023';
 END IF;
 IF p_expected_version IS NULL THEN
  INSERT INTO artistready.profile_preference_settings(artist_id,visibility,adult_confirmed)
  VALUES(p_owner,p_value->>'visibility',(p_value->>'adultConfirmed')::boolean)
  ON CONFLICT DO NOTHING RETURNING version INTO next_version;
 ELSE
  UPDATE artistready.profile_preference_settings SET visibility=p_value->>'visibility',
   adult_confirmed=(p_value->>'adultConfirmed')::boolean,version=version+1,updated_at=clock_timestamp()
  WHERE artist_id=p_owner AND version=p_expected_version RETURNING version INTO next_version;
 END IF;
 IF next_version IS NULL THEN RAISE EXCEPTION 'Preferences changed; reload before saving' USING ERRCODE='40001'; END IF;
 DELETE FROM artistready.profile_preference_answers WHERE artist_id=p_owner;
 INSERT INTO artistready.profile_preference_answers(artist_id,code,choice,notes)
 SELECT p_owner,a.key,a.value->>'choice',coalesce(a.value->>'notes','') FROM jsonb_each(p_value->'answers') a;
 p_result:=artistready.get_my_preferences(p_owner);
END $$;

CREATE FUNCTION search_artists(p_viewer text,p_filter jsonb) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 WITH eligible AS (
  SELECT p.id,p.name,p.role,p.city,p.updated_at,d.bio,d.gender,d.available,d.experience,d."ageFrom",d."bodyBuild",d."coverId",d.photo,m.height_inches
  FROM artistready.profiles p
  JOIN artistready.profile_details d ON d.artist_id=p.id
  JOIN artistready.artist_measurements m ON m.artist_id=p.id
  WHERE p.id<>p_viewer AND NOT p.is_archived
   AND (coalesce(p_filter->>'city','') IN ('','All locations') OR p.city=p_filter->>'city')
   AND (coalesce(p_filter->>'category','') IN ('','All') OR
    CASE p.role WHEN 'Actor' THEN 'Actors' WHEN 'Actress' THEN 'Actresses'
     WHEN 'Director' THEN 'Directors' WHEN 'Writer' THEN 'Writers' ELSE 'Crew' END=p_filter->>'category')
   AND (jsonb_array_length(coalesce(p_filter->'roles','[]'::jsonb))=0 OR
    CASE p.role WHEN 'Actor' THEN 'Actors' WHEN 'Actress' THEN 'Actresses'
     WHEN 'Director' THEN 'Directors' WHEN 'Writer' THEN 'Writers' ELSE 'Crew' END IN
    (SELECT jsonb_array_elements_text(p_filter->'roles')))
   AND (coalesce(p_filter->>'gender','') IN ('','All') OR d.gender=p_filter->>'gender')
   AND (coalesce(p_filter->>'bodyBuild','')='' OR d."bodyBuild"=p_filter->>'bodyBuild')
   AND (coalesce(p_filter->>'minHeightInches','')='' OR m.height_inches>=(p_filter->>'minHeightInches')::integer)
   AND (coalesce(p_filter->>'maxHeightInches','')='' OR m.height_inches<=(p_filter->>'maxHeightInches')::integer)
   AND (coalesce(p_filter->>'available','')<>'true' OR d.available)
   AND (coalesce(p_filter->>'minAge','18')='18' OR
    (d."ageFrom"<>'' AND d."ageFrom"::integer>=(p_filter->>'minAge')::integer))
   AND (coalesce(p_filter->>'maxAge','60')='60' OR
    (d."ageFrom"<>'' AND d."ageFrom"::integer<=(p_filter->>'maxAge')::integer))
   AND (jsonb_array_length(coalesce(p_filter->'languages','[]'::jsonb))=0 OR EXISTS(
    SELECT 1 FROM artistready.profile_list_values v WHERE v.artist_id=p.id AND v.list_name='languages'
     AND v.value IN (SELECT jsonb_array_elements_text(p_filter->'languages'))))
   AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(coalesce(p_filter->'skills','[]'::jsonb)) requested(value)
    WHERE NOT EXISTS(SELECT 1 FROM artistready.profile_list_values v WHERE v.artist_id=p.id AND v.list_name='skills' AND v.value=requested.value))
   AND (coalesce(p_filter->>'q','')='' OR
    lower(p.name||' '||p.role||' '||p.city) LIKE '%'||lower(p_filter->>'q')||'%' OR
    EXISTS(SELECT 1 FROM artistready.profile_list_values v WHERE v.artist_id=p.id
     AND v.list_name IN ('castingRoles','additionalRoles','skills','languages')
     AND lower(v.value) LIKE '%'||lower(p_filter->>'q')||'%'))
 ), page AS (
  SELECT * FROM eligible e ORDER BY
   CASE WHEN p_filter->>'sort'='Name A–Z' THEN e.name END COLLATE "C" ASC,
   CASE WHEN p_filter->>'sort'='Experience' THEN coalesce(substring(e.experience from '^[0-9]+')::integer,0) END DESC,
   e.updated_at DESC
  LIMIT 50 OFFSET greatest(coalesce((p_filter->>'offset')::integer,0),0)
 )
 SELECT jsonb_build_object('total',(SELECT count(*) FROM eligible),
  'artists',CASE WHEN p_filter->>'countOnly'='true' THEN '[]'::jsonb ELSE
   coalesce((SELECT jsonb_agg(jsonb_build_object(
    'id',e.id,'name',e.name,'role',e.role,'city',e.city,
    'category',CASE e.role WHEN 'Actor' THEN 'Actors' WHEN 'Actress' THEN 'Actresses'
      WHEN 'Director' THEN 'Directors' WHEN 'Writer' THEN 'Writers' ELSE 'Crew' END,
    'additionalRoles',coalesce((SELECT jsonb_agg(v.value ORDER BY v.sort_order) FROM artistready.profile_list_values v WHERE v.artist_id=e.id AND v.list_name='additionalRoles'),'[]'::jsonb),
    'image',coalesce((SELECT '/api/profile/files/'||e.id||'/'||f.id FROM artistready.profile_media f WHERE f.owner_id=e.id AND f.kind='photo' ORDER BY (f.id=e."coverId") DESC,f.created_at LIMIT 1),nullif(e.photo,''),'my-profile-placeholder'),
    'tagline',e.bio,'gender',e.gender,'bodyBuild',e."bodyBuild",'available',e.available,
    'age',nullif(e."ageFrom",'')::integer,
    'experience',coalesce(substring(e.experience from '^[0-9]+')::integer,0),
    'credits',(SELECT count(*) FROM artistready.profile_entries x WHERE x.artist_id=e.id AND x.entry_kind='credits'),
    'skills',coalesce((SELECT jsonb_agg(v.value ORDER BY v.sort_order) FROM artistready.profile_list_values v WHERE v.artist_id=e.id AND v.list_name='skills'),'[]'::jsonb),
    'languages',coalesce((SELECT jsonb_agg(v.value ORDER BY v.sort_order) FROM artistready.profile_list_values v WHERE v.artist_id=e.id AND v.list_name='languages'),'[]'::jsonb),
    'genres',coalesce((SELECT jsonb_agg(v.value ORDER BY v.sort_order) FROM artistready.profile_list_values v WHERE v.artist_id=e.id AND v.list_name='skills' AND v.sort_order<3),'[]'::jsonb)
   ) ORDER BY e.updated_at DESC) FROM page e),'[]'::jsonb) END)
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA artistready FROM PUBLIC,artistready_api;
REVOKE ALL ON FUNCTION get_preferences(text,text),get_my_preferences(text),search_artists(text,jsonb) FROM PUBLIC;
REVOKE ALL ON PROCEDURE save_preferences(text,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_preferences(text,text),get_my_preferences(text),search_artists(text,jsonb) TO artistready_api;
GRANT EXECUTE ON PROCEDURE save_preferences(text,jsonb,integer,jsonb) TO artistready_api;
RESET ROLE;
