"use client";
/* The newest thing a customer just did, in one sentence, on every tab.
   The sentence stands on its own: no label in front of it, and under it one line
   telling Grandma what she can do and which tab to open. */
import { useEffect, useState } from "react";
import type { LiveEvent } from "@/hooks/useLiveFeed";
import { BORDER, C } from "@/lib/ui";

export function LiveBanner({ events, onGo }: { events: LiveEvent[]; onGo?: (kind: LiveEvent["kind"]) => void }) {
  const newest = events[0];
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!newest) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 12000);
    return () => clearTimeout(t);
  }, [newest?.key]);

  if (!newest || !show) return null;
  return (
    <div role="status" aria-live="polite"
      style={{ position: "sticky", top: 12, zIndex: 20, display: "flex", alignItems: "center", gap: 18, padding: "18px 22px",
        background: C.maroon, color: C.white, border: BORDER, borderColor: C.maroon, borderRadius: 18,
        boxShadow: "0 8px 24px rgba(90,26,31,.28)", animation: "gm-hello-in 350ms cubic-bezier(0.22,1,0.36,1)" }}>
      <span aria-hidden style={{ fontSize: 34, lineHeight: 1, flexShrink: 0 }} className="anim-bob">{newest.icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 24, fontWeight: 700, lineHeight: 1.3 }}>{newest.text}</span>
        <span style={{ display: "block", marginTop: 4, fontSize: 18, fontWeight: 500, lineHeight: 1.35, color: "rgba(255,255,255,.82)" }}>{newest.cue}</span>
      </span>
      {onGo && (
        <button className="gm-press" onClick={() => { onGo(newest.kind); setShow(false); }}
          style={{ flexShrink: 0, minHeight: 56, padding: "0 24px", borderRadius: 28, border: "1px solid rgba(255,255,255,.45)",
            background: "rgba(255,255,255,.12)", color: C.white, font: "inherit", fontSize: 19, fontWeight: 700, cursor: "pointer" }}>
          Show me
        </button>
      )}
      <button onClick={() => setShow(false)} aria-label="Hide this message"
        style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 28, border: "1px solid rgba(255,255,255,.4)",
          background: "transparent", color: C.white, font: "inherit", fontSize: 24, cursor: "pointer" }}>×</button>
    </div>
  );
}
