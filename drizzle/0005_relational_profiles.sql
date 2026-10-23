DROP TRIGGER IF EXISTS profiles_search_insert;
DROP TRIGGER IF EXISTS profiles_search_update;
DROP TRIGGER IF EXISTS profiles_search_delete;
DROP TRIGGER IF EXISTS profiles_measurements_insert;
DROP TRIGGER IF EXISTS profiles_measurements_update;
DROP TRIGGER IF EXISTS profiles_measurements_delete;

CREATE TABLE artist_profile_details (
 artist_id TEXT PRIMARY KEY NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 body_build TEXT NOT NULL DEFAULT '', body_build_description TEXT NOT NULL DEFAULT '',
 booking_available_from TEXT NOT NULL DEFAULT '', booking_travel TEXT NOT NULL DEFAULT '', booking_locations TEXT NOT NULL DEFAULT '',
 booking_representative TEXT NOT NULL DEFAULT '', booking_email TEXT NOT NULL DEFAULT '', booking_phone TEXT NOT NULL DEFAULT '', booking_notes TEXT NOT NULL DEFAULT '',
 gender TEXT NOT NULL DEFAULT '', gender_description TEXT NOT NULL DEFAULT '', age_from TEXT NOT NULL DEFAULT '', age_to TEXT NOT NULL DEFAULT '',
 cover_id TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', experience TEXT NOT NULL DEFAULT '', photo TEXT NOT NULL DEFAULT '', reel TEXT NOT NULL DEFAULT '',
 show_booking_contact INTEGER NOT NULL DEFAULT 0, available INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE artist_call_sheets (
 artist_id TEXT PRIMARY KEY NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 shooting_status TEXT NOT NULL DEFAULT '', project TEXT NOT NULL DEFAULT '', shoot_from TEXT NOT NULL DEFAULT '', shoot_to TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT ''
);
CREATE TABLE artist_call_sheet_dates (
 artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL,
 id TEXT NOT NULL, from_date TEXT NOT NULL, to_date TEXT NOT NULL, status TEXT NOT NULL, notes TEXT NOT NULL,
 PRIMARY KEY(artist_id,id)
);
CREATE TABLE artist_clothing_sizes (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, size_key TEXT NOT NULL, size_value TEXT NOT NULL, PRIMARY KEY(artist_id,size_key));
CREATE TABLE artist_skill_categories (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, skill TEXT NOT NULL, category TEXT NOT NULL, PRIMARY KEY(artist_id,skill));
CREATE TABLE artist_casting_roles (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY(artist_id,sort_order));
CREATE TABLE artist_additional_roles (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY(artist_id,sort_order));
CREATE TABLE artist_languages (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY(artist_id,sort_order));
CREATE INDEX artist_languages_value ON artist_languages(value,artist_id);
CREATE TABLE artist_skills (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY(artist_id,sort_order));
CREATE INDEX artist_skills_value ON artist_skills(value,artist_id);
CREATE TABLE artist_pinned_media (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY(artist_id,sort_order));
CREATE TABLE artist_reel_links (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY(artist_id,sort_order));
CREATE TABLE artist_credits (
 artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, id TEXT NOT NULL,
 title TEXT NOT NULL, type TEXT NOT NULL, role TEXT NOT NULL, year TEXT NOT NULL, director TEXT NOT NULL, production TEXT NOT NULL, trailer TEXT NOT NULL,
 PRIMARY KEY(artist_id,id)
);
CREATE TABLE artist_training (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, id TEXT NOT NULL, title TEXT NOT NULL, organisation TEXT NOT NULL, year TEXT NOT NULL, notes TEXT NOT NULL, PRIMARY KEY(artist_id,id));
CREATE TABLE artist_recognition (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, id TEXT NOT NULL, title TEXT NOT NULL, organisation TEXT NOT NULL, year TEXT NOT NULL, notes TEXT NOT NULL, PRIMARY KEY(artist_id,id));
CREATE TABLE artist_education (artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, sort_order INTEGER NOT NULL, id TEXT NOT NULL, qualification TEXT NOT NULL, institution TEXT NOT NULL, year TEXT NOT NULL, notes TEXT NOT NULL, PRIMARY KEY(artist_id,id));
CREATE TABLE artist_preference_answers (
 artist_id TEXT NOT NULL REFERENCES artist_preferences(artist_id) ON DELETE CASCADE,
 code TEXT NOT NULL, choice TEXT NOT NULL, notes TEXT NOT NULL, PRIMARY KEY(artist_id,code)
);

ALTER TABLE artist_measurements ADD COLUMN body_build_description TEXT NOT NULL DEFAULT '';
ALTER TABLE artist_measurements ADD COLUMN height_feet INTEGER;
ALTER TABLE artist_measurements ADD COLUMN height_inch_part INTEGER;
ALTER TABLE artist_preferences ADD COLUMN visibility TEXT NOT NULL DEFAULT 'only_me';
ALTER TABLE artist_preferences ADD COLUMN adult_confirmed INTEGER NOT NULL DEFAULT 0;

INSERT INTO artist_profile_details SELECT id,
 coalesce(json_extract(document,'$.bodyBuild'),''),coalesce(json_extract(document,'$.bodyBuildDescription'),''),
 coalesce(json_extract(document,'$.bookingAvailableFrom'),''),coalesce(json_extract(document,'$.bookingTravel'),''),coalesce(json_extract(document,'$.bookingLocations'),''),
 coalesce(json_extract(document,'$.bookingRepresentative'),''),coalesce(json_extract(document,'$.bookingEmail'),''),coalesce(json_extract(document,'$.bookingPhone'),''),coalesce(json_extract(document,'$.bookingNotes'),''),
 coalesce(json_extract(document,'$.gender'),''),coalesce(json_extract(document,'$.genderDescription'),''),coalesce(json_extract(document,'$.ageFrom'),''),coalesce(json_extract(document,'$.ageTo'),''),
 coalesce(json_extract(document,'$.coverId'),''),coalesce(json_extract(document,'$.bio'),''),coalesce(json_extract(document,'$.experience'),''),coalesce(json_extract(document,'$.photo'),''),coalesce(json_extract(document,'$.reel'),''),
 coalesce(json_extract(document,'$.showBookingContact'),0),coalesce(json_extract(document,'$.available'),1)
 FROM profiles;
INSERT INTO artist_call_sheets SELECT id,
 coalesce(json_extract(document,'$.callSheet.shootingStatus'),''),coalesce(json_extract(document,'$.callSheet.project'),''),
 coalesce(json_extract(document,'$.callSheet.shootFrom'),''),coalesce(json_extract(document,'$.callSheet.shootTo'),''),coalesce(json_extract(document,'$.callSheet.notes'),'')
 FROM profiles;
INSERT INTO artist_call_sheet_dates SELECT p.id,CAST(d.key AS INTEGER),coalesce(json_extract(d.value,'$.id'),''),coalesce(json_extract(d.value,'$.from'),''),coalesce(json_extract(d.value,'$.to'),''),coalesce(json_extract(d.value,'$.status'),''),coalesce(json_extract(d.value,'$.notes'),'') FROM profiles p,json_each(p.document,'$.callSheet.dates') d;
INSERT INTO artist_clothing_sizes SELECT p.id,CAST(c.key AS INTEGER),c.key,c.value FROM profiles p,json_each(p.document,'$.clothing') c;
INSERT INTO artist_skill_categories SELECT p.id,CAST(c.key AS INTEGER),c.key,c.value FROM profiles p,json_each(p.document,'$.skillCategories') c;
INSERT INTO artist_casting_roles SELECT p.id,CAST(c.key AS INTEGER),c.value FROM profiles p,json_each(p.document,'$.castingRoles') c;
INSERT INTO artist_additional_roles SELECT p.id,CAST(c.key AS INTEGER),c.value FROM profiles p,json_each(p.document,'$.additionalRoles') c;
INSERT INTO artist_languages SELECT p.id,CAST(c.key AS INTEGER),c.value FROM profiles p,json_each(p.document,'$.languages') c;
INSERT INTO artist_skills SELECT p.id,CAST(c.key AS INTEGER),c.value FROM profiles p,json_each(p.document,'$.skills') c;
INSERT INTO artist_pinned_media SELECT p.id,CAST(c.key AS INTEGER),c.value FROM profiles p,json_each(p.document,'$.pinnedMedia') c;
INSERT INTO artist_reel_links SELECT p.id,CAST(c.key AS INTEGER),c.value FROM profiles p,json_each(p.document,'$.reelLinks') c;
INSERT INTO artist_credits SELECT p.id,CAST(c.key AS INTEGER),json_extract(c.value,'$.id'),coalesce(json_extract(c.value,'$.title'),''),coalesce(json_extract(c.value,'$.type'),''),coalesce(json_extract(c.value,'$.role'),''),coalesce(json_extract(c.value,'$.year'),''),coalesce(json_extract(c.value,'$.director'),''),coalesce(json_extract(c.value,'$.production'),''),coalesce(json_extract(c.value,'$.trailer'),'') FROM profiles p,json_each(p.document,'$.credits') c;
INSERT INTO artist_training SELECT p.id,CAST(c.key AS INTEGER),json_extract(c.value,'$.id'),coalesce(json_extract(c.value,'$.title'),''),coalesce(json_extract(c.value,'$.organisation'),''),coalesce(json_extract(c.value,'$.year'),''),coalesce(json_extract(c.value,'$.notes'),'') FROM profiles p,json_each(p.document,'$.training') c;
INSERT INTO artist_recognition SELECT p.id,CAST(c.key AS INTEGER),json_extract(c.value,'$.id'),coalesce(json_extract(c.value,'$.title'),''),coalesce(json_extract(c.value,'$.organisation'),''),coalesce(json_extract(c.value,'$.year'),''),coalesce(json_extract(c.value,'$.notes'),'') FROM profiles p,json_each(p.document,'$.recognition') c;
INSERT INTO artist_education SELECT p.id,CAST(c.key AS INTEGER),json_extract(c.value,'$.id'),coalesce(json_extract(c.value,'$.qualification'),''),coalesce(json_extract(c.value,'$.institution'),''),coalesce(json_extract(c.value,'$.year'),''),coalesce(json_extract(c.value,'$.notes'),'') FROM profiles p,json_each(p.document,'$.education') c;
UPDATE artist_measurements SET body_build_description=coalesce((SELECT json_extract(document,'$.bodyBuildDescription') FROM profiles WHERE id=artist_id),''),height_feet=(SELECT CAST(nullif(json_extract(document,'$.heightFeet'),'') AS INTEGER) FROM profiles WHERE id=artist_id),height_inch_part=(SELECT CAST(nullif(json_extract(document,'$.heightInches'),'') AS INTEGER) FROM profiles WHERE id=artist_id);
UPDATE artist_preferences SET visibility=coalesce(json_extract(document,'$.visibility'),'only_me'),adult_confirmed=coalesce(json_extract(document,'$.adultConfirmed'),0);
INSERT INTO artist_preference_answers SELECT p.artist_id,a.key,coalesce(json_extract(a.value,'$.choice'),'not_disclosed'),coalesce(json_extract(a.value,'$.notes'),'') FROM artist_preferences p,json_each(p.document,'$.answers') a;

DROP TABLE artist_search_skills;
DROP TABLE artist_search_languages;
DROP TABLE artist_search;
ALTER TABLE profiles DROP COLUMN document;
ALTER TABLE artist_preferences DROP COLUMN document;
CREATE INDEX profiles_city_role ON profiles(city,role);
CREATE INDEX profile_details_gender_available ON artist_profile_details(gender,available);
