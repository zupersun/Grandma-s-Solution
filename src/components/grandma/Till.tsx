"use client";
import { useState } from "react";
import type { MenuItem } from "@/hooks/useMenu";
import type { Order } from "@/hooks/useOrders";
import { BORDER, C, card, h2, pill } from "@/lib/ui";

export function Till({ menu, onCreate }: { menu: MenuItem[]; onCreate: (items: { slug: string; qty: number }[], paidHow: "counter" | "card") => Promise<Order> }) {
  const [lines, setLines] = useState<Record<string, number>>({});
  const [done, setDone] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const total = Object.entries(lines).reduce((s, [slug, qty]) => s + (menu.find((m) => m.slug === slug)?.price ?? 0) * qty, 0);

  const finish = async (paidHow: "counter" | "card") => {
    setBusy(true);
    try { const o = await onCreate(Object.entries(lines).map(([slug, qty]) => ({ slug, qty })), paidHow); setDone(o); setLines({}); setTimeout(() => setDone(null), 7000); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0, 2fr) minmax(300px, 1fr)" }}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
        {menu.map((m) => (
          <button key={m.slug} className="gm-press" onClick={() => setLines((l) => ({ ...l, [m.slug]: (l[m.slug] ?? 0) + 1 }))}
            style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 112, cursor: "pointer", font: "inherit", textAlign: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{m.names.en}</span>
            <span style={{ fontSize: 15, color: C.muted }}>${m.price.toFixed(2)}</span>
          </button>
        ))}
      </div>
      <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12, alignSelf: "start", position: "sticky", top: 20 }}>
        <h2 style={h2}>This order</h2>
        {done ? (
          <div style={{ padding: 20, textAlign: "center", background: C.bubble, borderRadius: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.muted }}>Pickup code</div>
            <div style={{ fontSize: 60, fontWeight: 700, color: C.maroon, lineHeight: 1.1 }}>{done.pickupCode}</div>
            <div style={{ fontSize: 17, color: C.muted }}>${done.total.toFixed(2)} paid</div>
          </div>
        ) : (
          <>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, fontSize: 17, minHeight: 80 }}>
              {Object.entries(lines).map(([slug, qty]) => {
                const m = menu.find((x) => x.slug === slug);
                if (!m) return null;
                return (
                  <li key={slug} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderBottom: BORDER, paddingBottom: 8 }}>
                    <span>{qty} × {m.names.en}</span>
                    <button className="gm-press" onClick={() => setLines((l) => { const n = { ...l }; if (--n[slug] <= 0) delete n[slug]; return n; })}
                      style={{ width: 40, height: 40, borderRadius: 20, border: BORDER, background: C.white, cursor: "pointer", font: "inherit", fontSize: 20, lineHeight: 1 }}>−</button>
                  </li>
                );
              })}
              {!Object.keys(lines).length && <li style={{ color: C.muted }}>Tap items to add them.</li>}
            </ul>
            <div style={{ fontSize: 34, fontWeight: 700, color: C.maroon }}>${total.toFixed(2)}</div>
            <button className="gm-press" style={{ ...pill("solid"), width: "100%" }} disabled={!total || busy} onClick={() => finish("counter")}>Paid at counter</button>
            <button className="gm-press" style={{ ...pill("soft"), width: "100%" }} disabled={!total || busy} onClick={() => finish("card")}>Card</button>
          </>
        )}
      </div>
    </div>
  );
}
