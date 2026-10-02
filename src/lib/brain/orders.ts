/* Acting on an approved plan: online suppliers get an order "sent", in-person suppliers become a shopping list. */
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { PlanLine } from "@/lib/db/schema";
import { label } from "./plan";

const { plans, supplierOrders, suppliers } = schema;

const confirmation = (name: string) => `${name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`;

export function orderText(supplierName: string, lines: PlanLine[], notes?: string | null) {
  const body = lines.map((l) => `- ${label(l.ingredient)}: ${l.packs} x ${l.qty / l.packs} ${l.unit} ($${l.cost.toFixed(2)})`).join("\n");
  return `Order for ${supplierName} from Grandma's Bakery\n${body}\nTotal: $${lines.reduce((s, l) => s + l.cost, 0).toFixed(2)}${notes ? `\nNote: ${notes}` : ""}`;
}

export async function executePlan(planId: number) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId));
  if (!plan) throw new Error("Plan not found");
  const existing = await db.select().from(supplierOrders).where(eq(supplierOrders.planId, planId));
  if (existing.length) return { plan, supplierOrders: existing };

  const sups = await db.select().from(suppliers);
  const groups = new Map<string, PlanLine[]>();
  for (const line of plan.lines) (groups.get(line.supplierName) ?? groups.set(line.supplierName, []).get(line.supplierName)!).push(line);

  const rows: (typeof supplierOrders.$inferInsert)[] = [];
  for (const [supplierName, lines] of groups) {
    const sup = sups.find((s) => s.name === supplierName);
    const mode = (lines[0].orderingMode ?? sup?.orderingMode ?? "in_person") as "online" | "in_person";
    rows.push({
      planId, supplierId: sup?.id ?? lines[0].supplierId, lines, mode,
      total: Math.round(lines.reduce((s, l) => s + l.cost, 0) * 100) / 100,
      status: mode === "online" ? "sent" : "listed",
      reference: mode === "online" ? confirmation(supplierName) : null,
    });
  }
  const inserted = await db.insert(supplierOrders).values(rows).returning();
  const [updated] = await db.update(plans).set({ status: "sent" }).where(eq(plans.id, planId)).returning();
  return { plan: updated, supplierOrders: inserted };
}

export async function ordersForPlan(planId: number) {
  const rows = await db.select().from(supplierOrders).where(eq(supplierOrders.planId, planId));
  const sups = await db.select().from(suppliers);
  return rows.map((r) => {
    const sup = sups.find((s) => s.id === r.supplierId);
    return { ...r, supplierName: sup?.name ?? "Supplier", trip: sup?.notes ?? "", orderUrl: sup?.orderUrl ?? null, orderEmail: sup?.orderEmail ?? null, text: orderText(sup?.name ?? "Supplier", r.lines) };
  });
}
