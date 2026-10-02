import { z } from "zod";
import { createOrder, loadOrders } from "@/lib/db/orders";
import { handle, ok, parseBody, parseQuery } from "@/lib/validate";

const statusEnum = z.enum(["new", "making", "ready", "picked_up"]);

export const GET = handle(async (req) => {
  const q = parseQuery(req, z.object({ status: z.string().optional(), since: z.string().optional(), customerId: z.string().optional(), limit: z.coerce.number().int().max(500).optional() }));
  const status = q.status ? z.array(statusEnum).parse(q.status.split(",")) : undefined;
  const orders = await loadOrders({ status, since: q.since ? new Date(q.since) : undefined, customerId: q.customerId, limit: q.limit });
  return ok({ orders });
});

export const POST = handle(async (req) => {
  const body = await parseBody(req, z.object({
    customerId: z.string().optional(),
    channel: z.enum(["web", "till", "voice"]).default("web"),
    items: z.array(z.object({ slug: z.string().min(1), qty: z.number().int().min(1).max(50) })).min(1),
    note: z.string().max(200).optional(),
    paidHow: z.enum(["counter", "demo"]).optional(),
  }));
  const order = await createOrder(body);
  return ok({ order }, 201);
});
