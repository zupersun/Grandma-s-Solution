# Grandma's Bakery

## Try it now

| | Link |
|---|---|
| **Customers** (phone or laptop) | https://tuition-midlands-subaru-characteristic.trycloudflare.com |
| **Grandma's in-store screen** | https://tuition-midlands-subaru-characteristic.trycloudflare.com/grandma |

Open both at once, ideally the first on a phone and the second on a laptop, and watch them talk to each other.

> These are live tunnel links to the demo machine and only work while it is running. Everything
> below runs locally too; see Quick start.

### A 90-second walkthrough

1. **On the phone**, tap a chip such as *Order ahead*. Grandma glides up, starts glowing, and speaks
   in a cloned voice. Allow the microphone and talk to her, or type instead. Try switching to
   한국어 with the globe button and she changes language mid-conversation.
2. **Ask her something real**: "do the pistachio croissants have nuts?" She answers only from the
   menu data and never guesses. Say "I wish you made more ube" and she logs it for the back office.
3. **Order and pay.** You get a pickup code.
4. **Watch Grandma's screen.** Within two seconds a banner announces the order with a chime and the
   card appears on her board. Tap it to move it along; a 10-second Undo appears.
5. **Open her Helper tab** and say, or type, "push puddings this month". The buying plan rewrites
   itself: egg, milk and sugar lines grow, and every line explains itself in a sentence.
6. **Press Approve.** Online suppliers get orders sent for her with confirmation numbers;
   the rest becomes a ticked-off shopping list grouped by which trip she makes.

Bring as many devices as you like. Each keeps its own identity, cart, points and language, and all
of them land on the one screen.

### What is actually happening

- Grandma's voice is an **ElevenLabs agent** with a cloned voice, and her tools write directly to the
  database: adding to a cart, placing an order, recording a vote, logging a request.
- The buying plan is **computed in code** from 30 days of sales, customer requests, votes and
  Grandma's own wishes. The language model only parses what she says and writes the explanations,
  so no quantity or price is ever invented.
- Chat signals can move a forecast by at most 20 percent. Real purchases dominate. Grandma's
  directives override everything.
- If voice is unavailable or the plan's concurrency cap is reached, customers fall back to typing to
  Grandma on Gemini. Nobody sees an error.

All data is fictional: suppliers, customers, past conversations and sales history are seeded.

Grandma's Bakery has run for three generations. "The Bakery" opened next door and sells
suspiciously similar goods. This gives Grandma two things she didn't have:

1. **A reason customers come to her** — a talking, animated Grandma they chat with on their
   phone, order ahead from, earn loyalty points with, and vote with.
2. **A brain for the back office** — an agent that turns orders, chat signals, and Grandma's
   own wishes into a monthly buying plan, explained in plain language.

Next.js 16 · TypeScript · Tailwind v4 · Drizzle + SQLite · ElevenLabs Agents · Gemini

## Quick start

```bash
pnpm install
cp .env.example .env        # fill in the keys below
pnpm db:push && pnpm db:seed
pnpm agents:create          # pushes personas to ElevenLabs, prints agent IDs for .env
pnpm dev
```

Open `/` for the customer app and `/grandma` for Grandma's iPad.

## Environment

| Var | Required | Notes |
|---|---|---|
| `ELEVENLABS_API_KEY` | yes | Profile → API keys |
| `ELEVENLABS_AGENT_CUSTOMER` / `_HELPER` | yes | Printed by `pnpm agents:create` |
| `ELEVENLABS_VOICE_CUSTOMER` / `_HELPER` | no | Empty falls back to the stock voices in `config.json` |
| `GEMINI_API_KEYS` | yes | Comma-separated; tried in order, rotated on quota errors |
| `GEMINI_MODEL` | yes | `gemini-2.5-flash` |
| `ANTHROPIC_API_KEY` | no | Fallback when every Gemini key fails |
| `STRIPE_SECRET_KEY` | no | Empty gives the "Pay (demo)" button |
| `NEXT_PUBLIC_BASE_URL` | yes | Set to the tunnel URL for a demo so Stripe and QR links resolve |
| `DATABASE_URL` | yes | `file:./data/grandma.db` |
| `DATABASE_AUTH_TOKEN` | no | Only for a remote Turso database |
| `GRANDMA_NAME` | yes | Defaults to `Grandma` |

## Surfaces

- **`/` — customer app.** Animated Grandma, voice or text, menu with allergen chips, order
  ahead with a pickup code, loyalty points, flavour-of-the-month vote, suggestion box.
- **`/grandma` — the iPad.** Orders board (polls every 2 s), Till, customer feedback, and the
  Helper, who holds the buying plan and takes directives like "push puddings this month".
- **`/api/*` — backend and Brain.** Quantities are computed in code; the LLM only parses
  directives and writes explanations, so the plan is deterministic and never invented.

English, 中文, 한국어, and Tiếng Việt throughout.

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm db:reset` | Drop, push, and reseed the database |
| `pnpm agents:create` | Push personas to ElevenLabs — re-run after editing a persona or the menu |
| `pnpm tunnel` | `cloudflared` HTTPS URL, needed for phone mics |
| `pnpm smoke` | End-to-end check against a running dev server |
| `pnpm typecheck` | `tsc --noEmit` |

## Layout

```
docs/MANIFEST.md     the full build manifest
scripts/             seed, create-agents, smoke
src/app/api/         backend routes
src/lib/brain/       plan, directive, summary, llm
src/persona/         system prompts, menu, suppliers, config
public/grandma/      avatar layers: base.png required, the rest optional
```

Every file stays under 500 lines. No secrets committed.
