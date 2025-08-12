CREATE TABLE `pictures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`original_url` text NOT NULL,
	`thumbnail_url` text NOT NULL,
	`alt_text` text,
	`file_size` integer,
	`width` integer,
	`height` integer,
	`mime_type` text,
	`uploaded_by` integer NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pictures_uploaded_by_idx` ON `pictures` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `pictures_mime_type_idx` ON `pictures` (`mime_type`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author` integer NOT NULL,
	`content` text NOT NULL,
	`picture_id` integer NOT NULL,
	`language` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`author`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`picture_id`) REFERENCES `pictures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `posts_author_idx` ON `posts` (`author`);--> statement-breakpoint
CREATE INDEX `posts_language_idx` ON `posts` (`language`);--> statement-breakpoint
CREATE INDEX `posts_created_at_idx` ON `posts` (`created_at`);--> statement-breakpoint
CREATE TABLE `translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`language` text NOT NULL,
	`translated_content` text NOT NULL,
	`translator_id` integer,
	`is_verified` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`translator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `translations_post_id_idx` ON `translations` (`post_id`);--> statement-breakpoint
CREATE INDEX `translations_language_idx` ON `translations` (`language`);--> statement-breakpoint
CREATE INDEX `translations_translator_idx` ON `translations` (`translator_id`);--> statement-breakpoint
CREATE INDEX `translations_verified_idx` ON `translations` (`is_verified`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`about` text,
	`picture_id` integer,
	`theme` text,
	`custom_css` text,
	`display_name` text,
	`location` text,
	`website` text,
	`last_login` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`picture_id`) REFERENCES `pictures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);