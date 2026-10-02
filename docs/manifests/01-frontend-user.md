# 01 · Frontend, customer app (lane/frontend-user)

Paste as the first prompt in a fresh Claude Code session opened in the `../grandma-frontend-user` worktree.

> You are building the customer-facing screens of Grandma's Bakery, a fictional three-generation bakery with a
> talking, animated Grandma. Read `docs/manifests/00-integration.md` first, then this file, then `docs/MANIFEST.md`
> for the product story. Work only inside the files you own. Figma designs arrive mid-session; until then make the
> skeleton feel warm and fun, not minimalist.

## Setup

```bash
cp ../Grandma-s-Solution/.env .env && pnpm install && pnpm db:reset && pnpm dev -p 3001
```

## You own

`src/app/page.tsx`, `src/app/order/[id]/page.tsx`, `src/app/globals.css`, `src/components/*.tsx` (not `grandma/`),
`public/grandma/**` (the artwork layers), `src/persona/customer-grandma.md` (her character), `src/persona/quips.json`.

## You consume (do not edit)

Hooks in `src/hooks/` and strings in `src/lib/i18n/strings.ts`. Data only through hooks. If a hook is missing
something, say so in your report and keep going with a local stub.

## Screens

### `/` on a phone first, laptop second

1. **Hero**: `GrandmaAvatar` large, `TalkToGrandma` with a big primary button, a "type instead" toggle, `LangPicker` (EN, ES, ZH, FR). A one-line name field that persists via `useCustomer().setName`.
2. **Grandma says**: `QuipTicker` rotating the quips in the chosen language every 8 s.
3. **Menu**: `Menu` cards with emoji, localized name and description, price, allergen chips from `config.allergenLabels`. Add button at least 48 px.
4. **Your order**: `Cart` sticky at the bottom on mobile. Checkout calls `useCart().checkout()`; if it returns `url`, redirect; else push to `/order/[id]`.
5. **Flavour of the month**: `VotePanel` with four big tappable options and live bars. Voting adds points with a small celebration.
6. **Suggestion box**: `SuggestionBox` single field plus Send. Thank-you line in her voice.
7. **Loyalty**: `LoyaltyBadge` top right, shows points and the redeem rule.

### `/order/[id]`

Pickup code huge, status line that polls every 2 s via `useOrders({ customerId })`, confetti on first load when paid. Button back to Grandma.

## Animating the drawing (`GrandmaAvatar.tsx`)

The artist drops transparent PNGs on one canvas into `public/grandma/`: `base.png` (required), `mouth-open.png`,
`mouth-half.png`, `eyes-closed.png`, `hand-wave.png` (optional). Stack them absolutely. Props: `state` idle, listening,
speaking, thinking; `volume` 0 to 1.

- speaking: pick the mouth layer by volume threshold (0.12 half, 0.3 open), sampled every frame.
- idle: slow bob, blink every 4 s by flashing `eyes-closed.png`.
- listening: slight tilt and scale up with a pulsing ring.
- thinking: tiny sway.
- Missing layers: use `onError` to hide them. With only `base.png`, speaking becomes a squash-and-stretch bounce timed to volume. With no files at all, render a big 👵 with the same motion so the page never looks broken.

## Talking to Grandma (`TalkToGrandma.tsx`)

Wraps `useGrandmaVoice({ agent: "customer", lang, clientTools })`. Shows the start button, a transcript list, the
text input in text mode, and "Grandma is putting on her glasses..." while connecting. Client tools are built in
`page.tsx` from the hooks and passed down; every tool returns a short sentence the agent will read back, e.g.
`Added 2 mango pies. Your order is $13.` Tool names must match the integration manifest exactly.

Her character goes in `src/persona/customer-grandma.md`: warm, nosy in a loving way, proud of three generations,
playful about The Bakery next door (jokes only, never claims about their food safety or people), knows the menu and
allergens cold, answers in the customer's language, one or two sentences per turn, one question at a time, pushes the
flavour vote once per conversation, never gives medical advice, says "let me check in store" for anything not on the menu.
The backend lane injects the menu and pushes this file to ElevenLabs.

## Order of work

1. Avatar harness with the emoji fallback (10 min). 2. Page layout with all seven regions wired to hooks (25 min).
3. Order page (10 min). 4. Persona file (10 min). 5. Apply Figma when it lands, one component at a time.
6. Polish: confetti on order, haptics-like button presses, share button with Web Share API.

## Done when

- A new phone visitor can set a name, read the menu in Chinese, add items, pay (demo), and see a pickup code, with no console errors.
- Typing to Grandma (text mode) logs a suggestion and the points badge updates without a reload.
- Voting shows the new tally immediately and the vote survives reload.
- `pnpm typecheck` and `pnpm build` pass.

## Report back (paste into the integration session)

Branch name, what is done, screenshots or a Loom, any hook or string you need added, anything you stubbed.
