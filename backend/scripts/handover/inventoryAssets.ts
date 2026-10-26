// Phase 4: inventories the asset directories referenced from the database
// (textbook-images, via TextbookSection.blocks image filenames) and the
// ingest-time source directories (books, teacher-guides, exams) that aren't
// referenced by id anywhere in the schema. Read-only; copies nothing.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dataDir = process.argv[2];
const outDir = process.argv[3];
if (!dataDir || !outDir) throw new Error('Usage: tsx inventoryAssets.ts <ai_package/data dir> <out dir>');

const assetsRoot = resolve(__dirname, '../../assets');
const imagesDir = join(assetsRoot, 'textbook-images');

type Block = { type: string; filename?: string };
type SectionRecord = { id: string; subjectId: string; grade: number; kind: string; sectionTitle: string; blocks: Block[] };

function loadSectionChunks(): SectionRecord[] {
  const dir = join(dataDir, 'textbook_sections');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const all: SectionRecord[] = [];
  for (const f of files) {
    const parsed = JSON.parse(readFileSync(join(dir, f), 'utf-8'));
    all.push(...parsed.records);
  }
  return all;
}

function main() {
  const sections = loadSectionChunks();

  const referencedBy = new Map<string, string[]>(); // filename -> [sectionId, ...]
  for (const s of sections) {
    for (const b of s.blocks) {
      if (b.type === 'image' && b.filename) {
        const refs = referencedBy.get(b.filename) ?? [];
        refs.push(s.id);
        referencedBy.set(b.filename, refs);
      }
    }
  }

  const onDisk = new Set(readdirSync(imagesDir));

  const missing: string[] = [];
  const rows: { filename: string; referencedBySectionIds: string[]; existsLocally: boolean; sizeBytes: number | null }[] = [];
  for (const [filename, sectionIds] of referencedBy) {
    const exists = onDisk.has(filename);
    if (!exists) missing.push(filename);
    const sizeBytes = exists ? statSync(join(imagesDir, filename)).size : null;
    rows.push({ filename, referencedBySectionIds: sectionIds, existsLocally: exists, sizeBytes });
  }

  const orphaned = [...onDisk].filter((f) => !referencedBy.has(f));

  writeFileSync(join(outDir, 'textbook_images_inventory.json'), JSON.stringify({
    description: 'Every image filename referenced by a TextbookSection block, cross-checked against assets/textbook-images/ on disk.',
    totalReferenced: referencedBy.size,
    totalExistingOnDisk: onDisk.size,
    totalMissing: missing.length,
    missingFilenames: missing,
    totalOrphanedOnDisk: orphaned.length,
    note: 'Orphaned = present on disk but not referenced by any exported TextbookSection block (not necessarily a problem — may belong to a section outside the exported set, or be an intermediate render artifact).',
    records: rows,
  }, null, 2));

  // Ingest-time source directories — not referenced by id anywhere in the
  // schema, just the original scanned material scripts/ingest/ reads from.
  function listFilesRecursive(dir: string, relBase = ''): { name: string; sizeBytes: number }[] {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return [];
    }
    const out: { name: string; sizeBytes: number }[] = [];
    for (const entry of entries) {
      const full = join(dir, entry);
      const rel = relBase ? `${relBase}/${entry}` : entry;
      const st = statSync(full);
      if (st.isDirectory()) out.push(...listFilesRecursive(full, rel));
      else out.push({ name: rel, sizeBytes: st.size });
    }
    return out;
  }

  const sourceDirs = ['books', 'teacher-guides', 'exams'] as const;
  const sourceInventory: Record<string, { fileCount: number; totalSizeBytes: number; files: { name: string; sizeBytes: number }[] }> = {};
  for (const dir of sourceDirs) {
    const files = listFilesRecursive(join(assetsRoot, dir));
    sourceInventory[dir] = {
      fileCount: files.length,
      totalSizeBytes: files.reduce((a, f) => a + f.sizeBytes, 0),
      files,
    };
  }
  writeFileSync(join(outDir, 'source_documents_inventory.json'), JSON.stringify({
    description:
      'Original scanned source PDFs/images under backend/assets/{books,teacher-guides,exams}/. These are NOT referenced by id from any database row — ' +
      'they are ingest-time-only inputs read by scripts/ingest/*.ts when content was first extracted. Kept locally, gitignored, not part of this JSON export.',
    bySourceDir: sourceInventory,
  }, null, 2));

  console.log(`textbook-images: ${referencedBy.size} referenced, ${missing.length} missing, ${orphaned.length} on-disk-but-unreferenced (of ${onDisk.size} total files on disk)`);
  for (const dir of sourceDirs) {
    console.log(`${dir}: ${sourceInventory[dir].fileCount} files, ${(sourceInventory[dir].totalSizeBytes / 1e6).toFixed(1)} MB`);
  }
  if (missing.length > 0) {
    console.log('\nMISSING (referenced by a section but not found on disk):');
    for (const m of missing) console.log(' -', m);
  }
}

main();
