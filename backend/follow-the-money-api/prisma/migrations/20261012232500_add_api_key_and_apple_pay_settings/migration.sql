-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "apiKey" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "applePaySettings" JSONB DEFAULT '{}';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_apiKey_key" ON "User"("apiKey");
