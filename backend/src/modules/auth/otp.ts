import bcrypt from 'bcryptjs';
import { redis } from '../../lib/redis';

const OTP_TTL_SECONDS = 5 * 60;
const OTP_LENGTH = 4;
const MAX_REQUESTS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

export class RateLimitedError extends Error {}

function otpKey(phone: string) {
  return `otp:${phone}`;
}
function requestCountKey(phone: string) {
  return `otp:reqcount:${phone}`;
}
function verifyAttemptsKey(phone: string) {
  return `otp:verifyattempts:${phone}`;
}

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  return Math.floor(Math.random() * max).toString().padStart(OTP_LENGTH, '0');
}

export async function issueOtp(phone: string): Promise<string> {
  const requests = await redis.incr(requestCountKey(phone));
  if (requests === 1) await redis.expire(requestCountKey(phone), 60 * 60);
  if (requests > MAX_REQUESTS_PER_HOUR) {
    throw new RateLimitedError('Too many OTP requests — try again later.');
  }

  const code = generateOtpCode();
  const hash = await bcrypt.hash(code, 10);
  await redis.set(otpKey(phone), hash, 'EX', OTP_TTL_SECONDS);
  await redis.del(verifyAttemptsKey(phone));
  return code;
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const attempts = await redis.incr(verifyAttemptsKey(phone));
  if (attempts === 1) await redis.expire(verifyAttemptsKey(phone), OTP_TTL_SECONDS);
  if (attempts > MAX_VERIFY_ATTEMPTS) {
    throw new RateLimitedError('Too many verification attempts — request a new code.');
  }

  const hash = await redis.get(otpKey(phone));
  if (!hash) return false;

  const matches = await bcrypt.compare(code, hash);
  if (matches) {
    await redis.del(otpKey(phone));
    await redis.del(verifyAttemptsKey(phone));
  }
  return matches;
}
