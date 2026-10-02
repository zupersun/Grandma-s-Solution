"use client";
import { useState } from "react";
import type { Plan, SupplierOrder } from "@/hooks/useBrain";
import supplierData from "@/persona/suppliers.json";

const LABELS = supplierData.ingredientLabels as Record<string, string>;
const label = (i: string) => LABELS[i] ?? i;

export function PlanCard({ plan, supplierOrders, loading, error, note, onMake, onApprove, onDirective }: {
  plan: Plan | null; supplierOrders: SupplierOrder[]; loading: boolean; error: string | null; note: string | null;
  onMake: () => void; onApprove: () => void; onDirective: (text: string) => void;
}) {
  const [more, setMore] = useState(false);
  const [text, setText] = useState("");
  const [confirm, setConfirm] = useState(false);
  const online = plan?.lines.filter((l) => l.orderingMode === "online") ?? [];
  const inPerson = plan?.lines.filter((l) => l.orderingMode === "in_person") ?? [];
  const sent = supplierOrders.filter((o) => o.mode === "online");
  const listed = supplierOrders.filter((o) => o.mode === "in_person");

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-black">🧺 What to buy</h2>
          <div className="flex gap-2">
            <button className="btn-soft" onClick={onMake} disabled={loading}>{loading ? "Thinking…" : plan ? "Make a new plan" : "Make my plan"}</button>
            {plan && plan.status === "draft" && !confirm && <button className="btn-primary" onClick={() => setConfirm(true)} disabled={loading}>Approve</button>}
            {confirm && <button className="btn-primary" onClick={() => { setConfirm(false); onApprove(); }}>Yes, order it ✓</button>}
            {confirm && <button className="btn-ghost" onClick={() => setConfirm(false)}>Not yet</button>}
          </div>
        </div>
        {error && <p className="mt-2 rounded-xl bg-blush px-3 py-2">{error}</p>}
        {note && <p className="mt-2 rounded-xl bg-butter px-3 py-2 text-lg">{note}</p>}
        {plan ? (
          <>
            <p className="mt-3 text-2xl font-black">About ${Math.round(plan.totalCost).toLocaleString()} · {plan.period} · {plan.status === "draft" ? "waiting for you" : plan.status === "sent" ? "ordered ✓" : "approved"}</p>
            <p className="mt-1 text-xl leading-relaxed">{plan.summary}</p>
            {plan.flags.length > 0 && (
              <ul className="mt-2 space-y-1">{plan.flags.slice(0, more ? 99 : 2).map((f, i) => <li key={i} className="rounded-xl bg-blush/70 px-3 py-1.5">⚠️ {f}</li>)}</ul>
            )}
            <button className="mt-2 text-jam font-bold underline" onClick={() => setMore((m) => !m)}>{more ? "Show less" : "Tell me more"}</button>
          </>
        ) : <p className="mt-2 text-lg opacity-70">No plan yet. Tap “Make my plan” or just tell your helper what you want.</p>}
      </div>

      <form className="card flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onDirective(text); setText(""); } }}>
        <input className="min-h-14 flex-1 rounded-2xl border border-crust/20 bg-white px-4 text-lg" placeholder="Tell your helper something, like “push puddings this month”" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-soft" type="submit" disabled={loading}>Tell</button>
      </form>

      {plan && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <h3 className="text-xl font-black">🖥️ Ordered online for you {sent.length ? "✓" : ""}</h3>
            {sent.length ? sent.map((o) => (
              <div key={o.id} className="mt-2 rounded-2xl bg-mint p-3">
                <div className="font-bold">{o.supplierName} · sent · ref {o.reference} · ${o.total.toFixed(2)}</div>
                {more && <pre className="mt-1 whitespace-pre-wrap text-sm">{o.text}</pre>}
              </div>
            )) : (
              <ul className="mt-2 space-y-1 text-lg">{online.map((l) => <li key={l.ingredient}><b>{label(l.ingredient)}</b> {l.qty} {l.unit} · {l.supplierName} · ${l.cost.toFixed(0)}{more && <span className="block text-sm opacity-70">{l.reason}</span>}</li>)}</ul>
            )}
          </div>
          <div className="card">
            <h3 className="text-xl font-black">🚗 Your shopping list</h3>
            {listed.length ? listed.map((o) => (
              <div key={o.id} className="mt-2 rounded-2xl bg-butter p-3">
                <div className="font-bold">{o.supplierName} · {o.trip}</div>
                <ul className="text-lg">{o.lines.map((l) => <li key={l.ingredient}>☐ {label(l.ingredient)} {l.qty} {l.unit} · about ${l.cost.toFixed(0)}</li>)}</ul>
              </div>
            )) : (
              <ul className="mt-2 space-y-1 text-lg">{inPerson.map((l) => <li key={l.ingredient}><b>{label(l.ingredient)}</b> {l.qty} {l.unit} · {l.supplierName} · ${l.cost.toFixed(0)}{more && <span className="block text-sm opacity-70">{l.reason}</span>}</li>)}</ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
