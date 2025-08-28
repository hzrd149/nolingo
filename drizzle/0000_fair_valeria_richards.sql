CREATE TABLE `notification_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`new_posts` integer DEFAULT 1 NOT NULL,
	`post_replies` integer DEFAULT 1 NOT NULL,
	`mentions` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preferences_user_id_unique` ON `notification_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_preferences_user_id_idx` ON `notification_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `pictures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`original_url` text NOT NULL,
	`thumbnail_url` text NOT NULL,
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
CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh_key` text NOT NULL,
	`auth_key` text NOT NULL,
	`user_agent` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `push_subscriptions_user_id_idx` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_endpoint_idx` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE TABLE `replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`author` integer NOT NULL,
	`content` text NOT NULL,
	`language` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `replies_post_id_idx` ON `replies` (`post_id`);--> statement-breakpoint
CREATE INDEX `replies_author_idx` ON `replies` (`author`);--> statement-breakpoint
CREATE INDEX `replies_created_at_idx` ON `replies` (`created_at`);--> statement-breakpoint
CREATE TABLE `translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`language` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `translations_post_id_idx` ON `translations` (`post_id`);--> statement-breakpoint
CREATE INDEX `translations_language_idx` ON `translations` (`language`);--> statement-breakpoint
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
	`learning_language` text,
	`last_login` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`picture_id`) REFERENCES `pictures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `users_learning_language_idx` ON `users` (`learning_language`);--> statement-breakpoint
CREATE TABLE `vapid_keys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_key` text NOT NULL,
	`private_key` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vapid_keys_public_key_unique` ON `vapid_keys` (`public_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `vapid_keys_private_key_unique` ON `vapid_keys` (`private_key`);