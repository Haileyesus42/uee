// Throwaway validation script — checks generated lesson JSON files against
// ExtractedLessonStepBatchSchema without touching Prisma or the database.
// Deleted immediately after use.
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ExtractedLessonStepBatchSchema } from './schemas';

const dir = join(__dirname, 'output');
const prefix = process.argv[2] || 'lesson-economics-';
const files = readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.json'));

let ok = 0;
let fail = 0;
for (const f of files) {
  const raw = readFileSync(join(dir, f), 'utf-8');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error(`[PARSE FAIL] ${f}:`, e);
    fail++;
    continue;
  }
  const result = ExtractedLessonStepBatchSchema.safeParse(json);
  if (!result.success) {
    console.error(`[SCHEMA FAIL] ${f}:`, JSON.stringify(result.error.issues, null, 2));
    fail++;
    continue;
  }
  const steps = result.data;
  const types = steps.map((s) => s.type).join(',');
  const allReviewed = steps.every((s) => s.reviewed === true);
  const questionCount = steps.filter((s) => s.type === 'question').length;
  const exampleCount = steps.filter((s) => s.type === 'example').length;
  const explanationCount = steps.filter((s) => s.type === 'explanation').length;
  const shapeOk = steps.length === 4 && explanationCount === 1 && exampleCount === 1 && questionCount === 2;
  console.log(
    `[OK] ${f} — types=[${types}] reviewed=${allReviewed} shapeOk=${shapeOk}`,
  );
  // flag bad correctIndex bounds for questions
  for (const s of steps) {
    if (s.type === 'question' && s.correctIndex >= s.options.length) {
      console.error(`  [BAD INDEX] ${f}: correctIndex ${s.correctIndex} >= options.length ${s.options.length}`);
      fail++;
    }
  }
  if (!allReviewed || !shapeOk) fail++;
  else ok++;
}
console.log(`\n${ok} ok, ${fail} failed, ${files.length} total matching "${prefix}"`);
