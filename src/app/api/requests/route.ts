import { z } from "zod";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { handle, ok, parseBody } from "@/lib/validate";

export const GET = handle(async () => {
  const rows = await db.select().from(schema.requests).orderBy(desc(schema.requests.createdAt)).limit(100);
  return ok({ requests: rows });
});

export const POST = handle(async (req) => {
  const body = await parseBody(req, z.object({ customerId: z.string().optional(), text: z.string().trim().min(2).max(300), itemHint: z.string().max(60).optional(), source: z.enum(["ui", "voice", "chat"]).default("voice") }));
  const [request] = await db.insert(schema.requests).values(body).returning();
  return ok({ request }, 201);
});
