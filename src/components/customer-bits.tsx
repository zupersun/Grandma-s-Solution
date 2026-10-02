"use client";
/* Small customer-page components. Props are the contract; markup is free to restyle. */
import { useEffect, useState } from "react";
import { pick, t } from "@/lib/i18n/strings";
import { CONFIG } from "@/lib/config";
import type { Lang } from "@/lib/db/schema";
import type { MenuItem } from "@/hooks/useMenu";
import type { VoteOption } from "@/hooks/useVotes";
import quips from "@/persona/quips.json";

export function LangPicker({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-1 rounded-full bg-white/70 p-1">
      {CONFIG.languages.map((l) => (
        <button key={l} onClick={() => onChange(l)} className={`rounded-full px-3 py-1 text-sm font-bold ${l === lang ? "bg-jam text-white" : ""}`}>{CONFIG.languageNames[l]}</button>
      ))}
    </div>
  );
}

export function LoyaltyBadge({ points, lang }: { points: number; lang: Lang }) {
  return (
    <div className="rounded-2xl bg-butter px-3 py-1.5 text-center shadow-sm">
      <div className="text-xl font-black leading-none">⭐ {points}</div>
      <div className="text-[11px] font-semibold opacity-70">{t("points", lang)} · {t("loyaltyRule", lang)}</div>
    </div>
  );
}

export function QuipTicker({ lang }: { lang: Lang }) {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % quips.length), 8000); return () => clearInterval(id); }, []);
  return (
    <p className="rounded-2xl border border-dashed border-jam/40 bg-white/60 px-4 py-2 text-center italic">
      <span className="font-bold not-italic">{t("grandmaSays", lang)}:</span> “{pick(quips[i], lang)}”
    </p>
  );
}

export function Menu({ items, lang, onAdd }: { items: MenuItem[]; lang: Lang; onAdd: (slug: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((m) => (
        <div key={m.slug} className="card flex gap-3">
          <div className="text-5xl">{m.emoji}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-black">{pick(m.names, lang)}</h3>
              <span className="font-bold">${m.price.toFixed(2)}</span>
            </div>
            <p className="text-sm opacity-80">{pick(m.descriptions, lang)}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {m.allergens.length ? m.allergens.map((a) => <span key={a} className="chip">{pick((CONFIG.allergenLabels as Record<string, Record<string, string>>)[a], lang)}</span>) : <span className="chip bg-mint">{t("allergenFree", lang)}</span>}
            </div>
          </div>
          <button className="btn-soft self-end" onClick={() => onAdd(m.slug)}>+ {t("add", lang)}</button>
        </div>
      ))}
    </div>
  );
}

export function Cart({ items, total, lang, onRemove, onCheckout, busy }: { items: { slug: string; qty: number; item: MenuItem }[]; total: number; lang: Lang; onRemove: (slug: string) => void; onCheckout: () => void; busy: boolean }) {
  return (
    <div className="card">
      <h3 className="text-lg font-black">🧺 {t("cart", lang)}</h3>
      {items.length === 0 ? <p className="opacity-70">{t("cartEmpty", lang)}</p> : (
        <ul className="my-2 space-y-1">
          {items.map((x) => (
            <li key={x.slug} className="flex items-center justify-between">
              <span>{x.item.emoji} {x.qty} × {pick(x.item.names, lang)}</span>
              <span className="flex items-center gap-2">${(x.item.price * x.qty).toFixed(2)} <button className="rounded-full bg-blush px-2" onClick={() => onRemove(x.slug)} aria-label="remove">×</button></span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between">
        <span className="font-bold">{t("total", lang)}: ${total.toFixed(2)}</span>
        <button className="btn-primary" disabled={!items.length || busy} onClick={onCheckout}>{t("checkout", lang)}</button>
      </div>
    </div>
  );
}

export function VotePanel({ options, tally, myVote, lang, onVote }: { options: VoteOption[]; tally: Record<string, number>; myVote: string | null; lang: Lang; onVote: (id: string) => void }) {
  const max = Math.max(1, ...Object.values(tally));
  return (
    <div className="card">
      <h3 className="text-lg font-black">🗳️ {t("vote", lang)}</h3>
      <p className="text-sm opacity-70">{myVote ? `${t("voted", lang)}: ${pick(options.find((o) => o.id === myVote)?.label, lang)}` : t("voteCta", lang)}</p>
      <div className="mt-2 space-y-2">
        {options.map((o) => (
          <button key={o.id} onClick={() => onVote(o.id)} className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left min-h-12 ${myVote === o.id ? "border-jam bg-butter" : "border-crust/10 bg-white/70"}`}>
            <span className="text-2xl">{o.emoji}</span>
            <span className="w-28 font-bold">{pick(o.label, lang)}</span>
            <span className="h-3 flex-1 rounded-full bg-crust/10"><span className="block h-3 rounded-full bg-jam transition-all" style={{ width: `${((tally[o.id] ?? 0) / max) * 100}%` }} /></span>
            <span className="w-6 text-right font-bold">{tally[o.id] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SuggestionBox({ lang, onSubmit }: { lang: Lang; onSubmit: (text: string) => Promise<unknown> }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  return (
    <form className="card" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await onSubmit(text); setText(""); setDone(true); setTimeout(() => setDone(false), 3000); }}>
      <h3 className="text-lg font-black">💌 {t("suggestion", lang)}</h3>
      <div className="mt-2 flex gap-2">
        <input className="min-h-12 flex-1 rounded-2xl border border-crust/20 bg-white px-4" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("suggestionPlaceholder", lang)} />
        <button className="btn-soft" type="submit">{t("send", lang)}</button>
      </div>
      {done && <p className="mt-2 text-sm font-semibold text-jam anim-pop">{t("thanks", lang)} +{CONFIG.loyalty.suggestion} ⭐</p>}
    </form>
  );
}
