import { env } from '../../env';
import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken } from '../../lib/jwt';
import { storeRefreshToken } from './sessions';
import { consumeLoginToken, storeLoginResult } from './telegramSessions';

const TELEGRAM_API = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

type TelegramFrom = {
  id: number;
  username?: string;
  first_name?: string;
  language_code?: string;
  is_premium?: boolean;
};

type TelegramPhotoSize = { file_id: string; width: number; height: number };

type TelegramUpdate = {
  update_id: number;
  message?: {
    text?: string;
    photo?: TelegramPhotoSize[];
    chat: { id: number };
    from?: TelegramFrom;
  };
};

// The subset of ChatFullInfo (returned by getChat) we actually use — every field
// here depends on the user's Telegram privacy settings and is commonly absent,
// so all reads of this type must treat every field as possibly missing.
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

// Best-effort only: profile enrichment must never block a login. Privacy settings
// hide most of these fields for most users (bio/birthdate especially), and that's
// expected, not an error.
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

// The deep link t.me/<bot>?start=<token> makes Telegram send "/start <token>" as
// the message text the moment the user taps Start — this is the entire hand-off,
// no webhook or web widget needed. Login and registration are the same flow here
// too: findOrCreate by telegramId, matching the (now-removed) phone+OTP flow's
// "no separate register step" behavior.
async function handleStartMessage(loginToken: string, from: TelegramFrom, chatId: number) {
  const consumed = await consumeLoginToken(loginToken);
  if (!consumed) {
    await sendTelegramMessage(
      chatId,
      "That login link expired or was already used — go back to the Compass app and tap “Continue with Telegram” again."
    );
    return;
  }

  const telegramId = String(from.id);
  const chatInfo = await fetchChatFullInfo(telegramId);

  // `undefined` fields below are left out of the create/update entirely (Prisma's
  // semantics for undefined vs null), so a field we couldn't fetch this time simply
  // keeps whatever value — if any — was captured on a previous login.
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

  await sendTelegramMessage(chatId, "✅ You're verified — return to the Compass app to continue.");
  await sendTelegramMessage(chatId, '📸 Want a profile picture? Send me a photo here anytime and I’ll add it to your account.');
}

// Fires for any photo message from an already-registered chat, not just one
// immediately after /start — the prompt above says "anytime" and means it, so
// this isn't gated on being part of the same conversation turn as registration.
// Silently ignores photos from a chat_id with no user row yet (hasn't sent
// /start at all) rather than inventing registration-before-verification.
async function handlePhotoMessage(photo: TelegramPhotoSize[], from: TelegramFrom, chatId: number) {
  const telegramId = String(from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return;

  // Telegram sends every size it generated, smallest first — the last entry is
  // the highest resolution available.
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

// Deliberately not cached to disk or re-hosted anywhere — Telegram file_ids can go
// stale, so re-resolving via getFile on every request is the correct behavior, not
// just the simplest one. GET /avatars/:userId (see routes.ts) wraps this.
export async function fetchTelegramFile(fileId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    const fileBody = (await fileRes.json()) as { ok: boolean; result?: { file_path?: string } };
    if (!fileBody.ok || !fileBody.result?.file_path) return null;

    const downloadUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileBody.result.file_path}`;
    const imageRes = await fetch(downloadUrl);
    if (!imageRes.ok) return null;

    // Telegram's file CDN often answers with application/octet-stream instead of
    // a real image type — confirmed live, not hypothetical (a captured photo came
    // back this way). Every caller of this function only ever fetches photos
    // (chat photos or message photos, both JPEG — Telegram transcodes every
    // "photo" send to JPEG), so a non-image content-type is always wrong, not a
    // legitimate other format to preserve.
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

let polling = false;

// Long-polling (not a webhook) on purpose: it needs no public HTTPS URL, which
// means it works identically in local dev and in production with zero config
// difference — appropriate for a small team, per the same reasoning as the rest
// of this stack's provider choices.
export async function startTelegramPolling(): Promise<void> {
  if (polling) return;
  polling = true;

  let offset = 0;
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

      const body = (await res.json()) as { ok: boolean; result: TelegramUpdate[] };
      for (const update of body.result) {
        offset = update.update_id + 1;
        const message = update.message;
        if (!message?.from) continue;

        if (message.photo?.length) {
          handlePhotoMessage(message.photo, message.from, message.chat.id).catch((err) =>
            console.error('[telegram] failed to handle photo', err)
          );
          continue;
        }

        const text = message.text;
        if (!text?.startsWith('/start ')) continue;

        const loginToken = text.slice('/start '.length).trim();
        if (!loginToken) continue;

        handleStartMessage(loginToken, message.from, message.chat.id).catch((err) =>
          console.error('[telegram] failed to handle /start', err)
        );
      }
    } catch (err) {
      console.error('[telegram] polling error', err);
      await sleep(3000);
    }
  }
}

export function stopTelegramPolling(): void {
  polling = false;
}
