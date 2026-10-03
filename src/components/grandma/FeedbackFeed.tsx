"use client";
/* The Customers tab, written for Grandma: what people keep asking for, how the vote stands,
   and the newest things they said. One idea per block, big type, no scrolling lists. */
import type { Request, Stats, Suggestion } from "@/hooks/useFeedback";
import type { VoteOption } from "@/hooks/useVotes";
import type { Summary } from "@/hooks/useBrain";
import type { LiveEvent } from "@/hooks/useLiveFeed";
import { BORDER, C } from "@/lib/ui";

const sheet: React.CSSProperties = { background: C.white, border: BORDER, borderRadius: 16, padding: "24px 26px" };
const eyebrow: React.CSSProperties = { margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted };

export function SummaryCard({ summary, onRefresh, loading }: { summary: Summary | null; onRefresh: () => void; loading: boolean }) {
  return (
    <div style={{ ...sheet, background: C.bubble, borderColor: C.tintLine }}>
      <p style={eyebrow}>Your helper says</p>
      <p style={{ margin: "10px 0 0", fontSize: 24, lineHeight: 1.5 }}>{summary?.text ?? "Tap the button and I’ll tell you how the day is going."}</p>
      <button className="gm-press" onClick={onRefresh} disabled={loading}
        style={{ marginTop: 18, minHeight: 64, padding: "0 28px", borderRadius: 32, border: 0, background: C.maroon, color: C.white, font: "inherit", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>
        {loading ? "Thinking…" : "Tell me about today"}
      </button>
    </div>
  );
}

/** Group near-identical asks so Grandma sees "6 people want ube", not six separate lines. */
function topWants(requests: Request[], suggestions: Suggestion[]) {
  const counts = new Map<string, { label: string; n: number }>();
  const add = (raw: string) => {
    const key = raw.trim().toLowerCase().replace(/^(please |more |a |an |the )/, "").slice(0, 28);
    if (key.length < 2) return;
    const row = counts.get(key) ?? { label: raw.trim(), n: 0 };
    row.n += 1; counts.set(key, row);
  };
  for (const r of requests) add(r.itemHint || r.text);
  for (const s of suggestions) add(s.text.split(/[.,!]/)[0]);
  return [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 5);
}

export function FeedbackFeed({ options, tally, suggestions, requests, stats, events }: {
  options: VoteOption[]; tally: Record<string, number>; suggestions: Suggestion[]; requests: Request[]; stats: Stats | null; events: LiveEvent[];
}) {
  const max = Math.max(1, ...Object.values(tally));
  const leader = options.reduce((best, o) => ((tally[o.id] ?? 0) > (tally[best?.id ?? ""] ?? -1) ? o : best), options[0]);
  const wants = topWants(requests, suggestions);
  const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} hours ago` : `${Math.round(m / 1440)} days ago`; };
  const recent = [...suggestions.map((s) => ({ at: s.createdAt, text: s.text })), ...requests.map((r) => ({ at: r.createdAt, text: r.text }))]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Today in three numbers */}
      <div style={{ ...sheet, display: "flex", gap: 36, flexWrap: "wrap" }}>
        <div><p style={eyebrow}>Orders today</p><p style={{ margin: "6px 0 0", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{stats?.today.orders ?? "—"}</p></div>
        <div><p style={eyebrow}>Money taken</p><p style={{ margin: "6px 0 0", fontSize: 44, fontWeight: 700, lineHeight: 1, color: C.maroon }}>${Math.round(stats?.today.revenue ?? 0)}</p></div>
        <div><p style={eyebrow}>Best seller</p><p style={{ margin: "6px 0 0", fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>{stats?.today.topItems[0]?.names.en ?? "Nothing yet"}</p></div>
      </div>

      {/* What people keep asking for */}
      <div style={sheet}>
        <p style={eyebrow}>What people keep asking you for</p>
        {wants.length ? (
          <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
            {wants.map((w) => (
              <li key={w.label} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24 }}>
                <span style={{ minWidth: 148, padding: "8px 18px", borderRadius: 24, background: C.maroon, color: C.white, fontSize: 20, fontWeight: 700, textAlign: "center" }}>
                  {w.n} {w.n === 1 ? "person" : "people"}
                </span>
                <span style={{ flex: 1, lineHeight: 1.4 }}>{w.label}</span>
              </li>
            ))}
          </ul>
        ) : <p style={{ margin: "12px 0 0", fontSize: 21, color: C.muted }}>Nobody has asked for anything new yet.</p>}
      </div>

      {/* The vote */}
      <div style={sheet}>
        <p style={eyebrow}>Flavour of the month</p>
        <p style={{ margin: "8px 0 16px", fontSize: 28, fontWeight: 700 }}>
          {leader ? <>{leader.label.en} is winning with {tally[leader.id] ?? 0} votes</> : "No votes yet"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {options.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 21 }}>
              <span style={{ width: 150, fontWeight: 600 }}>{o.label.en}</span>
              <span style={{ flex: 1, height: 24, borderRadius: 12, background: C.tint }}>
                <span style={{ display: "block", height: 24, borderRadius: 12, background: C.maroon, width: `${((tally[o.id] ?? 0) / max) * 100}%`, transition: "width 300ms cubic-bezier(0.22,1,0.36,1)" }} />
              </span>
              <span style={{ width: 36, textAlign: "right", fontWeight: 700 }}>{tally[o.id] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Newest messages */}
      <div style={sheet}>
        <p style={eyebrow}>Newest messages from customers</p>
        <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
          {recent.map((r, i) => (
            <li key={i} style={{ padding: "14px 18px", background: C.bubble, borderRadius: "18px 18px 18px 4px", fontSize: 21, lineHeight: 1.45 }}>
              “{r.text}”<span style={{ display: "block", marginTop: 4, fontSize: 15, color: C.muted }}>{ago(r.at)}</span>
            </li>
          ))}
          {!recent.length && <li style={{ fontSize: 21, color: C.muted }}>Nothing yet today.</li>}
        </ul>
      </div>

      {/* Everything that happened while she watched */}
      {events.length > 0 && (
        <div style={sheet}>
          <p style={eyebrow}>Happening right now</p>
          <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {events.slice(0, 8).map((e) => (
              <li key={e.key} style={{ display: "flex", gap: 12, alignItems: "baseline", fontSize: 20, paddingBottom: 10, borderBottom: BORDER }}>
                <span aria-hidden style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{e.icon}</span>
                <span style={{ flex: 1 }}>{e.text}</span>
                <span style={{ fontSize: 15, color: C.muted, flexShrink: 0 }}>{Math.max(0, Math.round((Date.now() - e.at) / 60000))} min ago</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
