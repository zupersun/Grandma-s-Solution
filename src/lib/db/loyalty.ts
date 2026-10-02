import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { CONFIG } from "@/lib/config";
import { dayKey } from "@/lib/ids";

const { customers, loyaltyEvents } = schema;
export type LoyaltyReason = "chat" | "vote" | "suggestion" | "order" | "referral";

export async function ensureCustomer(id: string, lang?: string) {
  const [existing] = await db.select().from(customers).where(eq(customers.id, id));
  if (existing) return existing;
  const [created] = await db.insert(customers).values({ id, lang: lang ?? "en" }).returning();
  return created;
}

/** Applies the loyalty rules from persona/config.json. Returns the new balance and what was awarded. */
export async function award(customerId: string, reason: LoyaltyReason, amount?: number) {
  const customer = await ensureCustomer(customerId);
  let points = 0;
  switch (reason) {
    case "chat": {
      const today = dayKey();
      if (customer.lastChatPointsDay === today) break;
      points = CONFIG.loyalty.chat;
      await db.update(customers).set({ lastChatPointsDay: today }).where(eq(customers.id, customerId));
      break;
    }
    case "vote": points = CONFIG.loyalty.vote; break;
    case "suggestion": points = CONFIG.loyalty.suggestion; break;
    case "referral": points = CONFIG.loyalty.referral; break;
    case "order": points = Math.round((amount ?? 0) * CONFIG.loyalty.perDollar); break;
  }
  if (points > 0) {
    await db.insert(loyaltyEvents).values({ customerId, points, reason });
    await db.update(customers).set({ points: customer.points + points }).where(eq(customers.id, customerId));
  }
  return { points: customer.points + points, awarded: points };
}
