CREATE TYPE "AnswerSource" AS ENUM ('official', 'derived');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "answerSource" "AnswerSource";

