CREATE TABLE `reply_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reply_id` integer NOT NULL,
	`language` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`reply_id`) REFERENCES `replies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reply_translations_reply_id_idx` ON `reply_translations` (`reply_id`);--> statement-breakpoint
CREATE INDEX `reply_translations_language_idx` ON `reply_translations` (`language`);