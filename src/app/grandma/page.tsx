"use client";
import { useEffect, useMemo, useState } from "react";
import { useMenu } from "@/hooks/useMenu";
import { useOrders } from "@/hooks/useOrders";
import { useVotes } from "@/hooks/useVotes";
import { useRequests, useStats, useSuggestions } from "@/hooks/useFeedback";
import { useBrain } from "@/hooks/useBrain";
import type { ClientTools } from "@/hooks/useGrandmaVoice";
import { TalkToGrandma } from "@/components/TalkToGrandma";
import { OrderBoard } from "@/components/grandma/OrderBoard";
import { Till } from "@/components/grandma/Till";
import { FeedbackFeed, SummaryCard } from "@/components/grandma/FeedbackFeed";
import { PlanCard } from "@/components/grandma/PlanCard";
import { CONFIG } from "@/lib/config";

const TABS = [["orders", "🧾 Orders"], ["till", "💵 Till"], ["customers", "💬 Customers"], ["helper", "🧠 Helper"]] as const;
type Tab = (typeof TABS)[number][0];

export default function GrandmaPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const { items: menu } = useMenu();
  const live = useOrders({ status: ["new", "making", "ready"], pollMs: 2000 });
  const votes = useVotes("grandma", 3000);
  const suggestions = useSuggestions(undefined, 3000);
  const requests = useRequests(3000);
  const { stats } = useStats(5000);
  const brain = useBrain("en");

  useEffect(() => {
    document.body.classList.add("ipad");
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<unknown> } };
    nav.wakeLock?.request("screen").catch(() => {});
    const t = setInterval(() => brain.refreshSummary().catch(() => {}), 30 * 60 * 1000);
    return () => { clearInterval(t); document.body.classList.remove("ipad"); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const helperTools: ClientTools = useMemo(() => ({
    getDailySummary: async () => { const s = await brain.refreshSummary(); return s.text; },
    getFeedback: async () => `Votes: ${votes.options.map((o) => `${o.label.en} ${votes.tally[o.id] ?? 0}`).join(", ")}. Recent requests: ${requests.requests.slice(0, 6).map((r) => r.text).join("; ")}. Suggestions: ${suggestions.suggestions.slice(0, 4).map((s) => s.text).join("; ")}.`,
    getPlan: async () => brain.plan ? `${brain.plan.summary} Lines: ${brain.plan.lines.map((l) => `${l.ingredient} ${l.qty} ${l.unit} from ${l.supplierName} $${l.cost.toFixed(0)}`).join("; ")}. Total $${Math.round(brain.plan.totalCost)}. Status ${brain.plan.status}.` : "There is no plan yet. Ask me to make one.",
    updatePlan: async ({ directive }) => { const d = await brain.sendDirective(String(directive)); return d.note ?? `Done. ${d.plan.summary}`; },
    approvePlan: async () => { const d = await brain.approvePlan(); const sent = d.supplierOrders.filter((o) => o.mode === "online"); const listed = d.supplierOrders.filter((o) => o.mode === "in_person"); return `Approved. Ordered online from ${sent.map((o) => o.supplierName).join(", ") || "nobody"}. Shopping list for ${listed.map((o) => o.supplierName).join(", ") || "nobody"}.`; },
    getOrders: async ({ status }) => { const list = live.orders.filter((o) => !status || o.status === status); return list.length ? list.map((o) => `${o.pickupCode}: ${o.items.map((l) => `${l.qty} ${l.names.en}`).join(", ")} (${o.status})`).join("; ") : "No orders waiting."; },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [brain.plan, votes.tally, requests.requests, suggestions.suggestions, live.orders]);

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">👵 {CONFIG.bakeryName} · Grandma's screen</h1>
        <nav className="flex gap-2">
          {TABS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`btn ${tab === id ? "bg-jam text-white" : "bg-white/70"}`}>{label}</button>)}
        </nav>
      </header>

      {tab === "orders" && <OrderBoard orders={live.orders} onAdvance={live.advance} onUndo={live.undo} />}
      {tab === "till" && <Till menu={menu} onCreate={live.createTillOrder} />}
      {tab === "customers" && (
        <div className="space-y-4">
          <SummaryCard summary={brain.summary} onRefresh={() => brain.refreshSummary().catch(() => {})} loading={brain.loading} />
          <FeedbackFeed options={votes.options} tally={votes.tally} suggestions={suggestions.suggestions} requests={requests.requests} stats={stats} />
        </div>
      )}
      {tab === "helper" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <TalkToGrandma agent="helper" lang="en" clientTools={helperTools} title="Talk to your helper" compact />
          <PlanCard plan={brain.plan} supplierOrders={brain.supplierOrders} loading={brain.loading} error={brain.error} note={brain.note}
            onMake={() => brain.makePlan().catch(() => {})} onApprove={() => brain.approvePlan().catch(() => {})} onDirective={(t) => brain.sendDirective(t).catch(() => {})} />
        </div>
      )}
    </main>
  );
}
