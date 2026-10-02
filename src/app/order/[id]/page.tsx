"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { api } from "@/hooks/api";
import type { Order } from "@/hooks/useOrders";
import { useCustomer } from "@/hooks/useCustomer";
import { pick, t } from "@/lib/i18n/strings";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const customer = useCustomer();
  const [order, setOrder] = useState<Order | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  const lang = customer.lang;

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const sessionId = search.get("session_id");
        const d = sessionId
          ? await api<{ order: Order }>(`/api/checkout/verify?orderId=${id}&session_id=${sessionId}`).catch(() => api<{ order: Order }>(`/api/orders/${id}`))
          : await api<{ order: Order }>(`/api/orders/${id}`);
        if (!stop) setOrder(d.order);
      } catch {}
    };
    load();
    const tm = setInterval(load, 2000);
    return () => { stop = true; clearInterval(tm); };
  }, [id, search]);

  useEffect(() => {
    if (order?.paid && !celebrated) { setCelebrated(true); confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }); customer.refresh(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.paid]);

  return (
    <main className="mx-auto max-w-md space-y-4 p-4 text-center">
      <h1 className="text-3xl font-black">{t("orderPlaced", lang)} 🎉</h1>
      {order ? (
        <>
          <div className="card">
            <div className="text-sm font-bold uppercase opacity-60">{t("pickupCode", lang)}</div>
            <div className="text-8xl font-black tracking-widest">{order.pickupCode}</div>
            <div className="mt-2 text-2xl font-bold">{t(`status_${order.status}` as "status_new", lang)}</div>
            {!order.paid && <p className="mt-2 rounded-xl bg-blush px-3 py-2">Not paid yet.</p>}
          </div>
          <ul className="card text-left">{order.items.map((l, i) => <li key={i}>{l.qty} × {l.emoji} {pick(l.names, lang)}</li>)}<li className="mt-2 font-bold">{t("total", lang)}: ${order.total.toFixed(2)}</li></ul>
        </>
      ) : <p>…</p>}
      <Link href="/" className="btn-primary">← {t("talkToGrandma", lang)}</Link>
    </main>
  );
}
