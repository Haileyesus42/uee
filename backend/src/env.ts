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
  // Optional at the schema level so the server can still boot (and the rest of the
  // API stay usable) before a bot token exists — server.ts logs a clear warning and
  // skips starting the polling loop when either is missing, rather than crashing.
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_BOT_USERNAME: z.string().optional().default(''),
  // Long-polling starts when a token is configured, but dev environments often
  // have no outbound access to api.telegram.org (containers, CI, restricted
  // networks). Turning this off keeps the API fully usable while Telegram login
  // is simply unavailable; set TELEGRAM_POLLING_ENABLED=false.
  TELEGRAM_POLLING_ENABLED: z.preprocess(
    (v) => (typeof v === 'string' ? !['false', '0', 'no', 'off'].includes(v.toLowerCase()) : v),
    z.boolean().default(true)
  ),
  // Alternative to polling once real multi-instance hosting exists — see
  // /auth/telegram/webhook in modules/auth/routes.ts and setWebhook's `secret_token`
  // param (api.telegram.org/bot<token>/setWebhook). Left unset, the webhook route
  // still exists but rejects every request (no secret to check incoming requests
  // against), so it's inert until deliberately configured — never an accidental
  // open endpoint.
  TELEGRAM_WEBHOOK_SECRET: z.string().optional().default(''),
  PAYMENT_PROVIDER: z.enum(['mock', 'chapa']).default('mock'),
  CHAPA_SECRET_KEY: z.string().optional().default(''),
  // Publicly reachable base URL for this server — Chapa's webhook is a
  // server-to-server call, so localhost only works behind a tunnel (ngrok/
  // cloudflared) in dev. Required to build callback_url when PAYMENT_PROVIDER=chapa;
  // ChapaPaymentProvider throws a clear error at checkout time if it's unset.
  PUBLIC_BASE_URL: z.string().optional().default(''),
  // Manual Telebirr payment (see src/modules/billing/telebirr.ts) — runs alongside
  // PAYMENT_PROVIDER rather than being one of its values, since it's not a
  // redirect/webhook flow: the receiver identity shown to students in-app, and
  // checked against what the submitted screenshot says the money was sent to.
  TELEBIRR_RECEIVER_PHONE: z.string().optional().default(''),
  TELEBIRR_RECEIVER_NAME: z.string().optional().default(''),
  // Shared-secret header for the review/screenshot endpoints — there's no admin
  // *user* in this system, just the solo dev, so a bearer-style secret is enough.
  ADMIN_SECRET: z.string().optional().default(''),
  // Telegram chat id the dev gets pinged at when a Telebirr submission needs manual
  // review (see sendTelegramMessage in modules/auth/telegramBot.ts). Get yours by
  // messaging your own bot once and reading the chat id off the resulting /start
  // update, or via @userinfobot. Left unset, review notifications are just skipped.
  ADMIN_TELEGRAM_CHAT_ID: z.string().optional().default(''),
  DEEPSEEK_API_KEY: z.string().optional().default(''),
  // Used both by content ingestion (backend/scripts/ingest/) and by the live Unity
  // chat endpoint (src/modules/chat/routes.ts). Optional at the schema level so the
  // server can still boot without it — chat replies fail gracefully with a "try
  // again" message rather than crashing (see chatRoutes) when it's unset.
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_VISION_MODEL: z.string().default('meta-llama/llama-4-scout-17b-16e-instruct'),
  GROQ_TEXT_MODEL: z.string().default('llama-3.3-70b-versatile'),
});

export const env = envSchema.parse(process.env);
