-- CreateTable
CREATE TABLE "textbook_sections" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "unitTitle" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "paragraphs" JSONB NOT NULL,
    "pageStart" INTEGER NOT NULL,
    "pageEnd" INTEGER NOT NULL,
    "lessonId" TEXT,

    CONSTRAINT "textbook_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_highlights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "paragraphIndex" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reading_progress" (
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "paragraphIndex" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reading_progress_pkey" PRIMARY KEY ("userId","subjectId")
);

-- CreateIndex
CREATE INDEX "textbook_sections_subjectId_grade_order_idx" ON "textbook_sections"("subjectId", "grade", "order");

-- CreateIndex
CREATE UNIQUE INDEX "textbook_sections_subjectId_order_key" ON "textbook_sections"("subjectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "user_bookmarks_userId_sectionId_key" ON "user_bookmarks"("userId", "sectionId");

-- CreateIndex
CREATE INDEX "user_highlights_userId_sectionId_idx" ON "user_highlights"("userId", "sectionId");

-- AddForeignKey
ALTER TABLE "textbook_sections" ADD CONSTRAINT "textbook_sections_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "textbook_sections" ADD CONSTRAINT "textbook_sections_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "textbook_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_highlights" ADD CONSTRAINT "user_highlights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_highlights" ADD CONSTRAINT "user_highlights_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "textbook_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reading_progress" ADD CONSTRAINT "user_reading_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
