-- AlterTable
ALTER TABLE `Note` ADD COLUMN `currency` ENUM('ALL', 'EUR', 'GBP', 'USD') NOT NULL DEFAULT 'EUR';
