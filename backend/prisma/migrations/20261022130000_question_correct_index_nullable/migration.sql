-- Questions published without an answer key are kept but never scored.
ALTER TABLE "questions" ALTER COLUMN "correctIndex" DROP NOT NULL;
