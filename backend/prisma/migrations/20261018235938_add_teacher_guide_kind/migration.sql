-- CreateEnum
CREATE TYPE "TextbookSectionKind" AS ENUM ('TEXTBOOK', 'TEACHER_GUIDE');

-- DropIndex
DROP INDEX "textbook_sections_subjectId_grade_order_idx";

-- DropConstraint (unique constraint, not a bare index — DROP INDEX can't remove it)
ALTER TABLE "textbook_sections" DROP CONSTRAINT "textbook_sections_subjectId_grade_order_key";

-- AlterTable
ALTER TABLE "textbook_sections" ADD COLUMN     "kind" "TextbookSectionKind" NOT NULL DEFAULT 'TEXTBOOK';

-- AlterTable
ALTER TABLE "user_reading_progress" DROP CONSTRAINT "user_reading_progress_pkey",
ADD COLUMN     "kind" "TextbookSectionKind" NOT NULL DEFAULT 'TEXTBOOK',
ADD CONSTRAINT "user_reading_progress_pkey" PRIMARY KEY ("userId", "subjectId", "kind");

-- CreateIndex
CREATE INDEX "textbook_sections_subjectId_grade_kind_order_idx" ON "textbook_sections"("subjectId", "grade", "kind", "order");

-- CreateIndex
CREATE UNIQUE INDEX "textbook_sections_subjectId_grade_kind_order_key" ON "textbook_sections"("subjectId", "grade", "kind", "order");

