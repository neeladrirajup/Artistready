CREATE TABLE artist_search (
  artist_id TEXT PRIMARY KEY NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  gender TEXT NOT NULL,
  available INTEGER NOT NULL,
  age_from INTEGER,
  age_to INTEGER,
  experience_years INTEGER NOT NULL,
  search_text TEXT NOT NULL
);
CREATE INDEX artist_search_city_category ON artist_search(city, category);
CREATE INDEX artist_search_available ON artist_search(available);
CREATE INDEX artist_search_gender ON artist_search(gender);
CREATE INDEX artist_search_age ON artist_search(age_from, age_to);
CREATE TABLE artist_search_skills (
  artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  PRIMARY KEY (artist_id, value)
);
CREATE INDEX artist_search_skills_value ON artist_search_skills(value, artist_id);
CREATE TABLE artist_search_languages (
  artist_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  PRIMARY KEY (artist_id, value)
);
CREATE INDEX artist_search_languages_value ON artist_search_languages(value, artist_id);

CREATE TRIGGER profiles_search_insert AFTER INSERT ON profiles BEGIN
  INSERT INTO artist_search
  SELECT NEW.id, NEW.name, NEW.role,
    CASE NEW.role WHEN 'Actor' THEN 'Actors' WHEN 'Actress' THEN 'Actresses'
      WHEN 'Director' THEN 'Directors' WHEN 'Writer' THEN 'Writers' ELSE 'Crew' END,
    NEW.city, coalesce(json_extract(NEW.document, '$.gender'), ''),
    CASE WHEN json_extract(NEW.document, '$.available') = 1 THEN 1 ELSE 0 END,
    cast(nullif(json_extract(NEW.document, '$.ageFrom'), '') AS INTEGER),
    cast(nullif(json_extract(NEW.document, '$.ageTo'), '') AS INTEGER),
    cast(coalesce(nullif(json_extract(NEW.document, '$.experience'), ''), '0') AS INTEGER),
    lower(NEW.name || ' ' || NEW.role || ' ' || NEW.city || ' ' ||
      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.document, '$.castingRoles')), '') || ' ' ||
      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.document, '$.additionalRoles')), '') || ' ' ||
      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.document, '$.skills')), '') || ' ' ||
      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.document, '$.languages')), ''));
  INSERT OR IGNORE INTO artist_search_skills SELECT NEW.id, value FROM json_each(NEW.document, '$.skills') WHERE type = 'text';
  INSERT OR IGNORE INTO artist_search_languages SELECT NEW.id, value FROM json_each(NEW.document, '$.languages') WHERE type = 'text';
END;
CREATE TRIGGER profiles_search_update AFTER UPDATE ON profiles BEGIN
  DELETE FROM artist_search_skills WHERE artist_id = NEW.id;
  DELETE FROM artist_search_languages WHERE artist_id = NEW.id;
  DELETE FROM artist_search WHERE artist_id = NEW.id;
  INSERT INTO artist_search
  SELECT NEW.id, NEW.name, NEW.role,
    CASE NEW.role WHEN 'Actor' THEN 'Actors' WHEN 'Actress' THEN 'Actresses'
      WHEN 'Director' THEN 'Directors' WHEN 'Writer' THEN 'Writers' ELSE 'Crew' END,
    NEW.city, coalesce(json_extract(NEW.document, '$.gender'), ''),
    CASE WHEN json_extract(NEW.document, '$.available') = 1 THEN 1 ELSE 0 END,
    cast(nullif(json_extract(NEW.document, '$.ageFrom'), '') AS INTEGER),
    cast(nullif(json_extract(NEW.document, '$.ageTo'), '') AS INTEGER),
    cast(coalesce(nullif(json_extract(NEW.document, '$.experience'), ''), '0') AS INTEGER),
    lower(NEW.name || ' ' || NEW.role || ' ' || NEW.city || ' ' ||
      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.document, '$.castingRoles')), '') || ' ' ||
      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.document, '$.additionalRoles')), '') || ' ' ||
      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.document, '$.skills')), '') || ' ' ||
      coalesce((SELECT group_concat(value, ' ') FROM json_each(NEW.document, '$.languages')), ''));
  INSERT OR IGNORE INTO artist_search_skills SELECT NEW.id, value FROM json_each(NEW.document, '$.skills') WHERE type = 'text';
  INSERT OR IGNORE INTO artist_search_languages SELECT NEW.id, value FROM json_each(NEW.document, '$.languages') WHERE type = 'text';
END;
CREATE TRIGGER profiles_search_delete AFTER DELETE ON profiles BEGIN
  DELETE FROM artist_search_skills WHERE artist_id = OLD.id;
  DELETE FROM artist_search_languages WHERE artist_id = OLD.id;
  DELETE FROM artist_search WHERE artist_id = OLD.id;
END;

UPDATE profiles SET document = document;
