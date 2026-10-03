"use client";
/* The newest thing a customer just did, in one sentence, on every tab. */
import { useEffect, useState } from "react";
import type { LiveEvent } from "@/hooks/useLiveFeed";
import { BORDER, C } from "@/lib/ui";

const WORD: Record<LiveEvent["kind"], string> = { order: "New order", ask: "Someone asked", idea: "New idea", vote: "New vote" };

export function LiveBanner({ events }: { events: LiveEvent[] }) {
  const newest = events[0];
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!newest) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 9000);
    return () => clearTimeout(t);
  }, [newest?.key]);

  if (!newest || !show) return null;
  return (
    <div role="status" aria-live="polite"
      style={{ position: "sticky", top: 12, zIndex: 20, display: "flex", alignItems: "center", gap: 14, padding: "16px 22px",
        background: C.maroon, color: C.white, border: BORDER, borderColor: C.maroon, borderRadius: 18,
        boxShadow: "0 8px 24px rgba(90,26,31,.28)", animation: "gm-hello-in 350ms cubic-bezier(0.22,1,0.36,1)" }}>
      <span style={{ width: 12, height: 12, borderRadius: 6, background: "#ffd9a0", flexShrink: 0 }} className="anim-bob" />
      <span style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.35 }}>
        {WORD[newest.kind]}: <span style={{ fontWeight: 600 }}>{newest.text}</span>
      </span>
      <button onClick={() => setShow(false)} aria-label="Dismiss"
        style={{ marginLeft: "auto", width: 48, height: 48, flexShrink: 0, borderRadius: 24, border: "1px solid rgba(255,255,255,.4)", background: "transparent", color: C.white, font: "inherit", fontSize: 22, cursor: "pointer" }}>×</button>
    </div>
  );
}
