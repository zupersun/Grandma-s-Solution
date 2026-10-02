import { z } from "zod";
import { applyDirective } from "@/lib/brain/directive";
import { ordersForPlan } from "@/lib/brain/orders";
import { handle, ok, parseBody } from "@/lib/validate";

export const POST = handle(async (req) => {
  const { text, lang } = await parseBody(req, z.object({ text: z.string().trim().min(2).max(400), lang: z.string().optional() }));
  const result = await applyDirective(text, lang);
  return ok({ ...result, supplierOrders: await ordersForPlan(result.plan.id) }, 201);
});
