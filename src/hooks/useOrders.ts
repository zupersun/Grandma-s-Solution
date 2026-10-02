"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderStatus } from "@/lib/db/schema";
import { api } from "./api";

export type OrderLine = { slug: string; emoji: string; names: Record<string, string>; qty: number; unitPrice: number };
export type Order = {
  id: string; customerId: string | null; customerName: string | null; channel: string; status: OrderStatus; total: number;
  pickupCode: string; paid: boolean; paidHow: string | null; note: string | null; createdAt: string; updatedAt: string; items: OrderLine[];
};

export function useOrders(opts: { status?: OrderStatus[]; customerId?: string; pollMs?: number; limit?: number } = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const key = `${opts.status?.join(",") ?? ""}|${opts.customerId ?? ""}|${opts.limit ?? ""}`;
  const keyRef = useRef(key); keyRef.current = key;

  const refresh = useCallback(async () => {
    const q = new URLSearchParams();
    if (opts.status?.length) q.set("status", opts.status.join(","));
    if (opts.customerId) q.set("customerId", opts.customerId);
    if (opts.limit) q.set("limit", String(opts.limit));
    try {
      const { orders } = await api<{ orders: Order[] }>(`/api/orders?${q}`);
      setOrders(orders); setError(null);
    } catch (e) { setError((e as Error).message); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (opts.customerId === "") return;
    refresh();
    if (!opts.pollMs) return;
    const t = setInterval(refresh, opts.pollMs);
    return () => clearInterval(t);
  }, [refresh, opts.pollMs, opts.customerId]);

  const patch = useCallback(async (id: string, body: Record<string, unknown>) => {
    const { order } = await api<{ order: Order }>(`/api/orders/${id}`, { method: "PATCH", json: body });
    setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
    return order;
  }, []);

  const FLOW: OrderStatus[] = ["new", "making", "ready", "picked_up"];
  const advance = useCallback(async (id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: FLOW[Math.min(FLOW.indexOf(o.status) + 1, 3)] } : o)));
    return patch(id, { action: "advance" });
  }, [patch]);
  const undo = useCallback((id: string) => patch(id, { action: "undo" }), [patch]);

  const createTillOrder = useCallback(async (items: { slug: string; qty: number }[], paidHow: "counter" | "card" | "demo") => {
    const { order } = await api<{ order: Order }>("/api/orders", { method: "POST", json: { channel: "till", items, paidHow: paidHow === "card" ? "counter" : paidHow } });
    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

  return { orders, error, refresh, advance, undo, createTillOrder };
}
