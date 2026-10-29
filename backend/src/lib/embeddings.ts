import { randomUUID, createHash } from 'node:crypto';
import { prisma } from './prisma';

// Tier-2 retrieval for Unity chat (docs/backend-architecture.md §9). Embeddings
// run locally on CPU via Transformers.js — no hosted embedding API, no extra
// line item in the AI budget, and this is the one piece of "AI" in this stack
// that genuinely costs nothing per call (see the infra report's self-hosting
// comparison for why that reasoning does NOT extend to the generation model).
//
// bge-small-en-v1.5: 384-dim output (matches the ContentEmbedding.embedding
// column's vector(384)), small enough to run inference on a $18/mo droplet's
// CPU without a dedicated GPU/accelerator.
const MODEL_NAME = 'Xenova/bge-small-en-v1.5';

export type EmbeddingSourceType = 'question' | 'lesson_step';

// The transformers.js pipeline loads model weights on first call and is
// expensive to re-create — built once per process, lazily (not at module
// load, so a request that never touches chat never pays this cost), and
// reused for every embed call after that.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embedderPromise: Promise<any> | null = null;
async function getEmbedder() {
  if (!embedderPromise) {
    // Dynamic import: @xenova/transformers ships as ESM-only, and this
    // backend's build target doesn't otherwise need module interop for it.
    embedderPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('feature-extraction', MODEL_NAME)
    );
  }
  return embedderPromise;
}

export async function embedText(text: string): Promise<number[]> {
  const embedder = await getEmbedder();
  // mean pooling + normalize: true gives a single unit-length vector per
  // input, which is what makes pgvector's `<=>` cosine-distance operator
  // (used in findSimilarContent below) a direct similarity measure rather
  // than needing a separate magnitude correction.
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export function hashContent(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

// Upserts by (sourceType, sourceId) — re-embedding the same question/lesson
// step (model upgrade, re-running the batch job) replaces the row rather than
// duplicating it, matching the @@unique constraint on the table.
export async function upsertContentEmbedding(
  sourceType: EmbeddingSourceType,
  sourceId: string,
  contentHash: string,
  embedding: number[]
): Promise<void> {
  const vectorLiteral = toVectorLiteral(embedding);
  await prisma.$executeRaw`
    INSERT INTO content_embeddings (id, "sourceType", "sourceId", "contentHash", embedding, "createdAt")
    VALUES (${randomUUID()}, ${sourceType}::"EmbeddingSourceType", ${sourceId}, ${contentHash}, ${vectorLiteral}::vector, NOW())
    ON CONFLICT ("sourceType", "sourceId")
    DO UPDATE SET "contentHash" = EXCLUDED."contentHash", embedding = EXCLUDED.embedding, "createdAt" = NOW()
  `;
}

// Lets the batch-embedding script skip content whose hash hasn't changed
// since it was last embedded, instead of re-running every row through the
// embedding model on every pass (see scripts/ingest/embedContent.ts).
export async function getExistingContentHash(
  sourceType: EmbeddingSourceType,
  sourceId: string
): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ contentHash: string }[]>`
    SELECT "contentHash" FROM content_embeddings WHERE "sourceType" = ${sourceType}::"EmbeddingSourceType" AND "sourceId" = ${sourceId}
  `;
  return rows[0]?.contentHash ?? null;
}

export type SimilarContentMatch = { sourceType: EmbeddingSourceType; sourceId: string; distance: number };

// Cosine distance (`<=>`, pgvector) — 0 is identical, 2 is maximally
// dissimilar for normalized vectors. No HNSW/IVFFlat index: at this content
// scale (low thousands of rows — see the infra report's content-volume
// measurement), an exact brute-force scan is fast enough that a tuned
// approximate index would be complexity with no measured benefit yet.
export async function findSimilarContent(queryEmbedding: number[], limit = 3): Promise<SimilarContentMatch[]> {
  const vectorLiteral = toVectorLiteral(queryEmbedding);
  return prisma.$queryRaw<SimilarContentMatch[]>`
    SELECT "sourceType", "sourceId", (embedding <=> ${vectorLiteral}::vector) AS distance
    FROM content_embeddings
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;
}
