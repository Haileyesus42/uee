import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExtractedLessonStepBatchSchema } from './schemas';

const DIR = join(__dirname, 'output');
const files = readdirSync(DIR).filter((f) => f.startsWith('lesson-') && f.endsWith('.json'));

let ok = 0;
let bad = 0;
let notAllReviewed = 0;

for (const f of files) {
  const raw = JSON.parse(readFileSync(join(DIR, f), 'utf-8'));
  const result = ExtractedLessonStepBatchSchema.safeParse(raw);
  if (!result.success) {
    bad += 1;
    console.log(`FAIL ${f}: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    continue;
  }
  const allReviewed = result.data.every((s) => s.reviewed);
  if (!allReviewed) {
    notAllReviewed += 1;
    console.log(`NOT-ALL-REVIEWED ${f}`);
  }
  ok += 1;
}

console.log(`\n${files.length} files checked: ${ok} schema-valid, ${bad} failed, ${notAllReviewed} not fully reviewed.`);
