# Grandma's Bakery: Manifest

Socratica x Ramp, 3-hour hack. Target: MVP running in 30 minutes, then layer features.
On approval this file is copied to `docs/MANIFEST.md` in the repo and the MVP is built.

## Context

Grandma's Bakery has been afloat for three generations. "The Bakery" opened next door and
sells suspiciously similar goods. Grandma is not tech-savvy. We give her two things:

1. **A reason for customers to come to her instead**: a talking, animated Grandma they can chat
   with on their phone, order ahead from, earn loyalty points with, vote with, and bond with.
2. **A brain that runs the back office**: an agent that turns orders, chat signals, and Grandma's
   own wishes into a monthly buying plan, keeps her informed in plain language, and (phase 2)
   pays suppliers through Ramp with one tap.

Success at demo time: a judge scans a QR code, talks to Grandma in Spanish, orders a mango pie,
the order appears on Grandma's iPad, Grandma says "I want to push puddings this month" to her
Helper, and the buying plan changes in front of everyone.

## Decisions (locked)

| Area | Decision | Why |
|---|---|---|
| App | One Next.js 15 app, TypeScript, Tailwind v4, `src/` layout | One `pnpm dev`, three surfaces, easy to split across people |
| Voice | ElevenLabs Agents Platform via `@elevenlabs/react` `useConversation` | Voice-to-voice, interruptions, languages, text mode, all built in. Starter tier has limited agent minutes: test in text mode, save voice for demos |
| Two agents, one component | "Grandma" (customers) and "Grandma's Helper" (iPad) share `TalkToGrandma.tsx`, differ by agent ID and client tools | No duplicated voice code |
| Brain LLM | Gemini via `@google/genai`, key pool `GEMINI_API_KEYS=k1,k2` with failover on 429/5xx, then Anthropic `claude-opus-5` if `ANTHROPIC_API_KEY` is set | Uses credits you already have (Google Cloud account 010352-77CF90-628194). Claude is a later add, no code change |
| Brain math | Quantities are computed in code; the LLM parses directives and writes explanations | Flash-class models never invent numbers; plan is deterministic and testable |
| Data | SQLite file via Drizzle + `@libsql/client` | Zero accounts. Same client speaks Turso for a Cloud Run deploy later |
| Live updates | iPad polls every 3 s | No realtime service needed for a demo |
| Payments | Stripe Checkout, test mode. If `STRIPE_SECRET_KEY` is empty, a "Pay (demo)" button marks the order paid | Full flow works in minute one, real Stripe is a key paste |
| Demo networking | Laptop runs the app, `cloudflared tunnel --url http://localhost:3000` gives a free HTTPS URL | Phone mics need HTTPS. iPad hits the same URL. Cloud Run (`gcloud run deploy --source .`) is the permanent-URL option on your paid Google account |
| Animated Grandma | The team's drawing, exported as a few transparent PNG layers, animated by a layer-swap component driven by `isSpeaking` and `getOutputVolume()` | Works with any art style, no rigging tool, mouth follows her actual voice. A single image still works with a motion-only fallback |
| Frontend | The team designs and styles both screens. The MVP ships a functional skeleton: one component per screen region, data through hooks, plain Tailwind | Designs drop onto working components instead of waiting on wiring |
| Identity | Anonymous `customerId` in localStorage plus optional first name | No login friction. Phone-number claim is phase 2 |
| Sponsor hook | Ramp Bills API (`POST /developer/v1/bills`, vendors at `POST /developer/v1/accounting/vendors`, spend at `GET /developer/v1/transactions`) | Approved plan becomes supplier bills; needs sandbox client credentials from the Ramp booth |

## Surfaces

The team's mockups define the look. The lists below are what each screen must expose so the
system works end to end; every item maps to a component and a hook in the contract further down.

### 1. Customer app, `/` (phone and laptop)

- **Hero**: animated Grandma, big "Talk to Grandma" button, "type instead" toggle, language picker (EN, ES, ZH, FR).
- **Menu**: cards with price, allergen chips (nuts, dairy, gluten, eggs, soy), names and descriptions in the chosen language.
- **Order ahead**: add to cart, checkout, order page with pickup code and live status.
- **Loyalty**: points badge. +5 first chat of the day, +1 per dollar, +10 vote, +10 suggestion, +15 referral (phase 2). Redeem rule shown plainly: 100 points = a free coffee.
- **Flavour of the month**: 4 options, one vote per customer per month, live tally.
- **Suggestion box**: free text, also reachable through Grandma by voice.
- **Grandma says**: a rotating quip ticker from a curated list (playful jabs at The Bakery, no LLM cost).

### 2. Grandma's iPad, `/grandma`

Four big tabs. Everything else is behind "Tell me more".

- **Orders**: board of cards, new to making to ready to picked up, tap to advance, undo for 10 s. Polls every 3 s.
- **Till**: tap items, see total, "Paid at counter" or "Card" (Stripe), creates a paid order with a pickup number.
- **Customers**: vote tally bars, suggestions, "what people asked Grandma for", today's top sellers, and the Brain's latest summary card with an "Update me" button. The page re-asks the Brain every 30 minutes while open.
- **Helper**: "Talk to your helper" (voice, text toggle). Shows the Plan card: ingredient, quantity, supplier, cost, one-line reason. "Approve plan" asks for confirmation. Helper takes directives like "more puddings this month" and regenerates the plan.

Accessibility rules (Tristin's principles, applied): touch targets at least 56 px, 20 px base font, warm high-contrast palette, max four top-level choices, plain words and rounded numbers, one question at a time, confirm before anything that spends money, undo for status changes, voice available everywhere a keyboard is.

### 3. Backend, `/api/*` and the Brain

Routes: `menu`, `orders` (list, create, update status), `checkout`, `loyalty`, `votes`, `suggestions`,
`requests`, `voice/signed-url?agent=customer|helper`, `brain/summary`, `brain/plan`,
`brain/directive`, `chat` (Gemini text fallback for the customer persona when ElevenLabs is out of credits).

## Data model (Drizzle, SQLite)

- `customers` (id, name, lang, points, createdAt)
- `menu_items` (id, slug, price, allergens JSON, names JSON, descriptions JSON, recipe JSON of ingredient to qty per unit, active)
- `orders` (id, customerId, channel: web|till, status, total, pickupCode, paid, stripeSessionId, createdAt)
- `order_items` (orderId, menuItemId, qty, unitPrice)
- `loyalty_events` (customerId, points, reason, createdAt)
- `votes` (customerId, option, month) unique on customer+month
- `suggestions` (customerId, text, source: ui|voice, createdAt)
- `requests` (customerId, text, itemHint, source, createdAt) what customers asked Grandma for
- `directives` (text, parsed JSON adjustments, createdAt, active) Grandma's wishes
- `plans` (id, period, items JSON, summary, status: draft|approved, createdAt)
- `summaries` (text, lang, stats JSON, createdAt)
- `suppliers` (id, name, ingredient, packSize, unit, packPrice, leadDays)
- `inventory` (ingredient, onHand, unit)

Seed: 12 menu items in 4 languages with recipes, 8 suppliers, 14 days of plausible sales
history, a handful of votes, suggestions, and requests so every screen has life at demo time.

## The Brain (`src/lib/brain/`)

- `llm.ts`: `generateJSON({ system, user, schema })`. Tries Gemini keys in order, rotates on 429, falls back to Anthropic if configured, throws a typed `BrainUnavailable` otherwise. UI shows "The Brain is napping" and keeps the last plan.
- `plan.ts`:
  1. `baseline()`: per item, average daily sales over the last 7 days times days in period.
  2. `signals()`: votes, suggestions, requests mapped to items. Chat signals can move a forecast at most 20 percent. Purchases dominate. Directives override and are applied last.
  3. `explode()`: forecast times recipe, minus inventory, rounded up to supplier pack sizes, priced.
  4. `explain()`: LLM writes one plain-language reason per line and a three-sentence summary, including "waste avoided versus last month" and any hype flags (many requests, few sales: "try a small batch").
- `directive.ts`: LLM parses "I want to push puddings this month" into `{ item: "pudding", multiplier: 1.5 }` style adjustments, stores them, regenerates the plan.
- `summary.ts`: stats are computed in code (orders, revenue, top items, new votes and suggestions), LLM turns them into a warm 3-sentence note in Grandma's language.
- `crossmatch.ts` (phase 2): discrepancy detection between chat signals and sales, dedupe near-identical suggestions.

## Voice (`src/persona/` and `scripts/create-agents.mts`)

- `customer-grandma.md` and `grandma-helper.md` are the system prompts. `config.json` holds `grandmaName`, `bakeryName`, `rivalName`, languages, voice IDs.
- `scripts/create-agents.mts` calls `POST /v1/convai/agents/create` with header `xi-api-key`, injects the menu JSON into the customer prompt, declares client tools (`type: "client"`, `expects_response: true`), sets a Gemini Flash model as the agent LLM, enables the four languages, and prints the agent IDs for `.env`. Re-run after editing a persona or the menu.
- `/api/voice/signed-url` calls `GET /v1/convai/conversation/get-signed-url?agent_id=...` so agent IDs stay server-side and per-customer caps can be added later.
- `TalkToGrandma.tsx` uses `useConversation({ clientTools, textOnly })`, `startSession({ signedUrl, connectionType: "webrtc" })`, `overrides.agent.language` from the picker, `isSpeaking` and `getOutputVolume()` for the avatar, `sendUserMessage` in text mode.

Client tools, customer agent: `addLoyaltyPoints(reason)`, `addToCart(itemSlug, qty)`, `placeOrder()`, `voteFlavour(option)`, `submitSuggestion(text)`, `logRequest(text, itemHint)`, `getMyPoints()`.
Client tools, helper agent: `getDailySummary()`, `getFeedback()`, `getPlan()`, `updatePlan(directive)`, `approvePlan()`, `getOrders(status)`.

Persona guardrails: allergen answers come only from menu data, otherwise "let me check in store"; no medical advice; rivalry stays playful and never makes factual claims about The Bakery's food, hygiene, or people; voice replies are one or two sentences with one question at a time.

## Animating the Grandma drawing (`GrandmaAvatar.tsx`)

The artist exports transparent PNGs on the same canvas size into `public/grandma/`:

| File | Required | Used for |
|---|---|---|
| `base.png` | yes | Everything that never moves: body, apron, hair, glasses, closed mouth, open eyes |
| `mouth-open.png` | recommended | Just the open mouth, everything else transparent |
| `mouth-half.png` | nice | Half-open mouth for smoother talking |
| `eyes-closed.png` | nice | Closed eyes for blinks |
| `hand-wave.png` | nice | Raised hand, shown on greeting |

The component stacks the layers absolutely and drives them from the voice SDK:

- `speaking`: `getOutputVolume()` sampled with requestAnimationFrame picks closed, half, or open mouth by threshold, so lips follow her actual voice.
- `idle`: slow bob and a blink every 4 s by flashing `eyes-closed.png`.
- `listening`: slight head tilt and scale up, pulsing ring around her.
- `thinking`: tiny side-to-side sway while the agent is between turns.
- Fallback: with only `base.png` present, speaking becomes a squash-and-stretch bounce timed to volume, so one drawing is enough to demo.

Separate head and body layers are optional; if provided, the head bobs independently.
Confetti fires on a placed order.

## Repo layout

```
docs/MANIFEST.md                 this document
scripts/create-agents.mts         push personas to ElevenLabs, print agent IDs
scripts/seed.mts                  seed menu, suppliers, history
src/app/page.tsx                 customer app
src/app/grandma/page.tsx         iPad
src/app/order/[id]/page.tsx      order status and Stripe return
src/app/api/**/route.ts          backend routes listed above
src/components/                  GrandmaAvatar, TalkToGrandma, Menu, Cart, VotePanel, SuggestionBox, LoyaltyBadge, LangPicker, QuipTicker
src/components/grandma/          OrderBoard, Till, FeedbackFeed, SummaryCard, PlanCard, HelperPanel
src/lib/db/{schema,index}.ts     Drizzle + libsql
src/lib/brain/{llm,plan,directive,summary}.ts
src/lib/{elevenlabs,stripe,customer}.ts
src/lib/i18n/strings.ts          UI strings, 4 languages
src/persona/{customer-grandma.md,grandma-helper.md,config.json,menu.json,suppliers.json,quips.json}
src/hooks/                       useCustomer, useCart, useOrders, useVotes, useSuggestions, useBrain, useGrandmaVoice
public/grandma/*.png             the team's artwork layers
data/grandma.db                  gitignored
.env.example
```

Every file stays under 500 lines. No secrets committed.

## Environment

```
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_CUSTOMER=agent_...
ELEVENLABS_AGENT_HELPER=agent_...
GEMINI_API_KEYS=key1,key2
GEMINI_MODEL=gemini-2.5-flash          # swap for the newest Flash listed in AI Studio
ANTHROPIC_API_KEY=                     # optional fallback, claude-opus-5
STRIPE_SECRET_KEY=                     # optional, demo pay when empty
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # set to the tunnel URL for the demo
DATABASE_URL=file:./data/grandma.db
GRANDMA_NAME="Grandma"
```

Gemini key: aistudio.google.com/apikey, signed in as the account that paid on June 13, 2026.
Check the key has no referrer or IP restriction, since the Brain calls from the server.

## 30-minute MVP build order

| Minute | Step | Done when |
|---|---|---|
| 0-5 | Scaffold Next app in scratchpad, copy into repo, add deps, `.env.example`, `.gitignore`, write `docs/MANIFEST.md` | `pnpm dev` serves a page |
| 5-10 | Schema, libsql client, seed data, `pnpm db:push && pnpm db:seed` | `sqlite3 data/grandma.db "select count(*) from menu_items"` returns 12 |
| 10-18 | API routes, hooks, customer skeleton: avatar harness (placeholder image until the drawing lands), menu, cart, demo pay, vote, suggestion, loyalty | Order placed on `/` shows in `GET /api/orders` |
| 18-25 | `/grandma` skeleton tabs: Orders board (poll), Till, Customers feed, Helper with Plan card | Order appears on the iPad within 3 s; "Make my plan" shows a seeded plan |
| 25-30 | Brain `llm.ts` + `plan.ts` + `summary.ts` on Gemini; `create-agents.ts`; wire `TalkToGrandma` in text mode | Directive "push puddings" changes the plan; typed chat with Grandma logs a suggestion and adds points |

Voice goes live the moment the agent IDs land in `.env`; a teammate can create the agents from the
dashboard in parallel if the script hits a snag.

## Frontend contract (so the team's designs plug in)

The skeleton is deliberately plain. Each screen region is one component that takes data in and
calls back out, and all data flows through hooks, so restyling never touches wiring.

| Hook | Returns | Actions |
|---|---|---|
| `useCustomer()` | id, name, lang, points | `setName`, `setLang` |
| `useCart()` | items, total | `add`, `remove`, `clear`, `checkout()` returns order id or Stripe URL |
| `useOrders(filter)` | orders, polling every 3 s | `advance(id)`, `undo(id)`, `createTillOrder(items, paidHow)` |
| `useVotes()` | options, tally, myVote | `vote(option)` |
| `useSuggestions()` | list | `submit(text)` |
| `useBrain()` | plan, summary, loading, error | `makePlan()`, `sendDirective(text)`, `approvePlan()`, `refreshSummary()` |
| `useGrandmaVoice(agent)` | status, mode, isSpeaking, volume, transcript | `start()`, `stop()`, `sendText()` |

Components and their props:

- `GrandmaAvatar({ state, volume })` where state is idle, listening, speaking, or thinking.
- `TalkToGrandma({ agent: "customer" | "helper", lang, clientTools })` renders the start button, text toggle, and transcript; the team can replace its markup and keep the hook.
- `Menu({ items, lang, onAdd })`, `Cart({ items, total, onCheckout })`, `VotePanel({ options, tally, myVote, onVote })`, `SuggestionBox({ onSubmit })`, `LoyaltyBadge({ points })`, `LangPicker({ lang, onChange })`, `QuipTicker({ quips })`.
- iPad: `OrderBoard({ orders, onAdvance, onUndo })`, `Till({ menu, onCreate })`, `FeedbackFeed({ votes, suggestions, requests, topSellers })`, `SummaryCard({ summary, onRefresh })`, `PlanCard({ plan, onApprove, onTellMeMore })`, `HelperPanel({ ...TalkToGrandma props })`.

When mockups are ready, hand over screenshots or a Figma export and the skeleton gets restyled
to match, one component at a time.

## Team lanes (merge cleanly, each owns its folders)

- **Lane A, Customer design and styling** (team): mockups, then styling `src/app/page.tsx` and `src/components/*`; artwork layers into `public/grandma/`.
- **Lane B, Grandma iPad design and styling** (team): mockups, then styling `src/app/grandma/*` and `src/components/grandma/*`, accessibility pass.
- **Lane C, Backend, Brain, voice, and the functional skeleton** (this build): `src/lib/*`, `src/hooks/*`, `src/app/api/*`, `scripts/*`, personas, Stripe, agents, plus unstyled working versions of every component above.

Nothing in Lane C waits on a mockup. Nothing in A or B waits on Lane C beyond the contract table.

## Phase 2, in priority order

1. **Voice and avatar polish**: half-mouth and blink layers, separate head bob, language auto-detect, first message per language, "Grandma is resting her voice" fallback to `/api/chat` when credits run out.
2. **Real Stripe test mode**: paste key, test card 4242 4242 4242 4242, receipt on the order page.
3. **Auto summaries**: iPad asks the Brain every 30 minutes, optional "read it to me" through ElevenLabs TTS.
4. **Noisy-data guardrails**: per-customer daily caps on votes, suggestions, and chat points; near-duplicate suggestion merging; chat signals weighted below purchases; hype flags in the plan.
5. **Ramp**: approved plan creates one vendor per supplier and one bill per supplier in the Ramp sandbox; iPad shows "Bills ready in Ramp, approve?"; transactions feed back as actual spend for cross-matching.
6. **Word of mouth**: QR code on the iPad and counter ("Scan to talk to Grandma, earn points"), share button with `?ref=` referral points.
7. **Post-call webhook**: ElevenLabs sends transcripts, Gemini extracts requests and sentiment server-side, better signal than relying on tool calls.
8. **Cloud Run**: `gcloud run deploy --source .` plus a Turso database URL for a permanent demo link.
9. **Identity claim**: phone number ties points across devices.

## Edge cases handled in the MVP

- No mic permission or loud room: text toggle is always visible.
- ElevenLabs credits exhausted or agent start fails: friendly message, text chat falls back to `/api/chat` on Gemini.
- Gemini quota: second key, then Claude if set, then "Brain is napping" with the last plan kept.
- No Stripe key: demo pay. Stripe return page verifies the session server-side, no webhook needed.
- Double taps on the order board: status transitions are idempotent, undo for 10 s.
- Unknown allergen: Grandma never guesses.
- Vote spam: one vote per customer per month, upsert.
- Cleared browser storage: points are lost for that customer; acceptable until phase 2 identity.
- Language mismatch: the agent only speaks languages enabled in its config; the picker lists exactly those four.
- iPad audio: sessions start only on a tap, which satisfies autoplay rules.

## Verification

1. `pnpm dev`, open `/`, add two items, "Pay (demo)", see pickup code; open `/grandma`, the order appears within 3 s, tap to "ready", undo works.
2. Type to Grandma: "do the mango pies have nuts?" returns the seeded allergen answer; "I wish you made ube cake" logs a suggestion and awards 10 points.
3. `/grandma` Helper: "Make my plan" returns at least 5 ingredient lines with supplier and cost; directive "push puddings this month" raises eggs, milk, and sugar lines and the summary explains why.
4. Customers tab: vote bars reflect the seeded votes; "Update me" produces a three-sentence summary.
5. Voice: with agent IDs set, "Talk to Grandma" asks for the mic, she greets in the picked language, and `voteFlavour` from voice shows in the tally.
6. Tunnel: `cloudflared tunnel --url http://localhost:3000`, open the HTTPS URL on a phone, mic prompt appears.
7. Stripe: with a test key, card 4242 4242 4242 4242 marks the order paid on return.
