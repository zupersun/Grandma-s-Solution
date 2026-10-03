import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const now = () => new Date();
const ts = (name: string) =>
  integer(name, { mode: "timestamp_ms" }).notNull().$defaultFn(now);

export type Lang = "en" | "zh" | "ko" | "vi";
export type OrderStatus = "new" | "making" | "ready" | "picked_up";
export type Localized = Record<string, string>;

/** Anonymous customers, identified by a localStorage id on the phone. */
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name"),
  lang: text("lang").notNull().default("en"),
  points: integer("points").notNull().default(0),
  lastChatPointsDay: text("last_chat_points_day"),
  visits: integer("visits").notNull().default(0),
  createdAt: ts("created_at"),
});

export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  emoji: text("emoji").notNull().default("🥧"),
  price: real("price").notNull(),
  allergens: text("allergens", { mode: "json" }).$type<string[]>().notNull(),
  names: text("names", { mode: "json" }).$type<Localized>().notNull(),
  descriptions: text("descriptions", { mode: "json" }).$type<Localized>().notNull(),
  /** ingredient -> quantity per unit sold, in the supplier's unit (kg, L, dozen) */
  recipe: text("recipe", { mode: "json" }).$type<Record<string, number>>().notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id"),
    channel: text("channel").notNull().default("web"), // web | till | voice
    status: text("status").notNull().default("new"), // new | making | ready | picked_up
    previousStatus: text("previous_status"),
    total: real("total").notNull(),
    pickupCode: text("pickup_code").notNull(),
    paid: integer("paid", { mode: "boolean" }).notNull().default(false),
    paidHow: text("paid_how"), // demo | stripe | counter
    stripeSessionId: text("stripe_session_id"),
    note: text("note"),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [index("orders_created").on(t.createdAt), index("orders_status").on(t.status)],
);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull().references(() => orders.id),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id),
  qty: integer("qty").notNull(),
  unitPrice: real("unit_price").notNull(),
});

export const loyaltyEvents = sqliteTable("loyalty_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: text("customer_id").notNull(),
  points: integer("points").notNull(),
  reason: text("reason").notNull(), // chat | vote | suggestion | order | referral | redeem
  createdAt: ts("created_at"),
});

export const votes = sqliteTable(
  "votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: text("customer_id").notNull(),
    option: text("option").notNull(),
    month: text("month").notNull(), // YYYY-MM
    createdAt: ts("created_at"),
  },
  (t) => [uniqueIndex("votes_customer_month").on(t.customerId, t.month)],
);

export const suggestions = sqliteTable("suggestions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: text("customer_id"),
  text: text("text").notNull(),
  source: text("source").notNull().default("ui"), // ui | voice | chat
  createdAt: ts("created_at"),
});

/** What customers asked Grandma for ("more mango", "anything vegan?"). */
export const requests = sqliteTable("requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: text("customer_id"),
  text: text("text").notNull(),
  itemHint: text("item_hint"), // menu slug or free text ingredient
  source: text("source").notNull().default("voice"),
  createdAt: ts("created_at"),
});

/** One row per past conversation with Grandma, with signals the Brain can use. */
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  customerId: text("customer_id"),
  agent: text("agent").notNull().default("customer"), // customer | helper
  lang: text("lang").notNull().default("en"),
  mode: text("mode").notNull().default("voice"), // voice | text
  durationSec: integer("duration_sec").notNull().default(0),
  summary: text("summary").notNull(),
  signals: text("signals", { mode: "json" }).$type<{ wants?: string[]; sentiment?: string; ordered?: string[] }>(),
  createdAt: ts("created_at"),
});

/** Grandma's own wishes: "push puddings this month". */
export const directives = sqliteTable("directives", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  adjustments: text("adjustments", { mode: "json" }).$type<{ item: string; multiplier: number; note?: string }[]>().notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: ts("created_at"),
});

export type PlanLine = {
  ingredient: string;
  qty: number;
  unit: string;
  packs: number;
  supplierId: number;
  supplierName: string;
  orderingMode: "online" | "in_person";
  cost: number;
  reason: string;
};

export const plans = sqliteTable("plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  period: text("period").notNull(), // e.g. 2026-10 or "next 7 days"
  lines: text("lines", { mode: "json" }).$type<PlanLine[]>().notNull(),
  summary: text("summary").notNull(),
  flags: text("flags", { mode: "json" }).$type<string[]>().notNull().default([]),
  totalCost: real("total_cost").notNull(),
  status: text("status").notNull().default("draft"), // draft | approved | sent
  createdAt: ts("created_at"),
});

export const summaries = sqliteTable("summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  lang: text("lang").notNull().default("en"),
  stats: text("stats", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  createdAt: ts("created_at"),
});

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ingredient: text("ingredient").notNull(),
  unit: text("unit").notNull(), // kg | L | dozen
  packSize: real("pack_size").notNull(),
  packPrice: real("pack_price").notNull(),
  leadDays: integer("lead_days").notNull().default(2),
  orderingMode: text("ordering_mode").notNull().default("in_person"), // online | in_person
  orderUrl: text("order_url"),
  orderEmail: text("order_email"),
  notes: text("notes"),
});

/** Orders the Brain placed (online suppliers) or listed (in-person suppliers). */
export const supplierOrders = sqliteTable("supplier_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").notNull().references(() => plans.id),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  lines: text("lines", { mode: "json" }).$type<PlanLine[]>().notNull(),
  total: real("total").notNull(),
  mode: text("mode").notNull(), // online | in_person
  status: text("status").notNull().default("pending"), // pending | sent | listed | paid
  reference: text("reference"), // fake confirmation number or Ramp bill id
  createdAt: ts("created_at"),
});

export const inventory = sqliteTable("inventory", {
  ingredient: text("ingredient").primaryKey(),
  onHand: real("on_hand").notNull(),
  unit: text("unit").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
