import crypto from 'node:crypto';
import { redis } from '../../lib/redis';

const LOGIN_TOKEN_TTL_SECONDS = 5 * 60; // deep link is only valid for 5 minutes
const RESULT_TTL_SECONDS = 2 * 60; // app has 2 minutes to poll and pick up the result

function pendingKey(token: string) {
  return `telegram:login:pending:${token}`;
}
function resultKey(token: string) {
  return `telegram:login:result:${token}`;
}

export type TelegramLoginResult = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; telegramId: string; telegramUsername: string | null; name: string; avatarEmoji: string; grade: number };
};

// One random, unguessable token per login attempt — this is what ties the app's
// "waiting for confirmation" poll to the specific /start message the bot receives.
export async function createLoginToken(): Promise<string> {
  const token = crypto.randomBytes(24).toString('base64url');
  await redis.set(pendingKey(token), '1', 'EX', LOGIN_TOKEN_TTL_SECONDS);
  return token;
}

export async function consumeLoginToken(token: string): Promise<boolean> {
  // DEL returns the number of keys removed — using that as the "was it actually
  // pending" check makes this atomically single-use, so a replayed /start with
  // the same token (or two bot instances racing) can't double-consume it.
  const removed = await redis.del(pendingKey(token));
  return removed === 1;
}

export async function storeLoginResult(token: string, result: TelegramLoginResult): Promise<void> {
  await redis.set(resultKey(token), JSON.stringify(result), 'EX', RESULT_TTL_SECONDS);
}

export async function takeLoginResult(token: string): Promise<TelegramLoginResult | null> {
  const raw = await redis.get(resultKey(token));
  if (!raw) return null;
  return JSON.parse(raw) as TelegramLoginResult;
}
