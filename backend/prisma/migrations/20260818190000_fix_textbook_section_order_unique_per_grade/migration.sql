-- order was only unique per subjectId, which collided as soon as a subject
-- had more than one grade's worth of sections imported (each grade's ingest
-- run numbers its own sections 0..N). Scope uniqueness to subjectId+grade.
DROP INDEX "textbook_sections_subjectId_order_key";
ALTER TABLE "textbook_sections" ADD CONSTRAINT "textbook_sections_subjectId_grade_order_key" UNIQUE ("subjectId", "grade", "order");
