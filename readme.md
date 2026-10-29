# Tizata UEE — Infrastructure & Profitability Model (Ground-Up Rebuild)

---

## 1. Executive summary

This app has never been deployed and has zero real users, so this report cannot measure real
costs — it builds them up from the actual code, actual official provider prices, and clearly
labeled assumptions, and it replaces the prior version's analysis entirely rather than
adjusting it (§2 audits exactly why).

**Six findings matter more than any individual number in this report:**

1. **A real Launch configuration costs ~$19/month before AI usage** (§7) — not the ~$70/month
   previously guessed — because the database and cache genuinely cost $0 on their real free
   tiers at this app's actual current data volume (~25 MB, §6.0), not because a flattering
   number was picked.
2. **AI inference, not servers, is the dominant cost at every scale this report modeled** —
   65–90%+ of total infrastructure+AI spend in all 18 profitability-matrix cells (§8.2, §8.3).
   This inverts the framing of the prior analysis entirely.
3. **The single biggest unknown — how many messages a "Pro = unlimited" subscriber actually
   sends per day — can swing the same scenario from 86% profit margin to -35% margin** (§8.3).
   No infrastructure optimization closes that gap, because infrastructure was never where the
   cost was concentrated. This is the one number most worth measuring before trusting any
   margin figure in this report.
4. **Higher conversion rate means higher margin at the same paying-subscriber count** (§8.3) —
   because fewer free users ride along per paying customer, subsidized off the same revenue.
5. **This app currently has no CDN or object storage anywhere** — textbook images are served
   from local disk, user photos and payment screenshots are stored directly in Postgres (§3.0).
   Adding Cloudflare R2 would cost $0.05–3.45/month at any modeled scale (§6.3) and is
   recommended from day one for that reason, not because current traffic demands it.
6. **Egress pricing is not geography-neutral, and this matters for an Ethiopia-serving app
   specifically**: Fly.io charges 6× more to serve Africa than North America/Europe, while
   DigitalOcean's overage rate is flat regardless of destination (§9) — a concrete, sourced
   reason to prefer DO for this app's real user base, not a provider preference asserted
   without evidence.

Two real, confirmed (not hypothetical) code inefficiencies were found and quantified (§3.0,
§10): a full-question-bank fetch that moves ~1.1 MB to return 10 rows for English practice
questions, and an unselected database query that pulls full payment-screenshot images on every
4-second status poll during manual review — the second one compounds into hundreds of wasted
fetches per submission under review, confirmed from the frontend's actual polling code. Both
are free to fix; neither materially changes the profitability picture, because (per finding 2)
compute/DB was never where the money was.

Infrastructure-only break-even is never the binding constraint at any modeled scale (§8.4).
Infrastructure+AI break-even is positive under this report's central-case assumptions but
genuinely uncertain, per finding 3. Full-business break-even (salary, support, marketing) is
explicitly left uncosted, per the brief's own instruction — this report has no real expense
data for that tier and will not invent one (§8.4). §11 ranks exactly what to measure first,
and states how to measure each item using data this app's schema already captures.

---

## 2. Methodology, and corrections to the prior analysis

The previous version of this analysis built its cost projections by interpolating between
two assumed anchor points (roughly $70/month at 10,000 users and $400/month at 100,000
users) rather than deriving cost from any specific, named infrastructure component. That
method is discarded here, not adjusted. Every dollar figure in this rebuild is derived from
one of: (a) an official provider pricing page, with the page and verification date stated,
(b) a measurement taken from this codebase or this session's own benchmark, with the
measurement's conditions stated, or (c) an explicitly labeled assumption, given as a range,
not a point estimate.

Ten specific methodological failures in the prior version are corrected as follows:

1. **Two-point extrapolation.** Cost was interpolated between two guessed totals instead of
   being built up from named components (compute + DB + cache + storage + AI + misc). This
   version prices each component separately and sums them.
2. **Database storage treated as the primary cost driver.** Storage is, in fact, one of the
   cheaper line items for this app (see §6) — compute and AI inference dominate at realistic
   usage. This version prices storage from the actual schema and content volume, not from
   assumption.
3. **"Every registered user downloads the whole content library every month."** This was used
   to size CDN/bandwidth cost. §6 instead models realistic repeat-visit and cache-hit
   behavior, and separately flags that no CDN exists in the current codebase at all (see §3).
4. **"Unlimited Pro" read as a known AI request volume.** An entitlement is not a usage number.
   §4 and §6 model Pro-user AI usage as an explicit assumed requests/day distribution with a
   stated range, not as "unlimited = large but unspecified."
5. **Registered users = simultaneous users.** 100,000 registered accounts do not imply 100,000
   concurrent connections at any moment. §4 derives concurrency from DAU and session-timing
   assumptions, explicitly, as its own modeled quantity.
6. **The inverse error — "horizontal scaling means it can handle any concurrency."** Architectural
   scalability (addressed this session: shared-state rate limiting, webhook-mode Telegram
   auth, graceful shutdown — see §3) is a precondition for scaling out, not proof of a specific
   achieved request rate. §5 states plainly what is and is not measured.
7. **Flat per-registered-user infrastructure cost.** A $/registered-user multiplier was applied
   without justifying why N more registered accounts mechanically requires N more compute.
   §6–§7 instead tie each cost component to the *activity* that actually drives it (query
   volume, AI calls, bandwidth), with upgrade triggers tied to measured load, not head count.
8. **Invented foreign-exchange cost line.** No specific forex fee was fabricated. §9 instead
   treats ETB/USD volatility and foreign-card billing availability as sensitivity factors with
   a stated rate range and source.
9. **Unsupported optimization savings figures.** §10 only claims a saving where the calculation
   producing it is shown next to the claim.
10. **Full-business break-even presented at the same confidence as infra break-even.** §8
    separates three break-even tiers explicitly and flags the full-business tier (which would
    need real salary/overhead figures this analysis does not have) as out of scope for a
    specific number.

Everything stated as fact below was re-verified by reading the actual source file in this
session (not recalled from an earlier pass); file paths and line references are given so
each claim can be checked directly.

---

## 3. Verified architecture and traced user journeys

### 3.0 What actually exists today (confirmed by direct code reading, this session)

- **Backend**: Fastify + Prisma + PostgreSQL + Redis, single Node process. Rate limiting
  (`@fastify/rate-limit`, Redis-backed, 200 req/min/IP global + a tighter 20/hour/IP limit on
  `/auth/telegram/start`), graceful SIGTERM/SIGINT shutdown, and a webhook-mode alternative to
  Telegram long-polling all exist and were verified live this session — these remove the three
  single-instance blockers that previously stood between this app and running more than one
  backend process at all. None of this proves a specific throughput number (see §5).
- **No CDN or object storage exists anywhere in this app, for any content type**, confirmed by
  reading every route that serves a binary:
  - Textbook figure images: read from local disk on the backend host and streamed via Node
    (`backend/src/modules/textbook/routes.ts:200-222`, `createReadStream` from
    `backend/assets/textbook-images/`), with a 1-year immutable `Cache-Control` header already
    set — meaning a CDN could be added in front of this with no further code change, but today
    every image request hits the origin Node process and its local disk.
  - User avatar uploads: stored as raw bytes directly in the Postgres `users.avatarUpload`
    column (`backend/prisma/schema.prisma:96`), capped at 8 MB by the global multipart limit
    (`backend/src/server.ts:29`), with no resizing/compression applied before storage.
  - Telebirr payment screenshots: likewise stored as raw bytes directly in Postgres
    (`telebirr_submissions.screenshot`, `schema.prisma:323`), same 8 MB cap, no compression.
  - **Implication for §6–§7**: any CDN/object-storage line item in this report is for a
    *proposed* architecture change, costed as an option, never as current spend. This is a
    meaningfully different (and smaller) category of cost than the prior analysis implied.
- **AI usage is two genuinely separate cost streams**, confirmed from the live `.env` model
  configuration (not just code defaults):
  - Unity chat (text): `openai/gpt-oss-120b` via Groq (`backend/src/lib/groq.ts`,
    `backend/src/modules/chat/routes.ts`). Free users capped at 5 real LLM calls/day
    (`DAILY_FREE_LIMIT`); Pro users uncapped. Each call sends a system prompt + up to 10 prior
    messages (`HISTORY_WINDOW`) as input, capped at 400 output tokens
    (`MAX_RESPONSE_TOKENS`) — but this specific model has been confirmed this session (via a
    raw API response showing `completion_tokens_details.reasoning_tokens`) to bill *hidden*
    reasoning tokens on top of the visible 400-token reply, so effective output-token billing
    exceeds what the visible reply length suggests. This must not be modeled as "400 tokens
    out" — see §6.
  - Telebirr screenshot verification (vision): `qwen/qwen3.8-27b` via Groq
    (`backend/src/lib/groqVision.ts`, `backend/src/modules/billing/telebirr.ts`). One call per
    submission, image sent as inline base64 (≈33% larger than the raw file), capped at 5
    submissions/user/day (`MAX_SUBMISSIONS_PER_DAY`). This is a per-*payment-attempt* cost, not
    a per-user or per-request cost — its volume is bounded by how many people pay via Telebirr,
    not by registered or active user count.
- **Two confirmed database-access inefficiencies** (not hypothetical — read directly in the
  running code), both relevant to §6's compute/DB sizing:
  - `pickQuestions()` and `pickUniqueQuestions()` (`backend/src/modules/practice/routes.ts:45-59`,
    also used as the UEE past-paper fallback in `backend/src/modules/uee/routes.ts:59`) fetch
    **the entire question bank for a subject** (`prisma.question.findMany({ where: { subjectId } })`,
    no `take`/pagination) into Node memory, then shuffle and slice in JavaScript to return as
    few as 10 rows. For the largest subject (English, ~2,500 questions), every single practice
    request transfers the full bank's prompt + options + explanation text from Postgres to
    Node to serve a 10-question page.
  - `GET /billing/telebirr/latest` (`backend/src/modules/billing/telebirr.ts:133-149`) runs
    `prisma.telebirrSubmission.findFirst({ where, orderBy })` with **no `select`**, which pulls
    the full screenshot `Bytes` blob (up to 8 MB) out of Postgres on every call, even though the
    handler only returns five small scalar fields to the client. This fires on every
    payment-status poll from the app.
  - Both are real, fixable-for-free architectural notes, not currently costed as a separate
    line item — their effect is to make the *current* per-request DB load heavier than a
    well-written equivalent would be, which is already reflected in this session's own
    benchmark of a comparably-shaped endpoint (§5), not double-counted separately.
- **Things that do *not* exist in this app**, confirmed by direct search this session, that a
  careful capacity plan must not assume: no school/institution concept or school-scoped
  leaderboard, no offline content-download feature, no push-notification infrastructure
  (no `expo-notifications`/`expo-server-sdk` anywhere — the `Notification` model is purely
  in-app/pull-based). Content is always fetched live per request; there is no "sync the whole
  curriculum to the device" cost and no push-delivery cost to model.
- **One well-implemented pattern worth noting (not everything found was a problem)**: the
  leaderboard (`backend/src/modules/leaderboard/routes.ts`) uses a Redis sorted set
  (`ZREVRANGE`) for ranking, then a single Postgres query scoped to only the top 20 user IDs
  with a narrow `select` — an O(log N) design that will not degrade as the user base grows.
  The Prisma schema also has indexes on essentially every join/filter column actually queried
  (`subjectId`, `userId`, composite keys for ordered lookups), which is why the one measured
  heavy endpoint (§5) stayed fast even before any scaling work this session.

### 3.1 Eleven traced user journeys

Each journey below is traced to the actual endpoint sequence, actual DB operations, and actual
external calls, by reading the route handler code directly (file:line given). These are the
primary journeys feeding the activity-based cost model in §6; two supporting journeys (profile
view, leaderboard view) are noted after the 11 for completeness since they surfaced relevant
findings above.

1. **Registration / login (Telegram deep-link)** — `POST /auth/telegram/start`
   (`auth/routes.ts:28`): Redis INCR+EXPIRE rate check (20/hour/IP), mint one-time login token.
   App opens Telegram; bot receives `/start <token>` (long-polling or webhook, same handler
   either way — `telegramBot.ts:196` `processUpdate`). `handleStartMessage`
   (`telegramBot.ts:69`): consume login token (Redis), one `getChat` call to the Telegram API,
   one `findUnique`+`create`-or-`update` on `User` (Postgres), sign access+refresh JWT, store
   refresh token (Redis), store login result (Redis), send two Telegram messages (external API).
   Meanwhile the app polls `GET /auth/telegram/status/:token` (unauthenticated, one Redis read)
   every **2 seconds exactly** (`AuthProvider.tsx:25`, confirmed from frontend code), capped at
   a **5-minute wall-clock deadline** (`AuthProvider.tsx:26`, ~150 requests ceiling) or until the
   user backs out of the screen, whichever comes first — a real login (switch to Telegram, tap
   Start, switch back) is typically far fewer polls than the cap, but an abandoned attempt can
   run the full ~150. External dependency: Telegram Bot API only.
2. **Session refresh** — `POST /auth/refresh` (`auth/routes.ts:107`): JWT verify (CPU-only), one
   `User.findUnique`, one Redis check (`isCurrentRefreshToken`), one Redis write
   (new refresh token stored). Fires roughly every 15 minutes per open app session
   (`ACCESS_TOKEN_TTL=15m`), independent of what the user is actually doing.
3. **Home / subjects screen** — `GET /subjects` (`curriculum/routes.ts:26`): fetches *all*
   subjects with *all* units with *all* lessons (full curriculum tree, regardless of which
   subjects the user cares about), plus *all* of this user's lesson-progress rows, plus two
   `groupBy` queries across all textbook sections and all questions. This is the exact endpoint
   measured in §5. Its cost scales with total *content* volume, not user count — adding more
   users doesn't make this query heavier, but every single user hits it on every app open.
4. **Unit drill-down and lesson completion** — `GET /subjects/:id/units`
   (`curriculum/routes.ts:65`, also re-fetches this user's *entire* cross-subject progress) →
   `GET /lessons/:id` (`curriculum/routes.ts:97`) → `POST /lessons/:id/progress`
   (`curriculum/routes.ts:118`): one or two progress upserts, a full re-fetch of the subject's
   unit/lesson tree to find "what's next," and one `awardXp` call
   (`lib/gamification.ts:16`: one Postgres transaction containing two writes, plus one Redis
   `ZINCRBY` for the leaderboard).
5. **Practice session** — `GET /practice/questions` (`practice/routes.ts:62`): the confirmed
   full-bank-fetch inefficiency (§3.0). `POST /quiz-attempts` (one insert) →
   `PATCH /quiz-attempts/:id/answers` per question answered (one `Question.findUnique` + one
   upsert each) → `POST /quiz-attempts/:id/submit` (`practice/routes.ts:113`: one attempt fetch
   with nested answers+questions, one update, one `awardXp` transaction).
6. **Full-length mock exam (same subject)** — identical endpoint shape to #5 with
   `mode: 'mock'` and up to 100 questions; same full-bank-fetch cost per request, more
   answer-check round trips per attempt, 8 XP/correct instead of 5.
7. **UEE past-paper exam** — `GET /uee/streams`, `GET /uee/years` (one `distinct` query),
   `GET /uee/:stream/subjects`, `GET /uee/:stream/:year/:subjectId/questions`
   (`uee/routes.ts:42`): tries a narrow, well-scoped query against real archived past-paper
   questions first; falls back to the same full-bank-fetch helper (`pickUniqueQuestions`) when
   no archive exists for that year. `POST /uee/:stream/:year/:subjectId/exam` then follows the
   same attempt/answer/submit cycle as #5.
8. **Textbook Study Mode reading session** — `GET /textbook/:subjectId/toc` (narrow `select`,
   well-scoped) → `GET /textbook/sections/:sectionId` (`textbook/routes.ts:82`: section fetch +
   two neighbor lookups) → `GET /textbook/images/:filename` per embedded figure (local-disk
   stream, §3.0) → `PUT /textbook/:subjectId/progress` fired repeatedly as the reader scrolls →
   optionally `GET /textbook/:subjectId/search` (a `to_tsvector` computed at query time, no
   index — the code's own comment states this is fine only "at this content scale," i.e. low
   hundreds of sections) and the bookmark/highlight CRUD endpoints.
9. **Unity AI chat** — `GET /chat/messages` (`chat/routes.ts:60`, `take: 50`) then
   `POST /chat/messages` (`chat/routes.ts:69`) per turn: one insert (user message), one
   `Subscription.findUnique` (Pro check), one Redis read (free-tier daily counter), if allowed:
   fetch 10 prior messages, **one Groq chat-completion call to `openai/gpt-oss-120b`** (the real
   external cost — see §3.0's reasoning-token caveat), one Redis `INCR`, one insert (assistant
   message).
10. **Subscription purchase — Chapa** — `POST /billing/checkout` (`billing/routes.ts:72`): one
    `User.findUniqueOrThrow`, one external Chapa "initiate checkout" call, one `Subscription`
    upsert. User completes payment on Chapa's own hosted page (not this app's infrastructure).
    Chapa calls back `POST /billing/webhook/chapa` (`billing/routes.ts:26`): signature
    verification, one `Subscription.findUnique`, one external Chapa "verify transaction" call
    (webhook payloads are never trusted on their own), one `Subscription.update`, one
    `Notification.create`. App polls `GET /billing/subscription` every **3 seconds while
    status is `pending`** (`useBilling.ts:14`, confirmed from frontend code), stopping
    automatically once resolved — no cap needed since Chapa's webhook typically resolves this
    in well under a minute.
11. **Subscription purchase — Telebirr (manual)** — `POST /billing/telebirr/submit`
    (`billing/telebirr.ts:151`): multipart upload (≤8 MB), one SHA-256 hash (CPU-only), one
    uniqueness `findUnique`, **one Groq vision call to `qwen/qwen3.8-27b`** with the image
    inline as base64 (≈33% larger than the raw file) — the real external cost, bounded by
    Telebirr-payment attempts, not by user count — one more `findFirst` if the extraction looks
    valid (duplicate transaction-ref check), one `TelebirrSubmission.create` (persists the full
    screenshot permanently in Postgres), and conditionally one `Subscription` upsert +
    `Notification.create` + an admin Telegram alert. `GET /billing/telebirr/latest` is then
    polled every **4 seconds while status is `needs_review`** (`useBilling.ts:44`), with no
    cap other than the screen being open/foregrounded — and carries the confirmed
    full-screenshot-blob-fetch inefficiency from §3.0 on every one of those polls (§10 sizes
    the effect of this precisely).

**Supporting journeys traced for completeness:**
- **Profile view** — `GET /me` (`profile/routes.ts:17` `buildProfilePayload`) runs five
  separate queries: the user row, their stats row, *every* quiz answer they've ever given,
  *every* completed lesson-progress row, and *every* submitted quiz attempt. Unlike journey #3,
  this cost grows with a retained user's **cumulative lifetime activity**, not with content
  size or concurrent load — a different scaling axis worth keeping distinct in §6 (a two-year
  daily user costs more per profile-view than a brand-new one).
- **Leaderboard view** — `GET /leaderboard` (`leaderboard/routes.ts:10`): Redis
  `ZREVRANGE` (O(log N)) plus one narrow Postgres `select` scoped to the top 20 IDs only. Noted
  in §3.0 as a well-implemented pattern, not a cost concern at any realistic scale.

---

## 4. User population model

### 4.1 Why registered ≠ MAU ≠ DAU ≠ paying ≠ concurrent, and how this report connects them

This app has never been deployed to real users, so **none** of the ratios below are measured —
every one is a stated assumption, given as a range, pulled from comparable-category norms
(ed-tech / habit-forming daily-practice apps) and adjusted for one Ethiopia-specific fact that
matters more here than in most markets: the UEE is sat once a year, so usage almost certainly
has a strong academic-calendar seasonality (heavier in the months immediately before the exam,
lighter during school breaks) rather than the flat usage curve a generic "ed-tech benchmark"
would assume. Nothing below should be read as more certain than "a reasoned starting range";
§11 states exactly what real measurement would replace each one.

**The population is built from the paying-subscriber count outward, per the task brief, not
from a registered-user count inward**: for each of the 6 subscriber counts × 3 conversion
rates in §8, `Total registered users = Paying subscribers ÷ Conversion rate`. A given "10,000
paying subscribers" cell therefore implies a *different* total registered population at 3%
conversion (≈333,000) than at 20% conversion (≈50,000) — these are not the same app-size
scenario, and §6–§8 price them separately rather than assuming a single infra bill applies to
both.

### 4.2 Assumption ranges (stated, not measured — see §11 for how to replace each with real data)

| Ratio | Stated range | Basis / reasoning |
|---|---|---|
| MAU ÷ Registered | 25–50% | Wide range because of UEE seasonality — likely toward the low end most of the year, toward the high end in the ~3 months before the exam. A generic habit-app benchmark would say 40–60%; lowered here for the exam-calendar effect. |
| DAU ÷ MAU | 12–25% | Conservative-to-moderate for a new, non-social-loop-dominant daily-practice app. (Duolingo-class DAU/MAU of ~40%+ is a trained, mature-product outlier, not a reasonable default for a pre-launch app.) |
| Paying ÷ Registered (conversion) | 3% / 10% / 20% | Given directly by the task brief as the three scenarios to model — not independently assumed here. |
| Peak-concurrent ÷ DAU | 3–8% | Derived, not assumed outright: if a DAU's session is ~8–15 minutes and daily usage concentrates into a roughly 6-hour after-school/evening window (16:00–22:00 local) rather than spreading evenly across 24 hours, instantaneous concurrency during the peak hour is well below DAU — see worked formula below. |
| AI chat usage (free tier) | 0–5 real LLM calls/user/day (hard cap) | `DAILY_FREE_LIMIT = 5` is a code-enforced ceiling, not an assumption — but how many free users actually *hit* the cap is: assumed 20–40% of active free users send at least one chat message on a given active day. |
| AI chat usage (Pro tier) | 3–15 real LLM calls/paying-user/day | "Unlimited" is an entitlement, not a volume (prior-analysis error #4, §2) — this is a stated assumed range for *actual* usage by someone who has no cap, informed by nothing more than reasoned judgment; flagged as the single highest-leverage number to replace with real data once Pro exists. |
| Telebirr submissions | 1.0–1.3 submissions per Telebirr-paying conversion | Most payments succeed first try (1.0); a modest allowance for resubmission after a misread or rejected screenshot. |

### 4.3 Worked concurrency formula (illustrative, not a measurement)

```
Peak concurrent sessions ≈ DAU × (avg_session_minutes / peak_window_minutes) × peak_concentration_factor

Worked example (midpoint assumptions):
  avg_session_minutes      = 12
  peak_window_minutes      = 360   (a 6-hour evening window, not all 24h)
  peak_concentration_factor = 1.8  (peak hour inside that window carries ~1.8x the window's average rate)

  Peak concurrent ≈ DAU × (12/360) × 1.8 ≈ DAU × 0.06
```

This lands inside the 3–8% stated range above and is used as the central estimate in §8. It is
an estimate built from assumptions, not a measurement — real session-length and time-of-day
analytics (available the moment any real users exist) would directly replace every input to
this formula.

---

## 5. Measured performance baseline

Per the brief's instruction not to claim a request rate without evidence, this session ran a
real load test — not a cited industry benchmark — against the actual running dev server and
actual endpoint code, using a purpose-built script
(`backend/scripts/handover/benchmark.ts`, left in the repo for reuse). Results, with zero
request errors across all four bursts:

| Endpoint | Concurrency | Requests | Throughput | p50 | p95 | p99 |
|---|---|---|---|---|---|---|
| `GET /health` (no DB) | 1 | 20 | 352 req/s | 1.7 ms | 23.1 ms | 23.1 ms |
| `GET /health` (no DB) | 20 | 60 | 1,212 req/s | 13.7 ms | 23.6 ms | 27.9 ms |
| `GET /subjects` (journey #3, real multi-table query) | 1 | 20 | 77 req/s | 13.1 ms | 14.8 ms | 14.8 ms |
| `GET /subjects` (journey #3, real multi-table query) | 20 | 60 | 218 req/s | 52.2 ms | 171.7 ms | 176.1 ms |

**What this does and does not prove:**
- `/subjects` was chosen deliberately because it is the heaviest *normal* endpoint traced in
  §3 — a full curriculum-tree fetch plus a full personal-progress fetch plus two `groupBy`
  scans, hit by every user on every app open (journey #3). Most other endpoints (single-row
  lookups like a textbook section or a lesson) are lighter than this; this number is a
  reasonable upper bound for "typical" request cost, not a worst case (the full-question-bank
  fetch in journeys #5–#7 was not separately benchmarked and is almost certainly heavier — see
  §11).
- This is a **measured floor, not a found ceiling**: concurrency 20 sustained 218 req/s with
  zero errors, but concurrency was never pushed further (doing so on a shared dev machine
  would have produced a number reflecting this laptop's contention with Metro/Docker/the IDE,
  not the server's real limit, and the app's own rate limiter — correctly — starts rejecting
  single-IP traffic past 200 req/min regardless).
- **Hardware/environment caveats, stated plainly**: this ran on a developer laptop, not a cloud
  instance; Postgres and Redis were local (no network round-trip a managed remote DB would
  add, which would make production latency *higher* than this for the same query — partially
  offset by a real cloud instance's dedicated/better-provisioned CPU, which could make it
  *lower*); the dev database's content volume is today's real seed data, not a hypothetical
  future catalog; and this was one Node process with no clustering.
- **Conclusion used downstream (§6)**: treat "~200 req/s sustained on this endpoint shape, on
  one unclustered process, on laptop-class hardware, with zero errors" as a conservative,
  evidence-based data point for single-instance capacity — not as a hard ceiling, and not
  extrapolated beyond this specific endpoint shape without saying so.

---

## 6. Bottom-up infrastructure cost model

### 6.0 Real content volume (measured directly from the dev database and disk, not assumed)

Queried the actual local Postgres database (via the app's own Prisma client — guaranteed to
be the right database, not a guess) and the actual textbook-images directory on disk:

| Item | Measured value |
|---|---|
| Questions (all 16 subjects) | 9,768 rows total. Largest: English 2,523, Civics 1,989, Mathematics 1,341. Smallest: Economics 163. |
| Avg. question payload (prompt+options+explanation only) | ~441 bytes/row (measured from a 500-row sample) |
| Textbook sections (rows, metadata only) | 2,600 |
| Lessons / lesson steps | 363 / 1,318 |
| **Total relational DB size, on disk, right now** | **~24–25 MB combined across every table** (`questions` table itself: 6.4 MB for all 9,768 rows; `textbook_sections`: 15 MB, the single largest table, since it carries the `blocks` JSON text) |
| Textbook figure images (local disk, NOT in Postgres) | **3.1 GB across 20,622 files** (`backend/assets/textbook-images/`), avg ~150 KB/file |

**This directly confirms prior-analysis weakness #2 (§2): database storage is not a meaningful
cost driver at any realistic near-term scale.** The entire relational dataset is ~25 MB — on
Neon's metered storage ($0.35/GB-mo, §6.1) that is roughly **1 cent per month**, full stop,
independent of how many users the app has (growth in DB size comes from *more content* being
ingested or *more user activity rows* accumulating, not from more registered accounts per se
— a registered user who never does anything adds one ~400-byte `users` row and nothing else).
The 3.1 GB of textbook images is the one real content-storage number worth tracking, and it
lives on local disk today, not in any billed cloud storage service — see §6.3.

**This also directly quantifies prior-analysis weakness #3 (§2).** `pickQuestions()` (§3) on
English's bank transfers ~2,523 × 441 bytes ≈ **1.1 MB of question text per single practice
request**, to return 10 rows (~4.4 KB) — roughly a 250× amplification for that one subject.
This is real, measured, and happens on Node/Postgres network-internal bandwidth (not
user-facing bandwidth), so it shows up as backend compute/DB load, not CDN egress — folded
into the compute sizing in §6.2, not double-counted as a storage or CDN line.

### 6.1 Compute, database, and Redis — official pricing (verified 2026-10-27)

Sourced directly from each provider's own pricing page (not an aggregator), via a dedicated
research pass this session. Two providers below are flagged low-confidence and excluded from
the costed configurations in §7 for that reason.

**Compute — DigitalOcean Basic Droplets** (source: digitalocean.com/pricing/droplets):

| vCPU | RAM | SSD | Transfer incl. | $/mo |
|---|---|---|---|---|
| 1 | 512 MiB | 10 GiB | 500 GiB | $4.00 |
| 1 | 1 GiB | 25 GiB | 1,000 GiB | $6.00 |
| 1 | 2 GiB | 50 GiB | 2,000 GiB | $12.00 |
| 2 | 2 GiB | 60 GiB | 3,000 GiB | $18.00 |
| 2 | 4 GiB | 80 GiB | 4,000 GiB | $24.00 |
| 4 | 8 GiB | 160 GiB | 5,000 GiB | $48.00 |
| 8 | 16 GiB | 320 GiB | 6,000 GiB | $96.00 |

Billed per-second (60s/$0.01 minimum), effective Jan 1 2026. Inbound traffic free. The page
does not state which CPU class (Regular vs. Premium Intel/AMD) this exact table applies to —
noted as a minor open question, not load-bearing for the config choices in §7.

**Compute — Fly.io** (source: docs.fly.io/about/pricing): shared-cpu-1x/256 MB $2.19/mo,
512 MB $3.69/mo, 1 GB $6.70/mo; shared-cpu-2x/2 GB $13.39/mo (cheapest regions, iad/ewr — other
regions cost more). Billed per-second. **Egress is region-tiered: $0.02/GB for North
America+Europe, but $0.12/GB for Africa+India** — 6× the NA/EU rate, and the one rate that
actually applies to this app's real user base. This is a genuine, sourced, Ethiopia-specific
cost sensitivity factor (carried into §9), not an invented one. Fly also offers a 40% reserved-
compute discount (e.g. $36/yr prepaid for $5/mo of credit).

**Database — Neon (serverless Postgres)** (source: neon.com/pricing): Free tier — 100 CU-hours
and 1 GB storage per project, 5 GB egress. Launch tier — **$0.106/CU-hour compute** (scales to
zero when idle; idle compute is $0 — relevant since a pre-revenue app has long idle stretches),
$0.35/GB-mo storage, 500 GB egress free then $0.10/GB. No fixed monthly minimum on paid tiers.

**Database — Supabase (managed Postgres + extras)** (source: supabase.com/pricing): Free —
500 MB DB, 5 GB egress, 50k MAU, shared CPU. Pro — $25/mo base (8 GB DB, 250 GB egress, 100k
MAU included), overages $0.125/GB-mo storage, $0.09/GB egress, $0.00325/MAU past 100k.
**Caveat worth flagging on its own: Pro's spend cap is ON by default** — a real traffic spike
throttles/rejects requests rather than silently overbilling, which protects a solo dev's
wallet but can turn a success spike into an outage unless deliberately disabled in advance.

**Redis — Upstash** (source: upstash.com/pricing): Free — 250 MB, 10 GB/mo bandwidth, 500k
commands/mo. Pay-as-you-go — $0.20 per 100k commands, $0.25/GB-mo storage (first 1 GB free),
bandwidth free to 200 GB/mo then $0.03/GB. Fixed tiers available from $10–$1,500/mo for
higher, capped throughput.

**Excluded from §7 costing (low confidence, flagged by the research pass itself):**
- **Hetzner Cloud** — official page confirmed only starting prices (€5.99–€6.49/mo. excl. VAT)
  without rendering specs (vCPU/RAM/disk/traffic) across repeated fetch attempts; aggregator
  sources disagree with each other on what those starting prices actually buy. Not used below.
- **Render** — official pricing page is JS-rendered and returned no figures on two fetch
  attempts; aggregator figures found two self-contradicting numbers for the same "Pro" plan
  name. Not used below.
- Both would need a direct, in-browser check before being trusted for a real decision — see §11.

### 6.2 Backend compute sizing — tied to measured load, not head count

Per prior-analysis weakness #7 (§2), instance count below is justified by *measured per-request
cost* (§5) and *modeled request volume* (§4), not by a per-registered-user multiplier.

The one endpoint actually benchmarked this session (§5, journey #3 — representative of a
"normal heavy" request) sustained **~218 req/s at p95 171.7 ms on a single unclustered Node
process on laptop-class hardware**, with zero errors, without being pushed to its actual
ceiling. The full-bank-fetch endpoints (journeys #5–#7) were not separately benchmarked and
are very likely heavier per-request than this (§6.0's 1.1 MB/request figure for English alone)
— until measured directly (§11), this report treats them as "no more than comparable to, very
plausibly worse than" the benchmarked figure, and does not claim a specific number for them.

**Instance-count rule used in §7/§8**: this report treats **200 req/s as the capacity of one
backend instance** — a deliberately conservative floor under the measured 218 req/s (§5), to
leave headroom for the fact that some unbenchmarked endpoints (the full-bank-fetch journeys,
§3.0) are plausibly heavier than the one endpoint actually measured. `instances_needed =
ceil(peak_req/sec ÷ 200)`, with peak req/sec derived from the population model (§4.3) — i.e.
tied to *modeled activity*, never to a registered-user count directly (prior-analysis
weakness #7, §2).

### 6.3 AI inference and CDN/object storage costs (verified 2026-10-27)

**AI — Groq, priced for the two models actually configured in the live `.env` (§3.0), not the
code's fallback defaults** (source: console.groq.com/docs/models, official, reached directly
— Groq's marketing pricing page and a `/docs/pricing` path both failed to surface a per-model
table, so this is the one path that worked):

| Model | Role | Input $/M tokens | Output $/M tokens | Tier |
|---|---|---|---|---|
| `openai/gpt-oss-120b` | Unity chat (text) | $0.15 | $0.60 | self-serve, confirmed current |
| `qwen/qwen3.8-27b` | Telebirr screenshot verification (vision) | $0.80 | $4.00 | **"Preview"** — Groq's own label for eval-only pricing subject to change |

(For reference: the code's *fallback default* text model, `llama-3.3-70b-versatile`, no longer
has public self-serve pricing on Groq's own page at all — it now shows "Contact Sales" —
which is moot here since the real deployed model is `gpt-oss-120b`, but is itself a useful
data point that defaults drift and should be checked live, not assumed from source code.)

**Cost per Unity chat call** — built from the actual code, not a guess: system prompt is a
fixed ~75 tokens (`chat/routes.ts:29-33`, counted directly); up to `HISTORY_WINDOW=10` prior
messages ride along; replies are capped at `MAX_RESPONSE_TOKENS=400` **visible** tokens, but
this specific model has confirmed hidden reasoning-token billing on top of that visible cap
(§3.0) — this session has exactly one anecdotal data point for the size of that overhead (25
reasoning tokens, from an early, non-representative low-`max_tokens` test), not a systematic
measurement, so it is treated as a genuine unknown with a wide illustrative range, not a
number to compute from:

```
Input tokens  ≈ 75 (system) + history + current message → ~300 (early conversation) to ~2,000 (long history), ~1,000 assumed central
Output tokens ≈ 400 (visible cap) + unmeasured reasoning overhead → ~400 to ~800+, ~500 assumed central

Central-case cost/call  ≈ (1,000 × $0.15/M) + (500 × $0.60/M) ≈ $0.00015 + $0.00030 ≈ $0.00045
Range                   ≈ $0.0003 – $0.0008 per call
```

**Cost per Telebirr vision call** — prompt text is a fixed ~150 tokens (`telebirr.ts:26-30`,
counted directly); the real unresolved unknown is **image tokenization** — how many input
tokens a phone-screenshot-sized image costs on this specific model is not documented by Groq
in anything the research pass could find, and is not something to guess precisely:

```
Input tokens  ≈ 150 (text) + 500–1,500 (image, reasoned placeholder — see §11) → ~650–1,650
Output tokens ≈ 40–80 (a 4-field JSON object)

Central-case cost/call ≈ (1,150 × $0.80/M) + (60 × $4.00/M) ≈ $0.00092 + $0.00024 ≈ $0.00116
Range                   ≈ $0.0008 – $0.0016 per submission
```

**Both per-call AI costs are a fraction of a cent.** AI only becomes a material cost *in
aggregate* at real volume — §8.2 applies these per-call figures across the population model
(§4) rather than treating "AI cost" as a flat per-user or per-subscriber number (prior-analysis
weakness #4, §2).

**CDN / object storage — Cloudflare R2 and Backblaze B2** (sources: developers.cloudflare.com/r2/pricing,
backblaze.com/cloud-storage/pricing, both official, reached directly):

| | Storage | Egress | Request-equivalent cost |
|---|---|---|---|
| Cloudflare R2 | $0.015/GB-mo (Standard) | **$0 always** | Class A (write/list) $4.50/M, Class B (read) $0.36/M |
| Backblaze B2 | $0.00695/GB-mo | Free up to 3× stored volume, then $0.01/GB; **$0 uncapped via Cloudflare's CDN partnership** | Class A/B/C calls $0; Class D $0.0004/1,000 |
| *(AWS S3, baseline only — figures third-party-sourced, not independently confirmed on AWS's own page this session)* | ~$0.023/GB-mo | ~$0.09/GB after 100 GB free | — |

Applied to the measured 3.1 GB / 20,622-file textbook-image library (§6.0) — **storage cost
is trivial on either real option**: R2 ≈ 3.1 × $0.015 ≈ **$0.047/month**; B2 ≈ 3.1 × $0.00695
≈ **$0.022/month**. This confirms the same point as §6.0 made for the database: moving these
images to real cloud storage would cost pennies to store, regardless of user count — the
request/bandwidth side is the only part that could ever matter, and both R2 and B2 price that
at $0 egress (R2 natively; B2 via its Cloudflare partnership), which is the central reason
either beats AWS S3 for this specific use case (contra assuming any particular provider is
"best" without a reason — here there is a concrete, sourced reason: zero egress fee on a
read-heavy static-asset workload). §7 prices a worked monthly request-volume estimate against
the population model, since request *count*, not storage, is the only non-zero variable.

**Monitoring — Sentry** (source: sentry.io/pricing, official, reached directly): Free tier —
5,000 errors, 5M spans, 50 replays, 5 GB logs, 1 uptime monitor, 20 metric monitors, 30-day
retention, unlimited projects, **$0/month** — plausibly sufficient through the Launch
configuration (§7). Team tier — $29/mo ($26/mo billed annually) for 50,000 errors; the
research pass flagged that its extraction of Team's *other* included quotas looked identical
to Free's, which may be a page-rendering artifact rather than Sentry's real plan structure —
treated as unconfirmed, not used as a hard number.

**Domain registration**: ~$10.46/year via Cloudflare Registrar's at-cost (no-markup) policy —
aggregator-sourced digit, not lifted directly off Cloudflare's own page, but low-stakes enough
(≈$0.87/month) that this report treats it as a settled rounding-level line item rather than a
cell needing its own sensitivity range.

---

## 7. Three infrastructure configurations

Each config is justified by a **measured-capacity threshold** (§6.2's 200 req/s/instance
rule), not a round registered-user number. "Upgrade" here means "add the next unit when
*sustained* peak load crosses the threshold for multiple consecutive days" — a brief spike
should not trigger a scale-up, and this report does not have real traffic data to say exactly
how many consecutive days is the right debounce (flagged for §11).

### Config A — Launch (handles peak loads up to ~200 req/s; 1 backend instance)

| Service | Choice | Cost |
|---|---|---|
| Compute | 1× DigitalOcean droplet, 2 vCPU / 2 GB (§6.1) | $18.00/mo |
| Database | Neon **Free tier** — current real dataset is ~25 MB (§6.0), well under Neon's free 1 GB/project + 100 CU-hours/mo | $0/mo |
| Cache/Redis | Upstash **Free tier** — 500k commands/mo, 250 MB (§6.1) covers this scale | $0/mo |
| CDN/object storage | Cloudflare R2, enabled from day one — storing the full 3.1 GB image library costs $0.05/mo regardless of traffic (§6.3), so there's no reason to wait on this one | ~$0.05–3/mo |
| AI (Groq) | Pay-as-you-go, no base fee | ~$20–90/mo (population-dependent, §8) |
| Monitoring | Sentry Free tier | $0/mo |
| Domain | Cloudflare Registrar | ~$0.87/mo |
| **Total (excl. AI)** | | **~$19/mo** |

This is the single most important correction to the prior analysis's cost floor: a real,
bottom-up Launch config costs **about $19/month before any AI usage**, not the previously
guessed $70/month — because DB and Redis genuinely cost $0 at this scale on their real free
tiers, not because a number was chosen to look better.

### Config B — Growth (peak loads ~200–800 req/s; 2–4 backend instances)

| Service | Choice | Cost (at 4 instances, upper end of this band) |
|---|---|---|
| Compute | 4× DigitalOcean droplet, 4 vCPU / 8 GB (§6.1) | $192.00/mo |
| Load balancer | DigitalOcean Global LB — $15/mo flat, 25M requests + 1TB transfer included (source: docs.digitalocean.com/products/networking/load-balancers/details/pricing, official, verified 2026-10-27); overage $0.70/M requests, $0.02/GB | $15.00/mo (+overage if ever exceeded — unlikely at this band) |
| Database | Neon Launch tier, usage-based — modeled here as scaling with instance count as a proxy for query load (§8's formula); a real deployment should replace this with measured CU-hours | ~$30–60/mo |
| Cache/Redis | Upstash pay-as-you-go, $0.20/100k commands past the free tier | ~$5–60/mo (population-dependent) |
| CDN/object storage | Cloudflare R2 | ~$1–2/mo |
| AI (Groq) | Pay-as-you-go | population-dependent, §8 — **this is the dominant line item at this scale, see §8's finding** |
| Monitoring | Sentry Team ($29/mo or $26/mo annual) — justified once error volume plausibly exceeds Free's 5,000/mo at this traffic level | $29.00/mo |
| Domain | | ~$0.87/mo |

### Config C — Large-scale (peak loads 800+ req/s; 5+ backend instances)

Same building blocks as Config B, scaled further: more 4 vCPU/8 GB droplets behind the same
Global load balancer (still $15/mo flat up to 25M requests/mo — comfortably enough headroom
for every modeled cell in §8, see the LB-overage check there), Neon Scale tier if a single
primary's compute becomes the bottleneck (read replicas are the next lever specifically for
the `/subjects`-style read-heavy queries in §3/§5, if and only if a real production load test
— §11 — shows the primary struggling), and Upstash's fixed higher tiers for predictable
billing at sustained high command volume. **At every scale this report actually modeled
(§8), AI inference cost exceeds compute+DB+Redis+CDN combined by roughly 4–20×** — so the
honest summary of Config C is "the compute/DB/cache side scales in a straightforward,
well-understood, and comparatively minor way; the real cost driver at large scale is AI usage,
not infrastructure in the traditional sense."

### Why DigitalOcean over Fly.io for compute here specifically

Not asserted as a universal best choice (per the brief's caution) — but for *this* app's *real*
user base, DigitalOcean's flat ~$0.01/GiB overage egress beats Fly.io's $0.12/GB Africa+India
rate (§9) by roughly 12×, and Fly's cheaper base compute price doesn't offset that once any
real image/content bandwidth is involved. If this app's user base were primarily NA/EU-based,
Fly's $0.02/GB rate there would flip this comparison the other way — the recommendation is
tied to the evidence about *this* user base, not to either provider in general.

---

## 8. Profitability analysis

### 8.1 Revenue-per-subscriber economics

At 300 ETB/year per paying subscriber and the 160 ETB/USD central working rate (§9):

```
300 ETB/year ÷ 160 ETB/USD ≈ $1.875/year per paying subscriber ≈ $0.156/month
```

Across the 150–180 ETB/USD sensitivity range, that's **$1.67–$2.00/year ($0.139–$0.167/month)**
per paying subscriber. This single number is the most important constraint in this entire
report: essentially every infrastructure cost priced in USD (§6, §7) must be weighed against
roughly **15–17 US cents of monthly revenue per paying subscriber**, not against the 300 ETB
figure directly — it is easy to misjudge the economics by reasoning in ETB on the cost side
and USD on the revenue side (or vice versa) without converting both to the same currency
first, and this report converts everything to USD for every cost/revenue comparison from here
on specifically to avoid that.

Total monthly revenue at each of the 6 modeled paying-subscriber counts:

| Paying subscribers | Monthly revenue (USD, @160 ETB/USD) | Monthly revenue range (@150–180 ETB/USD) |
|---|---|---|
| 1,000 | $156 | $139–$167 |
| 5,000 | $781 | $694–$833 |
| 10,000 | $1,563 | $1,389–$1,667 |
| 25,000 | $3,906 | $3,472–$4,167 |
| 50,000 | $7,813 | $6,944–$8,333 |
| 100,000 | $15,625 | $13,889–$16,667 |

This revenue figure is **independent of conversion rate** (conversion only determines how many
*registered* users it took to produce this many paying subscribers, §4.1) and independent of
infrastructure configuration — it is pure arithmetic, not modeled. §8.2 sets this against the
actual infra+AI cost at each cell to get margin.

### 8.2 The full 18-cell matrix (central-case assumptions, §4.2)

All dollar figures are modeled from the formulas in §12, using the central-case values stated
in §4.2/§6.3 — **not measurements**. `AI` = Unity chat + Telebirr vision combined (§6.3).
`Infra` = compute + DB + Redis + CDN + monitoring + domain (§7), i.e. *everything except AI*.
Revenue uses the 160 ETB/USD central rate (§9).

**Conversion rate 3%** (highest registered-population burden per paying subscriber):

| Paying | Registered | DAU | Instances | Infra/mo | AI/mo | Total/mo | Revenue/mo | Margin | Margin % |
|---|---|---|---|---|---|---|---|---|---|
| 1,000 | 33,333 | 2,100 | 1 | $19 | $64 | $83 | $156 | $73 | 47% |
| 5,000 | 166,667 | 10,500 | 1 | $24 | $320 | $344 | $781 | $437 | 56% |
| 10,000 | 333,333 | 21,000 | 1 | $30 | $640 | $670 | $1,563 | $892 | 57% |
| 25,000 | 833,333 | 52,500 | 2 | $202 | $1,599 | $1,801 | $3,906 | $2,105 | 54% |
| 50,000 | 1,666,667 | 105,000 | 4 | $361 | $3,198 | $3,559 | $7,813 | $4,254 | 54% |
| 100,000 | 3,333,333 | 210,000 | 8 | $677 | $6,396 | $7,073 | $15,625 | $8,552 | 55% |

**Conversion rate 10%** (central scenario):

| Paying | Registered | DAU | Instances | Infra/mo | AI/mo | Total/mo | Revenue/mo | Margin | Margin % |
|---|---|---|---|---|---|---|---|---|---|
| 1,000 | 10,000 | 630 | 1 | $19 | $46 | $65 | $156 | $91 | 58% |
| 5,000 | 50,000 | 3,150 | 1 | $19 | $231 | $250 | $781 | $531 | 68% |
| 10,000 | 100,000 | 6,300 | 1 | $22 | $461 | $483 | $1,563 | $1,080 | 69% |
| 25,000 | 250,000 | 15,750 | 1 | $27 | $1,153 | $1,180 | $3,906 | $2,726 | 70% |
| 50,000 | 500,000 | 31,500 | 2 | $189 | $2,305 | $2,494 | $7,813 | $5,318 | 68% |
| 100,000 | 1,000,000 | 63,000 | 3 | $272 | $4,610 | $4,882 | $15,625 | $10,743 | 69% |

**Conversion rate 20%** (lowest registered-population burden per paying subscriber):

| Paying | Registered | DAU | Instances | Infra/mo | AI/mo | Total/mo | Revenue/mo | Margin | Margin % |
|---|---|---|---|---|---|---|---|---|---|
| 1,000 | 5,000 | 315 | 1 | $18 | $42 | $61 | $156 | $95 | 61% |
| 5,000 | 25,000 | 1,575 | 1 | $18 | $211 | $230 | $781 | $551 | 71% |
| 10,000 | 50,000 | 3,150 | 1 | $19 | $423 | $443 | $1,563 | $1,120 | 72% |
| 25,000 | 125,000 | 7,875 | 1 | $23 | $1,057 | $1,080 | $3,906 | $2,827 | 72% |
| 50,000 | 250,000 | 15,750 | 1 | $27 | $2,114 | $2,141 | $7,813 | $5,671 | 73% |
| 100,000 | 500,000 | 31,500 | 2 | $190 | $4,227 | $4,417 | $15,625 | $11,208 | 72% |

### 8.3 The two findings that matter more than any single cell above

**Finding 1 — AI inference, not infrastructure, is the dominant cost everywhere.** In every
one of the 18 cells, AI cost is 65–90%+ of total modeled cost; compute+DB+Redis+CDN+monitoring
combined is a small fraction of the bill at any real scale. This directly inverts the implicit
assumption behind the prior analysis's "$70→$400/month" framing, which treated "infrastructure"
as the story — the real story, under this report's central-case assumptions, is almost entirely
about AI usage.

**Finding 2 — this conclusion rests on the single least-certain number in the whole report**,
exactly the one flagged in §4.2: how many messages a "Pro = unlimited" subscriber actually
sends per day. Holding everything else fixed at the 10,000-paying/10%-conversion cell:

| Pro chat calls/day (blended) | AI cost/mo | Total infra+AI/mo | Margin | Margin % |
|---|---|---|---|---|
| 1 | $190 | $213 | $1,350 | 86% |
| 3 (central case above) | $460 | $483 | $1,080 | 69% |
| 8 | $1,135 | $1,158 | $405 | 26% |
| 15 | $2,080 | $2,103 | **-$540** | **-35%** |

**The same cell can be comfortably profitable or a net loss depending entirely on this one
unmeasured usage assumption** — a swing no amount of compute/DB optimization can close,
because compute/DB was never where the cost was concentrated. This is the single most
important number to measure for real before trusting any profitability conclusion in this
report (§11), and it is precisely the kind of thing the prior analysis's "unlimited = large
but unspecified" framing (weakness #4, §2) obscured rather than surfaced.

**Secondary pattern worth naming**: at a fixed paying-subscriber count, *higher* conversion is
*more* profitable (margin % rises from ~55% at 3% conversion to ~70% at 20% conversion) —
because higher conversion means fewer free-tier users per paying subscriber subsidizing their
(smaller, capped) AI usage off the same revenue. This is the opposite of what a naive
"more registered users is better" framing would suggest, and falls directly out of modeling
free and paying populations separately (§4) rather than as one undifferentiated user count.

### 8.4 Three-tier break-even, as the brief requires them kept separate

1. **Infrastructure-only break-even** (compute+DB+Redis+CDN+monitoring+domain, no AI): every
   single cell in §8.2 clears this easily — infra-only cost never exceeds ~$700/mo even at the
   largest modeled scale, against revenue starting at $156/mo. **Infra-only was never the
   binding constraint in this model, at any scale.**
2. **Infrastructure + AI break-even**: still positive in every central-case cell above, but
   §8.3's sensitivity table shows this tier can flip negative well within the stated 3–15
   calls/day range for one input. This is the tier that actually matters for a real go/no-go
   decision, and the one this report has the least confidence in.
3. **Full-business break-even** (adding founder salary, support/moderation time, marketing,
   payment-processor fees, taxes): **explicitly out of scope for a specific number here**, per
   the brief's own instruction (weakness #10, §2) — this report has no real expense data for
   any of these, and inventing one would be exactly the "precise-looking but unsupported"
   failure mode the brief asks to avoid. What *can* be said: §8.2's margin figures are the
   budget available to cover this tier, not profit in a full-business sense — at the 10,000
   paying/10%-conversion central cell, that budget is ~$1,080/month (or as low as -$540/month
   under the higher end of the chat-usage sensitivity range), which a reader can compare
   against their own real salary/overhead numbers directly.

---

## 9. Ethiopia-specific and currency sensitivity factors

Per the brief's instruction, these are treated as sensitivity factors with stated ranges, not
folded into the cost model as invented point expenses.

**1. Egress pricing is not geography-neutral across providers — a real, sourced, and
counter-intuitive finding.** Fly.io prices egress to Africa+India at $0.12/GB, 6× its $0.02/GB
NA/EU rate (source: docs.fly.io/about/pricing, verified 2026-10-27, §6.1) — meaning this
app's entire real user base sits in Fly's single most expensive egress tier. DigitalOcean, by
contrast, bills egress overage at a flat **$0.01/GiB (~$0.0093/GB) regardless of destination
region** (source: docs.digitalocean.com/products/billing/bandwidth, official page's own
last-check date 2026-07-13, cross-referenced against third-party cost guides as of
2026-08-18 — both checked 2026-10-27). For an image-heavy app whose users are overwhelmingly
in one region DO doesn't surcharge for, this is a genuine, evidence-based reason to weight DO
above Fly for anything bandwidth-heavy (§7), not a provider preference asserted without
support (contra the brief's caution against assuming any specific provider combination is
best — this is the one place the evidence actually does favor one named provider over another
on a specific, quantified axis).

**2. Physical latency floor.** None of the providers priced in §6.1 have a data-center region
in or near Ethiopia (DigitalOcean's nearest listed region is likely Bangalore, India; Fly.io
and the others are similarly distant). This means **every dynamic API call** from an Ethiopian
user will carry real network round-trip latency on top of whatever this session measured
locally (§5) — a floor no backend optimization removes, only a closer edge location would
(and none of the researched providers offers one in-region). A CDN in front of *static* content
specifically (textbook images, §6.0/§6.3) is the one piece of this that an edge network can
actually improve, since static assets can be cached at an edge PoP closer to Ethiopia even
when the dynamic API origin cannot move.

**3. Currency conversion / FX volatility.** A specific live USD/ETB rate for today could not be
confirmed with confidence — searches returned conflicting, variously-dated figures: ~160
ETB/USD (Pluang, refreshed 2026-07-22), ~155.8–157.1 (Trading Economics, 2026-04-03), and
older figures in the 124–137 range from 2024–2025. The consistent signal across all dated
points is a steady depreciation trend since the ETB's 2024 managed float. **This report uses
160 ETB/USD as a central working rate for any USD-figure-to-ETB conversions elsewhere in this
report, with 150–180 ETB/USD as an explicit sensitivity range** — not a precise figure, and
not load-bearing for any pass/fail conclusion (all infra costs in §7 are small enough in
absolute USD terms that even the full width of this range changes the ETB figure by a few
hundred birr per month, not by a different order of magnitude). Anyone relying on this for a
real decision should check the National Bank of Ethiopia's published rate at the time.
**No forex *transaction fee* is assumed or invented** — foreign-currency card billing for
cloud infrastructure (DigitalOcean/Fly/Neon/Upstash/Groq all bill in USD) depends on the
specific card/bank used, which this report has no basis to estimate; flagged as a real
operational detail to confirm directly with whatever card/billing method is actually used,
not modeled as a number here.

---

## 10. Evidence-supported optimization opportunities

Per the brief, no dollar savings is claimed without the calculation behind it — several of
these turn out to have a *real but small* dollar effect precisely because of §8.3's Finding 1
(AI, not compute/DB, dominates cost); that is itself a supported conclusion, not a dodge.

1. **Scope `pickQuestions()`/`pickUniqueQuestions()` to the DB, not Node** (§3.0, §6.0) —
   replace `findMany({ where: { subjectId } })` + in-process shuffle/slice with either (a) a
   `$queryRaw` using Postgres's `ORDER BY random() LIMIT N`, or (b) pre-shuffling at ingest time
   and paginating with `skip`/`take` plus a rotating offset. Measured effect: English practice
   requests currently move **~1.1 MB of question text per request to return 10 rows (~4.4 KB)**
   — a ~250× reduction is available for that subject alone, smaller but nonzero for every other
   subject (Civics 1,989 questions, Mathematics 1,341, etc., §6.0's table). This reduces
   Postgres-to-Node internal bandwidth and Node-side JSON/object overhead per request — it
   shows up as lower compute/DB load in §6.2, not as a CDN or storage saving. **Dollar effect:
   genuinely small** — not because the inefficiency isn't real, but because §8.3's Finding 1
   means compute+DB is only ~5–35% of total modeled cost to begin with; eliminating this
   specific inefficiency entirely would save at most a few dollars a month at any modeled
   scale. Worth fixing (it's free and reduces real load), but not a lever that changes the
   profitability picture.
2. **Add `select` to `GET /billing/telebirr/latest`'s `findFirst`** (§3.0) — currently fetches
   the full screenshot `Bytes` blob (up to 8 MB, real submissions likely in the low hundreds of
   KB to a few MB) on every payment-status poll, then discards it before responding with five
   scalar fields. Confirmed from the frontend (`frontend/src/hooks/useBilling.ts:44`): this
   endpoint is polled every **4 seconds, uncapped, for as long as status stays `needs_review`**
   and the screen stays open/foregrounded (React Query drops the interval on unmount, but not
   otherwise) — and `needs_review` is resolved by manual admin action (`telebirr.ts:265`), which
   for a solo dev could plausibly take hours, not seconds. A user who leaves the "payment under
   review" screen open for an hour generates **~900 full-blob fetches** for a submission that
   needed exactly one. A `select` naming just the five returned scalar fields removes this
   entirely — this is a materially larger win than a generic "one wasted fetch" framing would
   suggest, precisely because of this polling pattern.
3. **Scope `/subjects/:id/units` and `/lessons/:id/progress`'s progress fetch to the relevant
   subject**, not the user's entire cross-subject history (§3.1, journey #4) — a smaller,
   bounded win that grows as a retained user's progress history grows over their account
   lifetime (same scaling axis as the profile-view finding in §3.1), not as the user base grows.
4. **CDN for textbook images** (§3.0, §6.0, §6.3, §9) — the 3.1 GB / 20,622-file library is
   already served with correct 1-year immutable cache headers, so fronting it with Cloudflare
   R2 is close to a drop-in change, not a rearchitecture. **Dollar effect, now priced exactly**:
   $0.05–3.45/month across every modeled scenario in §8.2 — consistently under $5/month even
   at 100,000 paying subscribers. Recommended from day one (Config A, §7) specifically because
   that cost is trivial regardless of traffic, not because current traffic demands it. The real
   benefit isn't the dollar saving (there isn't one yet — local-disk serving is currently
   free) but removing the §9 physical-latency penalty for Ethiopian users on static content,
   which no backend optimization can otherwise touch.

Items 1 and 3 above have small, bounded dollar effects precisely because of §8.3's Finding 1
(AI dominates cost, not compute/DB); items 2 and 4 have the largest concretely-priced effects
of the four, for the reasons stated against each.

---

## 11. What remains unmeasured, ranked by how much it would change this report's conclusion

1. **Pro-subscriber Unity-chat usage rate** (§4.2, §8.3) — by far the highest-leverage unknown;
   swings the central cell from 86% margin to -35% within a stated, not-unreasonable range.
   **How to measure**: once any paying users exist, log `messages sent per paying user per
   day` directly from `chat_messages` rows already being written (`ChatMessage` model,
   schema.prisma) — no new instrumentation needed, this data is already captured by the
   existing schema; it just needs to be queried and watched.
2. **Hidden reasoning-token overhead on `openai/gpt-oss-120b`** (§3.0, §6.3) — this report has
   one anecdotal data point from a non-representative test, not a production measurement.
   **How to measure**: log `usage.completion_tokens` from Groq's actual API response on live
   traffic (the field already exists in Groq's response payload; `groq.ts` currently discards
   everything except `choices[0].message.content`) and compare it to the visible reply's token
   count over a real sample.
3. **Image tokenization cost for `qwen/qwen3.8-27b`** (§6.3) — modeled with a 500–1,500 token
   placeholder range because neither Groq's docs nor this research pass could confirm a real
   figure for this specific model. **How to measure**: log `usage.prompt_tokens` from a real
   Telebirr-verification API response and subtract the known ~150-token text prompt (§6.3) to
   isolate the image's actual token cost.
4. **Real request-rate ceiling per backend instance** (§5, §6.2) — this report measured a
   floor (218 req/s, zero errors, not pushed further) on laptop hardware for one endpoint
   shape, and conservatively rounds down to 200 req/s for all sizing. **How to measure**: run
   the same `backend/scripts/handover/benchmark.ts` script (already written, left in the repo)
   against a real staging deployment on the actual chosen cloud instance type, pushed to actual
   failure (rising error rate / p99 blowing up), and separately benchmark the full-bank-fetch
   endpoints (§3.0, journeys #5–#7), which were never directly measured and are plausibly
   heavier than the one endpoint this report did measure.
5. **Every population ratio in §4.2** (MAU/registered, DAU/MAU, peak-concurrent/DAU,
   free-tier chatter share) — all stated assumptions, zero measurements, because the app has
   never had real users. **How to measure**: standard product analytics (even simple
   server-side logging of `last_active` timestamps, already partially captured via
   `UserStats.lastActiveDate`, schema.prisma) the moment any real registered users exist —
   none of this requires new infrastructure to start collecting.
6. **Actual Telebirr-vs-Chapa payment-method split and monthly transacting share** (§8.2's
   formula) — assumed 50/50 and 20%/month respectively with no basis beyond "a reasoned
   starting point." **How to measure**: both are already fully captured by the `Subscription`
   and `TelebirrSubmission` tables' existing `provider`/`createdAt` fields — this is a query
   against existing data, not a new build, the moment there's real subscription history.
7. **Hetzner and Render pricing** (§6.1) — explicitly excluded from this report's costed
   configs because the research pass itself flagged low confidence (JS-rendered pricing pages,
   conflicting aggregator figures). **How to resolve**: load each provider's pricing page
   directly in a real browser (not a text-fetching tool) and read the numbers off the rendered
   page.
8. **A specific current USD/ETB rate and real foreign-card billing mechanics** (§9) — used a
   150–180 range centered on 160 because no live-quoted figure could be confirmed for today.
   **How to resolve**: check the National Bank of Ethiopia's published rate directly, and
   confirm with whichever card/billing method will actually pay these providers' invoices
   whether foreign-currency fees apply.

---

## 12. Spreadsheet-ready assumptions and formulas

Every number in §8.2 is reproducible from the inputs and formulas below — paste this section
into a spreadsheet directly; each row is one cell/input.

**Fixed inputs (sourced, §6/§9):**

| Input | Value | Source |
|---|---|---|
| Price per paying subscriber | 300 ETB/year | given |
| ETB/USD rate | 160 (range 150–180) | §9, Pluang 2026-07-22, cross-referenced 2026-10-27 |
| Chat cost/call | $0.00045 (range $0.0003–0.0008) | §6.3, Groq official pricing 2026-10-27 |
| Vision cost/call | $0.00116 (range $0.0008–0.0016) | §6.3, Groq official pricing 2026-10-27 |
| Single-instance capacity | 200 req/s | §5/§6.2, measured floor (218 req/s) minus headroom |
| Compute, 1 instance | $18/mo (2vCPU/2GB DO droplet) | §6.1, DigitalOcean official 2026-10-27 |
| Compute, scaled instance | $48/mo (4vCPU/8GB DO droplet) | §6.1, DigitalOcean official 2026-10-27 |
| Load balancer | $15/mo (DO Global, 25M req incl.) | §7, DigitalOcean official 2026-10-27 |
| CDN storage (3.1GB library) | $0.047/mo (R2) | §6.3, Cloudflare official 2026-10-27 |
| CDN reads | $0.36/M requests (R2 Class B) | §6.3, Cloudflare official 2026-10-27 |
| Redis commands | $0.20/100k (Upstash PAYG) | §6.1, Upstash official 2026-10-27 |

**Stated assumptions (NOT sourced — replace with real data per §11 as it becomes available):**

| Assumption | Central value | Range |
|---|---|---|
| MAU ÷ Registered | 35% | 25–50% |
| DAU ÷ MAU | 18% | 12–25% |
| Peak concurrent ÷ DAU | 6% | 3–8% |
| Requests/sec per concurrent session | 0.125 (1 per ~8s) | — |
| Free-tier chatter share (of free DAU) | 30% | 20–40% |
| Free-tier calls/day when chatting | 3 | 1–5 (hard cap) |
| **Pro calls/day, blended (highest-leverage input — see §8.3)** | **3** | **1–15** |
| Monthly transacting share of paying base | 20% | — |
| Telebirr share of transactions | 50% | — |
| Resubmission factor | 1.15× | — |
| Redis ops/DAU/day | 10 | — |
| Textbook-mode daily usage share | 15% | — |
| Images/session (cache-miss) | 10 | — |

**Formulas (exactly as implemented in this report's model, reproducible in any spreadsheet):**

```
Registered          = Paying ÷ Conversion rate
MAU                  = Registered × 35%
DAU                  = MAU × 18%
Active paying        = Paying × 18%                         (treats paying subs as MAU-equivalent)
Free DAU             = MAX(0, DAU − Active paying)
Peak concurrent      = DAU × 6%
Peak req/sec          = Peak concurrent × 0.125
Instances needed      = CEILING(Peak req/sec ÷ 200, 1), minimum 1

Free chat calls/mo    = Free DAU × 30% × 3 × 30
Pro chat calls/mo     = Paying × [Pro calls/day input] × 30
Chat cost/mo          = (Free chat calls/mo + Pro chat calls/mo) × $0.00045

Telebirr calls/mo     = Paying × 20% × 50% × 1.15
Vision cost/mo        = Telebirr calls/mo × $0.00116

AI cost/mo            = Chat cost/mo + Vision cost/mo

Compute cost/mo       = IF(Instances=1, $18, Instances × $48 + $15)
DB cost/mo            = IF(Instances=1, $0, Instances × $15)        (proxy — see §7 caveat)
Redis cost/mo         = MAX(0, (DAU × 10 × 30 − 500,000)) ÷ 100,000 × $0.20
CDN cost/mo           = $0.05 + (DAU × 15% × 10 × 30 ÷ 1,000,000) × $0.36
Monitoring cost/mo     = IF(Instances=1, $0, $29)
Domain cost/mo         = $0.87

Total infra/mo        = Compute + DB + Redis + CDN + Monitoring + Domain
Total cost/mo          = Total infra/mo + AI cost/mo

Revenue/mo            = Paying × 300 ÷ ETB_USD_rate ÷ 12
Margin/mo             = Revenue/mo − Total cost/mo
```

This is the complete, reproducible basis for every number in §8 — change any input in the
first two tables and the formulas propagate exactly as shown, with no hidden adjustment.
