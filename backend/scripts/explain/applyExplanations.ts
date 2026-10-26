// Writes reviewed explanations (from the pilot/generation forks) into Postgres.
// Only ever touches the `explanation` column, scoped by id — never prompt,
// options, or correctIndex. Guarded: a row is only updated if its current
// explanation still matches what the generator read it as, so a row fixed by
// some other process in the meantime isn't silently clobbered.
//
// Usage:
//   npm run explain:apply -- --file scripts/explain/output/pilot-mathematics.json
//   npm run explain:apply -- --glob "scripts/explain/output/pilot-*.json"
import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ExplanationRow = {
  id: string;
  oldExplanation: string;
  newExplanation: string | null;
  verified: boolean;
};

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function resolveFiles(args: Record<string, string>): Promise<string[]> {
  if (args.file) return [resolve(args.file)];
  if (args.glob) {
    // Minimal glob: only supports "<dir>/<prefix>*<suffix>" as used by the
    // pilot files (pilot-*.json) — not a general glob implementation.
    const pattern = args.glob;
    const dir = dirname(resolve(pattern));
    const base = pattern.split('/').pop()!;
    const [prefix, suffix] = base.split('*');
    const files = await readdir(dir);
    return files
      .filter((f) => f.startsWith(prefix) && f.endsWith(suffix))
      .map((f) => resolve(dir, f));
  }
  throw new Error('Usage: --file <path> OR --glob "<dir>/pilot-*.json"');
}

async function applyFile(path: string) {
  const raw = JSON.parse(await readFile(path, 'utf-8')) as ExplanationRow[];
  let updated = 0;
  let skippedUnverified = 0;
  let skippedGuardMismatch = 0;
  let skippedNoChange = 0;

  for (const row of raw) {
    if (!row.verified || !row.newExplanation) {
      skippedUnverified += 1;
      continue;
    }
    if (row.newExplanation === row.oldExplanation) {
      skippedNoChange += 1;
      continue;
    }

    const result = await prisma.question.updateMany({
      where: { id: row.id, explanation: row.oldExplanation },
      data: { explanation: row.newExplanation },
    });

    if (result.count === 1) {
      updated += 1;
    } else {
      // 0 rows matched — the stored explanation no longer equals oldExplanation,
      // meaning something else changed this row since the generator read it.
      skippedGuardMismatch += 1;
    }
  }

  console.log(
    `${path}: ${updated} updated, ${skippedUnverified} unverified/skipped, ` +
      `${skippedGuardMismatch} guard-mismatch (row changed since read), ${skippedNoChange} no-op`
  );
  return { updated, skippedUnverified, skippedGuardMismatch, skippedNoChange };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = await resolveFiles(args);
  if (files.length === 0) throw new Error('No files matched.');

  const totals = { updated: 0, skippedUnverified: 0, skippedGuardMismatch: 0, skippedNoChange: 0 };
  for (const file of files) {
    const r = await applyFile(file);
    totals.updated += r.updated;
    totals.skippedUnverified += r.skippedUnverified;
    totals.skippedGuardMismatch += r.skippedGuardMismatch;
    totals.skippedNoChange += r.skippedNoChange;
  }

  console.log(
    `\nTotal across ${files.length} file(s): ${totals.updated} updated, ` +
      `${totals.skippedUnverified} unverified, ${totals.skippedGuardMismatch} guard-mismatch, ${totals.skippedNoChange} no-op`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
