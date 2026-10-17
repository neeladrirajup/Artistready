CREATE TABLE `artist_preferences` (
	`artist_id` text PRIMARY KEY NOT NULL,
	`document` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
