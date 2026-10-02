import { z } from "zod";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { award, ensureCustomer } from "@/lib/db/loyalty";
import { handle, ok, parseBody } from "@/lib/validate";

const { suggestions } = schema;
const DAILY_CAP = 5;

export const GET = handle(async () => {
  const rows = await db.select().from(suggestions).orderBy(desc(suggestions.createdAt)).limit(100);
  return ok({ suggestions: rows });
});

export const POST = handle(async (req) => {
  const body = await parseBody(req, z.object({ customerId: z.string().optional(), text: z.string().trim().min(2).max(300), source: z.enum(["ui", "voice", "chat"]).default("ui") }));
  let awarded = 0;
  let note: string | undefined;
  if (body.customerId) {
    await ensureCustomer(body.customerId);
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const [{ n }] = await db.select({ n: count() }).from(suggestions).where(and(eq(suggestions.customerId, body.customerId), gte(suggestions.createdAt, since)));
    if (n >= DAILY_CAP) note = "Grandma has your earlier ideas already, sweetheart. Points for today are all given out.";
  }
  const [suggestion] = await db.insert(suggestions).values(body).returning();
  if (body.customerId && !note) awarded = (await award(body.customerId, "suggestion")).awarded;
  return ok({ suggestion, awarded, note }, 201);
});
