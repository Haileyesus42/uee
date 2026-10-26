import { prisma } from '../../src/lib/prisma';

const HAS_MATH = /\$[^$]+\$/;

async function main() {
  const sections = await prisma.textbookSection.findMany({
    select: { blocks: true, subject: { select: { slug: true } } },
  });

  type Agg = { sections: number; maxMathBlocks: number; maxImageBlocks: number; totalMathBlocks: number };
  const bySubject = new Map<string, Agg>();
  let facsimileCount = 0;

  for (const s of sections) {
    const blocks = (s.blocks as any[]) ?? [];
    const isFacsimile = blocks.length > 0 && blocks.every((b) => b?.type === 'image');
    if (isFacsimile) {
      facsimileCount++;
      continue;
    }
    const mathBlocks = blocks.filter((b) => (b.type === 'text' || b.type === 'heading') && HAS_MATH.test(b.text)).length;
    const imageBlocks = blocks.filter((b) => b.type === 'image').length;
    const slug = s.subject.slug;
    const cur = bySubject.get(slug) ?? { sections: 0, maxMathBlocks: 0, maxImageBlocks: 0, totalMathBlocks: 0 };
    cur.sections++;
    cur.maxMathBlocks = Math.max(cur.maxMathBlocks, mathBlocks);
    cur.maxImageBlocks = Math.max(cur.maxImageBlocks, imageBlocks);
    cur.totalMathBlocks += mathBlocks;
    bySubject.set(slug, cur);
  }

  console.log('facsimile sections (excluded from this breakdown):', facsimileCount);
  console.log('Non-facsimile sections, math/image density by subject:');
  for (const [slug, d] of [...bySubject.entries()].sort((a, b) => b[1].maxMathBlocks - a[1].maxMathBlocks)) {
    console.log(
      `  ${slug}: sections=${d.sections} maxMathBlocksInOneSection=${d.maxMathBlocks} maxImageBlocksInOneSection=${d.maxImageBlocks} avgMathBlocksPerSection=${(d.totalMathBlocks / d.sections).toFixed(1)}`
    );
  }
  await prisma.$disconnect();
}

main();
