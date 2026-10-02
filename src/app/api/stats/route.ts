import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { handle, ok } from "@/lib/validate";

const { orders, orderItems, menuItems } = schema;

async function window(since: Date) {
  const [agg] = await db.select({ n: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${orders.total}), 0)` })
    .from(orders).where(and(gte(orders.createdAt, since), eq(orders.paid, true)));
  const top = await db.select({ slug: menuItems.slug, emoji: menuItems.emoji, names: menuItems.names, units: sql<number>`sum(${orderItems.qty})` })
    .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(and(gte(orders.createdAt, since), eq(orders.paid, true)))
    .groupBy(menuItems.slug, menuItems.emoji, menuItems.names).orderBy(sql`sum(${orderItems.qty}) desc`).limit(5);
  return { orders: Number(agg.n), revenue: Math.round(Number(agg.revenue) * 100) / 100, topItems: top };
}

export const GET = handle(async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week = new Date(today.getTime() - 6 * 86_400_000);
  const live = await db.select({ status: orders.status, n: sql<number>`count(*)` }).from(orders)
    .where(inArray(orders.status, ["new", "making", "ready"])).groupBy(orders.status);
  const liveCounts = { new: 0, making: 0, ready: 0 } as Record<string, number>;
  for (const l of live) liveCounts[l.status] = Number(l.n);
  return ok({ today: await window(today), week: await window(week), live: liveCounts });
});
