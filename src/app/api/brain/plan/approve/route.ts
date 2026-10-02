import { z } from "zod";
import { executePlan, ordersForPlan } from "@/lib/brain/orders";
import { handle, ok, parseBody } from "@/lib/validate";

export const POST = handle(async (req) => {
  const { planId } = await parseBody(req, z.object({ planId: z.number().int() }));
  const { plan } = await executePlan(planId);
  return ok({ plan, supplierOrders: await ordersForPlan(planId) });
});
