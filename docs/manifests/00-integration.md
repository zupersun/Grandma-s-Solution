# 00 · Integration Manifest (the glue)

Paste this into the session that owns `main`. It holds the contracts every other lane builds against,
merges their branches, and deploys the two demo links. Lane manifests: `01-frontend-user.md`,
`02-frontend-grandma.md`, `03-backend.md`, `04-brain.md`. The product story and feature list live in
`docs/MANIFEST.md`.

## Mission

Grandma's Bakery (fictional, three generations) is being copied by "The Bakery" next door. Ship, in one
3-hour hack, a system demoable from exactly two links:

- `https://<app>/` the customer app: a talking, animated Grandma on any phone or laptop. Order ahead,
  earn loyalty points, vote the flavour of the month, drop suggestions, in four languages.
- `https://<app>/grandma` Grandma's iPad: live orders, a till, customer feedback, and her Helper, the
  Brain that writes her buying plan, lists what to buy in person, and sends online supplier orders for her.

An action by any customer (an order, a vote, a request said to Grandma) shows on the iPad within
2 seconds. Many customers can talk to Grandma at the same time.

All data is fictional and comes from `scripts/seed.mts`: suppliers, 30 days of till sales, past customers,
past Grandma conversations. Never invent a real business or person.

## Stack (fixed)

Next.js 15 App Router, TypeScript, Tailwind v4, `src/` layout. Drizzle + `@libsql/client` (SQLite file
locally, Turso in production, same code). ElevenLabs Agents via `@elevenlabs/react`. Gemini via
`@google/genai` for the Brain, Anthropic SDK as optional fallback. Stripe Checkout (test) with a demo-pay
fallback. pnpm. Node 24.

## Folder ownership (strict, this is what keeps four sessions from colliding)

| Path | Owner |
|---|---|
| `src/app/page.tsx`, `src/app/order/**`, `src/components/*.tsx` (not `grandma/`), `src/app/globals.css`, `public/grandma/**`, `src/persona/customer-grandma.md`, `src/persona/quips.json` | **01 frontend-user** |
| `src/app/grandma/**`, `src/components/grandma/**` | **02 frontend-grandma** |
| `src/app/api/**` except `api/brain/**`, `src/lib/db/**`, `src/lib/{stripe,elevenlabs,customer,ids,validate}.ts`, `src/hooks/**`, `scripts/create-agents.mts`, `scripts/seed.mts`, `scripts/smoke.mts` | **03 backend** |
| `src/app/api/brain/**`, `src/lib/brain/**`, `src/persona/grandma-helper.md`, `src/persona/suppliers.json` | **04 brain** |
| `package.json`, lockfile, configs, `docs/**`, `src/lib/i18n/**`, `src/persona/{config,menu}.json`, `src/lib/db/schema.ts` changes after the first merge | **00 integration** (you) |

Need something outside your lane? Post the request in your report; integration makes the change on
`main` within minutes. Do not edit another lane's files, even for a one-liner.

## Git workflow

One worktree per lane, each on its own branch, each with its own dev server port.

```bash
# run once from the repo root, by integration
git worktree add ../grandma-frontend-user   -b lane/frontend-user
git worktree add ../grandma-frontend-grandma -b lane/frontend-grandma
git worktree add ../grandma-backend          -b lane/backend
git worktree add ../grandma-brain            -b lane/brain
# each lane: cp .env from the root checkout, pnpm install, pnpm db:reset, pnpm dev -p <port>
```

Ports: integration 3000, frontend-user 3001, frontend-grandma 3002, backend 3003, brain 3004.
Every lane rebases on `main` every 20 minutes (`git fetch && git rebase origin/main`) and pushes its
branch. Integration merges lanes into `main` in this order when their done criteria pass: backend,
brain, frontend-grandma, frontend-user. Commit messages start with the lane tag, e.g. `[brain] ...`.

## Contracts

### Database

`src/lib/db/schema.ts` is the source of truth. Tables: customers, menu_items, orders, order_items,
loyalty_events, votes, suggestions, requests, conversations, directives, plans, summaries, suppliers,
supplier_orders, inventory, settings. Schema changes go through integration.

### API (JSON, all under `/api`)

| Method, path | Body or query | Returns |
|---|---|---|
| GET `/menu` | | `{ items: MenuItem[] }` |
| GET `/customers/:id` | | `{ customer }` creates on first sight |
| PATCH `/customers/:id` | `{ name?, lang? }` | `{ customer }` |
| POST `/loyalty` | `{ customerId, reason: "chat"\|"vote"\|"suggestion"\|"referral" }` | `{ points, awarded }` |
| GET `/orders` | `?status=new,making,ready&since=ISO&customerId=` | `{ orders: OrderWithItems[] }` newest first |
| POST `/orders` | `{ customerId?, channel: "web"\|"till"\|"voice", items: [{ slug, qty }], note?, paidHow?: "counter" }` | `{ order }` |
| GET `/orders/:id` | | `{ order }` |
| PATCH `/orders/:id` | `{ action: "advance"\|"undo"\|"set", status?, paid?, paidHow? }` | `{ order }` idempotent |
| POST `/checkout` | `{ orderId }` | `{ url }` Stripe, or `{ demo: true, order }` |
| GET `/checkout/verify` | `?orderId=&session_id=` | `{ order }` |
| GET `/votes` | `?customerId=` | `{ month, options, tally: Record<id, number>, myVote? }` |
| POST `/votes` | `{ customerId, option }` | `{ tally, myVote, awarded }` upsert |
| GET `/suggestions` | | `{ suggestions }` |
| POST `/suggestions` | `{ customerId?, text, source }` | `{ suggestion, awarded }` |
| GET `/requests` | | `{ requests }` |
| POST `/requests` | `{ customerId?, text, itemHint?, source }` | `{ request }` |
| GET `/stats` | | `{ today: { orders, revenue, topItems }, week: {...}, live: { new, making, ready } }` |
| GET `/voice/signed-url` | `?agent=customer\|helper` | `{ signedUrl }` |
| POST `/chat` | `{ persona: "customer"\|"helper", lang, messages: [{ role, content }] }` | `{ reply }` Gemini text fallback |
| GET `/brain/plan` | | `{ plan: Plan \| null, supplierOrders: SupplierOrder[] }` |
| POST `/brain/plan` | `{ period? }` | `{ plan }` draft |
| POST `/brain/plan/approve` | `{ planId }` | `{ plan, supplierOrders }` sends online, lists in-person |
| POST `/brain/directive` | `{ text }` | `{ directive, plan }` |
| GET `/brain/summary` | | `{ summary }` latest |
| POST `/brain/summary` | `{ lang? }` | `{ summary }` fresh |

Errors: `{ error: string }` with 4xx or 5xx. Validate every body with zod. Money in dollars as numbers.

### Hooks (`src/hooks/`, client side, the only way frontends talk to the API)

```ts
useCustomer(): { id, name, lang, points, setName(n), setLang(l), refresh() }
useMenu(): { items, loading }
useCart(): { lines: { slug, qty }[], items, total, add(slug, qty?), remove(slug), clear(), checkout(note?): Promise<{ orderId, url? }> }
useOrders(opts?: { status?: OrderStatus[]; customerId?: string; pollMs?: number }): { orders, advance(id), undo(id), createTillOrder(items, paidHow), refresh() }
useVotes(): { month, options, tally, myVote, vote(option) }
useSuggestions(): { suggestions, submit(text) }
useRequests(): { requests }
useStats(pollMs?): { stats }
useBrain(): { plan, supplierOrders, summary, loading, error, makePlan(), sendDirective(text), approvePlan(), refreshSummary() }
useGrandmaVoice(opts: { agent: "customer" | "helper"; lang; clientTools }): { status, mode, isSpeaking, volume, transcript, start(mode), stop(), sendText(t) }
```

### Components (props are the contract, markup is the lane's)

Customer: `GrandmaAvatar({ state, volume })`, `TalkToGrandma({ agent, lang, clientTools })`, `Menu({ items, lang, onAdd })`,
`Cart({ items, total, onCheckout })`, `VotePanel({ options, tally, myVote, onVote, lang })`, `SuggestionBox({ onSubmit, lang })`,
`LoyaltyBadge({ points, lang })`, `LangPicker({ lang, onChange })`, `QuipTicker({ lang })`.

iPad: `OrderBoard({ orders, onAdvance, onUndo })`, `Till({ menu, onCreate })`, `FeedbackFeed({ votes, suggestions, requests, stats })`,
`SummaryCard({ summary, onRefresh })`, `PlanCard({ plan, supplierOrders, onApprove, onTellMeMore })`, `HelperPanel(TalkToGrandma props)`.

### Client tools (names must match the ElevenLabs agent config exactly)

Customer agent: `addLoyaltyPoints({reason})`, `addToCart({itemSlug, qty})`, `placeOrder({})`, `voteFlavour({option})`,
`submitSuggestion({text})`, `logRequest({text, itemHint})`, `getMyPoints({})`. Each returns a short string the agent reads.
Helper agent: `getDailySummary({})`, `getFeedback({})`, `getPlan({})`, `updatePlan({directive})`, `approvePlan({})`, `getOrders({status})`.

## Environment

See `.env.example`. Keys: ElevenLabs (profile, API keys), Gemini (aistudio.google.com/apikey, two keys
comma-separated), Stripe test key optional, Anthropic optional. `NEXT_PUBLIC_BASE_URL` is the public URL.

## Realtime and concurrency

- iPad hooks poll every 2 s; frontends apply optimistic updates and reconcile on the next poll.
- Status transitions are idempotent; `undo` restores `previousStatus` only within 10 s.
- Pickup codes are 3 digits, unique among non-picked-up orders.
- Many simultaneous Grandma conversations: each phone holds its own ElevenLabs session; the API is
  stateless; libsql serializes writes. ElevenLabs Starter has a small concurrent-conversation cap, so the
  text fallback (`/api/chat`, Gemini) is the overflow path and must always work.
- Optional stretch: `/api/events` as Server-Sent Events for sub-second updates. Only if polling feels slow on stage.

## Hosting (two links)

Vercel for the app, Turso for the database. Both free, no card.

```bash
pnpm dlx vercel link && pnpm dlx vercel env pull   # or set env in the Vercel dashboard
brew install tursodatabase/tap/turso && turso auth signup
turso db create grandma && turso db show grandma --url && turso db tokens create grandma
# Vercel env: DATABASE_URL=libsql://...  DATABASE_AUTH_TOKEN=...  plus every key from .env
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... pnpm db:push && pnpm db:seed
pnpm dlx vercel --prod
```

Fallback if Vercel misbehaves: laptop plus `pnpm tunnel` (cloudflared) still gives two HTTPS links.
Alternative with the paid Google Cloud account: `gcloud run deploy --source .` with the same Turso env.

## Demo script (90 seconds)

1. Phone: open `/`, pick Español, tap Talk to Grandma, ask about allergens, say "I'd love more ube", vote ube.
2. iPad: Customers tab shows the request and the vote within 2 s. Loyalty points tick up on the phone.
3. Phone: order a mango pie, pay (demo or Stripe test). iPad Orders tab shows it; tap to "ready"; phone status updates.
4. iPad: Helper tab, "Make my plan". Say "I want to push puddings this month". Plan changes, eggs and milk lines grow, reason text explains.
5. Approve. Online suppliers show "sent" with confirmation numbers; in-person suppliers show as Tuesday co-op and Saturday market shopping lists.

## Merge checklist (per lane)

`pnpm typecheck` clean, `pnpm build` clean, lane's done criteria met, no files outside ownership, `.env` untouched,
no secrets in diff, rebased on `main`.
