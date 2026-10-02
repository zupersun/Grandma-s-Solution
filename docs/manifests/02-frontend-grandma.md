# 02 · Frontend, Grandma's iPad (lane/frontend-grandma)

Paste as the first prompt in a fresh Claude Code session opened in the `../grandma-frontend-grandma` worktree.

> You are building Grandma's in-store iPad screen for Grandma's Bakery, a fictional bakery. Grandma is not
> tech-savvy, so this screen must be the easiest software she has ever used. Read `docs/manifests/00-integration.md`
> first, then this file, then `docs/MANIFEST.md`. Work only inside the files you own. Figma designs arrive
> mid-session; until then build it big, warm, and obvious.

## Setup

```bash
cp ../Grandma-s-Solution/.env .env && pnpm install && pnpm db:reset && pnpm dev -p 3002
```

Test in Safari responsive mode at iPad size (1024 x 768 landscape and portrait).

## You own

`src/app/grandma/**` and `src/components/grandma/**`.

## You consume (do not edit)

Hooks in `src/hooks/`, strings in `src/lib/i18n/strings.ts`, `TalkToGrandma` and `GrandmaAvatar` from
`src/components/` (import them, do not restyle them; wrap them). Data only through hooks.

## Accessibility rules (non-negotiable)

Touch targets 56 px or larger. Base font 20 px, headings 28 px plus. Warm high-contrast palette. Four top-level
tabs, nothing deeper than one tap except "Tell me more". Plain words, rounded numbers, no jargon, no abbreviations.
One question at a time. Confirm before anything that spends money. Undo for every status change. Voice available
wherever there is typing. Keep the screen awake with `navigator.wakeLock` when available.

## Screen: `/grandma`, four tabs

1. **Orders** (`OrderBoard`): three columns or stacked groups New, Making, Ready. Each card: pickup code huge, items with
   quantities, customer first name, minutes since placed, note if any. Tap the card to advance; a 10 s "Undo" toast
   appears. New orders arrive by polling every 2 s via `useOrders({ status: ["new", "making", "ready"], pollMs: 2000 })`;
   play a soft chime and flash the card when a new one appears. Picked-up orders disappear.
2. **Till** (`Till`): menu grid with emoji and price, tap to add, running list with totals, two buttons: "Paid at counter" and
   "Card". Both call `useOrders().createTillOrder(items, paidHow)`. Shows the pickup code for 5 s then resets.
3. **Customers** (`FeedbackFeed` and `SummaryCard`): vote tally as big bars; "People asked Grandma for" list from
   `useRequests`; suggestions from `useSuggestions`; today's top sellers and order count from `useStats`. At the top,
   `SummaryCard` with the latest Brain note and an "Update me" button; re-fetch every 30 min while the tab is open.
4. **Helper** (`HelperPanel` and `PlanCard`): "Talk to your helper" using `TalkToGrandma` with `agent: "helper"` and the
   helper client tools built from `useBrain` and `useOrders`. Below, the plan: a headline ("Buy about $1,100 of
   ingredients for the next month"), then one row per ingredient: name, quantity, supplier, cost, a one-line reason.
   Online suppliers get a "will be ordered for you" tag; in-person suppliers group into shopping lists titled by
   trip ("Tuesday, Dairyland Co-op", "Saturday market, Sunny Side Eggs"). Buttons: "Make my plan", "Approve"
   (confirm dialog, then shows sent confirmations and the printable list), "Tell me more" expands reasons and flags.
   A text field "Tell your helper something" sends `useBrain().sendDirective` for when voice is off.

## Order of work

1. Tabs shell and Orders board with polling and undo (25 min). 2. Till (15 min). 3. Customers tab (15 min).
4. Helper tab with PlanCard, directive field, and voice (25 min). 5. Apply Figma when it lands.
6. Polish: chime, wake lock, large print mode toggle, Grandma's language setting.

## Done when

- An order placed from another browser appears on the board within 2 s without a reload; tapping advances it; undo works.
- Till creates a paid order that shows on the board and in `/api/orders`.
- Customers tab shows seeded votes, requests, suggestions, and the summary; "Update me" produces a new note.
- Helper: "Make my plan" renders a plan; typing "push puddings this month" changes it; Approve shows sent and listed orders.
- `pnpm typecheck` and `pnpm build` pass.

## Report back

Branch name, what is done, screenshots at iPad size, hooks or strings you need, anything stubbed.
