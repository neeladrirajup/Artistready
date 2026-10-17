CREATE TABLE `verified_managers` (
	`account_id` text PRIMARY KEY NOT NULL,
	`verified_at` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
