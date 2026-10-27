// A real, local throughput measurement against the actual running dev server
// and actual endpoint code — not a generic industry benchmark. Run once,
// read-only against already-running processes, no app/DB state changes.
import { signAccessToken } from '../../src/lib/jwt';

const BASE = 'http://localhost:4000';

async function runBurst(path: string, token: string | null, concurrency: number, totalRequests: number) {
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const latencies: number[] = [];
  let completed = 0;
  let errors = 0;

  const start = performance.now();
  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const reqStart = performance.now();
      try {
        const res = await fetch(`${BASE}${path}`, { headers });
        await res.arrayBuffer();
        if (!res.ok) errors++;
      } catch {
        errors++;
      }
      latencies.push(performance.now() - reqStart);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const elapsedSec = (performance.now() - start) / 1000;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  console.log(
    `${path} | concurrency=${concurrency} | ${totalRequests} reqs in ${elapsedSec.toFixed(2)}s | ` +
      `${(totalRequests / elapsedSec).toFixed(1)} req/sec | p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms p99=${p99.toFixed(1)}ms | errors=${errors}`
  );
}

async function main() {
  const userId = process.argv[2];
  if (!userId) throw new Error('Usage: tsx benchmark.ts <userId>');
  const token = signAccessToken(userId);

  // Small, spaced bursts on purpose: the app's own rate limiter (200 req/min/IP,
  // added this session) otherwise 429s most of this traffic since it all comes
  // from one IP — that's real, correct behavior for abuse protection, but it
  // means raw req/sec from a single-origin test undercounts true server
  // capacity. Per-request latency under concurrency is unaffected by it and is
  // the signal that actually matters here.
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  console.log('=== /health (no auth, no DB query) ===');
  await runBurst('/health', null, 1, 20);
  await wait(2000);
  await runBurst('/health', null, 20, 60);

  console.log('\n=== /subjects (authenticated, real DB query: subjects+units+lessons+progress+groupBy x2) ===');
  await wait(2000);
  await runBurst('/subjects', token, 1, 20);
  await wait(2000);
  await runBurst('/subjects', token, 20, 60);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
