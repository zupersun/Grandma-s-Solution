"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, readLocal, writeLocal } from "./api";
import type { MenuItem } from "./useMenu";

export type CartLine = { slug: string; qty: number };

export function useCart(menu: MenuItem[], customerId: string) {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => { setLines(readLocal<CartLine[]>("grandma.cart", [])); }, []);
  const persist = (next: CartLine[]) => { setLines(next); writeLocal("grandma.cart", next); };

  const items = useMemo(() => lines.map((l) => ({ ...l, item: menu.find((m) => m.slug === l.slug) })).filter((x) => x.item) as { slug: string; qty: number; item: MenuItem }[], [lines, menu]);
  const total = useMemo(() => Math.round(items.reduce((s, x) => s + x.item.price * x.qty, 0) * 100) / 100, [items]);

  const add = useCallback((slug: string, qty = 1) => {
    setLines((prev) => {
      const next = prev.some((l) => l.slug === slug) ? prev.map((l) => (l.slug === slug ? { ...l, qty: l.qty + qty } : l)) : [...prev, { slug, qty }];
      writeLocal("grandma.cart", next); return next;
    });
  }, []);
  const remove = useCallback((slug: string) => setLines((prev) => { const next = prev.filter((l) => l.slug !== slug); writeLocal("grandma.cart", next); return next; }), []);
  const clear = useCallback(() => persist([]), []);

  /** Creates the order and either returns a Stripe URL or a paid demo order. */
  const checkout = useCallback(async (note?: string) => {
    if (!lines.length) throw new Error("Cart is empty");
    const { order } = await api<{ order: { id: string } }>("/api/orders", { method: "POST", json: { customerId, channel: "web", items: lines, note } });
    const pay = await api<{ url?: string; demo?: boolean }>("/api/checkout", { method: "POST", json: { orderId: order.id } });
    persist([]);
    return { orderId: order.id, url: pay.url };
  }, [lines, customerId]);

  return { lines, items, total, add, remove, clear, checkout };
}
