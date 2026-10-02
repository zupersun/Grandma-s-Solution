"use client";
import { useCallback, useEffect, useState } from "react";
import { getCustomerId } from "@/lib/customer";
import type { Lang } from "@/lib/db/schema";
import { api, readLocal, writeLocal } from "./api";

type Customer = { id: string; name: string | null; lang: string; points: number };

export function useCustomer() {
  const [id, setId] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lang, setLangState] = useState<Lang>("en");

  const refresh = useCallback(async (cid = id) => {
    if (!cid) return;
    const { customer } = await api<{ customer: Customer }>(`/api/customers/${cid}`);
    setCustomer(customer);
  }, [id]);

  useEffect(() => {
    const cid = getCustomerId();
    setId(cid);
    setLangState(readLocal<Lang>("grandma.lang", "en"));
    refresh(cid).catch(() => {});
  }, [refresh]);

  const setName = useCallback(async (name: string) => {
    const { customer } = await api<{ customer: Customer }>(`/api/customers/${id}`, { method: "PATCH", json: { name } });
    setCustomer(customer);
  }, [id]);

  const setLang = useCallback(async (next: Lang) => {
    setLangState(next); writeLocal("grandma.lang", next);
    if (id) api(`/api/customers/${id}`, { method: "PATCH", json: { lang: next } }).catch(() => {});
  }, [id]);

  return { id, name: customer?.name ?? "", lang, points: customer?.points ?? 0, setName, setLang, refresh, bumpPoints: (p: number) => setCustomer((c) => (c ? { ...c, points: p } : c)) };
}
