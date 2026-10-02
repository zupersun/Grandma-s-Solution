import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { computePlan, latestPlan } from "@/lib/brain/plan";
import { executePlan, ordersForPlan } from "@/lib/brain/orders";
import { handle, ok, parseBody } from "@/lib/validate";

export const GET = handle(async () => {
  const plan = await latestPlan();
  return ok({ plan, supplierOrders: plan ? await ordersForPlan(plan.id) : [] });
});

export const POST = handle(async (req) => {
  const body = await parseBody(req, z.object({ periodDays: z.number().int().min(7).max(90).optional(), lang: z.string().optional() }));
  let plan = await computePlan(body);
  const [setting] = await db.select().from(schema.settings).where(eq(schema.settings.key, "autoSendOnlineOrders"));
  if (setting?.value === "always") plan = (await executePlan(plan.id)).plan;
  return ok({ plan, supplierOrders: await ordersForPlan(plan.id) }, 201);
});
