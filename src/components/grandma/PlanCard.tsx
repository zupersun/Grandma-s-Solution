"use client";
/* The buying plan, written for Grandma: one headline number, one clear action, and two plain lists.
   Layout borrows Ramp's calm ledger style; wording avoids jargon and rounds every number. */
import { useEffect, useState } from "react";
import type { Plan, SupplierOrder } from "@/hooks/useBrain";
import type { PlanLine } from "@/lib/db/schema";
import supplierData from "@/persona/suppliers.json";
import { BORDER, C } from "@/lib/ui";

const LABELS = supplierData.ingredientLabels as Record<string, string>;
const label = (i: string) => LABELS[i] ?? i;
const dollars = (n: number) => `$${Math.round(n).toLocaleString()}`;

const sheet: React.CSSProperties = { background: C.white, border: BORDER, borderRadius: 16, overflow: "hidden" };
const sectionHead: React.CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "20px 24px", borderBottom: BORDER };
const eyebrow: React.CSSProperties = { margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted };
const bigBtn = (solid: boolean): React.CSSProperties => ({
  minHeight: 68, padding: "0 32px", borderRadius: 34, font: "inherit", fontSize: 21, fontWeight: 700, cursor: "pointer",
  ...(solid ? { background: C.maroon, color: C.white, border: 0, boxShadow: "0 6px 18px rgba(90,26,31,.24)" } : { background: C.white, color: C.text, border: BORDER }),
});

function Group({ title, note, lines, done, onToggle }: { title: string; note: string; lines: PlanLine[]; done?: Record<string, boolean>; onToggle?: (k: string) => void }) {
  const total = lines.reduce((s, l) => s + l.cost, 0);
  return (
    <div style={{ borderTop: BORDER }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "16px 24px 8px" }}>
        <div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</p>
          {note && <p style={{ margin: "2px 0 0", fontSize: 16, color: C.muted }}>{note}</p>}
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, whiteSpace: "nowrap" }}>{dollars(total)}</span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {lines.map((l) => {
          const key = `${title}:${l.ingredient}`;
          const checked = done?.[key] ?? false;
          return (
            <li key={l.ingredient} className="gm-row" style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", borderTop: BORDER }}>
              {onToggle && (
                <input type="checkbox" className="gm-check" checked={checked} onChange={() => onToggle(key)} aria-label={`Bought ${label(l.ingredient)}`} />
              )}
              <span style={{ flex: 1, minWidth: 0, fontSize: 21, textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.5 : 1 }}>
                <b style={{ fontWeight: 700 }}>{label(l.ingredient)}</b>
                <span style={{ color: C.muted }}> — {l.qty} {l.unit}</span>
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, whiteSpace: "nowrap" }}>{dollars(l.cost)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PlanCard({ plan, supplierOrders, loading, error, note, onMake, onApprove }: {
  plan: Plan | null; supplierOrders: SupplierOrder[]; loading: boolean; error: string | null; note: string | null;
  onMake: () => void; onApprove: () => void;
}) {
  const [why, setWhy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem("grandma.bought") || "{}")); } catch {} }, []);
  const toggle = (k: string) => setDone((d) => { const n = { ...d, [k]: !d[k] }; try { localStorage.setItem("grandma.bought", JSON.stringify(n)); } catch {} return n; });

  const online = plan?.lines.filter((l) => l.orderingMode === "online") ?? [];
  const inPerson = plan?.lines.filter((l) => l.orderingMode === "in_person") ?? [];
  const onlineCost = online.reduce((s, l) => s + l.cost, 0);
  const inPersonCost = inPerson.reduce((s, l) => s + l.cost, 0);
  const sent = supplierOrders.filter((o) => o.mode === "online");
  const listed = supplierOrders.filter((o) => o.mode === "in_person");
  const approved = plan ? plan.status !== "draft" : false;

  const byTrip = (lines: PlanLine[]) => {
    const groups = new Map<string, PlanLine[]>();
    for (const l of lines) { const arr = groups.get(l.supplierName) ?? []; arr.push(l); groups.set(l.supplierName, arr); }
    return [...groups.entries()];
  };
  const tripNote = (supplier: string) => listed.find((o) => o.supplierName === supplier)?.trip ?? "";

  if (!plan) {
    return (
      <div style={{ ...sheet, padding: 32, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>No shopping list yet</p>
        <p style={{ margin: "10px 0 24px", fontSize: 20, color: C.muted, lineHeight: 1.5 }}>I look at what sold and what people asked for. Then I write your list.</p>
        {error && <p style={{ margin: "0 0 16px", padding: "12px 16px", background: C.bubble, borderRadius: 14, fontSize: 18 }}>{error}</p>}
        <button className="gm-press" style={bigBtn(true)} onClick={onMake} disabled={loading}>{loading ? "Working on it…" : "Make my list"}</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Headline: one number, one sentence, one action */}
      <div style={{ ...sheet, padding: "28px 24px" }}>
        <p style={eyebrow}>Your shopping {plan.period}</p>
        <p style={{ margin: "10px 0 0", fontSize: 56, fontWeight: 700, lineHeight: 1, color: C.maroon, letterSpacing: "-1px" }}>{dollars(plan.totalCost)}</p>
        <p style={{ margin: "10px 0 0", fontSize: 21, lineHeight: 1.5 }}>{plan.summary}</p>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 22, paddingTop: 20, borderTop: BORDER }}>
          <div><p style={eyebrow}>I buy these for you</p><p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700 }}>{dollars(onlineCost)}</p></div>
          <div><p style={eyebrow}>You buy these</p><p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700 }}>{dollars(inPersonCost)}</p></div>
          <div><p style={eyebrow}>Is it done?</p><p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: approved ? "#2f6b43" : C.muted }}>{approved ? "Yes, all sent" : "Not yet"}</p></div>
        </div>

        {error && <p style={{ margin: "18px 0 0", padding: "12px 16px", background: C.bubble, borderRadius: 14, fontSize: 18 }}>{error}</p>}
        {note && <p style={{ margin: "18px 0 0", padding: "12px 16px", background: C.tint, border: `0.75px solid ${C.tintLine}`, borderRadius: 14, fontSize: 20 }}>{note}</p>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
          {!approved && !confirm && <button className="gm-press" style={bigBtn(true)} onClick={() => setConfirm(true)} disabled={loading}>Yes, buy it all</button>}
          {!approved && <button className="gm-press" style={bigBtn(false)} onClick={onMake} disabled={loading}>{loading ? "Working on it…" : "Start over"}</button>}
          {approved && <span style={{ fontSize: 20, fontWeight: 600, color: "#2f6b43" }}>All done. I sent my orders. Your list is below.</span>}
        </div>

        {confirm && (
          <div role="dialog" aria-label="Confirm the order" style={{ marginTop: 18, padding: 24, background: C.tint, border: `2px solid ${C.maroon}`, borderRadius: 16 }}>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Spend about {dollars(plan.totalCost)}?</p>
            <p style={{ margin: "8px 0 18px", fontSize: 19, lineHeight: 1.5 }}>I will order {dollars(onlineCost)} myself, right now. You buy the other {dollars(inPersonCost)} when you are out.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="gm-press" style={bigBtn(true)} onClick={() => { setConfirm(false); onApprove(); }}>Yes, do it</button>
              <button className="gm-press" style={bigBtn(false)} onClick={() => setConfirm(false)}>No, wait</button>
            </div>
          </div>
        )}
      </div>

      {/* I order these */}
      <div style={sheet}>
        <div style={sectionHead}>
          <div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>I buy these for you</p>
            <p style={{ margin: "4px 0 0", fontSize: 17, color: C.muted }}>{approved ? "All sent. Nothing for you to do." : "I send nothing until you say yes."}</p>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{dollars(onlineCost)}</span>
        </div>
        {sent.length > 0 && (
          <div style={{ padding: "16px 24px", background: "#f1f7f3", borderBottom: BORDER }}>
            {sent.map((o) => <p key={o.id} style={{ margin: "4px 0", fontSize: 18 }}><b>{o.supplierName}</b> · sent · number {o.reference}</p>)}
          </div>
        )}
        {byTrip(online).map(([supplier, lines]) => <Group key={supplier} title={supplier} note="" lines={lines} />)}
      </div>

      {/* You pick up */}
      <div style={sheet}>
        <div style={sectionHead}>
          <div>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>You buy these yourself</p>
            <p style={{ margin: "4px 0 0", fontSize: 17, color: C.muted }}>Tick each one when you have it.</p>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{dollars(inPersonCost)}</span>
        </div>
        {byTrip(inPerson).map(([supplier, lines]) => <Group key={supplier} title={supplier} note={tripNote(supplier)} lines={lines} done={done} onToggle={toggle} />)}
      </div>

      {/* Why */}
      <div style={sheet}>
        <button className="gm-press" onClick={() => setWhy((w) => !w)} aria-expanded={why}
          style={{ width: "100%", minHeight: 68, padding: "0 24px", border: 0, background: C.white, font: "inherit", fontSize: 21, fontWeight: 700, textAlign: "left", cursor: "pointer", color: C.maroon }}>
          {why ? "Hide this" : "Why so much?"}
        </button>
        {why && (
          <div style={{ padding: "0 24px 24px" }}>
            {plan.flags.length > 0 && (
              <ul style={{ margin: "0 0 18px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.flags.map((f, i) => <li key={i} style={{ padding: "14px 18px", background: C.bubble, borderRadius: 14, fontSize: 19, lineHeight: 1.45 }}>{f}</li>)}
              </ul>
            )}
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {plan.lines.map((l) => (
                <li key={l.ingredient} style={{ fontSize: 19, lineHeight: 1.45, paddingBottom: 12, borderBottom: BORDER }}>
                  <b>{label(l.ingredient)}</b> — {l.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
