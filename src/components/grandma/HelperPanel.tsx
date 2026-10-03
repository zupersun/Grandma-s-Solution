"use client";
import { useEffect, useRef, useState } from "react";
import { useGrandmaVoice, type ClientTools } from "@/hooks/useGrandmaVoice";
import { HelperAvatar } from "./HelperAvatar";
import { BORDER, C, card, pill } from "@/lib/ui";

/** Grandma talks to her helper here: same voice surface as the customer screen, iPad scale. */
export function HelperPanel({ clientTools, onAsk }: { clientTools: ClientTools; onAsk: (text: string) => Promise<{ reply: string }> }) {
  const voice = useGrandmaVoice({ agent: "helper", lang: "en", clientTools });
  const [typed, setTyped] = useState("");
  const [thinking, setThinking] = useState(false);
  const [typedTurns, setTypedTurns] = useState<{ role: "user" | "grandma"; text: string }[]>([]);
  const scroll = useRef<HTMLDivElement | null>(null);
  const talking = voice.avatarState === "speaking";
  const listening = voice.avatarState === "listening" && voice.mode === "voice";
  const live = voice.status === "connected";

  const turns = [...voice.transcript, ...typedTurns];
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; }, [voice.transcript, typedTurns]);

  const status = voice.status === "connecting" ? "Putting on her glasses…" : talking ? "Your helper is talking…" : listening ? "Listening… go ahead" : "Tap the microphone to talk";

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14, alignSelf: "start", position: "sticky", top: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <HelperAvatar talking={talking} listening={listening} />
        <p role="status" style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.maroon }}>{status}</p>
      </div>

      <div ref={scroll} className="gm-scroll" aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto", fontSize: 18, lineHeight: 1.45 }}>
        {turns.length === 0 && <p style={{ margin: 0, color: C.muted }}>Ask how today is going, or tell me to bake more of something.</p>}
        {turns.map((t, i) => (
          <div key={i} style={{ display: "flex", justifyContent: t.role === "user" ? "flex-end" : "flex-start" }}>
            <p style={{ margin: 0, maxWidth: "88%", padding: "10px 14px", ...(t.role === "user"
              ? { background: C.maroon, color: C.white, borderRadius: "18px 18px 4px 18px", fontSize: 16 }
              : { background: C.bubble, color: C.text, borderRadius: "18px 18px 18px 4px" }) }}>{t.text}</p>
          </div>
        ))}
      </div>

      {(voice.fallback || voice.error) && <p style={{ margin: 0, fontSize: 14, color: C.muted, textAlign: "center" }}>Her voice is resting. Type to her instead.</p>}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <button className="gm-press gm-mic" onClick={() => { if (!live) { voice.start("voice"); return; } if (talking) { voice.interrupt(); return; } voice.setMuted(!voice.isMuted); }}
          aria-label={talking ? "Stop and listen to me" : live && voice.isMuted ? "Start listening" : "Pause listening"} aria-pressed={live && !voice.isMuted}
          style={{ width: 76, height: 76, borderRadius: "50%", border: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 18px rgba(90,26,31,.28)", background: talking ? C.listening : C.maroon }}>
          {talking ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></svg>
          )}
        </button>
        <form onSubmit={async (e) => {
            e.preventDefault();
            const m = typed.trim(); if (!m || thinking) return;
            setTyped(""); if (talking) voice.interrupt();
            setTypedTurns((t) => [...t, { role: "user", text: m }]);
            setThinking(true);
            try { const r = await onAsk(m); setTypedTurns((t) => [...t, { role: "grandma", text: r.reply }]); }
            catch (err) { setTypedTurns((t) => [...t, { role: "grandma", text: `Sorry, that did not work. ${(err as Error).message}` }]); }
            finally { setThinking(false); }
          }} style={{ display: "flex", gap: 8, width: "100%" }}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={thinking ? "Thinking…" : "Type to your helper…"} aria-label="Type to your helper"
            style={{ flex: 1, minWidth: 0, height: 52, boxSizing: "border-box", padding: "0 18px", border: BORDER, borderRadius: 26, font: "inherit", fontSize: 17, background: C.white, color: C.text }} />
          <button className="gm-press" type="submit" disabled={thinking} style={{ ...pill("solid"), minHeight: 52, padding: "0 20px" }}>Send</button>
        </form>
      </div>
    </div>
  );
}
