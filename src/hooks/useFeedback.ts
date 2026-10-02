"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export type Suggestion = { id: number; customerId: string | null; text: string; source: string; createdAt: string };
export type Request = { id: number; customerId: string | null; text: string; itemHint: string | null; source: string; createdAt: string };
export type Stats = { today: { orders: number; revenue: number; topItems: { slug: string; emoji: string; names: Record<string, string>; units: number }[] }; week: { orders: number; revenue: number; topItems: { slug: string; emoji: string; names: Record<string, string>; units: number }[] }; live: Record<string, number> };

function usePolled<T>(path: string, initial: T, pollMs?: number) {
  const [data, setData] = useState<T>(initial);
  const refresh = useCallback(() => api<T>(path).then(setData).catch(() => {}), [path]);
  useEffect(() => {
    refresh();
    if (!pollMs) return;
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);
  return { data, refresh };
}

export function useSuggestions(customerId?: string, pollMs?: number) {
  const { data, refresh } = usePolled<{ suggestions: Suggestion[] }>("/api/suggestions", { suggestions: [] }, pollMs);
  const submit = useCallback(async (text: string, source: "ui" | "voice" | "chat" = "ui") => {
    const res = await api<{ suggestion: Suggestion; awarded: number; note?: string }>("/api/suggestions", { method: "POST", json: { customerId, text, source } });
    refresh();
    return res;
  }, [customerId, refresh]);
  return { suggestions: data.suggestions, submit, refresh };
}

export function useRequests(pollMs?: number) {
  const { data, refresh } = usePolled<{ requests: Request[] }>("/api/requests", { requests: [] }, pollMs);
  const log = useCallback(async (customerId: string | undefined, text: string, itemHint?: string, source: "ui" | "voice" | "chat" = "voice") => {
    const res = await api<{ request: Request }>("/api/requests", { method: "POST", json: { customerId, text, itemHint, source } });
    refresh();
    return res;
  }, [refresh]);
  return { requests: data.requests, log, refresh };
}

export function useStats(pollMs?: number) {
  const { data, refresh } = usePolled<Stats | null>("/api/stats", null, pollMs);
  return { stats: data, refresh };
}
