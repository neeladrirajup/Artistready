SET ROLE artistready_owner;
ALTER TABLE artistready.languages ADD COLUMN sort_order integer NOT NULL DEFAULT 100 CHECK(sort_order>=0);
UPDATE artistready.languages SET sort_order=CASE name
 WHEN 'Telugu' THEN 1 WHEN 'Tamil' THEN 2 WHEN 'Kannada' THEN 3 WHEN 'Malayalam' THEN 4
 WHEN 'Hindi' THEN 5 WHEN 'English' THEN 6 ELSE 100 END;
CREATE OR REPLACE FUNCTION artistready.list_languages() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'isActive',is_active,'sortOrder',sort_order)
 ORDER BY sort_order,name),'[]'::jsonb) FROM artistready.languages WHERE is_active
$$;
CREATE OR REPLACE FUNCTION artistready.get_artist_languages(p_artist text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',l.id,'name',l.name) ORDER BY l.sort_order,l.name),'[]'::jsonb)
 FROM artistready.artist_languages a JOIN artistready.languages l ON l.id=a.language_id
 WHERE a.artist_id=p_artist
$$;
RESET ROLE;
