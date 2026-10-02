# 03 · Backend (lane/backend)

Paste as the first prompt in a fresh Claude Code session opened in the `../grandma-backend` worktree.

> You own the API, database access, hooks, payments, and the voice plumbing for Grandma's Bakery, a fictional
> bakery with a talking Grandma. Read `docs/manifests/00-integration.md` first (the API and hook tables there are
> the contract you implement), then this file. A thin working skeleton already exists; your job is to make it
> correct, validated, concurrent-safe, and demo-proof. Work only inside the files you own.

## Setup

```bash
cp ../Grandma-s-Solution/.env .env && pnpm install && pnpm db:reset && pnpm dev -p 3003
```

## You own

`src/app/api/**` except `api/brain/**`; `src/lib/db/index.ts`; `src/lib/{stripe,elevenlabs,customer,ids,validate}.ts`;
`src/hooks/**`; `scripts/create-agents.mts`; `scripts/seed.mts`; `scripts/smoke.mts`. Schema changes: propose them in your
report, integration applies them to `src/lib/db/schema.ts`.

## Rules

Validate every request body and query with zod at the boundary. Money in dollars as numbers, rounded to cents.
Every handler returns `{ error }` with a status on failure. No file over 500 lines. Never log secrets.

## Work, in order

1. **Harden orders** (25 min): `POST /orders` prices from the menu table (never trust client prices), 3-digit pickup
   codes unique among non-picked-up orders, `PATCH` with idempotent `advance`, `undo` only within 10 s using
   `previousStatus`, `set` for explicit status or paid flags. `GET /orders` filters by status list, `since`,
   `customerId`; newest first; includes items with slug, emoji, localized names.
2. **Loyalty rules** (10 min): `POST /loyalty` applies `config.loyalty`: chat once per day per customer, vote and
   suggestion once per event, order points on paid, referral on first order with `?ref=`. Write `loyalty_events`
   and bump `customers.points` atomically.
3. **Votes, suggestions, requests** (10 min): one vote per customer per month (upsert, points only when new),
   suggestions capped at 5 per customer per day, requests capped at 20 per customer per day. Caps return 200 with
   `awarded: 0` and a friendly `note`, never an error, since Grandma reads the tool result aloud.
4. **Stats** (10 min): `GET /stats` for today and the last 7 days: order count, revenue, top 5 items, live counts.
5. **Checkout** (20 min): `POST /checkout` creates a Stripe Checkout Session in test mode when `STRIPE_SECRET_KEY`
   is set (line items from the order, `success_url` to `/order/{id}?session_id={CHECKOUT_SESSION_ID}` on
   `NEXT_PUBLIC_BASE_URL`), else marks the order paid with `paidHow: "demo"`. `GET /checkout/verify` retrieves the
   session, marks paid when `payment_status === "paid"`, awards order points once. No webhooks.
6. **Voice** (25 min): `GET /voice/signed-url` calls ElevenLabs `GET /v1/convai/conversation/get-signed-url?agent_id=`
   with header `xi-api-key`, choosing the agent ID from `?agent=`. `scripts/create-agents.mts` creates or updates both
   agents: `POST /v1/convai/agents/create` (or `PATCH /v1/convai/agents/{id}` when the env ID exists), reads the
   persona markdown, fills `{{GRANDMA_NAME}}`, `{{BAKERY}}`, `{{RIVAL}}`, `{{MENU}}` (menu JSON with allergens),
   `{{VOTE_OPTIONS}}`, declares client tools via `POST /v1/convai/tools` with `tool_config: { type: "client", name,
   description, parameters, expects_response: true }` and references them with `prompt.tool_ids`, sets
   `prompt.llm` to `config.agentLlm`, `tts.voice_id` from config, `language` en plus `language_presets` for es, zh,
   fr with translated first messages. Prints the two agent IDs. Treat API errors as readable output, not crashes.
7. **Chat fallback** (10 min): `POST /chat` answers in persona with Gemini using `src/lib/brain/llm.ts` (owned by
   brain lane; call its exported `generateText`). Used when ElevenLabs is down or over its concurrency cap.
8. **Hooks** (20 min): every hook in the contract table, fetch-based, with polling where specified, optimistic updates
   for `advance` and `vote`, and `AbortController` cleanup. `useGrandmaVoice` wraps `@elevenlabs/react`
   `useConversation`: start fetches the signed URL, `connectionType: "websocket"`, `textOnly` for text mode,
   `overrides.agent.language`, `isSpeaking` and `getOutputVolume()` sampled with requestAnimationFrame into `volume`,
   `onMessage` into `transcript`, client tools dispatched through a ref so they always see fresh state.
9. **Smoke test** (10 min): `scripts/smoke.mts` runs against `http://localhost:3003`: create customer, order, pay demo,
   advance, undo, vote twice (second is a no-op), suggestion, stats. Prints PASS or the first failure.
10. **Stretch**: `GET /events` Server-Sent Events emitting `orders`, `votes`, `requests` change ticks; `api/transcripts`
   webhook receiver for ElevenLabs post-call transcripts into the `conversations` table.

## Done when

`pnpm smoke` passes, `pnpm agents:create` prints two agent IDs (or a readable reason it cannot), a Stripe test
payment flips an order to paid, `pnpm typecheck` and `pnpm build` pass.

## Report back

Branch name, endpoints finished, schema changes you need, agent IDs (paste into the root `.env` only, never into chat
or git), anything stubbed.
