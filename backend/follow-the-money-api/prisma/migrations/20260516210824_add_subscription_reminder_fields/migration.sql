-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `reminder1DaySentFor` DATETIME(3) NULL,
    ADD COLUMN `reminder3DaysSentFor` DATETIME(3) NULL;
