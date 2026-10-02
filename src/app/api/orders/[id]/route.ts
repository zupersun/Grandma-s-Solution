import { z } from "zod";
import { getOrder, transition } from "@/lib/db/orders";
import { fail, handle, ok, parseBody } from "@/lib/validate";

export const GET = handle(async (_req, ctx) => {
  const { id } = await ctx.params;
  const order = await getOrder(id);
  return order ? ok({ order }) : fail("Order not found", 404);
});

export const PATCH = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await parseBody(req, z.object({
    action: z.enum(["advance", "undo", "set"]),
    status: z.enum(["new", "making", "ready", "picked_up"]).optional(),
    paid: z.boolean().optional(),
    paidHow: z.string().optional(),
  }));
  const order = await transition(id, body.action, body);
  return ok({ order });
});
