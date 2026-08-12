import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  SMS_PROVIDER: z.enum(['console', 'africastalking']).default('console'),
  PAYMENT_PROVIDER: z.enum(['mock', 'chapa']).default('mock'),
  CHAPA_SECRET_KEY: z.string().optional().default(''),
  DEEPSEEK_API_KEY: z.string().optional().default(''),
});

export const env = envSchema.parse(process.env);
