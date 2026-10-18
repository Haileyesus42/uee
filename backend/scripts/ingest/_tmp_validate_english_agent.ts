import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ExtractedLessonStepBatchSchema } from './schemas';

const dir = join(__dirname, 'output');
const files = process.argv.slice(2);
const targets = files.length > 0 ? files : readdirSync(dir).filter((f) => f.startsWith('lesson-english-'));

let ok = 0;
let fail = 0;
for (const f of targets) {
  const full = join(dir, f);
  try {
    const raw = JSON.parse(readFileSync(full, 'utf-8'));
    const result = ExtractedLessonStepBatchSchema.safeParse(raw);
    if (!result.success) {
      fail++;
      console.log(`FAIL ${f}`);
      console.log(JSON.stringify(result.error.format(), null, 2));
    } else if (result.data.length !== 4) {
      fail++;
      console.log(`FAIL ${f}: expected 4 steps, got ${result.data.length}`);
    } else {
      const types = result.data.map((s) => s.type);
      const expected = ['explanation', 'example', 'question', 'question'];
      if (JSON.stringify(types) !== JSON.stringify(expected)) {
        fail++;
        console.log(`FAIL ${f}: step type order ${JSON.stringify(types)}, expected ${JSON.stringify(expected)}`);
      } else {
        ok++;
      }
    }
  } catch (e) {
    fail++;
    console.log(`FAIL ${f}: ${e}`);
  }
}
console.log(`\n${ok} passed, ${fail} failed, ${targets.length} total`);
