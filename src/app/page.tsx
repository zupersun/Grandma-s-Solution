"use client";
/* Grandma's Bakeria, customer screen. Layout, colours, motion and copy follow docs/PROMPT.md
   (Figma frame "iPhone 17 - 1", 402x874). Voice is the real ElevenLabs agent with a Gemini text
   fallback, and the chips drive real orders, loyalty, votes and suggestions through client tools. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConversationProvider } from "@elevenlabs/react";
import { useCustomer } from "@/hooks/useCustomer";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/hooks/useCart";
import { useVotes } from "@/hooks/useVotes";
import { useRequests, useSuggestions } from "@/hooks/useFeedback";
import { useGrandmaVoice, type ClientTools } from "@/hooks/useGrandmaVoice";
import { api } from "@/hooks/api";
import { BakeriaGrandma } from "@/components/BakeriaGrandma";
import { SafeImg } from "@/components/SafeImg";
import { LANGS, type BLang } from "@/lib/i18n/bakeria";
import { CONFIG } from "@/lib/config";
import type { Lang } from "@/lib/db/schema";

const MAROON = "#5a1a1f";
const BORDER = "0.75px solid #d9d9d9";
const CHIP_TEXT: React.CSSProperties = { fontWeight: 600, fontSize: 16, lineHeight: "normal", letterSpacing: "-0.16px", color: "#5a5959", whiteSpace: "nowrap" };
const STREAM_GAP = 60;

export default function Page() {
  return (
    <ConversationProvider>
      <Bakeria />
    </ConversationProvider>
  );
}

function Bakeria() {
  const router = useRouter();
  const customer = useCustomer();
  const { items: menu } = useMenu();
  const cart = useCart(menu, customer.id);
  const votes = useVotes(customer.id, 8000);
  const suggestions = useSuggestions(customer.id);
  const requests = useRequests();

  const [lang, setLang] = useState<BLang>("en");
  const [screen, setScreen] = useState<"home" | "voice">("home");
  const [tapped, setTapped] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState<Record<number, number>>({});
  const scrollEl = useRef<HTMLDivElement | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = LANGS[lang];

  useEffect(() => { if (customer.lang && customer.lang in LANGS) setLang(customer.lang as BLang); }, [customer.lang]);

  const clientTools: ClientTools = useMemo(() => ({
    addLoyaltyPoints: async ({ reason }) => { const r = await api<{ points: number; awarded: number }>("/api/loyalty", { method: "POST", json: { customerId: customer.id, reason: (reason as string) || "chat" } }); customer.bumpPoints(r.points); return r.awarded ? `Gave ${r.awarded} points, ${r.points} total.` : `They already have ${r.points} points today.`; },
    addToCart: async ({ itemSlug, qty }) => { const m = menu.find((x) => x.slug === itemSlug || x.names.en?.toLowerCase() === String(itemSlug).toLowerCase()); if (!m) return `I don't have that. I do have: ${menu.slice(0, 8).map((x) => x.names.en).join(", ")}.`; const n = Number(qty) || 1; cart.add(m.slug, n); return `Set aside ${n} ${m.names.en}. That comes to $${(cart.total + m.price * n).toFixed(2)}.`; },
    placeOrder: async () => { if (!cart.lines.length) return "Nothing set aside yet, dear."; const { orderId, url } = await cart.checkout(); if (url) { window.location.href = url; return "Sending them to pay."; } router.push(`/order/${orderId}`); return "All wrapped up. The pickup code is on their screen."; },
    voteFlavour: async ({ option }) => { const o = votes.options.find((x) => x.id === option || x.label.en?.toLowerCase() === String(option).toLowerCase()); if (!o) return `The choices are ${votes.options.map((x) => x.label.en).join(", ")}.`; const r = await votes.vote(o.id); customer.refresh(); return `Voted ${o.label.en}.${r.awarded ? ` +${r.awarded} points.` : ""}`; },
    submitSuggestion: async ({ text }) => { const r = await suggestions.submit(String(text), "voice"); customer.refresh(); return r.note ?? `Written in my recipe book. +${r.awarded} points.`; },
    logRequest: async ({ text, itemHint }) => { await requests.log(customer.id, String(text), itemHint ? String(itemHint) : undefined, "voice"); return "Noted for my helper."; },
    getMyPoints: async () => `${customer.points} points. ${CONFIG.loyalty.redeemAt} gets ${CONFIG.loyalty.redeemReward}.`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [customer.id, customer.points, menu, cart.lines, cart.total, votes.options]);

  const voice = useGrandmaVoice({ agent: "customer", lang, clientTools, greeting: t.hello });
  const talking = voice.avatarState === "speaking";
  const listening = voice.avatarState === "listening" && voice.mode === "voice";

  // Streaming captions: reveal one word at a time for Grandma's newest line.
  useEffect(() => {
    const i = voice.transcript.length - 1;
    const turn = voice.transcript[i];
    if (!turn || turn.role !== "grandma" || shown[i] !== undefined) return;
    const words = turn.text.split(/(\s+)/).filter((w) => w.trim()).length;
    let n = 0;
    setShown((s) => ({ ...s, [i]: 0 }));
    const tick = setInterval(() => { n += 1; setShown((s) => ({ ...s, [i]: n })); if (n >= words) clearInterval(tick); }, STREAM_GAP);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.transcript.length]);

  useEffect(() => { if (scrollEl.current) scrollEl.current.scrollTop = scrollEl.current.scrollHeight; }, [voice.transcript, shown]);
  useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current); }, []);

  const startChat = useCallback(async () => {
    if (tapped) return;
    setTapped(true);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const go = async () => {
      setTapped(false);
      setScreen("voice");
      await voice.start("voice");
    };
    if (reduce) { await go(); return; }
    setTimeout(go, 220);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tapped, voice]);

  const live = voice.status === "connected";

  const micPress = useCallback(() => {
    if (!live) { voice.start("voice"); return; }
    if (talking) { voice.interrupt(); return; }   // she is mid-sentence: stop and listen
    voice.setMuted(!voice.isMuted);               // otherwise pause or resume listening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, talking, voice.isMuted]);

  const micLabel = !live ? t.micOn : talking ? t.micStop : voice.isMuted ? t.micOn : t.micStop;

  const goHome = () => { voice.stop(); setScreen("home"); setShown({}); };
  const pickLang = (l: BLang) => { setLang(l); setSheet(false); customer.setLang(l as Lang); };
  const status = voice.status === "connecting" ? t.connecting : talking ? t.speaking : live && voice.isMuted ? t.idle : listening ? t.listening : t.idle;

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#efedea", padding: 16 }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap" />
      <div style={{ position: "relative", width: 402, height: 874, overflow: "hidden", background: "#f9f8f7", fontFamily: "'Hanken Grotesk', system-ui, sans-serif", color: "#2b2222", borderRadius: 20, boxShadow: "0 12px 48px rgba(43,34,34,.18)" }}>

        <div className="t-page-slide" data-page={screen === "voice" ? "2" : "1"} style={{ position: "absolute", inset: 0 }}>
          {/* ---------- Home ---------- */}
          <div className="t-page" data-page-id="1" aria-hidden={screen === "voice"}>
            <Shelves />
            <div style={{ position: "absolute", left: 48, right: 48, top: 600, display: "flex", justifyContent: "center" }}>
              <button className={`gm-chip${tapped ? " is-tapped" : ""}`} onClick={startChat} aria-label={t.talkToGrandma}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", minHeight: 62,
                  padding: "0 24px", border: 0, borderRadius: 31, background: MAROON, color: "#fff",
                  fontSize: 19, fontWeight: 700, letterSpacing: "-0.2px", boxShadow: "0 6px 18px rgba(90,26,31,.26)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>
                {t.talkToGrandma}
              </button>
            </div>
            <button className="gm-press" onClick={() => setSheet(true)} aria-label={t.language}
              style={{ position: "absolute", left: 192, top: 804, display: "block", width: 24, height: 24, padding: 0, border: 0, background: "none", cursor: "pointer" }}>
              <Globe name="globe" />
            </button>
            <div style={{ position: "absolute", left: 24, right: 24, top: 170, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
              <p className="gm-hello" style={{ position: "relative", margin: 0, padding: "8px 14px", background: "#fff", border: BORDER, borderRadius: 18, fontWeight: 600, fontSize: 16, letterSpacing: "-0.16px", color: MAROON, textAlign: "center", boxShadow: "0 2px 8px rgba(90,26,31,.06)" }}>
                {t.welcome}
                <span aria-hidden style={{ position: "absolute", left: "50%", bottom: -6, width: 10, height: 10, marginLeft: -5, background: "#fff", borderRight: BORDER, borderBottom: BORDER, transform: "rotate(45deg)" }} />
              </p>
            </div>
            <Awning />
          </div>

          {/* ---------- Voice chat ---------- */}
          <div className="t-page" data-page-id="2" aria-hidden={screen !== "voice"}>
            <div style={{ boxSizing: "border-box", width: 402, height: 874, display: "flex", flexDirection: "column", padding: "56px 24px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 44 }}>
                <button className="gm-press" onClick={goHome} aria-label={t.back} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: BORDER, borderRadius: 22, background: "#fff", cursor: "pointer" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a5959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <Logo />
                <button className="gm-press" onClick={() => setSheet(true)} aria-label={t.language} style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: 0, background: "none", cursor: "pointer" }}>
                  <Globe name="globe-header" />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 28 }}>
                <div aria-hidden style={{ width: 200, height: 196 }} />
                <p role="status" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: MAROON }}>{status}</p>
              </div>

              <div className="gm-scroll" ref={scrollEl} aria-live="polite" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "16px 0" }}>
                {voice.transcript.map((turn, i) => {
                  const mine = turn.role === "user";
                  const segs = turn.text.split(/(?<=\s)/);
                  const visible = mine ? segs.length : shown[i] ?? segs.length;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                      <p aria-label={turn.text} style={{ margin: 0, maxWidth: "82%", padding: "10px 14px", fontSize: mine ? 15 : 17, lineHeight: 1.4, ...(mine ? { background: MAROON, color: "#fff", borderRadius: "18px 18px 4px 18px" } : { background: "#f6f1eb", color: "#2b2222", borderRadius: "18px 18px 18px 4px" }) }}>
                        {segs.map((seg, k) => <span key={k} className={`t-stream-w${k < visible ? " is-in" : ""}`} aria-hidden>{seg}</span>)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {(voice.fallback || voice.error) && <p style={{ margin: "0 0 8px", fontSize: 13, color: "#5a5959", textAlign: "center" }}>{t.micOff}</p>}

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <button className="gm-press gm-mic" onClick={micPress}
                  aria-label={micLabel} aria-pressed={live && !voice.isMuted}
                  style={{ width: 76, height: 76, borderRadius: "50%", border: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 18px rgba(90,26,31,.28)", background: talking ? "#a3243b" : MAROON, transition: "background-color 150ms ease" }}>
                  {talking ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                  ) : live && voice.isMuted ? (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /><path d="M3 3l18 18" /></svg>
                  ) : (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>
                  )}
                </button>
                <form onSubmit={(e) => { e.preventDefault(); const m = typed.trim(); if (!m) return; setTyped(""); if (talking) voice.interrupt(); voice.sendText(m); }} style={{ display: "flex", gap: 8, width: "100%" }}>
                  <label htmlFor="gm-type" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{t.typeInstead}</label>
                  <input id="gm-type" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t.typeInstead} autoComplete="off"
                    style={{ flex: 1, minWidth: 0, height: 44, boxSizing: "border-box", padding: "0 16px", border: BORDER, borderRadius: 22, font: "inherit", fontSize: 15, color: "#2b2222", background: "#fff" }} />
                  <button className="gm-press" type="submit" style={{ height: 44, padding: "0 18px", border: 0, borderRadius: 22, background: MAROON, color: "#fff", font: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{t.send}</button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <BakeriaGrandma voice={screen === "voice"} talking={talking} listening={listening} />

        {cart.items.length > 0 && screen === "home" && (
          <button onClick={() => cart.checkout().then(({ orderId, url }) => (url ? (window.location.href = url) : router.push(`/order/${orderId}`)))}
            className="gm-press" style={{ position: "absolute", left: 24, right: 24, bottom: 56, height: 48, border: 0, borderRadius: 24, background: MAROON, color: "#fff", font: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 6px 18px rgba(90,26,31,.28)" }}>
            {cart.items.reduce((s, x) => s + x.qty, 0)} set aside · ${cart.total.toFixed(2)} · pick up
          </button>
        )}

        {sheet && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(43,34,34,.35)" }}>
            <button onClick={() => setSheet(false)} aria-label="Close" style={{ flex: 1, border: 0, background: "transparent", cursor: "pointer" }} />
            <div role="dialog" aria-label={t.language} style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 24px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "#d9d9d9", alignSelf: "center", marginBottom: 8 }} />
              <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>{t.language}</p>
              {(Object.keys(LANGS) as BLang[]).map((k) => {
                const on = lang === k;
                return (
                  <button key={k} className="gm-press" onClick={() => pickLang(k)} aria-pressed={on}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 52, padding: "0 16px", borderRadius: 14, font: "inherit", fontSize: 17, fontWeight: 600, cursor: "pointer", textAlign: "left", color: "#2b2222", ...(on ? { border: `1.5px solid ${MAROON}`, background: "#fbf3f3" } : { border: BORDER, background: "#fff" }) }}>
                    <span>{LANGS[k].name}</span>
                    {on && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={MAROON} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ---- Asset wrappers: real art when present, a drawn stand-in otherwise ---- */

function Shelves() {
  return (
    <SafeImg src="/grandma/shelves.png" style={{ position: "absolute", left: 0, top: 264.63, width: 402, height: 402, objectFit: "cover", pointerEvents: "none" }}
      fallback={
        <div aria-hidden style={{ position: "absolute", left: 0, top: 264.63, width: 402, height: 402, pointerEvents: "none" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 70 + i * 104, height: 10, background: "#e4d7c6", boxShadow: "0 4px 8px rgba(43,34,34,.10)" }} />
          ))}
        </div>
      } />
  );
}

function Awning() {
  return (
    <SafeImg src="/grandma/awning.png" width={402} height={170} style={{ position: "absolute", left: 0, top: 0, width: 402, height: "auto", display: "block", pointerEvents: "none" }}
      fallback={
        <div aria-hidden style={{ position: "absolute", left: 0, top: 0, width: 402, height: 86, pointerEvents: "none", background: "repeating-linear-gradient(90deg, #a3243b 0 30px, #f6f1eb 30px 60px)", borderBottomLeftRadius: "50% 26px", borderBottomRightRadius: "50% 26px", boxShadow: "0 6px 14px rgba(43,34,34,.12)" }} />
      } />
  );
}

function Logo() {
  return (
    <SafeImg src="/grandma/logo.png" alt="Grandma's Bakeria" style={{ display: "block", width: 107, height: 31.4, objectFit: "cover" }}
      fallback={<span style={{ fontSize: 16, fontWeight: 700, color: MAROON, letterSpacing: "-0.2px", whiteSpace: "nowrap" }}>Grandma&apos;s Bakeria</span>} />
  );
}

function Globe({ name }: { name: string }) {
  return <SafeImg src={`/grandma/${name}.svg`} width={24} height={24} style={{ display: "block" }} fallback={<span style={{ fontSize: 21, lineHeight: 1 }}>&#127760;</span>} />;
}
