import { and, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { money, newId, newPickupCode } from "@/lib/ids";
import { award } from "@/lib/db/loyalty";
import type { OrderStatus } from "@/lib/db/schema";

const { orders, orderItems, menuItems, customers } = schema;

export const STATUS_FLOW: OrderStatus[] = ["new", "making", "ready", "picked_up"];
const UNDO_WINDOW_MS = 12_000;

export type OrderLine = { slug: string; emoji: string; names: Record<string, string>; qty: number; unitPrice: number };
export type OrderWithItems = typeof orders.$inferSelect & { items: OrderLine[]; customerName: string | null };

export async function loadOrders(opts: { status?: OrderStatus[]; since?: Date; customerId?: string; ids?: string[]; limit?: number }) {
  const where = [];
  if (opts.status?.length) where.push(inArray(orders.status, opts.status));
  if (opts.since) where.push(gte(orders.createdAt, opts.since));
  if (opts.customerId) where.push(eq(orders.customerId, opts.customerId));
  if (opts.ids?.length) where.push(inArray(orders.id, opts.ids));
  const rows = await db.select().from(orders).where(where.length ? and(...where) : undefined)
    .orderBy(desc(orders.createdAt)).limit(opts.limit ?? 200);
  return attachItems(rows);
}

async function attachItems(rows: (typeof orders.$inferSelect)[]): Promise<OrderWithItems[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const lines = await db.select({
    orderId: orderItems.orderId, qty: orderItems.qty, unitPrice: orderItems.unitPrice,
    slug: menuItems.slug, emoji: menuItems.emoji, names: menuItems.names,
  }).from(orderItems).innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id)).where(inArray(orderItems.orderId, ids));
  const customerIds = [...new Set(rows.map((r) => r.customerId).filter((x): x is string => !!x))];
  const names = customerIds.length
    ? Object.fromEntries((await db.select({ id: customers.id, name: customers.name }).from(customers).where(inArray(customers.id, customerIds))).map((c) => [c.id, c.name]))
    : {};
  return rows.map((r) => ({
    ...r,
    customerName: r.customerId ? names[r.customerId] ?? null : null,
    items: lines.filter((l) => l.orderId === r.id).map(({ orderId: _o, ...l }) => l),
  }));
}

export async function createOrder(input: {
  customerId?: string | null; channel: "web" | "till" | "voice"; items: { slug: string; qty: number }[];
  note?: string | null; paidHow?: "counter" | "demo" | null;
}) {
  const slugs = input.items.map((i) => i.slug);
  const menu = await db.select().from(menuItems).where(and(inArray(menuItems.slug, slugs), eq(menuItems.active, true)));
  const bySlug = Object.fromEntries(menu.map((m) => [m.slug, m]));
  const missing = slugs.filter((s) => !bySlug[s]);
  if (missing.length) throw new Error(`Unknown menu item: ${missing.join(", ")}`);

  const taken = new Set((await db.select({ code: orders.pickupCode }).from(orders).where(ne(orders.status, "picked_up"))).map((r) => r.code));
  const id = newId("ord");
  const total = money(input.items.reduce((s, i) => s + bySlug[i.slug].price * i.qty, 0));
  const paid = input.paidHow === "counter" || input.paidHow === "demo";
  const [order] = await db.insert(orders).values({
    id, customerId: input.customerId ?? null, channel: input.channel, status: "new", total,
    pickupCode: newPickupCode(taken), paid, paidHow: paid ? input.paidHow : null, note: input.note ?? null,
  }).returning();
  await db.insert(orderItems).values(input.items.map((i) => ({ orderId: id, menuItemId: bySlug[i.slug].id, qty: i.qty, unitPrice: bySlug[i.slug].price })));
  if (paid && input.customerId) await award(input.customerId, "order", total);
  return (await attachItems([order]))[0];
}

export async function getOrder(id: string) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id));
  return row ? (await attachItems([row]))[0] : null;
}

export async function transition(id: string, action: "advance" | "undo" | "set", patch?: { status?: OrderStatus; paid?: boolean; paidHow?: string }) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id));
  if (!row) throw new Error("Order not found");
  const now = new Date();
  const update: Partial<typeof orders.$inferInsert> = {};
  if (action === "advance") {
    const idx = STATUS_FLOW.indexOf(row.status as OrderStatus);
    const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
    if (next !== row.status) Object.assign(update, { status: next, previousStatus: row.status, updatedAt: now });
  } else if (action === "undo") {
    const fresh = now.getTime() - row.updatedAt.getTime() <= UNDO_WINDOW_MS;
    if (row.previousStatus && fresh) Object.assign(update, { status: row.previousStatus, previousStatus: null, updatedAt: now });
  } else {
    if (patch?.status && patch.status !== row.status) Object.assign(update, { status: patch.status, previousStatus: row.status, updatedAt: now });
    if (patch?.paid !== undefined && patch.paid !== row.paid) {
      Object.assign(update, { paid: patch.paid, paidHow: patch.paidHow ?? row.paidHow ?? "counter", updatedAt: now });
      if (patch.paid && !row.paid && row.customerId) await award(row.customerId, "order", row.total);
    }
  }
  if (Object.keys(update).length) await db.update(orders).set(update).where(eq(orders.id, id));
  return getOrder(id);
}

export async function markPaid(id: string, paidHow: "demo" | "stripe", stripeSessionId?: string) {
  const [row] = await db.select().from(orders).where(eq(orders.id, id));
  if (!row) throw new Error("Order not found");
  if (!row.paid) {
    await db.update(orders).set({ paid: true, paidHow, stripeSessionId: stripeSessionId ?? row.stripeSessionId, updatedAt: new Date() }).where(eq(orders.id, id));
    if (row.customerId) await award(row.customerId, "order", row.total);
  }
  return getOrder(id);
}
