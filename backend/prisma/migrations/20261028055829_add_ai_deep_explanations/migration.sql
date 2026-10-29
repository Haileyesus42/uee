-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "aiDeepExplanation" TEXT,
ADD COLUMN     "aiDeepExplanationAt" TIMESTAMP(3),
ADD COLUMN     "aiFollowUps" JSONB,
ADD COLUMN     "aiFollowUpsAt" TIMESTAMP(3);
