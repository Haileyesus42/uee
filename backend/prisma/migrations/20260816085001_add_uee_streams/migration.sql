-- CreateEnum
CREATE TYPE "Stream" AS ENUM ('natural', 'social');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "stream" "Stream";

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "streams" "Stream"[] DEFAULT ARRAY[]::"Stream"[];

-- CreateIndex
CREATE INDEX "questions_subjectId_stream_examYear_idx" ON "questions"("subjectId", "stream", "examYear");
