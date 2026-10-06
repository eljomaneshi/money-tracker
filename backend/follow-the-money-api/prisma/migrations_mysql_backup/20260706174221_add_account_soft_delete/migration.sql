-- AlterTable
ALTER TABLE `Account` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Account_userId_deletedAt_idx` ON `Account`(`userId`, `deletedAt`);
