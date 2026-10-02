# 04 · The Brain (lane/brain)

Paste as the first prompt in a fresh Claude Code session opened in the `../grandma-brain` worktree.

> You are building the Brain of Grandma's Bakery, a fictional bakery. The Brain turns 30 days of fictional till sales,
> what customers told the talking Grandma, votes, suggestions, and Grandma's own wishes into a buying plan, then
> acts on it: online suppliers get orders sent on Grandma's behalf, in-person suppliers become a shopping list in
> plain language. It also writes Grandma a short note about her day. Read `docs/manifests/00-integration.md`
> first, then this file. Work only inside the files you own.

## Setup

```bash
cp ../Grandma-s-Solution/.env .env && pnpm install && pnpm db:reset && pnpm dev -p 3004
```

## You own

`src/lib/brain/**`, `src/app/api/brain/**`, `src/persona/grandma-helper.md`, `src/persona/suppliers.json`.

## Principle

Numbers come from code. The model parses language and writes language. A Flash-class model never gets to invent a
quantity, a price, or a supplier.

## Modules

### `llm.ts`

`generateJSON<T>({ system, user, schema: ZodSchema<T> }): Promise<T>` and `generateText({ system, messages })`.
Gemini via `@google/genai` (`new GoogleGenAI({ apiKey })`, `ai.models.generateContent({ model, contents, config: {
systemInstruction, responseMimeType: "application/json", temperature } })`), keys from `GEMINI_API_KEYS` tried in
order and rotated on 429 or 5xx, model from `GEMINI_MODEL`. If every key fails and `ANTHROPIC_API_KEY` is set, call
`@anthropic-ai/sdk` `messages.create` with `model: "claude-opus-5"` and the same prompts. Otherwise throw
`BrainUnavailable`. Parse JSON, validate with zod, retry once with the validation error appended to the prompt.

### `plan.ts`, `computePlan({ periodDays, directives })`

1. `baseline`: per menu item, average daily units over the last 7 days of `orders` (all channels, paid) times `periodDays`.
2. `signals`: votes this month, `requests.itemHint`, suggestion keywords mapped to menu slugs or ingredients. A signal
   can move an item's forecast at most plus or minus 20 percent. Purchases dominate.
3. `directives`: active rows apply last as multipliers (`{ item, multiplier }`), no cap.
4. `explode`: forecast times `menu_items.recipe`, summed per ingredient, minus `inventory.onHand`, rounded up to
   supplier pack sizes, priced with `packPrice`. One line per ingredient with the supplier, `orderingMode`, cost.
5. `flags`: hype (requests high, sales low: "try a small batch"), waste (last plan bought far more than sold),
   lead time (supplier `leadDays` longer than days until needed).
6. `explain`: one `generateJSON` call that returns a reason per ingredient line and a 3-sentence summary in Grandma's
   language, given the computed lines, flags, last month's approved plan, and the directives. Store as a draft `plans` row.

### `directive.ts`, `applyDirective(text)`

`generateJSON` parses "I want to push puddings this month" into adjustments
`[{ item: "vanilla-pudding", multiplier: 1.5 }, { item: "chocolate-pudding", multiplier: 1.5 }]` against the menu
slugs, with a `note`. Store in `directives`, then recompute the plan. Unknown items come back with multiplier 1 and a
note so the Helper can ask Grandma what she meant.

### `orders.ts`, `executePlan(planId)`

Marks the plan approved. Groups lines by supplier. For `online` suppliers, "sends" the order: writes a
`supplier_orders` row with status `sent`, a fake confirmation like `TIL-48213`, and a plain-English order text
(what an email to `orderEmail` or a form on `orderUrl` would contain). For `in_person` suppliers, writes status
`listed` with the shopping list grouped by trip (use the supplier `notes`: Tuesday co-op, Saturday market, Kensington
stall). Honour `settings.autoSendOnlineOrders`: `after_approval` (default) or `always`. Phase 2: create a Ramp bill
per supplier (`POST /developer/v1/bills`) when Ramp sandbox credentials exist.

### `summary.ts`, `writeSummary(lang)`

Stats computed in code: today's orders, revenue, top items, new votes, new suggestions, new requests, orders waiting.
One `generateText` call turns them into three warm sentences in Grandma's language with one concrete suggestion.
Store in `summaries`.

### Routes, `src/app/api/brain/`

`plan/route.ts` GET latest plus supplier orders, POST compute. `plan/approve/route.ts`. `directive/route.ts`.
`summary/route.ts` GET latest, POST fresh. Shapes are in the integration manifest.

### `src/persona/grandma-helper.md`

The Helper speaks to Grandma like a trusted apprentice: short, plain, rounded numbers, no jargon, headline first,
details only when asked, confirms before changing the plan or spending money, works in her language. Describe each
client tool and when to call it: `getDailySummary`, `getFeedback`, `getPlan`, `updatePlan({ directive })`,
`approvePlan`, `getOrders({ status })`.

## Order of work

1. `llm.ts` with a tiny CLI check `node --import tsx src/lib/brain/check.ts` that prints a JSON reply (15 min).
2. `plan.ts` steps 1 to 5 with a unit-style script that prints the lines for the seed data (30 min).
3. `explain`, routes, `directive.ts` (25 min). 4. `orders.ts` and approve route (20 min). 5. `summary.ts` (10 min).
6. Helper persona (10 min). 7. Stretch: `crossmatch.ts` hype and duplicate-suggestion merging; Ramp bills.

## Done when

- `POST /api/brain/plan` on seed data returns at least 10 ingredient lines, ube flagged as under-ordered or hyped,
  apples flagged for waste, total cost near last month's.
- `POST /api/brain/directive {"text":"push puddings this month"}` raises eggs, milk, cream, sugar lines, and the
  summary says why in one sentence.
- Approve creates `sent` rows for online suppliers with confirmation numbers and `listed` rows for in-person ones.
- `POST /api/brain/summary {"lang":"zh"}` returns three sentences in Chinese.
- With both Gemini keys wrong, the error is `BrainUnavailable` with a readable message, not a stack trace.
- `pnpm typecheck` and `pnpm build` pass.

## Report back

Branch name, what is done, example plan JSON, prompts you wrote, anything stubbed, Ramp status.
