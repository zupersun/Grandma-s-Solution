"use client";
import type { Request, Stats, Suggestion } from "@/hooks/useFeedback";
import type { VoteOption } from "@/hooks/useVotes";
import type { Summary } from "@/hooks/useBrain";

export function SummaryCard({ summary, onRefresh, loading }: { summary: Summary | null; onRefresh: () => void; loading: boolean }) {
  return (
    <div className="card bg-butter">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-black">📝 Your helper says</h2>
        <button className="btn-ghost" onClick={onRefresh} disabled={loading}>{loading ? "Thinking…" : "Update me"}</button>
      </div>
      <p className="mt-2 text-xl leading-relaxed">{summary?.text ?? "Tap Update me and I'll tell you how the day is going."}</p>
      {summary && <p className="mt-1 text-sm opacity-60">{new Date(summary.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>}
    </div>
  );
}

export function FeedbackFeed({ options, tally, suggestions, requests, stats }: { options: VoteOption[]; tally: Record<string, number>; suggestions: Suggestion[]; requests: Request[]; stats: Stats | null }) {
  const max = Math.max(1, ...Object.values(tally));
  const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card">
        <h2 className="text-2xl font-black">🗳️ Flavour of the month</h2>
        {options.map((o) => (
          <div key={o.id} className="mt-2 flex items-center gap-3 text-lg">
            <span className="w-36 font-bold">{o.emoji} {o.label.en}</span>
            <span className="h-5 flex-1 rounded-full bg-crust/10"><span className="block h-5 rounded-full bg-jam transition-all" style={{ width: `${((tally[o.id] ?? 0) / max) * 100}%` }} /></span>
            <span className="w-8 text-right font-black">{tally[o.id] ?? 0}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="text-2xl font-black">📈 Today</h2>
        {stats ? (
          <>
            <p className="text-lg">{stats.today.orders} orders · ${Math.round(stats.today.revenue)} · waiting: {(stats.live.new ?? 0) + (stats.live.making ?? 0)}</p>
            <ul className="mt-1 text-lg">{stats.today.topItems.map((t) => <li key={t.slug}>{t.emoji} {t.names.en} · {t.units}</li>)}</ul>
            <p className="mt-2 text-sm opacity-60">This week: {stats.week.orders} orders, ${Math.round(stats.week.revenue)}</p>
          </>
        ) : <p className="opacity-50">Counting…</p>}
      </div>
      <div className="card">
        <h2 className="text-2xl font-black">🙋 People asked Grandma for</h2>
        <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto text-lg">{requests.slice(0, 30).map((r) => <li key={r.id} className="flex justify-between gap-2"><span>{r.text}</span><span className="shrink-0 text-sm opacity-50">{ago(r.createdAt)}</span></li>)}</ul>
      </div>
      <div className="card">
        <h2 className="text-2xl font-black">💌 Suggestion box</h2>
        <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto text-lg">{suggestions.slice(0, 30).map((s) => <li key={s.id} className="flex justify-between gap-2"><span>“{s.text}”</span><span className="shrink-0 text-sm opacity-50">{ago(s.createdAt)}</span></li>)}</ul>
      </div>
    </div>
  );
}
