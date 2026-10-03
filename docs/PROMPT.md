# Prompt: rebuild "Grandma's Bakeria" (customer voice-chat prototype)

> **How to use:** paste everything below the line into Claude and attach the 11 files in `docs/replicate/assets/`.
> If Claude can read this repo, point it at `docs/replicate/` instead. The spec comes first; the complete
> working source is at the end as the source of truth for any value the spec doesn't spell out.

---

You are rebuilding a clickable mobile prototype called **Grandma's Bakeria**. It is the customer-facing screen of a
small family bakery app. Customers tap a chip and **talk to an illustrated Grandma** who answers out loud, with
lip-sync and streaming captions. Build it as **one self-contained HTML file** (vanilla JS + CSS, no build step, no
framework) at a fixed **402 × 874 px** phone size (iPhone 17), centred on the page. If you are building it as a Claude
Design canvas instead, use the `.dc.html` reference at the end almost unchanged.

Reproduce the details exactly. Every number below came from the Figma file or was tuned by hand, and several rules
exist because a simpler version looked wrong (they are marked **Why**).

## 1. Assets (attached; use them exactly, never redraw)

| File | What | Notes |
|---|---|---|
| `grandma.png` | Grandma, mouth closed (square, transparent) | Main avatar |
| `grandma-talking.png` | Grandma, mouth open | **Pixel-aligned with `grandma.png`**: same canvas and pose. Stack them at the *same* position |
| `shelves.png` | Hand-drawn bakery shelves (square, transparent bottom half) | Home background |
| `awning.svg` | Red/cream striped curtain awning, 489×251 | Home top |
| `logo.png` | "Grandma's Bakeria" wordmark (≈3.41:1) | Voice-chat header only |
| `cookie.svg`, `chefhat.svg`, `heart.svg`, `question.svg` | Chip icons | `chefhat.svg` is used twice |
| `globe.svg` | Language icon, home | 24×24 |
| `globe-header.svg` | Language icon, voice header | 24×24 |

## 2. Look

- **Font:** Hanken Grotesk (Google Fonts, weights 400/600/700) everywhere.
- **Colours:**
  - background `#f9f8f7`
  - body text `#2b2222`
  - chip text `#5a5959`
  - hairline borders `#d9d9d9`
  - brand maroon `#5a1a1f`
  - listening red `#a3243b`
  - Grandma's chat bubble `#f6f1eb`
  - pressed-chip tint `#f6efe6` with border `#e6d6c3`
- **Chip style:**
  - text 16px semibold, letter-spacing −0.16px, `#5a5959`
  - padding 8px 12px, border 0.75px `#d9d9d9`, radius 18px
  - icon and text 6px apart; the cookie icon is 10.969px, the others 13.5px
  - The chip group sits at 80% opacity, wrapping with gaps of 8px between rows and 4px between chips.

## 3. Home screen (Figma frame "iPhone 17 - 1"; absolute positions in the 402×874 frame)

Draw it in this order, back to front:
1. **Shelves:** `shelves.png` at left 0, top 264.63, 402×402, object-fit cover.
2. **Chips:** left 48, right 48, top 579, flex-wrap, in this order:
   1. 🍪 cookie, **Order ahead**
   2. chef hat, **Suggest a recipe**
   3. chef hat, **Ask about ingredients/allergens**
   4. heart, **Give a compliment to Grandma**
   5. question mark, **Ask anything!**
3. **Globe button:** left 192, top 804, 24×24. It opens the language sheet.
4. **Welcome bubble:** centred, top 170. It is a white speech bubble:
   - 0.75px `#d9d9d9` border, radius 18, padding 8px 14px
   - text 16px semibold maroon, with a faint shadow `0 2px 8px rgba(90,26,31,.06)`
   - a 10px rotated-square tail pointing down at Grandma's head
   - It says "Come in, dear! What can I bake for you?" (translated in §8).
5. **Awning:** `awning.svg` at left −85, top −90, 489×251, on top of everything on this screen.
6. **Grandma** is **not** part of this screen; she lives in the shared layer (§5). On the home screen her window is
   left 69, top 219, 264×311.

There is no logo on the home screen.

## 4. Voice-chat screen (not in Figma; same visual language)

This is a flex column with padding 56px 24px 32px:
- **Header** (44px tall, space-between):
  - a back button: 44px circle, 0.75px `#d9d9d9` border, white, with a chevron
  - `logo.png` at 107×31.4
  - a globe button, 44×44
- **Avatar slot:** margin-top 28, an empty 200×196 placeholder where the shared Grandma layer lands.
- **Status line** 12px below it: 15px semibold maroon. It reads "Grandma is talking…", "Listening… go ahead,
  dear" or "Tap the mic to talk to Grandma".
- **Transcript** (flex 1, scrolls, gap 10, auto-scrolls to the bottom), line-height 1.4:
  - Grandma's bubbles: left-aligned, `#f6f1eb`, 17px, radius 18 18 18 4
  - customer bubbles: right-aligned, maroon with white text, 15px, radius 18 18 4 18
  - Both are at most 82% wide, with padding 10px 14px.
- **Controls** (centred column, gap 14):
  - **Mic button:** 76px maroon circle with shadow `0 6px 18px rgba(90,26,31,.28)`. It shows a mic icon, or turns
    `#a3243b` with a stop square while listening.
  - **Typing row:** a 44px pill input ("Or type to Grandma…") and a maroon **Send** pill.
- **Mic fallback:** if the mic isn't available, show a 13px note: "The microphone isn't available here, so type
  instead."

**Language sheet:** a bottom sheet over a `rgba(43,34,34,.35)` backdrop (tap the backdrop to close).
- The sheet has 24px top corners, a drag handle and a "Language" title.
- Its rows are 52px tall: English, Español, Tiếng Việt, 中文. The selected row has a 1.5px maroon border, a `#fbf3f3`
  fill and a check icon.
- Picking a language switches every label, Grandma's lines and her speech voice (`en-US`, `es-ES`, `vi-VN`, `zh-CN`).

## 5. Grandma: one shared layer, gliding between screens

Grandma is drawn **once**, in an absolutely positioned layer above both screens (`pointer-events: none`). It holds a
clipping window containing the two stacked avatar images:

| | Window (left, top, w×h) | Both images inside window (left, top, size) |
|---|---|---|
| Home | 69, 219, 264×311 | −101.5, −72.37, 512×512 |
| Voice | 101, 136, 200×188 | −41.5, −43.7, 310×310 |

- **Glide:** going home → voice, animate left/top/width/height of the window and the images over **400ms**
  `cubic-bezier(0.22,1,0.36,1)`. Going back takes **350ms** (closing is faster than opening).
- **Bottom fade:**
  - **Voice:** the window has a mask fade, `linear-gradient(to bottom, #000 78%, transparent 100%)`.
  - **Home:** no mask fade. Instead, a 48px gradient from transparent to `#f9f8f7` covers her bottom edge and fades
    out as she glides to the chat.
  - Animate the mask with a registered custom property: `@property --gm-fade` <percentage>, home 122%, voice 78%.
- **Glow (voice only):** a `drop-shadow` filter on the layer's wrapper, so it hugs her **silhouette**, not a circle.
  - **Idle:** `drop-shadow(0 0 5px rgba(226,200,166,.45)) drop-shadow(0 0 12px rgba(226,200,166,.25))`.
  - **Talking:** warm beige, breathing over 1.4s, from `6px/16px @ rgba(226,190,140,.7/.4)` to
    `9px/24px @ .9/.55`.
  - **Listening:** the same in pink `rgba(240,180,188,…)`, over 0.9s.
  - On home there is no glow; it transitions from zero-radius transparent shadows.
- **Mouth:** `grandma.png` stays **fully opaque at all times**. Only `grandma-talking.png` on top fades between
  opacity 0 and 1, over 140ms ease-in-out.
  - **Why:** crossfading both images made her silhouette briefly translucent, which made the glow flash on every
    mouth move.
  - **Why:** never offset the talking image. Figma happens to place the two frames 22.5px apart, but the artwork is
    pixel-aligned, and the offset made her jump sideways on every syllable.

## 6. Screen transition (transitions.dev "Page side-by-side")

The home and voice screens are two absolutely stacked pages inside a container with `data-page="1|2"`.
- **Inactive page:** opacity 0, `translateX(∓8px)` (home moves −8, voice +8), `blur(3px)`, pointer-events none.
- **Active page:** opacity 1, translateX(0), blur(0).
- **Timing:** opacity, transform and filter all transition over 250ms `cubic-bezier(0.22,1,0.36,1)`.
- **Grandma's layer** is outside the pages, so she stays put and glides while the screen changes around her.

## 7. Talking: speech, lip-sync and streaming captions

- **Speech:** the browser's `speechSynthesis`, rate 0.92, pitch 1.05, in the current language.
- **Mouth plan:** build it from the reply text (`buildMouthPlan`, verbatim in the source). Tokenise into words; CJK
  counts each character as a word. Then:
  - **Per word:** open once, or twice for words of 3 or more vowel groups. Hold open 180ms (140ms each when twice;
    150ms for a CJK character), then close for 95ms (80ms for CJK).
  - **Rests:** 40ms after a space, 220ms after a comma, 380ms after a full stop.
  - **Variation and pace:** every duration is jittered ×0.85–1.15 and divided by the speech rate.
  - Each word records its first step index and its text segment (to the next word, so punctuation rides along).
- **Start:** begin the plan on the utterance's `onstart`, not when it's queued.
- **Resync:** on every `onboundary` word event, jump the plan to that word.
- **Fallback:** if `onstart` hasn't fired within 1.5s, or there is no `speechSynthesis`, run the plan silently and
  finish after `plan.total + 200ms`.
- **Captions** (transitions.dev "Streaming text"):
  - Each word segment is a span: opacity 0 + `blur(1px)` → `.is-in` opacity 1 + blur 0, over 350ms
    `cubic-bezier(0.22,1,0.36,1)`.
  - Reveal one word every **60ms** from the moment speech starts, so the text runs well ahead of the voice and reads
    quickly.
  - The bubble carries `aria-label` with the full text; the spans are `aria-hidden`.
  - The customer's own bubble appears instantly.
- **Mic:** `SpeechRecognition` / `webkitSpeechRecognition`, `interimResults: false`, in the current language. The
  result is sent as the customer's message. On error or no support, show the mic note and use typing.
- **Customer message:** Grandma replies 500ms later with `grandmaReply()`.
  - **English:** keyword answers first: nuts, gluten/wheat, dairy/vegan, menu, "The Bakery" teasing, and hours
    (the hours are a `[OPENING HOURS]` placeholder).
  - **Otherwise:** the topic's scripted replies, step by step.

## 8. Copy (all four languages)

Use the `LANGS` object in the reference source **verbatim**. For every language it holds:
- the chip labels and the welcome line
- the status lines, input placeholder, Send, Back and Language labels, and the mic labels and note
- Grandma's opening line for each chip topic (`order`, `recipe`, `allergens`, `compliment`, `ask`)
- the scripted replies for each topic

Tone: warm, cosy, brief grandma ("dear", "sweetheart"). The occasional joke at The Bakery is gentle and never makes
factual claims about them.

## 9. Tap states and motion (transitions.dev motion tokens; match on usage, not the nearest number)

```
--duration-quick 150ms  --duration-fast 250ms  --duration-medium 350ms  --duration-slow 400ms
--duration-very-slow 500ms  --ease-smooth-out cubic-bezier(0.22,1,0.36,1)  --ease-in-out ease-in-out
--ease-bounce-strong cubic-bezier(0.34,3.85,0.64,1)  --scale-medium 0.97  --distance-micro 4px
--distance-medium 12px  --blur-medium 3px  --like-pop 350ms  --like-pop-ease cubic-bezier(0.34,1.96,0.64,1)
```
- **Press (chips and all buttons):** scale 0.97 over 150ms smooth-out, and chips also take the warm tint.
  **Release:** springs back over 250ms `--ease-bounce-strong`. Turn off the tap highlight. No hover states; this is a
  touch UI.
- **Unique icon move per chip on tap** (each 250ms ease-in-out unless noted):
  - Order ahead: the cookie **wobbles** (rotate −12° → 10° → 0).
  - Suggest a recipe: the chef hat **hops** up 4px.
  - Ask about ingredients: the chef hat **sniffs** (±1.5px and ±8°, side to side).
  - Ask anything: the question mark **tilts** to −15°.
  - Give a compliment: the heart **pops** 1 → 0.82 → 1 over 350ms with the like-pop ease.
  - Open the voice chat only **after** the icon move finishes (250ms, or 350ms for the heart), and ignore taps
    meanwhile.
- **Mic:** its shadow shrinks while pressed.
- **Welcome bubble:** rises in on load over 500ms smooth-out after a 200ms delay, from translateY(12px) +
  `blur(3px)` + opacity 0.
- **Reduced motion** (`prefers-reduced-motion: reduce`):
  - no scaling, icon moves, glide, page slide, glow breathing or bubble rise
  - captions appear all at once, and the mouth stays open while she speaks
  - colour tints still apply

## 10. Accessibility

- Use real `<button>` and `<input>` + `<label>`; give icon-only buttons an `aria-label`.
- The status line uses `role="status"`, and the transcript `aria-live="polite"`.
- The inactive page gets `aria-hidden="true"`.
- Images: Grandma's still image has alt text; decorative images use `alt=""`.

## 11. Done when

- **Home matches the Figma frame:**
  - the awning hangs at the top, the welcome bubble sits above her head, and the shelves sit behind her
  - five chips wrap as: Order ahead + Suggest a recipe / ingredients / compliment / Ask anything
  - the globe is at the bottom
- **A chip tap** plays its icon move, then the UI slides and blurs over to the chat while Grandma glides up,
  shrinks, and starts to glow.
- **She speaks her opener aloud:**
  - her mouth opens about once per word, smoothly, with no sideways jumping and no glow flicker
  - captions stream in quickly, word by word
- **Mic and typing** both work; the back button reverses everything.
- **The language sheet** switches every string and the voice.

## 12. Reference implementation (source of truth)

The complete working source follows. It is a Claude Design canvas artboard (`.dc.html`):
- `{{name}}` holes are filled from `renderVals()`.
- `<sc-if>` and `<sc-for>` are conditionals and loops.
- `class Component extends DCLogic` is a React class component without `render()`.

For a plain HTML build, keep the CSS as-is and port the markup and logic. Asset paths point at `../assets/`.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Grandma's Bakeria</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&amp;display=swap">
<style>
body{margin:0}
a{color:#5a1a1f}a:hover{color:#3d0f13}
/* Motion tokens from transitions.dev (transitions-polish _root.css), only the ones used here */
:root{--duration-very-slow:500ms;--distance-medium:12px;--blur-medium:3px;--duration-quick:150ms;--duration-fast:250ms;--duration-medium:350ms;--duration-slow:400ms;--ease-smooth-out:cubic-bezier(0.22,1,0.36,1);--ease-in-out:ease-in-out;--ease-bounce-strong:cubic-bezier(0.34,3.85,0.64,1);--distance-micro:4px;--scale-medium:0.97;--like-pop:350ms;--like-pop-ease:cubic-bezier(0.34,1.96,0.64,1)}
/* Press = "hover in": quick + direct. Release = "hover out": softer, springy settle. */
.gm-chip{cursor:pointer;background:#ffffff;font:inherit;-webkit-tap-highlight-color:transparent;transition:transform var(--duration-fast) var(--ease-bounce-strong),background-color var(--duration-quick) var(--ease-smooth-out),border-color var(--duration-quick) var(--ease-smooth-out)}
.gm-chip:active,.gm-chip.is-tapped{transform:scale(var(--scale-medium));background:#f6efe6;border-color:#e6d6c3 !important;transition-duration:var(--duration-quick);transition-timing-function:var(--ease-smooth-out)}
.gm-chip.is-tapped .gm-ico{transform-origin:50% 60%}
/* Icon moves follow the icon-swap token (250ms, ease-in-out); the heart uses the like-button pop. */
.gm-chip--order.is-tapped .gm-ico{animation:gm-wobble var(--duration-fast) var(--ease-in-out)}
.gm-chip--recipe.is-tapped .gm-ico{animation:gm-bounce var(--duration-fast) var(--ease-in-out)}
.gm-chip--compliment.is-tapped .gm-ico{animation:gm-beat var(--like-pop) var(--like-pop-ease)}
.gm-chip--ask.is-tapped .gm-ico{animation:gm-tilt var(--duration-fast) var(--ease-in-out)}
.gm-chip--allergens.is-tapped .gm-ico{animation:gm-sniff var(--duration-fast) var(--ease-in-out)}
@keyframes gm-wobble{0%{transform:rotate(0)}30%{transform:rotate(-12deg)}65%{transform:rotate(10deg)}100%{transform:rotate(0)}}
@keyframes gm-bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(calc(var(--distance-micro) * -1))}}
@keyframes gm-beat{0%{transform:scale(1)}30%{transform:scale(0.82)}100%{transform:scale(1)}}
@keyframes gm-sniff{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-1.5px) rotate(-8deg)}75%{transform:translateX(1.5px) rotate(8deg)}}
@keyframes gm-tilt{0%,100%{transform:rotate(0)}45%{transform:rotate(-15deg)}}
.gm-hello{animation:gm-hello-in var(--duration-very-slow) var(--ease-smooth-out) 200ms both}
@keyframes gm-hello-in{from{opacity:0;transform:translateY(var(--distance-medium));filter:blur(var(--blur-medium))}to{opacity:1;transform:translateY(0);filter:blur(0)}}
@media (prefers-reduced-motion: reduce){.gm-hello{animation:none}}
.gm-press{-webkit-tap-highlight-color:transparent;transition:transform var(--duration-fast) var(--ease-bounce-strong),box-shadow var(--duration-fast) var(--ease-smooth-out)}
.gm-press:active{transform:scale(var(--scale-medium));transition-duration:var(--duration-quick);transition-timing-function:var(--ease-smooth-out)}
.gm-mic:active{box-shadow:0 2px 8px rgba(90,26,31,.22) !important}
@media (prefers-reduced-motion: reduce){.gm-chip,.gm-press{transition:background-color var(--duration-quick) var(--ease-smooth-out)}.gm-chip:active,.gm-chip.is-tapped,.gm-press:active{transform:none}.gm-chip.is-tapped .gm-ico{animation:none}}
/* Shared Grandma layer: she stays put while the UI swaps, gliding from her home spot to the chat spot.
   Position change -> --ease-smooth-out; big travel opens at --duration-slow, closes faster at --duration-medium. */
@property --gm-fade{syntax:'<percentage>';inherits:false;initial-value:122%}
.gm-aura{filter:drop-shadow(0 0 0 rgba(226,200,166,0)) drop-shadow(0 0 0 rgba(226,200,166,0));transition:filter var(--duration-medium) var(--ease-smooth-out)}
.gm-aura.is-voice{filter:drop-shadow(0 0 5px rgba(226,200,166,.45)) drop-shadow(0 0 12px rgba(226,200,166,.25));transition-duration:var(--duration-slow)}
.gm-aura.is-voice.on{animation:gm-glow-talk 1.4s ease-in-out infinite}
.gm-aura.is-voice.listen{animation:gm-glow-listen .9s ease-in-out infinite}
@keyframes gm-glow-talk{0%,100%{filter:drop-shadow(0 0 6px rgba(226,190,140,.7)) drop-shadow(0 0 16px rgba(226,190,140,.4))}50%{filter:drop-shadow(0 0 9px rgba(226,190,140,.9)) drop-shadow(0 0 24px rgba(226,190,140,.55))}}
@keyframes gm-glow-listen{0%,100%{filter:drop-shadow(0 0 6px rgba(240,180,188,.7)) drop-shadow(0 0 16px rgba(240,180,188,.4))}50%{filter:drop-shadow(0 0 9px rgba(240,180,188,.9)) drop-shadow(0 0 24px rgba(240,180,188,.55))}}
.gm-win{position:absolute;left:69px;top:219px;width:264px;height:311px;overflow:hidden;--gm-fade:122%;-webkit-mask-image:linear-gradient(to bottom,#000 var(--gm-fade),transparent calc(var(--gm-fade) + 22%));mask-image:linear-gradient(to bottom,#000 var(--gm-fade),transparent calc(var(--gm-fade) + 22%));transition:left var(--duration-medium) var(--ease-smooth-out),top var(--duration-medium) var(--ease-smooth-out),width var(--duration-medium) var(--ease-smooth-out),height var(--duration-medium) var(--ease-smooth-out),--gm-fade var(--duration-medium) var(--ease-smooth-out)}
.gm-aura.is-voice .gm-win{left:101px;top:136px;width:200px;height:188px;--gm-fade:78%;transition-duration:var(--duration-slow)}
/* Home: a small background-coloured gradient softens Grandma's bottom edge. In the chat the mask fade takes over, so it fades out. */
.gm-win::after{content:"";position:absolute;left:0;right:0;bottom:0;height:48px;background:linear-gradient(to bottom,rgba(249,248,247,0),#f9f8f7);opacity:1;transition:opacity var(--duration-medium) var(--ease-smooth-out)}
.gm-aura.is-voice .gm-win::after{opacity:0;transition-duration:var(--duration-slow)}
.gm-img{position:absolute;max-width:none;transition:left var(--duration-medium) var(--ease-smooth-out),top var(--duration-medium) var(--ease-smooth-out),width var(--duration-medium) var(--ease-smooth-out),height var(--duration-medium) var(--ease-smooth-out),opacity 140ms ease-in-out}
.gm-aura.is-voice .gm-img{transition-duration:var(--duration-slow),var(--duration-slow),var(--duration-slow),var(--duration-slow),140ms}
/* Figma home frame (512px art); chat = same art at 310px. The still and talking art are pixel-aligned
   in their own canvases, so both share one position: only the mouth changes, she never shifts sideways. */
.gm-img{left:-101.5px;top:-72.37px;width:512px;height:512px}
.gm-img-talk{will-change:opacity}
.gm-aura.is-voice .gm-img{left:-41.5px;top:-43.7px;width:310px;height:310px}
@media (prefers-reduced-motion: reduce){.gm-aura,.gm-win{transition:none}.gm-img{transition:opacity 140ms ease-in-out}.gm-aura.is-voice.on{animation:none;filter:drop-shadow(0 0 8px rgba(226,190,140,.85)) drop-shadow(0 0 20px rgba(226,190,140,.5))}.gm-aura.is-voice.listen{animation:none;filter:drop-shadow(0 0 8px rgba(240,180,188,.85)) drop-shadow(0 0 20px rgba(240,180,188,.5))}}

/* transitions.dev 08 · Page side-by-side (verbatim) */
:root{--page-slide-dur:250ms;--page-fade-dur:250ms;--page-slide-distance:8px;--page-blur:3px;--page-stagger:0ms;--page-exit-enabled:1;--page-slide-ease:cubic-bezier(0.22, 1, 0.36, 1);--page-fade-ease:cubic-bezier(0.22, 1, 0.36, 1)}
.t-page-slide {
  position: relative;
}
.t-page-slide .t-page[data-page-id="1"] {
  --t-page-from-x: calc(var(--page-slide-distance) * -1);
}
.t-page-slide .t-page[data-page-id="2"] {
  --t-page-from-x: var(--page-slide-distance);
}
.t-page-slide .t-page {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transform: translateX(calc(var(--t-page-from-x, 0px) * var(--page-exit-enabled)));
  filter: blur(calc(var(--page-blur) * var(--page-exit-enabled)));
  transition:
    opacity   var(--page-fade-dur)  var(--page-fade-ease),
    transform var(--page-slide-dur) var(--page-slide-ease),
    filter    var(--page-slide-dur) var(--page-slide-ease);
  will-change: opacity, transform, filter;
}
.t-page-slide[data-page="1"] .t-page[data-page-id="1"],
.t-page-slide[data-page="2"] .t-page[data-page-id="2"] {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
  filter: blur(0);
  transition-delay: var(--page-stagger);
}
@media (prefers-reduced-motion: reduce) {
  .t-page-slide .t-page { transition: none !important; }
}

/* transitions.dev 30 · Streaming text (verbatim); words release every --stream-gap once she starts speaking */
:root{--stream-gap:60ms;--stream-fade:350ms;--stream-blur:1px;--stream-ease:cubic-bezier(0.22, 1, 0.36, 1)}
.t-stream-w {
  opacity: 0;
  filter: blur(var(--stream-blur));
  transition:
    opacity var(--stream-fade) var(--stream-ease),
    filter var(--stream-fade) var(--stream-ease);
}
.t-stream-w.is-in {
  opacity: 1;
  filter: blur(0);
}
@media (prefers-reduced-motion: reduce) {
  .t-stream-w { transition: none !important; filter: none !important; opacity: 1 !important; }
}
.gm-scroll::-webkit-scrollbar{width:0}
</style>
</helmet>
<div style="position: relative; width: 402px; height: 874px; overflow: hidden; background: #f9f8f7; font-family: 'Hanken Grotesk', system-ui, sans-serif; color: #2b2222">

<div class="t-page-slide" data-page="{{page}}" style="position: absolute; inset: 0">
<div class="t-page" data-page-id="1" aria-hidden="{{homeHidden}}">
<!-- Figma frame 1:2. Grandma herself is drawn by the shared layer at left 69 / top 219. -->
<img src="../assets/shelves.png" alt="" style="position: absolute; left: 0; top: 264.63px; width: 402px; height: 402px; object-fit: cover; pointer-events: none">
<div style="position: absolute; left: 48px; right: 48px; top: 579px; display: flex; flex-wrap: wrap; gap: 8px 4px; align-items: flex-start; align-content: flex-start; opacity: 0.8">
  <button class="gm-chip gm-chip--order {{orderTap}}" onClick="{{openOrder}}" style="display: flex; align-items: center; justify-content: center; padding: 8px 12px; border: 0.75px solid #d9d9d9; border-radius: 18px">
    <span style="display: flex; gap: 6px; align-items: center">
      <img class="gm-ico" src="../assets/cookie.svg" alt="" width="10.9688" height="10.9688" style="display: block; flex-shrink: 0">
      <span style="font-weight: 600; font-size: 16px; line-height: normal; letter-spacing: -0.16px; color: #5a5959; white-space: nowrap">{{t.order}}</span>
    </span>
  </button>
  <button class="gm-chip gm-chip--recipe {{recipeTap}}" onClick="{{openRecipe}}" style="display: flex; align-items: center; justify-content: center; padding: 8px 12px; border: 0.75px solid #d9d9d9; border-radius: 18px">
    <span style="display: flex; gap: 6px; align-items: center">
      <img class="gm-ico" src="../assets/chefhat.svg" alt="" style="display: block; width: 13.5px; height: 13.5px; flex-shrink: 0">
      <span style="font-weight: 600; font-size: 16px; line-height: normal; letter-spacing: -0.16px; color: #5a5959; white-space: nowrap">{{t.recipe}}</span>
    </span>
  </button>
  <button class="gm-chip gm-chip--allergens {{allergensTap}}" onClick="{{openAllergens}}" style="display: flex; align-items: center; justify-content: center; padding: 8px 12px; border: 0.75px solid #d9d9d9; border-radius: 18px">
    <span style="display: flex; gap: 6px; align-items: center">
      <img class="gm-ico" src="../assets/chefhat.svg" alt="" style="display: block; width: 13.5px; height: 13.5px; flex-shrink: 0">
      <span style="font-weight: 600; font-size: 16px; line-height: normal; letter-spacing: -0.16px; color: #5a5959; white-space: nowrap">{{t.allergens}}</span>
    </span>
  </button>
  <button class="gm-chip gm-chip--compliment {{complimentTap}}" onClick="{{openCompliment}}" style="display: flex; align-items: center; justify-content: center; padding: 8px 12px; border: 0.75px solid #d9d9d9; border-radius: 18px">
    <span style="display: flex; gap: 6px; align-items: center">
      <img class="gm-ico" src="../assets/heart.svg" alt="" style="display: block; width: 13.5px; height: 13.5px; flex-shrink: 0">
      <span style="font-weight: 600; font-size: 16px; line-height: normal; letter-spacing: -0.16px; color: #5a5959; white-space: nowrap">{{t.compliment}}</span>
    </span>
  </button>
  <button class="gm-chip gm-chip--ask {{askTap}}" onClick="{{openAsk}}" style="display: flex; align-items: center; justify-content: center; padding: 8px 12px; border: 0.75px solid #d9d9d9; border-radius: 18px">
    <span style="display: flex; gap: 6px; align-items: center">
      <img class="gm-ico" src="../assets/question.svg" alt="" style="display: block; width: 13.5px; height: 13.5px; flex-shrink: 0">
      <span style="font-weight: 600; font-size: 16px; line-height: normal; letter-spacing: -0.16px; color: #5a5959; white-space: nowrap">{{t.ask}}</span>
    </span>
  </button>
</div>
<button class="gm-press" onClick="{{openSheet}}" aria-label="{{t.language}}" style="position: absolute; left: 192px; top: 804px; display: block; width: 24px; height: 24px; padding: 0; border: 0; background: none; cursor: pointer">
  <img src="../assets/globe.svg" alt="" width="24" height="24" style="display: block">
</button>
<div style="position: absolute; left: 24px; right: 24px; top: 170px; display: flex; justify-content: center; pointer-events: none">
  <p class="gm-hello" style="position: relative; margin: 0; padding: 8px 14px; background: #ffffff; border: 0.75px solid #d9d9d9; border-radius: 18px; font-weight: 600; font-size: 16px; line-height: normal; letter-spacing: -0.16px; color: #5a1a1f; text-align: center; box-shadow: 0 2px 8px rgba(90, 26, 31, 0.06)">{{t.welcome}}<span aria-hidden="true" style="position: absolute; left: 50%; bottom: -6px; width: 10px; height: 10px; margin-left: -5px; background: #ffffff; border-right: 0.75px solid #d9d9d9; border-bottom: 0.75px solid #d9d9d9; transform: rotate(45deg)"></span></p>
</div>
<img src="../assets/awning.svg" alt="" width="489" height="251" style="position: absolute; left: -85px; top: -90px; display: block; pointer-events: none">
</div>

<div class="t-page" data-page-id="2" aria-hidden="{{voiceHidden}}">
<div style="box-sizing: border-box; width: 402px; height: 874px; display: flex; flex-direction: column; padding: 56px 24px 32px">
  <div style="display: flex; align-items: center; justify-content: space-between; height: 44px">
    <button class="gm-press" onClick="{{goHome}}" aria-label="{{t.back}}" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border: 0.75px solid #d9d9d9; border-radius: 22px; background: #ffffff; cursor: pointer">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a5959" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
    </button>
    <img src="../assets/logo.png" alt="Grandma's Bakeria" style="display: block; width: 107px; height: 31.4px; object-fit: cover">
    <button class="gm-press" onClick="{{openSheet}}" aria-label="{{t.language}}" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border: 0; background: none; cursor: pointer">
      <img src="../assets/globe-header.svg" alt="" width="24" height="24" style="display: block">
    </button>
  </div>

  <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 28px">
    <div aria-hidden="true" style="width: 200px; height: 196px"></div>
    <p role="status" style="margin: 0; font-size: 15px; font-weight: 600; color: #5a1a1f">{{statusText}}</p>
  </div>

  <div class="gm-scroll" ref="{{scrollRef}}" aria-live="polite" style="flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 16px 0">
    <sc-for list="{{turns}}" as="turn" hint-placeholder-count="2">
      <div style="{{turn.rowStyle}}">
        <p style="{{turn.bubbleStyle}}" aria-label="{{turn.text}}"><sc-for list="{{turn.words}}" as="w" hint-placeholder-count="6"><span class="{{w.cls}}" aria-hidden="true">{{w.text}}</span></sc-for></p>
      </div>
    </sc-for>
  </div>

  <sc-if value="{{hasMicNote}}" hint-placeholder-val="{{ false }}">
    <p style="margin: 0 0 8px; font-size: 13px; color: #5a5959; text-align: center">{{t.micOff}}</p>
  </sc-if>

  <div style="display: flex; flex-direction: column; align-items: center; gap: 14px">
    <button class="gm-press gm-mic" onClick="{{toggleMic}}" aria-label="{{micAria}}" aria-pressed="{{listening}}" style="{{micStyle}}">
      <sc-if value="{{listening}}" hint-placeholder-val="{{ false }}">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
      </sc-if>
      <sc-if value="{{notListening}}" hint-placeholder-val="{{ true }}">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><path d="M12 18v3"></path></svg>
      </sc-if>
    </button>
    <form onSubmit="{{submitTyped}}" style="display: flex; gap: 8px; width: 100%">
      <label for="gm-type" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">{{t.typeInstead}}</label>
      <input id="gm-type" value="{{typed}}" onChange="{{onType}}" placeholder="{{t.typeInstead}}" autocomplete="off" style="flex: 1; min-width: 0; height: 44px; box-sizing: border-box; padding: 0 16px; border: 0.75px solid #d9d9d9; border-radius: 22px; font: inherit; font-size: 15px; color: #2b2222; background: #ffffff">
      <button class="gm-press" type="submit" style="height: 44px; padding: 0 18px; border: 0; border-radius: 22px; background: #5a1a1f; color: #ffffff; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer">{{t.send}}</button>
    </form>
  </div>
</div>
</div>
</div>

<div class="gm-aura {{auraClass}}" style="position: absolute; inset: 0; pointer-events: none">
  <div class="gm-win">
    <img class="gm-img gm-img-still" src="../assets/grandma.png" alt="Grandma, arms crossed and smiling" style="opacity: {{stillOpacity}}">
    <img class="gm-img gm-img-talk" src="../assets/grandma-talking.png" alt="" style="opacity: {{talkOpacity}}">
  </div>
</div>

<sc-if value="{{sheetOpen}}" hint-placeholder-val="{{ false }}">
<div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; background: rgba(43, 34, 34, 0.35)">
  <button onClick="{{closeSheet}}" aria-label="Close" style="flex: 1; border: 0; background: transparent; cursor: pointer"></button>
  <div role="dialog" aria-label="{{t.language}}" style="background: #ffffff; border-radius: 24px 24px 0 0; padding: 20px 24px 40px; display: flex; flex-direction: column; gap: 8px">
    <div style="width: 40px; height: 4px; border-radius: 2px; background: #d9d9d9; align-self: center; margin-bottom: 8px"></div>
    <p style="margin: 0 0 4px; font-size: 18px; font-weight: 700; color: #2b2222">{{t.language}}</p>
    <sc-for list="{{langs}}" as="lang" hint-placeholder-count="4">
      <button class="gm-press" onClick="{{lang.pick}}" aria-pressed="{{lang.selected}}" style="{{lang.style}}">
        <span>{{lang.label}}</span>
        <sc-if value="{{lang.selected}}" hint-placeholder-val="{{ false }}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a1a1f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"></path></svg>
        </sc-if>
      </button>
    </sc-for>
  </div>
</div>
</sc-if>

</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":402,"height":874}}'>
const MAROON = '#5a1a1f';

const LANGS = {
  en: {
    name: 'English', code: 'en-US',
    order: 'Order ahead', recipe: 'Suggest a recipe', compliment: 'Give a compliment to Grandma', ask: 'Ask anything!', allergens: 'Ask about ingredients/allergens', welcome: 'Come in, dear! What can I bake for you?',
    speaking: 'Grandma is talking…', listening: 'Listening… go ahead, dear', idle: 'Tap the mic to talk to Grandma',
    typeInstead: 'Or type to Grandma…', send: 'Send', back: 'Back to home', language: 'Language',
    micOn: 'Talk to Grandma', micStop: 'Stop listening',
    micOff: 'The microphone isn’t available here, so type instead.',
    open: {
      order: 'Hello dear! What would you like me to set aside for you, and when will you pick it up?',
      recipe: 'Ooh, a recipe idea! Tell me what you’d love me to bake.',
      compliment: 'Aww, you’ll make Grandma blush. Go on, tell me!',
      allergens: 'Of course, dear. Which treat would you like to know about? I’ll tell you exactly what’s in it.',
      ask: 'Ask me anything, sweetheart: what’s fresh today, what’s in it, anything at all.'
    },
    replies: {
      order: ['Lovely, I’ll put that aside for you. What time will you come by?', 'Perfect. It will be wrapped and waiting for you, dear. See you soon!'],
      recipe: ['What a lovely idea! I’ve written it in my recipe book. If enough people ask, it could be next month’s special.'],
      compliment: ['Thank you, sweetheart! That’s going straight on the fridge. You won’t hear that at The Bakery, I’ll bet.'],
      allergens: ['Only the almond cookies have nuts. Everything has wheat, and most have egg and dairy. If it’s serious, please check with me at the counter too, dear.'],
      ask: ['Good question, dear. Ask me about the menu, allergens, or what’s fresh today.']
    }
  },
  es: {
    name: 'Español', code: 'es-ES',
    order: 'Pedir con antelación', recipe: 'Sugerir una receta', compliment: 'Hacer un cumplido a la Abuela', ask: '¡Pregunta lo que sea!', allergens: 'Preguntar por ingredientes/alérgenos', welcome: '¡Pasa, cariño! ¿Qué te horneo hoy?',
    speaking: 'La Abuela está hablando…', listening: 'Te escucho, cariño…', idle: 'Toca el micrófono para hablar con la Abuela',
    typeInstead: 'O escríbele a la Abuela…', send: 'Enviar', back: 'Volver al inicio', language: 'Idioma',
    micOn: 'Hablar con la Abuela', micStop: 'Dejar de escuchar',
    micOff: 'El micrófono no está disponible aquí; escribe tu mensaje.',
    open: {
      order: '¡Hola, cariño! ¿Qué quieres que te guarde y cuándo pasas a recogerlo?',
      recipe: '¡Una idea de receta! Cuéntame qué te gustaría que horneara.',
      compliment: 'Ay, vas a hacer que me sonroje. ¡Cuéntame!',
      allergens: 'Claro, cariño. ¿De qué dulce quieres saber? Te digo exactamente qué lleva.',
      ask: 'Pregúntame lo que quieras, cariño: qué hay hoy, qué lleva, lo que sea.'
    },
    replies: {
      order: ['Perfecto, te lo guardo. ¿A qué hora vienes?', 'Estupendo. Estará envuelto y esperándote. ¡Hasta pronto!'],
      recipe: ['¡Qué buena idea! La apunto en mi libro de recetas.'],
      compliment: ['¡Gracias, cariño! Eso no lo oyes en The Bakery.'],
      allergens: ['Solo las galletas de almendra llevan frutos secos. Todo lleva trigo y casi todo huevo y lácteos. Si es grave, confírmalo conmigo en el mostrador.'],
      ask: ['Buena pregunta. Pregúntame por el menú, los alérgenos o lo que está recién hecho.']
    }
  },
  vi: {
    name: 'Tiếng Việt', code: 'vi-VN',
    order: 'Đặt trước', recipe: 'Gợi ý công thức', compliment: 'Gửi lời khen cho Bà', ask: 'Hỏi gì cũng được!', allergens: 'Hỏi về thành phần/dị ứng', welcome: 'Vào đi con! Hôm nay con muốn ăn bánh gì?',
    speaking: 'Bà đang nói…', listening: 'Bà đang nghe đây con…', idle: 'Chạm vào micro để nói chuyện với Bà',
    typeInstead: 'Hoặc nhắn cho Bà…', send: 'Gửi', back: 'Về trang chủ', language: 'Ngôn ngữ',
    micOn: 'Nói chuyện với Bà', micStop: 'Dừng nghe',
    micOff: 'Micro không dùng được ở đây, con nhắn tin nhé.',
    open: {
      order: 'Chào con! Con muốn Bà để dành bánh gì, và khi nào con ghé lấy?',
      recipe: 'Ồ, công thức mới hả! Con muốn Bà làm bánh gì nào?',
      compliment: 'Trời ơi, con làm Bà ngại quá. Nói Bà nghe đi!',
      allergens: 'Được chứ con. Con muốn hỏi bánh nào? Bà nói rõ trong đó có gì.',
      ask: 'Con cứ hỏi Bà: hôm nay có bánh gì, bánh có gì trong đó, gì cũng được.'
    },
    replies: {
      order: ['Được rồi, Bà để dành cho con. Mấy giờ con ghé?', 'Tuyệt. Bà gói sẵn chờ con nhé!'],
      recipe: ['Ý hay quá! Bà ghi vào sổ công thức rồi.'],
      compliment: ['Cảm ơn con! Bên The Bakery không ai khen vậy đâu.'],
      allergens: ['Chỉ bánh quy hạnh nhân có hạt. Bánh nào cũng có lúa mì, đa số có trứng và sữa. Nếu dị ứng nặng, con hỏi lại Bà ở quầy nhé.'],
      ask: ['Câu hỏi hay đó con. Hỏi Bà về thực đơn, dị ứng, hay bánh mới ra lò nhé.']
    }
  },
  zh: {
    name: '中文', code: 'zh-CN',
    order: '提前预订', recipe: '推荐食谱', compliment: '给外婆一句夸奖', ask: '随便问！', allergens: '问问配料/过敏原', welcome: '快进来，乖孩子！今天想吃点什么？',
    speaking: '外婆在说话…', listening: '外婆在听，你说吧…', idle: '点麦克风和外婆聊天',
    typeInstead: '或者打字给外婆…', send: '发送', back: '返回首页', language: '语言',
    micOn: '和外婆说话', micStop: '停止聆听',
    micOff: '这里用不了麦克风，请打字。',
    open: {
      order: '乖孩子你好！想让外婆给你留点什么？什么时候来拿？',
      recipe: '哦，有新食谱想法！告诉外婆你想吃什么。',
      compliment: '哎呀，外婆要脸红了。说吧！',
      allergens: '当然可以。你想问哪一款？外婆告诉你里面到底有什么。',
      ask: '什么都可以问外婆：今天有什么、里面有什么，都行。'
    },
    replies: {
      order: ['好的，外婆给你留着。几点来拿？', '太好了，包好等你来！'],
      recipe: ['好主意！外婆记在食谱本上了。'],
      compliment: ['谢谢你，乖孩子！The Bakery 可听不到这样的话。'],
      allergens: ['只有杏仁饼干有坚果。所有点心都含小麦，大多数有鸡蛋和乳制品。过敏严重的话，请在柜台再跟我确认。'],
      ask: ['好问题。可以问外婆菜单、过敏原，或者今天新鲜出炉的。']
    }
  }
};

const MENU = 'Today I have mango pie, egg tarts, pandan chiffon cake, coconut buns, red bean mooncakes and almond cookies.';

/** English gets keyword answers; every language falls back to the topic's scripted lines. */
function grandmaReply(text, topic, lang, userTurnsInTopic) {
  const s = text.toLowerCase();
  if (lang === 'en') {
    if (/nut|almond|peanut/.test(s)) return 'Only the almond cookies have nuts, dear. We bake everything in one kitchen though, so if it’s serious, check with me at the counter.';
    if (/gluten|wheat|flour/.test(s)) return 'I’m sorry, dear, all my pastries use wheat flour right now. Leave me a suggestion and I’ll work on a gluten-free one!';
    if (/dairy|milk|lactose|vegan/.test(s)) return 'The pandan chiffon cake and mooncakes have no dairy. Everything else has butter or milk, I’m afraid.';
    if (/menu|have|fresh|today|what.*(good|sell)/.test(s)) return MENU + ' What catches your eye?';
    if (/the bakery|other bakery/.test(s)) return 'The Bakery? Oh sweetheart, their croissants could prop open a door.';
    if (/hour|open|close/.test(s)) return 'I’m open [OPENING HOURS], dear. Come early for the warm egg tarts!';
  }
  const lines = LANGS[lang].replies[topic];
  return lines[Math.min(userTurnsInTopic, lines.length - 1)];
}

/**
 * Turn text into mouth movements: one gentle open per word (two for long words), words get a short
 * rest, commas a longer one and full stops the longest. Durations vary a little so it feels spoken.
 */
function buildMouthPlan(text, rate) {
  const k = 1 / (rate || 1);
  const steps = [];
  const words = [];
  let total = 0;
  const push = (open, ms) => {
    ms = Math.round(ms * k);
    const last = steps[steps.length - 1];
    if (last && last.open === open) last.ms += ms; else steps.push({ open, ms });
    total += ms;
  };
  const jitter = (n) => n * (0.85 + Math.random() * 0.3);
  const re = /([\u3400-\u9fff])|([^\s\u3400-\u9fff.,;:!?\u3002\uff0c\uff01\uff1f\u2026]+)|([.!?\u3002\uff01\uff1f\u2026]+)|([,;:\uff0c]+)|(\s+)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[1] || m[2]) {
      words.push({ char: m.index, step: steps.length });
      // One open per word (two for long words of 3+ syllables); CJK: one per character.
      const syl = m[1] ? 1 : Math.max(1, (m[2].toLowerCase().match(/[aeiouy\u00e0-\u1ef9]+/g) || []).length);
      const opens = syl >= 3 ? 2 : 1;
      // Tuned so a sentence takes about as long as the voice needs to say it (~2.5 words/s, ~4 chars/s).
      const holdOpen = m[1] ? 150 : (opens === 2 ? 140 : 180);
      for (let i = 0; i < opens; i++) {
        push(true, jitter(holdOpen));
        push(false, jitter(m[1] ? 80 : 95));
      }
    } else if (m[3]) push(false, 380);
    else if (m[4]) push(false, 220);
    else if (m[5]) push(false, 40);
  }
  push(false, 0);
  // Each word's segment runs to the next word, so trailing punctuation and spaces ride along.
  words.forEach((w, k) => { w.text = text.slice(k === 0 ? 0 : w.char, k + 1 < words.length ? words[k + 1].char : text.length); });
  if (!words.length) words.push({ char: 0, step: 0, text });
  return { steps, words, total };
}

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { screen: 'home', lang: 'en', sheet: false, topic: 'ask', turns: [], status: 'idle', typed: '', micNote: false, mouthOpen: false, tapped: null, streamTurn: -1, streamShown: 9999 };
    this.scrollEl = null;
    this.rec = null;
  }

  componentDidUpdate() {
    if (this.scrollEl) this.scrollEl.scrollTop = this.scrollEl.scrollHeight;
  }

  componentWillUnmount() {
    clearTimeout(this.tapTimer);
    this.stopAll();
  }

  stopAll() {
    this.stopMouth();
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    try { this.rec && this.rec.abort(); } catch (e) {}
    this.rec = null;
  }

  // ---- Lip sync: one open/close per syllable, rests at spaces and punctuation ----

  setMouth(open) {
    if (this.state.mouthOpen !== open) this.setState({ mouthOpen: open });
  }

  stopMouth() {
    clearTimeout(this.mouthTimer);
    clearTimeout(this.streamTimer);
    clearTimeout(this.startGuard);
    clearTimeout(this.doneGuard);
    this.mouthTimer = null;
    this.mouthPlan = null;
    this.setState({ mouthOpen: false, streamShown: 9999 });
  }

  /** Run the plan from step i; each step holds the mouth open or closed for a while. */
  runMouth(i) {
    clearTimeout(this.mouthTimer);
    const plan = this.mouthPlan;
    if (!plan || i >= plan.steps.length) { this.setMouth(false); return; }
    const step = plan.steps[i];
    this.setMouth(step.open);
    this.mouthTimer = setTimeout(() => this.runMouth(i + 1), step.ms);
  }

  startMouth(plan) {
    if (this.mouthPlan === plan) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.mouthPlan = null; this.setState({ mouthOpen: true, streamShown: 9999 }); return; }
    this.mouthPlan = plan;
    this.runMouth(0);
    this.startStream(plan.words.length);
  }

  /** Streaming text (transitions.dev 30): reveal one word every --stream-gap, ahead of the voice so it reads quickly. */
  startStream(count) {
    clearTimeout(this.streamTimer);
    let gap = 60;
    try { gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stream-gap')) || 60; } catch (e) {}
    const next = (n) => {
      this.setState({ streamShown: n });
      if (n < count) this.streamTimer = setTimeout(() => next(n + 1), gap);
    };
    next(1);
  }

  /** The voice reached a new word: jump the plan there so the mouth doesn't drift. */
  syncMouth(charIndex) {
    const plan = this.mouthPlan;
    if (!plan) return;
    let idx = -1;
    for (const w of plan.words) { if (w.char <= charIndex) idx = w.step; else break; }
    if (idx >= 0) this.runMouth(idx);
  }

  say(text) {
    const rate = 0.92;
    const plan = buildMouthPlan(text, rate);
    clearTimeout(this.startGuard);
    clearTimeout(this.doneGuard);
    this.setState((st) => ({
      turns: st.turns.concat([{ who: 'grandma', text, segs: plan.words.map((w) => w.text) }]),
      streamTurn: st.turns.length,
      streamShown: 0,
      status: 'speaking'
    }));
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const done = () => { this.stopMouth(); this.setState({ status: 'idle' }); };
    // Without a voice (or if it never starts), run the plan on its own so the words still stream.
    const runSilently = () => { this.startMouth(plan); this.doneGuard = setTimeout(done, plan.total + 200); };
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { runSilently(); return; }
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANGS[this.state.lang].code;
      u.rate = rate;
      u.pitch = 1.05;
      // Start moving when the voice actually starts, not when it's queued.
      u.onstart = () => { clearTimeout(this.startGuard); this.startMouth(plan); };
      u.onboundary = (e) => { if (e.name === 'word' || e.name === undefined) this.syncMouth(e.charIndex); };
      u.onend = done;
      u.onerror = done;
      clearTimeout(this.startGuard);
      this.startGuard = setTimeout(runSilently, 1500);
      synth.speak(u);
    } catch (e) {
      runSilently();
    }
  }

  /** Let the chip's icon finish its little move before switching screens. */
  tapChip(topic) {
    if (this.state.tapped) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.open(topic); return; }
    this.setState({ tapped: topic });
    clearTimeout(this.tapTimer);
    // Sequence: let the icon's move finish (250ms icon-swap token; 350ms like-button pop for the heart).
    const ms = topic === 'compliment' ? 350 : 250;
    this.tapTimer = setTimeout(() => { this.setState({ tapped: null }); this.open(topic); }, ms);
  }

  open(topic) {
    this.stopAll();
    this.setState({ screen: 'voice', topic, turns: [], typed: '', micNote: false });
    this.say(LANGS[this.state.lang].open[topic]);
  }

  hear(text) {
    const clean = (text || '').trim();
    if (!clean) return;
    const st = this.state;
    const userTurns = st.turns.filter((t) => t.who === 'you').length;
    this.setState({ turns: st.turns.concat([{ who: 'you', text: clean }]), typed: '' });
    const reply = grandmaReply(clean, st.topic, st.lang, userTurns);
    setTimeout(() => this.say(reply), 500);
  }

  toggleMic() {
    if (this.state.status === 'listening') {
      try { this.rec && this.rec.stop(); } catch (e) {}
      this.setState({ status: 'idle' });
      return;
    }
    const Ctor = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!Ctor) { this.setState({ micNote: true }); return; }
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      const rec = new Ctor();
      rec.lang = LANGS[this.state.lang].code;
      rec.interimResults = false;
      rec.onresult = (e) => {
        const said = e.results && e.results[0] && e.results[0][0] ? e.results[0][0].transcript : '';
        this.hear(said);
      };
      rec.onerror = () => this.setState({ status: 'idle', micNote: true });
      rec.onend = () => { if (this.state.status === 'listening') this.setState({ status: 'idle' }); };
      this.rec = rec;
      this.setState({ status: 'listening', micNote: false });
      rec.start();
    } catch (e) {
      this.setState({ status: 'idle', micNote: true });
    }
  }

  renderVals() {
    const st = this.state;
    const t = LANGS[st.lang];
    const listening = st.status === 'listening';
    return {
      t,
      sheetOpen: st.sheet,
      openOrder: () => this.tapChip('order'),
      openRecipe: () => this.tapChip('recipe'),
      openCompliment: () => this.tapChip('compliment'),
      openAsk: () => this.tapChip('ask'),
      openAllergens: () => this.tapChip('allergens'),
      orderTap: st.tapped === 'order' ? 'is-tapped' : '',
      recipeTap: st.tapped === 'recipe' ? 'is-tapped' : '',
      complimentTap: st.tapped === 'compliment' ? 'is-tapped' : '',
      askTap: st.tapped === 'ask' ? 'is-tapped' : '',
      allergensTap: st.tapped === 'allergens' ? 'is-tapped' : '',
      openSheet: () => this.setState({ sheet: true }),
      closeSheet: () => this.setState({ sheet: false }),
      goHome: () => { this.stopAll(); this.setState({ screen: 'home', status: 'idle', turns: [] }); },
      langs: Object.keys(LANGS).map((k) => ({
        label: LANGS[k].name,
        selected: st.lang === k,
        pick: () => this.setState({ lang: k, sheet: false }),
        style: 'display: flex; align-items: center; justify-content: space-between; min-height: 52px; padding: 0 16px; border-radius: 14px; font: inherit; font-size: 17px; font-weight: 600; cursor: pointer; text-align: left; color: #2b2222; ' +
          (st.lang === k ? 'border: 1.5px solid ' + MAROON + '; background: #fbf3f3' : 'border: 0.75px solid #d9d9d9; background: #ffffff')
      })),
      turns: st.turns.map((turn, idx) => {
        const mine = turn.who === 'you';
        const segs = turn.segs || [turn.text];
        const shown = idx === st.streamTurn ? st.streamShown : segs.length;
        return {
          text: turn.text,
          words: segs.map((seg, k) => ({ text: seg, cls: k < shown ? 't-stream-w is-in' : 't-stream-w' })),
          rowStyle: 'display: flex; justify-content: ' + (mine ? 'flex-end' : 'flex-start'),
          bubbleStyle: 'margin: 0; max-width: 82%; padding: 10px 14px; font-size: ' + (mine ? '15px' : '17px') + '; line-height: 1.4; ' +
            (mine ? 'background: ' + MAROON + '; color: #ffffff; border-radius: 18px 18px 4px 18px'
                  : 'background: #f6f1eb; color: #2b2222; border-radius: 18px 18px 18px 4px')
        };
      }),
      statusText: st.status === 'speaking' ? t.speaking : listening ? t.listening : t.idle,
      // Grandma lives in one shared layer above both screens (positions are in the .gm-win/.gm-img CSS).
      page: st.screen === 'voice' ? '2' : '1',
      homeHidden: st.screen === 'voice' ? 'true' : 'false',
      voiceHidden: st.screen === 'voice' ? 'false' : 'true',
      auraClass: st.screen === 'voice' ? ('is-voice ' + (st.status === 'speaking' ? 'on' : listening ? 'listen' : '')) : '',
      // The still art stays fully opaque underneath; only the talking art fades in on top. Crossfading both
      // made her silhouette briefly translucent, which made the outline glow flash on every mouth move.
      stillOpacity: 1,
      talkOpacity: st.mouthOpen ? 1 : 0,
      listening,
      notListening: !listening,
      micAria: listening ? t.micStop : t.micOn,
      micStyle: 'width: 76px; height: 76px; border-radius: 50%; border: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 18px rgba(90, 26, 31, 0.28); background: ' + (listening ? '#a3243b' : MAROON),
      hasMicNote: st.micNote,
      typed: st.typed,
      onType: (e) => this.setState({ typed: e.target.value }),
      submitTyped: (e) => { e.preventDefault(); this.hear(this.state.typed); },
      scrollRef: (el) => { this.scrollEl = el; }
    };
  }
}
</script>
</body>
</html>
```
