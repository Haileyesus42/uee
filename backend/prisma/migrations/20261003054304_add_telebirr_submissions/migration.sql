-- CreateEnum
CREATE TYPE "TelebirrSubmissionStatus" AS ENUM ('approved', 'rejected', 'needs_review');

-- CreateTable
CREATE TABLE "telebirr_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "priceETB" INTEGER NOT NULL,
    "screenshot" BYTEA NOT NULL,
    "screenshotType" TEXT NOT NULL,
    "screenshotHash" TEXT NOT NULL,
    "extractedRef" TEXT,
    "extractedAmountETB" DOUBLE PRECISION,
    "extractedReceiver" TEXT,
    "rawExtraction" JSONB,
    "status" "TelebirrSubmissionStatus" NOT NULL,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telebirr_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telebirr_submissions_screenshotHash_key" ON "telebirr_submissions"("screenshotHash");

-- CreateIndex
CREATE INDEX "telebirr_submissions_userId_idx" ON "telebirr_submissions"("userId");

-- CreateIndex
CREATE INDEX "telebirr_submissions_extractedRef_idx" ON "telebirr_submissions"("extractedRef");

-- AddForeignKey
ALTER TABLE "telebirr_submissions" ADD CONSTRAINT "telebirr_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

