ALTER TABLE `users` ADD `learning_language` text;--> statement-breakpoint
CREATE INDEX `users_learning_language_idx` ON `users` (`learning_language`);