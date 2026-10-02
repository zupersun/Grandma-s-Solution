import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getOrder, markPaid } from "@/lib/db/orders";
import { baseUrl, stripeClient } from "@/lib/stripe";
import { fail, handle, ok, parseBody } from "@/lib/validate";

export const POST = handle(async (req) => {
  const { orderId } = await parseBody(req, z.object({ orderId: z.string().min(1) }));
  const order = await getOrder(orderId);
  if (!order) return fail("Order not found", 404);
  if (order.paid) return ok({ demo: true, order });

  const stripe = stripeClient();
  if (!stripe) return ok({ demo: true, order: await markPaid(orderId, "demo") });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: order.items.map((l) => ({
      quantity: l.qty,
      price_data: { currency: "cad", unit_amount: Math.round(l.unitPrice * 100), product_data: { name: `${l.emoji} ${l.names.en}` } },
    })),
    success_url: `${baseUrl()}/order/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl()}/order/${orderId}?cancelled=1`,
    metadata: { orderId },
  });
  await db.update(schema.orders).set({ stripeSessionId: session.id }).where(eq(schema.orders.id, orderId));
  return ok({ url: session.url });
});
