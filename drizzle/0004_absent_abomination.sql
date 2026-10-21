CREATE TABLE `artist_measurements` (
	`artist_id` text PRIMARY KEY NOT NULL,
	`measurement_fit` text NOT NULL,
	`body_build` text NOT NULL,
	`height_inches` integer,
	`weight_kg` real,
	`chest_in` real,
	`bust_in` real,
	`waist_in` real,
	`hip_in` real,
	FOREIGN KEY (`artist_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `artist_measurements_build_fit` ON `artist_measurements` (`body_build`,`measurement_fit`);--> statement-breakpoint
CREATE INDEX `artist_measurements_height` ON `artist_measurements` (`height_inches`);

CREATE TRIGGER profiles_measurements_insert AFTER INSERT ON profiles BEGIN
  INSERT INTO artist_measurements
  SELECT NEW.id,
    coalesce(json_extract(NEW.document, '$.measurementFit'), ''),
    coalesce(json_extract(NEW.document, '$.bodyBuild'), ''),
    CASE WHEN nullif(json_extract(NEW.document, '$.heightFeet'), '') IS NOT NULL
      THEN cast(json_extract(NEW.document, '$.heightFeet') AS INTEGER) * 12 + cast(coalesce(nullif(json_extract(NEW.document, '$.heightInches'), ''), '0') AS INTEGER) END,
    cast(nullif(json_extract(NEW.document, '$.weight'), '') AS REAL),
    cast(nullif(json_extract(NEW.document, '$.chest'), '') AS REAL),
    cast(nullif(json_extract(NEW.document, '$.bust'), '') AS REAL),
    cast(nullif(json_extract(NEW.document, '$.waist'), '') AS REAL),
    cast(nullif(json_extract(NEW.document, '$.hip'), '') AS REAL);
END;
CREATE TRIGGER profiles_measurements_update AFTER UPDATE ON profiles BEGIN
  DELETE FROM artist_measurements WHERE artist_id = NEW.id;
  INSERT INTO artist_measurements
  SELECT NEW.id,
    coalesce(json_extract(NEW.document, '$.measurementFit'), ''),
    coalesce(json_extract(NEW.document, '$.bodyBuild'), ''),
    CASE WHEN nullif(json_extract(NEW.document, '$.heightFeet'), '') IS NOT NULL
      THEN cast(json_extract(NEW.document, '$.heightFeet') AS INTEGER) * 12 + cast(coalesce(nullif(json_extract(NEW.document, '$.heightInches'), ''), '0') AS INTEGER) END,
    cast(nullif(json_extract(NEW.document, '$.weight'), '') AS REAL),
    cast(nullif(json_extract(NEW.document, '$.chest'), '') AS REAL),
    cast(nullif(json_extract(NEW.document, '$.bust'), '') AS REAL),
    cast(nullif(json_extract(NEW.document, '$.waist'), '') AS REAL),
    cast(nullif(json_extract(NEW.document, '$.hip'), '') AS REAL);
END;
CREATE TRIGGER profiles_measurements_delete AFTER DELETE ON profiles BEGIN
  DELETE FROM artist_measurements WHERE artist_id = OLD.id;
END;

UPDATE profiles SET document = document;
