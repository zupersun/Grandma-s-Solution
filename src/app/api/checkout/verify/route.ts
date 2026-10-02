import { z } from "zod";
import { getOrder, markPaid } from "@/lib/db/orders";
import { stripeClient } from "@/lib/stripe";
import { fail, handle, ok, parseQuery } from "@/lib/validate";

export const GET = handle(async (req) => {
  const { orderId, session_id } = parseQuery(req, z.object({ orderId: z.string().min(1), session_id: z.string().min(1) }));
  const order = await getOrder(orderId);
  if (!order) return fail("Order not found", 404);
  if (order.paid) return ok({ order });
  const stripe = stripeClient();
  if (!stripe) return fail("Stripe not configured", 503);
  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.payment_status !== "paid" || session.metadata?.orderId !== orderId) return ok({ order });
  return ok({ order: await markPaid(orderId, "stripe", session.id) });
});
