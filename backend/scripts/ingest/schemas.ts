import { z } from 'zod';

// Every extracted item starts unreviewed — importReviewed.ts refuses to write
// anything where reviewed !== true. Accuracy matters more here than anywhere else
// in the app (a wrong answer key on a UEE past paper is a real harm to a student
// studying from it), so nothing reaches Postgres without a human having opened the
// output file and flipped this flag.
const reviewFields = {
  reviewed: z.boolean().default(false),
  confidence: z.enum(['high', 'low']).default('high'),
  sourcePage: z.number().int().positive().optional(),
  // Free-text flag for why something needs a closer look — e.g. the source
  // document's own marked answer contradicting its own explanation text.
  note: z.string().optional(),
};

export const ExtractedQuestionSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  // -1 is a deliberate sentinel for "source had no recoverable answer key" (see
  // extractExam.ts) — never a real answer. importReviewed.ts hard-rejects any
  // reviewed:true item where this isn't a valid option index, so -1 can't slip
  // through to the database even if a reviewer misses the low-confidence flag.
  correctIndex: z.number().int().min(-1),
  explanation: z.string().min(1),
  // 'transcribed' = the source paper itself showed a worked solution — verify
  // against the source for typos. 'generated' = the model wrote the explanation
  // itself because the source only had an answer key — verify for correctness,
  // not just transcription accuracy. Review scrutiny should differ accordingly.
  explanationSource: z.enum(['transcribed', 'generated']),
  ...reviewFields,
});
export type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;
export const ExtractedQuestionBatchSchema = z.array(ExtractedQuestionSchema);

// Mirrors the LessonStep union already used by seed.ts and the frontend's
// LessonScreen.tsx — extraction output has to match this exactly to import cleanly.
export const ExtractedLessonStepSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('explanation'), heading: z.string().min(1), body: z.string().min(1), ...reviewFields }),
  z.object({
    type: z.literal('example'),
    heading: z.string().min(1),
    body: z.string().min(1),
    steps: z.array(z.string().min(1)).min(1),
    ...reviewFields,
  }),
  z.object({
    type: z.literal('question'),
    prompt: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(6),
    correctIndex: z.number().int().min(0),
    hint: z.string().min(1),
    explanation: z.string().min(1),
    ...reviewFields,
  }),
]);
export type ExtractedLessonStep = z.infer<typeof ExtractedLessonStepSchema>;
export const ExtractedLessonStepBatchSchema = z.array(ExtractedLessonStepSchema);

// A section's reading content is a sequence of blocks, not a flat string[] —
// needed once real figures (see imageExtract.ts) are interleaved with text,
// since an image can't be represented as a plain paragraph string. heading/
// list/table come from classifyBlocks.ts's PDF-geometry-based document model
// (see that file) instead of arriving as plain text — this is what stops
// bullet lists collapsing into run-on paragraphs and headings from having to
// be re-guessed client-side from text shape.
export const ExtractedContentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string().min(1) }),
  z.object({
    type: z.literal('image'),
    // Served via GET /textbook/images/:filename — not a full URL, just the
    // filename, so the backend's base URL isn't baked into stored content.
    filename: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    caption: z.string().optional(),
  }),
  z.object({ type: z.literal('heading'), level: z.union([z.literal(1), z.literal(2), z.literal(3)]), text: z.string().min(1) }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.string().min(1)).min(1) }),
  z.object({
    type: z.literal('table'),
    rows: z.array(z.array(z.string())).min(1),
    caption: z.string().optional(),
  }),
]);
export type ExtractedContentBlock = z.infer<typeof ExtractedContentBlockSchema>;

// Textbook Study Mode raw content (see extractTextbookSections.ts). No reviewFields
// here deliberately — this is verbatim source text run through deterministic
// cleanup, not LLM-generated structure, so it doesn't carry the same per-item
// accuracy risk the exam/lesson schemas guard against. Review is a whole-file
// eyeball pass before running the import, not a per-item flag.
export const ExtractedTextbookSectionSchema = z.object({
  subject: z.string().min(1),
  grade: z.number().int().positive(),
  unitTitle: z.string().min(1),
  sectionTitle: z.string().min(1),
  order: z.number().int().min(0),
  blocks: z.array(ExtractedContentBlockSchema),
  pageStart: z.number().int().positive(),
  pageEnd: z.number().int().positive(),
});
export type ExtractedTextbookSection = z.infer<typeof ExtractedTextbookSectionSchema>;
export const ExtractedTextbookSectionBatchSchema = z.array(ExtractedTextbookSectionSchema);
