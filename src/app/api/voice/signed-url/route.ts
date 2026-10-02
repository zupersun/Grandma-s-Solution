import { z } from "zod";
import { signedUrlFor } from "@/lib/elevenlabs";
import { fail, handle, ok, parseQuery } from "@/lib/validate";

export const GET = handle(async (req) => {
  const { agent } = parseQuery(req, z.object({ agent: z.enum(["customer", "helper"]).default("customer") }));
  try {
    return ok({ signedUrl: await signedUrlFor(agent) });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Voice unavailable", 503);
  }
});
