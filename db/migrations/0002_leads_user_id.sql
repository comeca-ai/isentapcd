ALTER TABLE `leads` ADD COLUMN `userId` bigint unsigned NULL;
CREATE INDEX `leads_user_idx` ON `leads` (`userId`);
