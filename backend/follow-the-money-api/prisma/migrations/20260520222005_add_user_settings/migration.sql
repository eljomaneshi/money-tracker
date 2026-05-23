-- AlterTable
ALTER TABLE `User` ADD COLUMN `fullName` VARCHAR(191) NULL,
    ADD COLUMN `notifySubscriptionCancelled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifySubscriptionCreated` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifySubscriptionReminder` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `secondCurrency` VARCHAR(191) NULL DEFAULT 'EUR',
    ADD COLUMN `showSecondCurrency` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `totalsMainCurrency` VARCHAR(191) NOT NULL DEFAULT 'ALL';
