import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/authenticate';

type TextContentBlock = { type: 'text'; text: string };
type ImageContentBlock = { type: 'image'; filename: string; width: number; height: number; caption?: string };
type HeadingContentBlock = { type: 'heading'; level: 1 | 2 | 3; text: string };
type ListContentBlock = { type: 'list'; ordered: boolean; items: string[] };
type TableContentBlock = { type: 'table'; rows: string[][]; caption?: string };
type ContentBlock = TextContentBlock | ImageContentBlock | HeadingContentBlock | ListContentBlock | TableContentBlock;

// One flat, searchable string per block, regardless of type — search
// shouldn't go blind on a bullet list or heading just because it isn't a
// plain `text` block.
function blockSearchableText(b: ContentBlock): string | null {
  if (b.type === 'text' || b.type === 'heading') return b.text;
  if (b.type === 'list') return b.items.join(' ');
  if (b.type === 'table') return b.rows.map((row) => row.join(' ')).join(' ');
  return b.caption ?? null;
}

const IMAGES_DIR = resolve(__dirname, '../../../assets/textbook-images');
const IMAGE_MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

const kindParam = z.enum(['textbook', 'teacher_guide']).default('textbook');
const KIND_DB: Record<z.infer<typeof kindParam>, 'TEXTBOOK' | 'TEACHER_GUIDE'> = {
  textbook: 'TEXTBOOK',
  teacher_guide: 'TEACHER_GUIDE',
};
const tocQuery = z.object({ grade: z.coerce.number().int().min(9).max(12).optional(), kind: kindParam });
const searchQuery = z.object({ q: z.string().min(1), kind: kindParam });
const bookmarksQuery = z.object({ subjectId: z.string().optional() });
const bookmarkBody = z.object({ sectionId: z.string() });
const highlightsQuery = z.object({ sectionId: z.string() });
const highlightBody = z.object({ sectionId: z.string(), paragraphIndex: z.number().int().min(0), note: z.string().optional() });
const progressQuery = z.object({ kind: kindParam });
const progressBody = z.object({ sectionId: z.string(), paragraphIndex: z.number().int().min(0), kind: kindParam });

const SNIPPET_RADIUS = 90;

function buildSnippet(paragraph: string, lowerQuery: string): string {
  const matchAt = paragraph.toLowerCase().indexOf(lowerQuery);
  if (matchAt < 0) return paragraph.length > 180 ? `${paragraph.slice(0, 180)}…` : paragraph;
  const start = Math.max(0, matchAt - SNIPPET_RADIUS);
  const end = Math.min(paragraph.length, matchAt + lowerQuery.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < paragraph.length ? '…' : '';
  return `${prefix}${paragraph.slice(start, end)}${suffix}`;
}

export async function textbookRoutes(app: FastifyInstance) {
  // TOC — grouped by unit, in reading order. `grade` narrows to one grade's
  // textbook (a subject can in principle have textbook content for more than
  // one grade later; today only Biology grade 11 has any).
  app.get<{ Params: { subjectId: string } }>(
    '/textbook/:subjectId/toc',
    { preHandler: authenticate },
    async (request) => {
      const { grade, kind } = tocQuery.parse(request.query);
      const sections = await prisma.textbookSection.findMany({
        where: { subjectId: request.params.subjectId, kind: KIND_DB[kind], ...(grade ? { grade } : {}) },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          unitTitle: true,
          sectionTitle: true,
          order: true,
          pageStart: true,
          pageEnd: true,
          // Lets a caller fetch ungraded once and filter client-side across
          // several grades (see LearnHomeScreen's fan-out, fixed this session)
          // instead of re-querying per grade switch.
          grade: true,
        },
      });

      const byUnit = new Map<string, typeof sections>();
      for (const s of sections) {
        const list = byUnit.get(s.unitTitle) ?? [];
        list.push(s);
        byUnit.set(s.unitTitle, list);
      }
      return Array.from(byUnit.entries()).map(([unitTitle, unitSections]) => ({ unitTitle, sections: unitSections }));
    }
  );

  // One section's full reading content, plus prev/next for in-reader navigation
  // and the cross-linked lessonId (null if no matching structured lesson exists).
  app.get<{ Params: { sectionId: string } }>(
    '/textbook/sections/:sectionId',
    { preHandler: authenticate },
    async (request, reply) => {
      const section = await prisma.textbookSection.findUnique({
        where: { id: request.params.sectionId },
        include: { lesson: { select: { unitId: true } } },
      });
      if (!section) return reply.code(404).send({ error: 'Section not found' });

      // Scoped to grade too, not just subject — order is only sequential
      // within one grade's book (a subject can have several grades' worth
      // of sections imported separately), so without this a "next" lookup
      // could jump into a different grade's section that happened to share
      // the same order number.
      const [prev, next] = await Promise.all([
        prisma.textbookSection.findUnique({
          where: {
            subjectId_grade_kind_order: {
              subjectId: section.subjectId,
              grade: section.grade,
              kind: section.kind,
              order: section.order - 1,
            },
          },
          select: { id: true },
        }),
        prisma.textbookSection.findUnique({
          where: {
            subjectId_grade_kind_order: {
              subjectId: section.subjectId,
              grade: section.grade,
              kind: section.kind,
              order: section.order + 1,
            },
          },
          select: { id: true },
        }),
      ]);

      const sectionBlocks = (section.blocks ?? []) as { type?: string }[];

      return {
        id: section.id,
        unitTitle: section.unitTitle,
        sectionTitle: section.sectionTitle,
        blocks: section.blocks,
        // A facsimile section is a run of page images rather than extracted
        // text; clients use this to swap text-only affordances for page
        // navigation.
        isFacsimile: sectionBlocks.length > 0 && sectionBlocks.every((b) => b?.type === 'image'),
        // Page range for this section — the reader needs it to turn a
        // "go to page N" request into a block index.
        pageStart: section.pageStart,
        pageEnd: section.pageEnd,
        lessonId: section.lessonId,
        unitId: section.lesson?.unitId ?? null,
        prevSectionId: prev?.id ?? null,
        nextSectionId: next?.id ?? null,
      };
    }
  );

  // Whether this subject/grade book is a facsimile (page-image) edition.
  // Reads one section's blocks — cheap. The client uses it to decide between
  // text search and page-number navigation.
  app.get<{ Params: { subjectId: string } }>(
    '/textbook/:subjectId/edition',
    { preHandler: authenticate },
    async (request) => {
      const { kind } = tocQuery.parse(request.query);
      const first = await prisma.textbookSection.findFirst({
        where: { subjectId: request.params.subjectId, kind: KIND_DB[kind] },
        orderBy: { order: 'asc' },
        select: { blocks: true },
      });
      const blocks = (first?.blocks ?? []) as { type?: string }[];
      return { facsimile: blocks.length > 0 && blocks.every((b) => b?.type === 'image') };
    }
  );

  // Full-text search within one subject's textbook. Postgres to_tsvector computed
  // at query time (no generated column/index) — fine at this content scale (low
  // hundreds of sections at most), no new infra needed for it. Searching
  // `blocks::text` still works fine even though it now includes image blocks'
  // JSON (filenames, captions) — captions are genuinely searchable text, and the
  // rest is inert noise tsvector just won't match against.
  app.get<{ Params: { subjectId: string } }>(
    '/textbook/:subjectId/search',
    { preHandler: authenticate },
    async (request) => {
      const { q, kind } = searchQuery.parse(request.query);
      const matches = await prisma.$queryRaw<{ id: string; sectionTitle: string; blocks: unknown }[]>`
        SELECT id, "sectionTitle", blocks FROM textbook_sections
        WHERE "subjectId" = ${request.params.subjectId}
        AND kind = ${KIND_DB[kind]}::"TextbookSectionKind"
        AND to_tsvector('english', blocks::text) @@ plainto_tsquery('english', ${q})
        ORDER BY "order" ASC
        LIMIT 30
      `;

      return matches.map((m) => {
        const blocks = m.blocks as ContentBlock[];
        const texts = blocks.map(blockSearchableText).filter((t): t is string => t !== null && t.length > 0);
        const lowerQ = q.toLowerCase();
        const hit = texts.find((t) => t.toLowerCase().includes(lowerQ));
        // Postgres's tsquery match (stemmed — e.g. "termite" matches "termites") can
        // land on a paragraph where the literal query string sits well past the
        // first 180 characters, so the snippet window is centered on the actual
        // match position rather than always starting at 0.
        const snippet = hit ? buildSnippet(hit, lowerQ) : (texts[0]?.slice(0, 180) ?? '');
        return { sectionId: m.id, sectionTitle: m.sectionTitle, snippet };
      });
    }
  );

  // Serves an extracted figure image. `filename` is validated to a bare
  // basename (no path traversal) before touching the filesystem.
  app.get<{ Params: { filename: string } }>('/textbook/images/:filename', async (request, reply) => {
    const filename = basename(request.params.filename);
    const ext = filename.slice(filename.lastIndexOf('.'));
    const mime = IMAGE_MIME[ext];
    if (!mime) return reply.code(400).send({ error: 'Unsupported image type' });

    const fullPath = resolve(IMAGES_DIR, filename);
    try {
      // Streamed, not read fully into memory first — these files run up to
      // ~1MB each and the reader can have several in flight at once
      // (facsimile prefetch keeps ~5 pages warm), so buffering every request
      // means that many full-file allocations held in memory simultaneously
      // for no benefit; a stream only ever holds one chunk at a time.
      const { size } = await stat(fullPath);
      return reply
        .type(mime)
        .header('Cache-Control', 'public, max-age=31536000, immutable')
        .header('Content-Length', size)
        .send(createReadStream(fullPath));
    } catch {
      return reply.code(404).send({ error: 'Image not found' });
    }
  });

  // Bookmarks
  app.get('/textbook/bookmarks', { preHandler: authenticate }, async (request) => {
    const { subjectId } = bookmarksQuery.parse(request.query);
    const bookmarks = await prisma.userBookmark.findMany({
      where: { userId: request.userId, ...(subjectId ? { section: { subjectId } } : {}) },
      include: { section: { select: { sectionTitle: true, unitTitle: true, subjectId: true, kind: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // Lowercased to match the kind value every other textbook endpoint
    // takes/returns (the Prisma enum is uppercase internally only).
    return bookmarks.map((b) => ({
      ...b,
      section: { ...b.section, kind: b.section.kind === 'TEACHER_GUIDE' ? 'teacher_guide' : 'textbook' },
    }));
  });

  app.post('/textbook/bookmarks', { preHandler: authenticate }, async (request, reply) => {
    const { sectionId } = bookmarkBody.parse(request.body);
    const bookmark = await prisma.userBookmark.upsert({
      where: { userId_sectionId: { userId: request.userId, sectionId } },
      create: { userId: request.userId, sectionId },
      update: {},
    });
    return reply.send(bookmark);
  });

  app.delete<{ Params: { id: string } }>('/textbook/bookmarks/:id', { preHandler: authenticate }, async (request, reply) => {
    await prisma.userBookmark.deleteMany({ where: { id: request.params.id, userId: request.userId } });
    return reply.send({ ok: true });
  });

  // Highlights — whole-paragraph granularity, see docs/backend-architecture.md.
  app.get('/textbook/highlights', { preHandler: authenticate }, async (request) => {
    const { sectionId } = highlightsQuery.parse(request.query);
    return prisma.userHighlight.findMany({
      where: { userId: request.userId, sectionId },
      orderBy: { paragraphIndex: 'asc' },
    });
  });

  app.post('/textbook/highlights', { preHandler: authenticate }, async (request, reply) => {
    const { sectionId, paragraphIndex, note } = highlightBody.parse(request.body);
    const highlight = await prisma.userHighlight.create({
      data: { userId: request.userId, sectionId, paragraphIndex, note },
    });
    return reply.send(highlight);
  });

  app.delete<{ Params: { id: string } }>('/textbook/highlights/:id', { preHandler: authenticate }, async (request, reply) => {
    await prisma.userHighlight.deleteMany({ where: { id: request.params.id, userId: request.userId } });
    return reply.send({ ok: true });
  });

  // Reading progress — one row per user+subject, upserted as the reader scrolls.
  app.get<{ Params: { subjectId: string } }>(
    '/textbook/:subjectId/progress',
    { preHandler: authenticate },
    async (request) => {
      const { kind } = progressQuery.parse(request.query);
      const progress = await prisma.userReadingProgress.findUnique({
        where: {
          userId_subjectId_kind: { userId: request.userId, subjectId: request.params.subjectId, kind: KIND_DB[kind] },
        },
      });
      return progress ?? null;
    }
  );

  app.put<{ Params: { subjectId: string } }>(
    '/textbook/:subjectId/progress',
    { preHandler: authenticate },
    async (request, reply) => {
      const { sectionId, paragraphIndex, kind } = progressBody.parse(request.body);
      const progress = await prisma.userReadingProgress.upsert({
        where: {
          userId_subjectId_kind: { userId: request.userId, subjectId: request.params.subjectId, kind: KIND_DB[kind] },
        },
        create: {
          userId: request.userId,
          subjectId: request.params.subjectId,
          kind: KIND_DB[kind],
          sectionId,
          paragraphIndex,
        },
        update: { sectionId, paragraphIndex },
      });
      return reply.send(progress);
    }
  );
}
