-- AlterTable
ALTER TABLE `Account` ADD COLUMN `baseCurrency` ENUM('ALL', 'EUR', 'GBP', 'USD') NOT NULL DEFAULT 'EUR';
