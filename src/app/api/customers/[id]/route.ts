import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { ensureCustomer } from "@/lib/db/loyalty";
import { handle, ok, parseBody } from "@/lib/validate";

export const GET = handle(async (_req, ctx) => {
  const { id } = await ctx.params;
  return ok({ customer: await ensureCustomer(id) });
});

export const PATCH = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await parseBody(req, z.object({ name: z.string().trim().max(40).optional(), lang: z.enum(["en", "es", "zh", "fr"]).optional() }));
  await ensureCustomer(id);
  const [customer] = await db.update(schema.customers).set(body).where(eq(schema.customers.id, id)).returning();
  return ok({ customer });
});
