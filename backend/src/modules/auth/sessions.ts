import crypto from 'node:crypto';
import { redis } from '../../lib/redis';

const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

function sessionKey(userId: string) {
  return `session:refresh:${userId}`;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Storing a hash of only the *current* refresh token per user is what makes rotation
// meaningful: once a refresh token is used and replaced, presenting the old one again
// (e.g. a stolen, already-used token) no longer matches what's stored.
export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  await redis.set(sessionKey(userId), hashToken(token), 'EX', REFRESH_TOKEN_TTL_SECONDS);
}

export async function isCurrentRefreshToken(userId: string, token: string): Promise<boolean> {
  const stored = await redis.get(sessionKey(userId));
  return stored !== null && stored === hashToken(token);
}

export async function revokeRefreshToken(userId: string): Promise<void> {
  await redis.del(sessionKey(userId));
}
