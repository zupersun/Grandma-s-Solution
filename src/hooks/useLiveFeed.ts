"use client";
/* Watches everything customers do and turns it into plain sentences for Grandma.
   Each poll is diffed against what we have already seen, so only genuinely new things speak up. */
import { useEffect, useRef, useState } from "react";
import type { Order } from "./useOrders";
import type { Request, Suggestion } from "./useFeedback";

export type LiveEvent = {
  key: string; kind: "order" | "ask" | "idea" | "vote"; at: number;
  /** One plain sentence that stands on its own. Never prefixed with a label. */
  text: string;
  /** What Grandma can do about it, and where. Shown under the sentence. */
  cue: string;
  icon: string;
};

/** "please more mango " -> "Mango". Customers type freely; Grandma should read a tidy name. */
function tidy(raw: string) {
  const t = raw.trim().replace(/^(please |more |a |an |the |some )+/i, "").replace(/\s+/g, " ");
  if (!t) return "something";
  const short = t.length > 40 ? `${t.slice(0, 40).trimEnd()}…` : t;
  return short[0].toUpperCase() + short.slice(1);
}

const chime = (high: boolean) => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    g.gain.value = 0.07; osc.frequency.value = high ? 980 : 720;
    osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.14);
  } catch {}
};

export function useLiveFeed(input: {
  orders: Order[]; suggestions: Suggestion[]; requests: Request[]; tally: Record<string, number>;
  voteLabels: Record<string, string>;
}) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const seen = useRef<{ ready: boolean; orders: Set<string>; sug: Set<number>; req: Set<number>; tally: Record<string, number> }>({
    ready: false, orders: new Set(), sug: new Set(), req: new Set(), tally: {},
  });

  useEffect(() => {
    const s = seen.current;
    const fresh: LiveEvent[] = [];
    const now = Date.now();

    for (const o of input.orders) {
      if (s.orders.has(o.id)) continue;
      s.orders.add(o.id);
      if (!s.ready) continue;
      const items = o.items.map((l) => `${l.qty} × ${l.names.en}`).join(", ");
      fresh.push({ key: `o${o.id}`, kind: "order", at: now, icon: "🧾",
        text: `${o.customerName ?? "A customer"} ordered ${items}.`, cue: "It is on your Orders board now." });
    }
    for (const r of input.requests) {
      if (s.req.has(r.id)) continue;
      s.req.add(r.id);
      if (!s.ready) continue;
      fresh.push({ key: `r${r.id}`, kind: "ask", at: now, icon: "🙋",
        text: `A customer wants ${tidy(r.itemHint || r.text)}.`, cue: "Open Customers to see what people keep asking for." });
    }
    for (const g of input.suggestions) {
      if (s.sug.has(g.id)) continue;
      s.sug.add(g.id);
      if (!s.ready) continue;
      fresh.push({ key: `s${g.id}`, kind: "idea", at: now, icon: "💡",
        text: `Someone suggested: “${tidy(g.text)}”`, cue: "Open Customers to read it." });
    }
    for (const [id, n] of Object.entries(input.tally)) {
      const before = s.tally[id];
      s.tally[id] = n;
      if (!s.ready || before === undefined || n <= before) continue;
      fresh.push({ key: `v${id}${n}`, kind: "vote", at: now, icon: "🗳️",
        text: `Someone voted for ${input.voteLabels[id] ?? id}. That makes ${n}.`, cue: "Open Customers to see the whole vote." });
    }

    if (!s.ready) { s.ready = true; return; }
    if (!fresh.length) return;
    chime(fresh.some((e) => e.kind === "order"));
    setEvents((prev) => [...fresh, ...prev].slice(0, 40));
  }, [input.orders, input.suggestions, input.requests, input.tally, input.voteLabels]);

  const clear = () => setEvents([]);
  return { events, clear };
}
