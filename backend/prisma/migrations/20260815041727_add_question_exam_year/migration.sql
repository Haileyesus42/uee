-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "examYear" INTEGER;

-- CreateIndex
CREATE INDEX "questions_subjectId_examYear_idx" ON "questions"("subjectId", "examYear");
