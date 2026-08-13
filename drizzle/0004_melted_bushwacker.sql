CREATE TABLE `email_login_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_login_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_login_tokens_token_hash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `email_login_tokens_email_idx` ON `email_login_tokens` (`email`);