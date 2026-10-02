import { z } from "zod";
import { latestSummary, writeSummary } from "@/lib/brain/summary";
import { handle, ok, parseBody } from "@/lib/validate";

export const GET = handle(async () => ok({ summary: await latestSummary() }));

export const POST = handle(async (req) => {
  const { lang } = await parseBody(req, z.object({ lang: z.string().optional() }));
  return ok({ summary: await writeSummary(lang) }, 201);
});
