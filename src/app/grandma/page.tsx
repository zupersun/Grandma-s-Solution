"use client";
/* Grandma's in-store screen. Same Bakeria design language as the customer app (docs/PROMPT.md §2),
   scaled for an iPad: 56px touch targets, large plain type, four choices and nothing deeper. */
import { useEffect, useMemo, useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { useMenu } from "@/hooks/useMenu";
import { useOrders } from "@/hooks/useOrders";
import { useVotes } from "@/hooks/useVotes";
import { useRequests, useStats, useSuggestions } from "@/hooks/useFeedback";
import { useBrain } from "@/hooks/useBrain";
import type { ClientTools } from "@/hooks/useGrandmaVoice";
import { SafeImg } from "@/components/SafeImg";
import { OrderBoard } from "@/components/grandma/OrderBoard";
import { Till } from "@/components/grandma/Till";
import { FeedbackFeed, SummaryCard } from "@/components/grandma/FeedbackFeed";
import { PlanCard } from "@/components/grandma/PlanCard";
import { LiveBanner } from "@/components/grandma/LiveBanner";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { HelperPanel } from "@/components/grandma/HelperPanel";
import { BORDER, C, FONT } from "@/lib/ui";

const TABS = [["orders", "Orders"], ["till", "Till"], ["customers", "Customers"], ["helper", "Helper"]] as const;
type Tab = (typeof TABS)[number][0];

export default function GrandmaScreen() {
  return (
    <ConversationProvider>
      <Screen />
    </ConversationProvider>
  );
}

function Screen() {
  const [tab, setTab] = useState<Tab>("orders");
  const { items: menu } = useMenu();
  const live = useOrders({ status: ["new", "making", "ready"], pollMs: 2000 });
  const recent = useOrders({ pollMs: 2500, limit: 25 });
  const votes = useVotes("grandma", 4000);
  const suggestions = useSuggestions(undefined, 4000);
  const requests = useRequests(4000);
  const { stats } = useStats(5000);
  const brain = useBrain("en");
  const waiting = (stats?.live.new ?? 0) + (stats?.live.making ?? 0);
  const voteLabels = useMemo(() => Object.fromEntries(votes.options.map((o) => [o.id, o.label.en])), [votes.options]);
  const feed = useLiveFeed({ orders: recent.orders, suggestions: suggestions.suggestions, requests: requests.requests, tally: votes.tally, voteLabels });
  const [seenCount, setSeenCount] = useState(0);
  const unseen = Math.max(0, feed.events.length - seenCount);
  useEffect(() => { if (tab === "customers") setSeenCount(feed.events.length); }, [tab, feed.events.length]);

  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<unknown> } };
    nav.wakeLock?.request("screen").catch(() => {});
    const t = setInterval(() => brain.refreshSummary().catch(() => {}), 30 * 60 * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const helperTools: ClientTools = useMemo(() => ({
    getDailySummary: async () => (await brain.refreshSummary()).text,
    getFeedback: async () => `Votes: ${votes.options.map((o) => `${o.label.en} ${votes.tally[o.id] ?? 0}`).join(", ")}. Recent requests: ${requests.requests.slice(0, 6).map((r) => r.text).join("; ")}. Suggestions: ${suggestions.suggestions.slice(0, 4).map((s) => s.text).join("; ")}.`,
    getPlan: async () => brain.plan ? `${brain.plan.summary} Lines: ${brain.plan.lines.map((l) => `${l.ingredient} ${l.qty} ${l.unit} from ${l.supplierName} $${l.cost.toFixed(0)}`).join("; ")}. Total $${Math.round(brain.plan.totalCost)}. Status ${brain.plan.status}.` : "There is no plan yet. Ask me to make one.",
    updatePlan: async ({ directive }) => { const d = await brain.sendDirective(String(directive)); return d.note ?? `Done. ${d.plan.summary}`; },
    approvePlan: async () => { const d = await brain.approvePlan(); const sent = d.supplierOrders.filter((o) => o.mode === "online"); const listed = d.supplierOrders.filter((o) => o.mode === "in_person"); return `Approved. Ordered online from ${sent.map((o) => o.supplierName).join(", ") || "nobody"}. You pick up from ${listed.map((o) => o.supplierName).join(", ") || "nobody"}.`; },
    getOrders: async ({ status }) => { const list = live.orders.filter((o) => !status || o.status === status); return list.length ? list.map((o) => `${o.pickupCode}: ${o.items.map((l) => `${l.qty} ${l.names.en}`).join(", ")} (${o.status})`).join("; ") : "No orders waiting."; },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [brain.plan, votes.tally, requests.requests, suggestions.suggestions, live.orders]);

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: FONT, fontSize: 20 }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap" />
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 24px 48px", display: "flex", flexDirection: "column", gap: 22 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <SafeImg src="/grandma/logo.png" alt="Grandma's Bakeria" style={{ display: "block", width: 150, height: "auto" }}
            fallback={<span style={{ fontSize: 24, fontWeight: 700, color: C.maroon, letterSpacing: "-0.3px" }}>Grandma&apos;s Bakeria</span>} />
          <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: C.muted }}>
            {waiting > 0 ? `${waiting} order${waiting === 1 ? "" : "s"} waiting` : "All caught up"}
            {stats ? ` · ${stats.today.orders} today · $${Math.round(stats.today.revenue)}` : ""}
          </p>
        </header>

        <LiveBanner events={feed.events} />

        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {TABS.map(([id, text]) => {
            const on = tab === id;
            return (
              <button key={id} className="gm-press" onClick={() => setTab(id)}
                style={{ minHeight: 56, padding: "0 26px", borderRadius: 28, font: "inherit", fontSize: 18, fontWeight: 600, cursor: "pointer",
                  ...(on ? { background: C.maroon, color: C.white, border: 0 } : { background: C.white, color: C.muted, border: BORDER }) }}>
                {text}
                {id === "customers" && unseen > 0 && (
                  <span aria-label={`${unseen} new`} style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 30, height: 30, padding: "0 8px", borderRadius: 15, background: on ? C.white : C.maroon, color: on ? C.maroon : C.white, fontSize: 16, fontWeight: 700 }}>{unseen}</span>
                )}
              </button>
            );
          })}
        </nav>

        {tab === "orders" && <OrderBoard orders={live.orders} onAdvance={live.advance} onUndo={live.undo} />}
        {tab === "till" && <Till menu={menu} onCreate={live.createTillOrder} />}
        {tab === "customers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SummaryCard summary={brain.summary} onRefresh={() => brain.refreshSummary().catch(() => {})} loading={brain.loading} />
            <FeedbackFeed options={votes.options} tally={votes.tally} suggestions={suggestions.suggestions} requests={requests.requests} stats={stats} events={feed.events} />
          </div>
        )}
        {tab === "helper" && (
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(300px, 0.8fr) minmax(0, 1.6fr)", alignItems: "start" }}>
            <HelperPanel clientTools={helperTools} />
            <PlanCard plan={brain.plan} supplierOrders={brain.supplierOrders} loading={brain.loading} error={brain.error} note={brain.note}
              onMake={() => brain.makePlan().catch(() => {})} onApprove={() => brain.approvePlan().catch(() => {})} onDirective={(t) => brain.sendDirective(t).catch(() => {})} />
          </div>
        )}
      </div>
    </main>
  );
}
