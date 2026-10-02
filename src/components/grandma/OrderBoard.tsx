"use client";
import { useEffect, useRef, useState } from "react";
import type { Order } from "@/hooks/useOrders";

const COLUMNS: { status: Order["status"]; title: string; next: string; color: string }[] = [
  { status: "new", title: "New", next: "Start baking →", color: "bg-blush" },
  { status: "making", title: "In the oven", next: "It's ready →", color: "bg-butter" },
  { status: "ready", title: "Ready to pick up", next: "Picked up ✓", color: "bg-mint" },
];

export function OrderBoard({ orders, onAdvance, onUndo }: { orders: Order[]; onAdvance: (id: string) => void; onUndo: (id: string) => void }) {
  const [undoId, setUndoId] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    const incoming = orders.filter((o) => !seen.current.has(o.id)).map((o) => o.id);
    if (seen.current.size && incoming.length) {
      setFresh(new Set(incoming));
      try { new AudioContext(); const ctx = new AudioContext(); const osc = ctx.createOscillator(); osc.frequency.value = 880; osc.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.15); } catch {}
      setTimeout(() => setFresh(new Set()), 4000);
    }
    for (const o of orders) seen.current.add(o.id);
  }, [orders]);

  const advance = (id: string) => { onAdvance(id); setUndoId(id); setTimeout(() => setUndoId((u) => (u === id ? null : u)), 10000); };
  const minutes = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => (
        <section key={col.status} className="space-y-3">
          <h2 className="text-2xl font-black">{col.title} <span className="text-base opacity-60">({orders.filter((o) => o.status === col.status).length})</span></h2>
          {orders.filter((o) => o.status === col.status).map((o) => (
            <div key={o.id} className={`card ${col.color} ${fresh.has(o.id) ? "anim-pop ring-4 ring-jam" : ""}`}>
              <div className="flex items-baseline justify-between">
                <span className="text-5xl font-black tracking-wider">{o.pickupCode}</span>
                <span className="text-sm font-semibold opacity-70">{minutes(o.createdAt)} min · {o.channel === "till" ? "counter" : o.channel === "voice" ? "told Grandma" : "phone"}</span>
              </div>
              <div className="font-bold">{o.customerName ?? "Walk-in"} {o.paid ? "" : "· NOT PAID"}</div>
              <ul className="my-1 text-lg">{o.items.map((l, i) => <li key={i}>{l.qty} × {l.emoji} {l.names.en}</li>)}</ul>
              {o.note && <p className="rounded-xl bg-white/70 px-2 py-1 text-sm">“{o.note}”</p>}
              <div className="mt-2 flex gap-2">
                <button className="btn-primary flex-1" onClick={() => advance(o.id)}>{col.next}</button>
                {undoId === o.id && <button className="btn-ghost" onClick={() => { onUndo(o.id); setUndoId(null); }}>Undo</button>}
              </div>
            </div>
          ))}
          {orders.filter((o) => o.status === col.status).length === 0 && <p className="opacity-50">Nothing here.</p>}
        </section>
      ))}
    </div>
  );
}
