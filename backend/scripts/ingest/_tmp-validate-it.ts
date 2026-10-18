// TEMPORARY, read-only helper for the information-technology content pass.
// Validates lesson-*.json output files against ExtractedLessonStepBatchSchema
// without touching the database. Delete when the content pass is done.
// Usage: npx tsx scripts/ingest/_tmp-validate-it.ts <file1> <file2> ...
import { readFileSync } from 'node:fs';
import { ExtractedLessonStepBatchSchema } from './schemas';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: npx tsx scripts/ingest/_tmp-validate-it.ts <file1.json> [file2.json ...]');
  process.exit(1);
}

let ok = 0;
let fail = 0;
for (const f of files) {
  try {
    const raw = JSON.parse(readFileSync(f, 'utf-8'));
    const parsed = ExtractedLessonStepBatchSchema.parse(raw);
    const types = parsed.map((s) => s.type).join(',');
    const allReviewed = parsed.every((s) => s.reviewed === true);
    const qCount = parsed.filter((s) => s.type === 'question').length;
    const expCount = parsed.filter((s) => s.type === 'explanation').length;
    const exCount = parsed.filter((s) => s.type === 'example').length;
    const shapeOk = parsed.length === 4 && expCount === 1 && exCount === 1 && qCount === 2;
    // Sanity-check every question's correctIndex is in range (importReviewed.ts
    // checks this too, but catching it here is cheaper than a failed import).
    const badIndex = parsed.some((s) => s.type === 'question' && (s.correctIndex < 0 || s.correctIndex >= s.options.length));
    if (!allReviewed || !shapeOk || badIndex) {
      console.log(`WARN  ${f}: reviewed=${allReviewed} shape=${shapeOk}(${types}) badIndex=${badIndex}`);
      fail += 1;
    } else {
      console.log(`OK    ${f}: ${types}`);
      ok += 1;
    }
  } catch (err) {
    console.log(`FAIL  ${f}: ${(err as Error).message}`);
    fail += 1;
  }
}
console.log(`\n${ok} ok, ${fail} failed/warned, ${files.length} total`);
