SET ROLE artistready_owner;
SET search_path=pg_catalog,artistready;

CREATE TABLE artistready.preference_choices (
 code text PRIMARY KEY,
 label text NOT NULL UNIQUE,
 sort_order integer NOT NULL UNIQUE
);
INSERT INTO artistready.preference_choices VALUES
 ('okay','Okay',10),('not_okay','Not okay',20),
 ('discuss_first','Discuss first',30),('not_disclosed','Prefer not to disclose',40);

CREATE TABLE artistready.preference_options (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 code text NOT NULL UNIQUE CHECK(code ~ '^[a-z][a-z0-9_]*$'),
 category text NOT NULL,
 label text NOT NULL,
 description text NOT NULL,
 adults_only boolean NOT NULL DEFAULT false,
 sort_order integer NOT NULL UNIQUE,
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT current_timestamp
);
INSERT INTO artistready.preference_options(code,category,label,description,adults_only,sort_order) VALUES
 ('lip_kissing','Physical contact','On-screen kissing / lip lock','Kissing on the lips; agree exact scene requirements separately.',true,10),
 ('hugging','Physical contact','Hugging','Scripted hugs and embraces.',false,20),
 ('holding_hands','Physical contact','Holding hands','Scripted hand holding.',false,30),
 ('cuddling','Physical contact','Cuddling','Close romantic physical contact.',true,40),
 ('simulated_intimacy','Intimate scenes','Simulated intimacy','Simulated scenes only; requires separate scene-specific agreement.',true,50),
 ('revealing_costumes','Costumes & nudity','Revealing costumes','Artist-defined clothing limits; specify details in notes.',true,60),
 ('swimwear','Costumes & nudity','Swimwear','Beach or pool attire; confirm the specific costume.',true,70),
 ('partial_nudity','Costumes & nudity','Partial nudity','Discuss exact depiction, framing and safeguards separately.',true,80),
 ('full_nudity','Costumes & nudity','Full nudity','Discuss exact depiction, framing and safeguards separately.',true,90),
 ('fight_scenes','Action & stunts','Choreographed fight scenes','Staged action with agreed safety arrangements.',false,100),
 ('height_stunts','Action & stunts','Height stunts','Elevated work and stunt requirements.',false,110),
 ('water_stunts','Action & stunts','Water stunts','Water-based action and safety requirements.',false,120),
 ('haircut','Appearance changes','Haircut','Temporary or lasting changes to hair length.',false,130),
 ('hair_colour','Appearance changes','Hair colour','Changes to hair colour.',false,140),
 ('shaving','Appearance changes','Shaving / facial hair changes','Changes to facial hair for a role.',false,150),
 ('smoking_depiction','Sensitive roles','Depicting smoking','On-screen portrayal; does not imply actual tobacco use.',false,160),
 ('drinking_depiction','Sensitive roles','Depicting alcohol consumption','On-screen portrayal; does not imply actual alcohol consumption.',false,170),
 ('strong_language','Sensitive roles','Strong language','Scripted profanity or strong dialogue.',false,180),
 ('night_shoots','Work conditions','Night shoots','Late-night work subject to applicable work rules.',false,190),
 ('travel','Work conditions','Travel for projects','Out-of-city or out-of-country project travel.',false,200),
 ('overnight_stays','Work conditions','Overnight stays','Project-related accommodation away from home.',false,210);

-- Absence of a row means unanswered, never agreement. No artist is prefilled.
-- Kept separate from publicly returned profile JSON to prevent accidental exposure.
CREATE TABLE artistready.artist_preferences (
 artist_id text NOT NULL REFERENCES artistready.profiles(id) ON DELETE CASCADE,
 preference_id bigint NOT NULL REFERENCES artistready.preference_options(id),
 choice_code text NOT NULL REFERENCES artistready.preference_choices(code),
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT current_timestamp,
 updated_at timestamptz NOT NULL DEFAULT current_timestamp,
 PRIMARY KEY(artist_id,preference_id)
);
COMMENT ON TABLE artistready.artist_preferences IS
 'Private initial boundaries, not scene-specific consent. No defaults. Future API must authenticate ownership, enforce adult eligibility for adults_only options, and explicitly authorize any verified casting viewer. No API access granted yet.';

CREATE FUNCTION artistready.list_preference_options() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,artistready AS $$
 SELECT jsonb_build_object(
 'choices',(SELECT jsonb_agg(jsonb_build_object('code',code,'label',label) ORDER BY sort_order) FROM artistready.preference_choices),
 'preferences',(SELECT jsonb_agg(jsonb_build_object('id',id,'code',code,'category',category,'label',label,'description',description,'adultsOnly',adults_only) ORDER BY sort_order) FROM artistready.preference_options WHERE is_active))
$$;
REVOKE ALL ON artistready.preference_choices,artistready.preference_options,artistready.artist_preferences FROM PUBLIC,artistready_api;
REVOKE ALL ON FUNCTION artistready.list_preference_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION artistready.list_preference_options() TO artistready_api;
RESET ROLE;
