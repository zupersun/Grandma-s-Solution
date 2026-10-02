"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/hooks/useCustomer";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/hooks/useCart";
import { useVotes } from "@/hooks/useVotes";
import { useRequests, useSuggestions } from "@/hooks/useFeedback";
import type { ClientTools } from "@/hooks/useGrandmaVoice";
import { api } from "@/hooks/api";
import { TalkToGrandma } from "@/components/TalkToGrandma";
import { Cart, LangPicker, LoyaltyBadge, Menu, QuipTicker, SuggestionBox, VotePanel } from "@/components/customer-bits";
import { pick, t } from "@/lib/i18n/strings";
import { CONFIG } from "@/lib/config";

export default function CustomerPage() {
  const router = useRouter();
  const customer = useCustomer();
  const { items: menu } = useMenu();
  const cart = useCart(menu, customer.id);
  const votes = useVotes(customer.id, 5000);
  const suggestions = useSuggestions(customer.id);
  const requests = useRequests();
  const [busy, setBusy] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const lang = customer.lang;

  const checkout = async () => {
    setBusy(true);
    try {
      const { orderId, url } = await cart.checkout();
      if (url) window.location.href = url; else router.push(`/order/${orderId}`);
    } catch (e) { alert((e as Error).message); } finally { setBusy(false); }
  };

  const clientTools: ClientTools = useMemo(() => ({
    addLoyaltyPoints: async ({ reason }) => { const r = await api<{ points: number; awarded: number }>("/api/loyalty", { method: "POST", json: { customerId: customer.id, reason: (reason as string) || "chat" } }); customer.bumpPoints(r.points); return r.awarded ? `Gave ${r.awarded} points. ${customer.name || "They"} now have ${r.points}.` : `No new points right now, they already have ${r.points}.`; },
    addToCart: async ({ itemSlug, qty }) => { const m = menu.find((x) => x.slug === itemSlug || x.names.en.toLowerCase() === String(itemSlug).toLowerCase()); if (!m) return `I don't have ${itemSlug}. Menu: ${menu.map((x) => x.slug).join(", ")}`; const n = Number(qty) || 1; cart.add(m.slug, n); return `Added ${n} ${m.names.en}. The order is now $${(cart.total + m.price * n).toFixed(2)}.`; },
    placeOrder: async () => { if (!cart.lines.length) return "The basket is empty."; const { orderId, url } = await cart.checkout(); if (url) { window.location.href = url; return "Sending them to pay."; } router.push(`/order/${orderId}`); return "Order placed and paid. The pickup code is on their screen now."; },
    voteFlavour: async ({ option }) => { const o = votes.options.find((x) => x.id === option || x.label.en.toLowerCase() === String(option).toLowerCase()); if (!o) return `Options are ${votes.options.map((x) => x.id).join(", ")}.`; const r = await votes.vote(o.id); customer.refresh(); return `Voted ${o.label.en}. ${r.awarded ? `+${r.awarded} points.` : "Vote changed."} Tally: ${Object.entries(r.tally).map(([k, v]) => `${k} ${v}`).join(", ")}.`; },
    submitSuggestion: async ({ text }) => { const r = await suggestions.submit(String(text), "voice"); customer.refresh(); return r.note ?? `Saved the suggestion. +${r.awarded} points.`; },
    logRequest: async ({ text, itemHint }) => { await requests.log(customer.id, String(text), itemHint ? String(itemHint) : undefined, "voice"); return "Noted for Grandma's helper."; },
    getMyPoints: async () => `${customer.name || "They"} have ${customer.points} points. ${CONFIG.loyalty.redeemAt} points is ${CONFIG.loyalty.redeemReward}.`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [customer.id, customer.name, customer.points, menu, cart.lines, cart.total, votes.options, votes.tally]);

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 pb-32">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-black">🥧 {CONFIG.bakeryName}</h1>
        <div className="flex items-center gap-2">
          <LangPicker lang={lang} onChange={customer.setLang} />
          <LoyaltyBadge points={customer.points} lang={lang} />
        </div>
      </header>

      <TalkToGrandma agent="customer" lang={lang} clientTools={clientTools} />

      {!customer.name && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (nameDraft.trim()) customer.setName(nameDraft.trim()); }}>
          <input className="min-h-12 flex-1 rounded-2xl border border-crust/20 bg-white px-4" placeholder={t("yourName", lang)} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
          <button className="btn-soft" type="submit">OK</button>
        </form>
      )}
      <QuipTicker lang={lang} />

      <section id="menu" className="space-y-2">
        <h2 className="text-2xl font-black">🍞 {t("menu", lang)}</h2>
        <Menu items={menu} lang={lang} onAdd={(slug) => cart.add(slug)} />
      </section>

      <VotePanel options={votes.options} tally={votes.tally} myVote={votes.myVote} lang={lang} onVote={(id) => votes.vote(id).then(() => customer.refresh())} />
      <SuggestionBox lang={lang} onSubmit={async (text) => { await suggestions.submit(text, "ui"); customer.refresh(); }} />

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-3xl p-3">
        <Cart items={cart.items} total={cart.total} lang={lang} onRemove={cart.remove} onCheckout={checkout} busy={busy} />
      </div>
      <p className="pt-8 text-center text-xs opacity-50">A fictional bakery for the Socratica × Ramp hack. {pick(CONFIG.languageNames, lang)}</p>
    </main>
  );
}
