"use client";
import { useEffect, useRef, useState } from "react";
import type { Order } from "@/hooks/useOrders";
import { BORDER, C, card, h2, pill } from "@/lib/ui";

const COLUMNS: { status: Order["status"]; title: string; next: string }[] = [
  { status: "new", title: "New", next: "Start baking" },
  { status: "making", title: "In the oven", next: "It's ready" },
  { status: "ready", title: "Ready to pick up", next: "Picked up" },
];

export function OrderBoard({ orders, onAdvance, onUndo }: { orders: Order[]; onAdvance: (id: string) => void; onUndo: (id: string) => void }) {
  const [undoId, setUndoId] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    const incoming = orders.filter((o) => !seen.current.has(o.id)).map((o) => o.id);
    if (seen.current.size && incoming.length) {
      setFresh(new Set(incoming));
      try { const ctx = new AudioContext(); const osc = ctx.createOscillator(); const g = ctx.createGain(); g.gain.value = 0.08; osc.frequency.value = 880; osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.14); } catch {}
      setTimeout(() => setFresh(new Set()), 4000);
    }
    for (const o of orders) seen.current.add(o.id);
  }, [orders]);

  const advance = (id: string) => { onAdvance(id); setUndoId(id); setTimeout(() => setUndoId((u) => (u === id ? null : u)), 10000); };
  const mins = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
      {COLUMNS.map((col) => {
        const list = orders.filter((o) => o.status === col.status);
        return (
          <section key={col.status} style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <h2 style={h2}>{col.title} <span style={{ color: C.muted, fontWeight: 600 }}>({list.length})</span></h2>
            {list.map((o) => (
              <div key={o.id} style={{ ...card, padding: 18, ...(fresh.has(o.id) ? { borderColor: C.maroon, boxShadow: `0 0 0 3px ${C.tint}` } : null) }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: 2, color: C.maroon, lineHeight: 1 }}>{o.pickupCode}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>{mins(o.createdAt)} min · {o.channel === "till" ? "counter" : o.channel === "voice" ? "told Grandma" : "phone"}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 17, fontWeight: 600 }}>{o.customerName ?? "Walk-in"}{o.paid ? "" : <span style={{ color: C.listening }}> · not paid</span>}</div>
                <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", fontSize: 18, lineHeight: 1.5 }}>
                  {o.items.map((l, i) => <li key={i}>{l.qty} × {l.names.en}</li>)}
                </ul>
                {o.note && <p style={{ margin: "10px 0 0", padding: "8px 12px", background: C.bubble, borderRadius: "18px 18px 18px 4px", fontSize: 15 }}>“{o.note}”</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button className="gm-press" style={{ ...pill("solid"), flex: 1 }} onClick={() => advance(o.id)}>{col.next}</button>
                  {undoId === o.id && <button className="gm-press" style={pill("ghost")} onClick={() => { onUndo(o.id); setUndoId(null); }}>Undo</button>}
                </div>
              </div>
            ))}
            {list.length === 0 && <p style={{ margin: 0, padding: "18px 0", color: C.muted, fontSize: 17, borderTop: BORDER }}>Nothing here.</p>}
          </section>
        );
      })}
    </div>
  );
}
