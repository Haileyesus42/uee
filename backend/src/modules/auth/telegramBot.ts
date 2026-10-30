import { env } from '../../env';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { signAccessToken, signRefreshToken } from '../../lib/jwt';
import { storeRefreshToken } from './sessions';
import { consumeLoginToken, storeLoginResult } from './telegramSessions';

const TELEGRAM_API = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

// If a user verified within this window, subsequent /start or /login commands
// still issue a fresh session (the app needs a valid token to poll) but don't
// repeat the "Welcome" message. Prevents chat spam when the app's polling lags
// and the user retries — which is exactly what caused the multi-bubble mess
// in the reported screenshot.
const RECENT_VERIFY_TTL_SECONDS = 120;

type TelegramFrom = {
  id: number;
  username?: string;
  first_name?: string;
  language_code?: string;
  is_premium?: boolean;
};

type TelegramPhotoSize = { file_id: string; width: number; height: number };

export type TelegramUpdate = {
  update_id: number;
  message?: {
    text?: string;
    photo?: TelegramPhotoSize[];
    chat: { id: number };
    from?: TelegramFrom;
  };
};

type ChatFullInfo = {
  photo?: { small_file_id: string; big_file_id: string };
  bio?: string;
  birthdate?: { day: number; month: number; year?: number };
};

export async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function fetchChatFullInfo(telegramId: string): Promise<ChatFullInfo | null> {
  try {
    const res = await fetch(`${TELEGRAM_API}/getChat?chat_id=${telegramId}`);
    const body = (await res.json()) as { ok: boolean; result?: ChatFullInfo; description?: string };
    if (!body.ok || !body.result) {
      console.warn('[telegram] getChat did not return chat info', body.description);
      return null;
    }
    return body.result;
  } catch (err) {
    console.warn('[telegram] getChat request failed', err);
    return null;
  }
}

// Fired by any /start TOKEN (Telegram deep link) or /login TOKEN (menu/manual).
// The login token is single-use — consumeLoginToken atomically deletes it, so
// only one caller per token ever sees `consumed = true`. That already prevents
// duplicate success messages for the SAME attempt. The recent-verify guard
// below handles the SEPARATE case where the user retries with a fresh token
// within a short window (typical when the app's polling lags).
async function handleStartMessage(loginToken: string, from: TelegramFrom, chatId: number) {
  const telegramId = String(from.id);
  const recentKey = `telegram:recently-verified:${telegramId}`;

  const consumed = await consumeLoginToken(loginToken);
  if (!consumed) {
    // Token already used or expired. Two different sub-cases:
    //   - User recently verified → they're already signed in, tell them so
    //     instead of the scarier "expired" message.
    //   - Otherwise → genuine expiry, guide them back to the app.
    const recentlyVerified = await redis.get(recentKey);
    if (recentlyVerified) {
      await sendTelegramMessage(chatId, `✅ You're already signed in! Return to Tizata UEE to continue.`);
    } else {
      await sendTelegramMessage(
        chatId,
        '⚠️ This login link has expired or has already been used.\n\n' +
          'No worries! Return to Tizata UEE and tap Continue with Telegram to start a new login.'
      );
    }
    return;
  }

  const chatInfo = await fetchChatFullInfo(telegramId);

  const profileFields = {
    telegramUsername: from.username ?? undefined,
    languageCode: from.language_code ?? undefined,
    isPremium: from.is_premium ?? undefined,
    avatarFileId: chatInfo?.photo?.big_file_id ?? undefined,
    bio: chatInfo?.bio ?? undefined,
    birthdayDay: chatInfo?.birthdate?.day ?? undefined,
    birthdayMonth: chatInfo?.birthdate?.month ?? undefined,
    birthdayYear: chatInfo?.birthdate?.year ?? undefined,
  };

  let user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        name: from.first_name ?? '',
        stats: { create: {} },
        ...profileFields,
      },
    });
  } else {
    user = await prisma.user.update({ where: { id: user.id }, data: profileFields });
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id, user.tokenVersion);
  await storeRefreshToken(user.id, refreshToken);

  await storeLoginResult(loginToken, {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      name: user.name,
      avatarEmoji: user.avatarEmoji,
      grade: user.grade,
    },
  });

  // One welcome per session. If the user verified within the last
  // RECENT_VERIFY_TTL_SECONDS, they're clearly retrying because the app hasn't
  // picked up the first success yet — silently re-issue the session without
  // spamming another welcome bubble.
  const recentlyVerified = await redis.get(recentKey);
  if (recentlyVerified) return;

  const firstName = from.first_name?.trim();
  const greeting = firstName ? `Hi ${firstName}!` : null;
  const header = greeting ? `✅ ${greeting} Welcome to Tizata UEE.` : '✅ Welcome to Tizata UEE.';

  await sendTelegramMessage(
    chatId,
    `${header}\n\n` +
      `You've successfully logged in. You can now return to the app and continue learning.\n\n` +
      `Happy studying! 🎓`
  );

  await redis.setex(recentKey, RECENT_VERIFY_TTL_SECONDS, '1');
}

// Fires for any photo message from an already-registered chat. Unchanged from
// prior behavior — sending a photo still saves it and confirms. This is a
// separate flow from login and doesn't affect the success-message count.
async function handlePhotoMessage(photo: TelegramPhotoSize[], from: TelegramFrom, chatId: number) {
  const telegramId = String(from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return;

  const largest = photo[photo.length - 1];
  const file = await fetchTelegramFile(largest.file_id);
  if (!file) {
    await sendTelegramMessage(chatId, "Couldn't fetch that photo — mind trying again?");
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUpload: file.buffer, avatarUploadType: file.contentType },
  });
  await sendTelegramMessage(chatId, '✅ Profile picture saved!');
}

export async function fetchTelegramFile(fileId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    const fileBody = (await fileRes.json()) as { ok: boolean; result?: { file_path?: string } };
    if (!fileBody.ok || !fileBody.result?.file_path) return null;

    const downloadUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileBody.result.file_path}`;
    const imageRes = await fetch(downloadUrl);
    if (!imageRes.ok) return null;

    const rawContentType = imageRes.headers.get('content-type');
    const contentType = rawContentType?.startsWith('image/') ? rawContentType : 'image/jpeg';
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    return { buffer, contentType };
  } catch (err) {
    console.warn('[telegram] failed to fetch file', err);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function processUpdate(update: TelegramUpdate): void {
  const message = update.message;
  if (!message?.from) return;

  if (message.photo?.length) {
    handlePhotoMessage(message.photo, message.from, message.chat.id).catch((err) =>
      console.error('[telegram] failed to handle photo', err)
    );
    return;
  }

  const text = message.text;
  if (!text) return;

  // Accept both /start TOKEN and /login TOKEN. The deep link from the app's
  // "Continue with Telegram" button always sends /start TOKEN (Telegram
  // platform constraint). /login is also accepted so manual entry and bot-menu
  // commands work — the difference is invisible to the user either way.
  // The optional @botname suffix handles the group-chat variant, though this
  // bot is primarily DM-only.
  const authMatch = text.match(/^\/(?:start|login)(?:@[A-Za-z0-9_]+)?\s+(\S+)/);
  if (authMatch) {
    handleStartMessage(authMatch[1], message.from, message.chat.id).catch((err) =>
      console.error('[telegram] failed to handle auth command', err)
    );
    return;
  }

  // Bare /start or /login without a token — guide the user back to the app.
  // Users who tap the bot's menu command (rather than the app's deep link)
  // land here and need a clear next step.
  if (/^\/(?:start|login)(?:@[A-Za-z0-9_]+)?\s*$/.test(text)) {
    sendTelegramMessage(
      message.chat.id,
      '👋 To sign in, open Tizata UEE and tap "Continue with Telegram". We\'ll send you a login link here.'
    ).catch((err) => console.error('[telegram] failed to send help message', err));
    return;
  }
}

let polling = false;

const POLL_BACKOFF_MIN_MS = 3000;
const POLL_BACKOFF_MAX_MS = 60_000;

export async function startTelegramPolling(): Promise<void> {
  if (polling) return;
  polling = true;

  let offset = 0;
  let backoffMs = POLL_BACKOFF_MIN_MS;
  let warnedUnreachable = false;
  console.log('[telegram] bot polling started');

  while (polling) {
    try {
      const allowedUpdates = encodeURIComponent(JSON.stringify(['message']));
      const res = await fetch(`${TELEGRAM_API}/getUpdates?timeout=30&offset=${offset}&allowed_updates=${allowedUpdates}`);

      if (!res.ok) {
        console.error('[telegram] getUpdates failed', res.status, await res.text());
        await sleep(3000);
        continue;
      }

      backoffMs = POLL_BACKOFF_MIN_MS;
      warnedUnreachable = false;

      const body = (await res.json()) as { ok: boolean; result: TelegramUpdate[] };
      for (const update of body.result) {
        offset = update.update_id + 1;
        processUpdate(update);
      }
    } catch (err) {
      const code = (err as { cause?: { code?: string } })?.cause?.code;
      if (!warnedUnreachable) {
        console.warn(
          `[telegram] cannot reach api.telegram.org (${code ?? (err as Error).message}) — Telegram login is ` +
            'unavailable from this process. Check outbound network/DNS, or set TELEGRAM_POLLING_ENABLED=false. ' +
            `Retrying with backoff up to ${POLL_BACKOFF_MAX_MS / 1000}s.`
        );
        warnedUnreachable = true;
      }
      console.warn(`[telegram] polling error (${code ?? 'unknown'}), retrying in ${backoffMs / 1000}s`);
      await sleep(backoffMs);
      backoffMs = Math.min(backoffMs * 2, POLL_BACKOFF_MAX_MS);
    }
  }
}

export function stopTelegramPolling(): void {
  polling = false;
}