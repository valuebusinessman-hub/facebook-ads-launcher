CREATE TABLE `ad_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notionPageId` varchar(64) NOT NULL,
	`headline` text NOT NULL,
	`primaryText` text NOT NULL,
	`imageUrl` text,
	`imageHash` varchar(255),
	`targetingJson` json,
	`status` enum('Pending Review','Approved','Rejected','Launched','Failed') NOT NULL DEFAULT 'Pending Review',
	`facebookAdId` varchar(255),
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_drafts_id` PRIMARY KEY(`id`),
	CONSTRAINT `ad_drafts_notionPageId_unique` UNIQUE(`notionPageId`)
);
--> statement-breakpoint
CREATE TABLE `facebook_launches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adDraftId` int NOT NULL,
	`campaignId` varchar(255) NOT NULL,
	`adsetId` varchar(255) NOT NULL,
	`adId` varchar(255) NOT NULL,
	`creativeId` varchar(255) NOT NULL,
	`imageHash` varchar(255),
	`launchStatus` enum('Pending','Success','Failed') NOT NULL DEFAULT 'Pending',
	`errorMessage` text,
	`launchedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facebook_launches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `llm_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adDraftId` int NOT NULL,
	`originalHeadline` text NOT NULL,
	`suggestedHeadline` text NOT NULL,
	`originalText` text NOT NULL,
	`suggestedText` text NOT NULL,
	`reasoning` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `llm_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notion_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`syncStatus` enum('Success','Failed') NOT NULL,
	`draftsFetched` int DEFAULT 0,
	`errorMessage` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notion_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
