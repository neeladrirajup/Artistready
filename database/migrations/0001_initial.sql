-- Structured artist data only. Uploaded files belong in private object storage.
CREATE TABLE accounts (
 id TEXT PRIMARY KEY NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

-- Provider subjects identify verified accounts; never store plaintext passwords or OTPs.
CREATE TABLE auth_identities (
 id TEXT PRIMARY KEY NOT NULL,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 provider TEXT NOT NULL CHECK(provider IN ('phone','google','email')),
 provider_subject TEXT NOT NULL,
 verified_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(provider, provider_subject)
) STRICT;
CREATE INDEX auth_identity_account ON auth_identities(account_id);

CREATE TABLE artists (
 id TEXT PRIMARY KEY NOT NULL,
 account_id TEXT UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
 slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
 professional_name TEXT NOT NULL CHECK(length(trim(professional_name)) BETWEEN 1 AND 80),
 primary_role TEXT NOT NULL CHECK(length(trim(primary_role)) BETWEEN 1 AND 100),
 city TEXT NOT NULL CHECK(length(trim(city)) BETWEEN 1 AND 100),
 country TEXT NOT NULL DEFAULT 'India',
 biography TEXT NOT NULL DEFAULT '',
 gender TEXT NOT NULL DEFAULT '',
 gender_description TEXT NOT NULL DEFAULT '',
 playing_age_from INTEGER CHECK(playing_age_from BETWEEN 1 AND 100),
 playing_age_to INTEGER CHECK(playing_age_to BETWEEN 1 AND 100),
 experience_label TEXT NOT NULL DEFAULT 'Starting out',
 experience_years INTEGER CHECK(experience_years >= 0),
 open_to_opportunities INTEGER NOT NULL DEFAULT 1 CHECK(open_to_opportunities IN (0,1)),
 visibility TEXT NOT NULL DEFAULT 'draft' CHECK(visibility IN ('draft','published','hidden')),
 is_sample INTEGER NOT NULL DEFAULT 0 CHECK(is_sample IN (0,1)),
 artwork_key TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK((playing_age_from IS NULL AND playing_age_to IS NULL) OR
       (playing_age_from IS NOT NULL AND playing_age_to IS NOT NULL AND playing_age_from <= playing_age_to))
) STRICT;
CREATE INDEX artists_discovery ON artists(visibility, primary_role, city);
CREATE INDEX artists_name ON artists(professional_name COLLATE NOCASE);

CREATE TABLE artist_roles (
 id TEXT PRIMARY KEY NOT NULL,
 artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 role TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(role)) BETWEEN 1 AND 100),
 UNIQUE(artist_id,role)
) STRICT;
CREATE TABLE artist_languages (
 id TEXT PRIMARY KEY NOT NULL,
 artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 language TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(language)) BETWEEN 1 AND 80),
 UNIQUE(artist_id,language)
) STRICT;
CREATE TABLE artist_skills (
 id TEXT PRIMARY KEY NOT NULL,
 artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 name TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(name)) BETWEEN 1 AND 100),
 category TEXT NOT NULL DEFAULT 'Others' CHECK(category IN ('Technical','Soft Skills','Artistic Skills','Others')),
 UNIQUE(artist_id,name)
) STRICT;
CREATE TABLE artist_genres (
 id TEXT PRIMARY KEY NOT NULL,
 artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 genre TEXT NOT NULL COLLATE NOCASE,
 UNIQUE(artist_id,genre)
) STRICT;

CREATE TABLE artist_measurements (
 artist_id TEXT PRIMARY KEY NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 fit TEXT NOT NULL DEFAULT 'neutral' CHECK(fit IN ('male','female','neutral')),
 height_feet INTEGER CHECK(height_feet BETWEEN 1 AND 8),
 height_inches INTEGER CHECK(height_inches BETWEEN 0 AND 11),
 weight_kg REAL CHECK(weight_kg > 0 AND weight_kg <= 300),
 chest_inches REAL CHECK(chest_inches > 0 AND chest_inches <= 300),
 bust_inches REAL CHECK(bust_inches > 0 AND bust_inches <= 300),
 waist_inches REAL CHECK(waist_inches > 0 AND waist_inches <= 300),
 hip_inches REAL CHECK(hip_inches > 0 AND hip_inches <= 300),
 CHECK(height_inches IS NULL OR height_feet IS NOT NULL)
) STRICT;
CREATE TABLE artist_wardrobe (
 artist_id TEXT PRIMARY KEY NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 top_size TEXT NOT NULL DEFAULT '',
 dress_size TEXT NOT NULL DEFAULT '',
 trouser_waist TEXT NOT NULL DEFAULT '',
 jacket_size TEXT NOT NULL DEFAULT '',
 shoes_size TEXT NOT NULL DEFAULT '',
 gloves_size TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE artist_credits (
 id TEXT PRIMARY KEY NOT NULL,
 artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
 project_type TEXT NOT NULL CHECK(project_type IN ('Feature film','Short film','OTT series','Television','Theatre','Commercial','Music video','Trailer','Appearance','Other')),
 role TEXT NOT NULL CHECK(length(trim(role)) BETWEEN 1 AND 120),
 project_year INTEGER CHECK(project_year BETWEEN 1000 AND 9999),
 director TEXT NOT NULL DEFAULT '',
 production_company TEXT NOT NULL DEFAULT '',
 project_url TEXT CHECK(project_url IS NULL OR project_url GLOB 'https://?*' OR project_url GLOB 'http://?*'),
 sort_order INTEGER NOT NULL DEFAULT 0
) STRICT;
CREATE INDEX credits_artist_type ON artist_credits(artist_id,project_type);

CREATE TABLE artist_milestones (
 id TEXT PRIMARY KEY NOT NULL,
 artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('education','training','recognition')),
 title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
 organisation TEXT NOT NULL DEFAULT '',
 milestone_year INTEGER CHECK(milestone_year BETWEEN 1000 AND 9999),
 notes TEXT NOT NULL DEFAULT '',
 sort_order INTEGER NOT NULL DEFAULT 0
) STRICT;
CREATE INDEX milestones_artist_kind ON artist_milestones(artist_id,kind);

-- Private booking contacts are separated from public availability information.
CREATE TABLE artist_booking (
 artist_id TEXT PRIMARY KEY NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 available_from TEXT CHECK(available_from IS NULL OR (available_from GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND date(available_from) IS NOT NULL AND date(available_from)=available_from)),
 preferred_locations TEXT NOT NULL DEFAULT '',
 travel_preference TEXT NOT NULL DEFAULT 'Open to discussion' CHECK(travel_preference IN ('Open to discussion','Available for domestic travel','Available for international travel','Local projects only')),
 representative TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT ''
) STRICT;
CREATE TABLE artist_booking_contacts (
 artist_id TEXT PRIMARY KEY NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 email TEXT NOT NULL DEFAULT '',
 phone TEXT NOT NULL DEFAULT '',
 display_contact INTEGER NOT NULL DEFAULT 0 CHECK(display_contact IN (0,1))
) STRICT;

CREATE TABLE artist_media (
 id TEXT PRIMARY KEY NOT NULL,
 artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('photo','video','link')),
 title TEXT NOT NULL DEFAULT '',
 storage_key TEXT,
 external_url TEXT,
 mime_type TEXT,
 size_bytes INTEGER,
 is_profile_photo INTEGER NOT NULL DEFAULT 0 CHECK(is_profile_photo IN (0,1)),
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(artist_id,id),
 CHECK((kind='photo' AND storage_key IS NOT NULL AND external_url IS NULL AND mime_type IS NOT NULL AND mime_type IN ('image/jpeg','image/png','image/webp') AND size_bytes IS NOT NULL AND size_bytes > 0 AND size_bytes <= 5000000)
    OR (kind='video' AND storage_key IS NOT NULL AND external_url IS NULL AND mime_type IS NOT NULL AND mime_type IN ('video/mp4','video/webm') AND size_bytes IS NOT NULL AND size_bytes > 0 AND size_bytes < 50000000)
    OR (kind='link' AND storage_key IS NULL AND external_url IS NOT NULL AND (external_url GLOB 'https://?*' OR external_url GLOB 'http://?*') AND size_bytes IS NULL)),
 CHECK(is_profile_photo=0 OR kind='photo')
) STRICT;
CREATE UNIQUE INDEX one_profile_photo ON artist_media(artist_id) WHERE is_profile_photo=1;
CREATE INDEX media_artist_kind ON artist_media(artist_id,kind);
CREATE TABLE artist_pinned_media (
 artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 media_id TEXT NOT NULL,
 position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 3),
 PRIMARY KEY(artist_id,position),
 UNIQUE(artist_id,media_id),
 FOREIGN KEY(artist_id,media_id) REFERENCES artist_media(artist_id,id) ON DELETE CASCADE
) STRICT;
CREATE TABLE saved_artists (
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(account_id,artist_id)
) STRICT;
