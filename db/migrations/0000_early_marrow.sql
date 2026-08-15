CREATE TABLE `documents` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`docType` varchar(60) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`sizeBytes` int NOT NULL,
	`data` longblob NOT NULL,
	`status` enum('pending','in_review','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `documents_user_doctype_uniq` UNIQUE(`userId`,`docType`)
);
--> statement-breakpoint
CREATE TABLE `email_reminders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`kind` varchar(60) NOT NULL,
	`refKey` varchar(120) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_reminders_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_reminders_uniq` UNIQUE(`userId`,`kind`,`refKey`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`kind` varchar(60) NOT NULL,
	`payload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`whatsapp` varchar(30) NOT NULL,
	`lgpdConsent` boolean NOT NULL,
	`source` enum('simulator','quiz','site') NOT NULL,
	`uf` char(2),
	`quizAnswers` json,
	`eligibilityResult` json,
	`referredBy` varchar(255),
	`status` enum('new','contacted','converted','lost') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `process_stages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`processId` bigint unsigned NOT NULL,
	`stageKey` varchar(40) NOT NULL,
	`status` enum('pending','in_progress','waiting_org','waiting_user','done','blocked') NOT NULL DEFAULT 'pending',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `process_stages_id` PRIMARY KEY(`id`),
	CONSTRAINT `process_stages_process_stage_uniq` UNIQUE(`processId`,`stageKey`)
);
--> statement-breakpoint
CREATE TABLE `processes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`uf` char(2),
	`currentStage` varchar(40) NOT NULL DEFAULT 'descoberta',
	`paidAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`userId` bigint unsigned NOT NULL,
	`cpf` varchar(11),
	`telefone` varchar(30),
	`uf` char(2),
	`disabilityType` varchar(40),
	`isDriver` boolean,
	`cnhSpecial` boolean,
	`laudoInfo` json,
	`condutoresInfo` json,
	`endereco` json,
	`intendedVehicleId` bigint unsigned,
	`purchaseDate` date,
	`plateFinalDigit` tinyint,
	`formStep` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`referredBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`categoria` varchar(60) NOT NULL,
	`precoCentavos` int NOT NULL,
	`combustivel` enum('flex','gasolina','diesel','eletrico','hibrido') NOT NULL,
	`adaptacao` boolean NOT NULL DEFAULT false,
	`imagem` varchar(255) NOT NULL,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_reminders` ADD CONSTRAINT `email_reminders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `process_stages` ADD CONSTRAINT `process_stages_processId_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `processes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `processes` ADD CONSTRAINT `processes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_intendedVehicleId_vehicles_id_fk` FOREIGN KEY (`intendedVehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `documents_user_idx` ON `documents` (`userId`);--> statement-breakpoint
CREATE INDEX `email_reminders_user_idx` ON `email_reminders` (`userId`);--> statement-breakpoint
CREATE INDEX `events_user_idx` ON `events` (`userId`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `leads_uf_idx` ON `leads` (`uf`);--> statement-breakpoint
CREATE INDEX `process_stages_process_idx` ON `process_stages` (`processId`);--> statement-breakpoint
CREATE INDEX `processes_user_idx` ON `processes` (`userId`);--> statement-breakpoint
CREATE INDEX `users_referred_by_idx` ON `users` (`referredBy`);