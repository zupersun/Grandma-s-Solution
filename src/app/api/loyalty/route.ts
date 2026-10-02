import { z } from "zod";
import { award } from "@/lib/db/loyalty";
import { handle, ok, parseBody } from "@/lib/validate";

export const POST = handle(async (req) => {
  const { customerId, reason } = await parseBody(req, z.object({
    customerId: z.string().min(1), reason: z.enum(["chat", "vote", "suggestion", "referral"]),
  }));
  return ok(await award(customerId, reason));
});
