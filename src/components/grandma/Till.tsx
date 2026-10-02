"use client";
import { useState } from "react";
import type { MenuItem } from "@/hooks/useMenu";
import type { Order } from "@/hooks/useOrders";

export function Till({ menu, onCreate }: { menu: MenuItem[]; onCreate: (items: { slug: string; qty: number }[], paidHow: "counter" | "card") => Promise<Order> }) {
  const [lines, setLines] = useState<Record<string, number>>({});
  const [done, setDone] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const total = Object.entries(lines).reduce((s, [slug, qty]) => s + (menu.find((m) => m.slug === slug)?.price ?? 0) * qty, 0);
  const add = (slug: string) => setLines((l) => ({ ...l, [slug]: (l[slug] ?? 0) + 1 }));
  const finish = async (paidHow: "counter" | "card") => {
    setBusy(true);
    try {
      const order = await onCreate(Object.entries(lines).map(([slug, qty]) => ({ slug, qty })), paidHow);
      setDone(order); setLines({}); setTimeout(() => setDone(null), 6000);
    } finally { setBusy(false); }
  };
  return (
    <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {menu.map((m) => (
          <button key={m.slug} onClick={() => add(m.slug)} className="card flex min-h-28 flex-col items-center justify-center text-center active:scale-95">
            <span className="text-4xl">{m.emoji}</span>
            <span className="font-bold leading-tight">{m.names.en}</span>
            <span className="text-sm opacity-70">${m.price.toFixed(2)}</span>
          </button>
        ))}
      </div>
      <div className="card flex flex-col gap-2">
        <h2 className="text-2xl font-black">This order</h2>
        {done ? (
          <div className="rounded-2xl bg-mint p-4 text-center anim-pop">
            <div className="text-sm font-bold">Pickup code</div>
            <div className="text-6xl font-black">{done.pickupCode}</div>
            <div className="opacity-70">${done.total.toFixed(2)} paid</div>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-1 text-lg">
              {Object.entries(lines).map(([slug, qty]) => {
                const m = menu.find((x) => x.slug === slug)!;
                return <li key={slug} className="flex justify-between"><span>{qty} × {m.emoji} {m.names.en}</span><button className="rounded-full bg-blush px-3" onClick={() => setLines((l) => { const n = { ...l }; if (--n[slug] <= 0) delete n[slug]; return n; })}>−</button></li>;
              })}
              {!Object.keys(lines).length && <li className="opacity-50">Tap items to add them.</li>}
            </ul>
            <div className="text-3xl font-black">${total.toFixed(2)}</div>
            <button className="btn-primary" disabled={!total || busy} onClick={() => finish("counter")}>💵 Paid at counter</button>
            <button className="btn-soft" disabled={!total || busy} onClick={() => finish("card")}>💳 Card</button>
          </>
        )}
      </div>
    </div>
  );
}
