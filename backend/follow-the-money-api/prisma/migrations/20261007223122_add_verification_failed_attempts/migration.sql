-- AlterTable
ALTER TABLE "EmailVerificationCode" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PendingEmailChange" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0;
