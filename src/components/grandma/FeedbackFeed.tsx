"use client";
import type { Request, Stats, Suggestion } from "@/hooks/useFeedback";
import type { VoteOption } from "@/hooks/useVotes";
import type { Summary } from "@/hooks/useBrain";
import { BORDER, C, card, h2, pill } from "@/lib/ui";

export function SummaryCard({ summary, onRefresh, loading }: { summary: Summary | null; onRefresh: () => void; loading: boolean }) {
  return (
    <div style={{ ...card, background: C.bubble, borderColor: C.tintLine }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={h2}>Your helper says</h2>
        <button className="gm-press" style={pill("ghost")} onClick={onRefresh} disabled={loading}>{loading ? "Thinking…" : "Update me"}</button>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 21, lineHeight: 1.45 }}>{summary?.text ?? "Tap “Update me” and I’ll tell you how the day is going."}</p>
      {summary && <p style={{ margin: "8px 0 0", fontSize: 14, color: C.muted }}>{new Date(summary.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>}
    </div>
  );
}

export function FeedbackFeed({ options, tally, suggestions, requests, stats }: { options: VoteOption[]; tally: Record<string, number>; suggestions: Suggestion[]; requests: Request[]; stats: Stats | null }) {
  const max = Math.max(1, ...Object.values(tally));
  const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
  const list: React.CSSProperties = { margin: "12px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto", fontSize: 17 };
  const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: BORDER };

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
      <div style={card}>
        <h2 style={h2}>Flavour of the month</h2>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {options.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 17 }}>
              <span style={{ width: 130, fontWeight: 600 }}>{o.label.en}</span>
              <span style={{ flex: 1, height: 18, borderRadius: 9, background: C.tint }}>
                <span style={{ display: "block", height: 18, borderRadius: 9, background: C.maroon, width: `${((tally[o.id] ?? 0) / max) * 100}%`, transition: "width 250ms cubic-bezier(0.22,1,0.36,1)" }} />
              </span>
              <span style={{ width: 28, textAlign: "right", fontWeight: 700 }}>{tally[o.id] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <h2 style={h2}>Today</h2>
        {stats ? (
          <>
            <p style={{ margin: "12px 0 0", fontSize: 21 }}>{stats.today.orders} orders · ${Math.round(stats.today.revenue)} · {(stats.live.new ?? 0) + (stats.live.making ?? 0)} waiting</p>
            <ul style={{ ...list, maxHeight: "none" }}>{stats.today.topItems.map((t) => <li key={t.slug} style={row}><span>{t.names.en}</span><span style={{ fontWeight: 700 }}>{t.units}</span></li>)}</ul>
            <p style={{ margin: "12px 0 0", fontSize: 15, color: C.muted }}>This week: {stats.week.orders} orders, ${Math.round(stats.week.revenue)}</p>
          </>
        ) : <p style={{ margin: "12px 0 0", color: C.muted }}>Counting…</p>}
      </div>

      <div style={card}>
        <h2 style={h2}>People asked Grandma for</h2>
        <ul style={list}>{requests.slice(0, 30).map((r) => <li key={r.id} style={row}><span>{r.text}</span><span style={{ color: C.muted, fontSize: 14, flexShrink: 0 }}>{ago(r.createdAt)}</span></li>)}</ul>
      </div>

      <div style={card}>
        <h2 style={h2}>Suggestion box</h2>
        <ul style={list}>{suggestions.slice(0, 30).map((s) => <li key={s.id} style={row}><span>“{s.text}”</span><span style={{ color: C.muted, fontSize: 14, flexShrink: 0 }}>{ago(s.createdAt)}</span></li>)}</ul>
      </div>
    </div>
  );
}
