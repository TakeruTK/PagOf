CREATE TABLE `pieces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`kind` text NOT NULL,
	`description` text NOT NULL,
	`material` text NOT NULL,
	`price` integer,
	`status` text NOT NULL,
	`availability` text NOT NULL,
	`images` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pieces_status_updated` ON `pieces` (`status`,`updated`);