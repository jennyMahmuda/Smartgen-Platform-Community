CREATE TABLE `community_post_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_post_views_id` PRIMARY KEY(`id`),
	CONSTRAINT `community_post_views_unique` UNIQUE(`userId`,`postId`)
);
--> statement-breakpoint
CREATE TABLE `community_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetType` enum('post','reply') NOT NULL,
	`targetId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `community_reactions_unique` UNIQUE(`userId`,`targetType`,`targetId`)
);
--> statement-breakpoint
CREATE INDEX `community_post_views_post_idx` ON `community_post_views` (`postId`);--> statement-breakpoint
CREATE INDEX `community_reactions_target_idx` ON `community_reactions` (`targetType`,`targetId`);