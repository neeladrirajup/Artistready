ALTER TABLE `artist_measurements` ADD `height` text DEFAULT '' NOT NULL;
UPDATE artist_measurements SET height=CAST(height_feet AS TEXT)||' ft '||CAST(coalesce(height_inch_part,0) AS TEXT)||' in' WHERE height_feet IS NOT NULL;
