"use client";
import { useCallback, useEffect, useState } from "react";
import type { PlanLine } from "@/lib/db/schema";
import { api } from "./api";

export type Plan = { id: number; period: string; lines: PlanLine[]; summary: string; flags: string[]; totalCost: number; status: string; createdAt: string };
export type SupplierOrder = { id: number; planId: number; supplierId: number; supplierName: string; lines: PlanLine[]; total: number; mode: "online" | "in_person"; status: string; reference: string | null; trip: string; orderUrl: string | null; orderEmail: string | null; text: string };
export type Summary = { id: number; text: string; lang: string; stats: Record<string, unknown>; createdAt: string };

export function useBrain(lang = "en") {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>) => {
    setLoading(true); setError(null);
    try { return await fn(); } catch (e) { setError((e as Error).message); throw e; } finally { setLoading(false); }
  }, []);

  const applyPlan = (d: { plan: Plan | null; supplierOrders?: SupplierOrder[] }) => { setPlan(d.plan); setSupplierOrders(d.supplierOrders ?? []); };

  useEffect(() => {
    api<{ plan: Plan | null; supplierOrders: SupplierOrder[] }>("/api/brain/plan").then(applyPlan).catch(() => {});
    api<{ summary: Summary | null }>("/api/brain/summary").then((d) => setSummary(d.summary)).catch(() => {});
  }, []);

  const makePlan = useCallback(() => run(async () => { const d = await api<{ plan: Plan; supplierOrders: SupplierOrder[] }>("/api/brain/plan", { method: "POST", json: { lang } }); applyPlan(d); return d.plan; }), [run, lang]);
  const sendDirective = useCallback((text: string) => run(async () => {
    const d = await api<{ plan: Plan; supplierOrders: SupplierOrder[]; note?: string }>("/api/brain/directive", { method: "POST", json: { text, lang } });
    applyPlan(d); setNote(d.note ?? null); return d;
  }), [run, lang]);
  const approvePlan = useCallback(() => run(async () => {
    if (!plan) throw new Error("No plan yet");
    const d = await api<{ plan: Plan; supplierOrders: SupplierOrder[] }>("/api/brain/plan/approve", { method: "POST", json: { planId: plan.id } });
    applyPlan(d); return d;
  }), [run, plan]);
  /** One door for everything Grandma types: answers her, and updates the plan when she changed it. */
  const ask = useCallback((text: string) => run(async () => {
    const d = await api<{ kind: "change" | "question"; reply: string; plan: Plan | null; supplierOrders: SupplierOrder[] }>(
      "/api/brain/ask", { method: "POST", json: { text, lang } });
    if (d.plan) applyPlan(d);
    return d;
  }), [run, lang]);

  const refreshSummary = useCallback(() => run(async () => { const d = await api<{ summary: Summary }>("/api/brain/summary", { method: "POST", json: { lang } }); setSummary(d.summary); return d.summary; }), [run, lang]);

  return { plan, supplierOrders, summary, loading, error, note, ask, makePlan, sendDirective, approvePlan, refreshSummary };
}
