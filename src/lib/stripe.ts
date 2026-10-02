import Stripe from "stripe";

export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const baseUrl = () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
