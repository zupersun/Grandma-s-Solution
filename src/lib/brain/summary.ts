import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { CONFIG, grandmaName } from "@/lib/config";
import { BrainUnavailable, generateText } from "./llm";

const { orders, orderItems, menuItems, votes, suggestions, requests, summaries } = schema;

export async function todayStats() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [agg] = await db.select({ n: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${orders.total}), 0)` }).from(orders).where(and(gte(orders.createdAt, today), eq(orders.paid, true)));
  const top = await db.select({ name: menuItems.names, units: sql<number>`sum(${orderItems.qty})` }).from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(and(gte(orders.createdAt, today), eq(orders.paid, true))).groupBy(menuItems.names).orderBy(sql`sum(${orderItems.qty}) desc`).limit(3);
  const [v] = await db.select({ n: sql<number>`count(*)` }).from(votes).where(gte(votes.createdAt, today));
  const [s] = await db.select({ n: sql<number>`count(*)` }).from(suggestions).where(gte(suggestions.createdAt, today));
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(requests).where(gte(requests.createdAt, today));
  const [w] = await db.select({ n: sql<number>`count(*)` }).from(orders).where(inArray(orders.status, ["new", "making"]));
  const latestSuggestions = (await db.select({ text: suggestions.text }).from(suggestions).orderBy(desc(suggestions.createdAt)).limit(3)).map((x) => x.text);
  return {
    orders: Number(agg.n), revenue: Math.round(Number(agg.revenue) * 100) / 100,
    topItems: top.map((t) => `${t.name.en} (${Number(t.units)})`),
    newVotes: Number(v.n), newSuggestions: Number(s.n), newRequests: Number(r.n), waiting: Number(w.n), latestSuggestions,
  };
}

export async function writeSummary(lang = "en") {
  const stats = await todayStats();
  let text: string;
  try {
    text = await generateText({
      system: `You are the Helper at ${CONFIG.bakeryName}. Write ${grandmaName()} a warm note about her day in language code "${lang}". Exactly three short sentences, rounded numbers, no jargon, end with one concrete suggestion. Never invent numbers.`,
      messages: [{ role: "user", content: JSON.stringify(stats) }],
      temperature: 0.6,
    });
  } catch (e) {
    if (!(e instanceof BrainUnavailable)) console.warn("[brain] summary failed", e);
    text = `So far today: ${stats.orders} orders and about $${Math.round(stats.revenue)}. Top sellers: ${stats.topItems.join(", ") || "nothing yet"}. ${stats.waiting} orders are waiting, and ${stats.newRequests} people asked Grandma for something new.`;
  }
  const [row] = await db.insert(summaries).values({ text: text.trim(), lang, stats }).returning();
  return row;
}

export async function latestSummary() {
  const [row] = await db.select().from(summaries).orderBy(desc(summaries.createdAt)).limit(1);
  return row ?? null;
}
