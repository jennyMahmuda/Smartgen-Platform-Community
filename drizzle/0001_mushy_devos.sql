CREATE TABLE `community_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(40) NOT NULL,
	CONSTRAINT `community_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `community_badges_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `community_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(40),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `community_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`reactionCount` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`acceptedReplyId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`isAccepted` int NOT NULL DEFAULT 0,
	`reactionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeId` int NOT NULL,
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_user_badges_id` PRIMARY KEY(`id`),
	CONSTRAINT `community_user_badges_unique` UNIQUE(`userId`,`badgeId`)
);
--> statement-breakpoint
CREATE TABLE `community_user_stats` (
	`userId` int NOT NULL,
	`articlesViewed` int NOT NULL DEFAULT 0,
	`reactionsGiven` int NOT NULL DEFAULT 0,
	`solutionsProvided` int NOT NULL DEFAULT 0,
	`problemsFaced` int NOT NULL DEFAULT 0,
	`problemsResolved` int NOT NULL DEFAULT 0,
	`ratingScore` int NOT NULL DEFAULT 0,
	`ratingCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_user_stats_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `contributor_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raterId` int NOT NULL,
	`ratedUserId` int NOT NULL,
	`score` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contributor_ratings_id` PRIMARY KEY(`id`),
	CONSTRAINT `contributor_ratings_pair_unique` UNIQUE(`raterId`,`ratedUserId`)
);
--> statement-breakpoint
CREATE INDEX `community_posts_category_idx` ON `community_posts` (`categoryId`);--> statement-breakpoint
CREATE INDEX `community_posts_author_idx` ON `community_posts` (`authorId`);--> statement-breakpoint
CREATE INDEX `community_posts_created_idx` ON `community_posts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `community_replies_post_idx` ON `community_replies` (`postId`);--> statement-breakpoint
CREATE INDEX `community_replies_author_idx` ON `community_replies` (`authorId`);--> statement-breakpoint
CREATE INDEX `community_user_badges_user_idx` ON `community_user_badges` (`userId`);--> statement-breakpoint
CREATE INDEX `contributor_ratings_rated_idx` ON `contributor_ratings` (`ratedUserId`);