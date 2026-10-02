import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { CONFIG } from "@/lib/config";
import { award, ensureCustomer } from "@/lib/db/loyalty";
import { monthKey } from "@/lib/ids";
import { fail, handle, ok, parseBody, parseQuery } from "@/lib/validate";

const { votes } = schema;
const optionIds = CONFIG.voteOptions.map((o) => o.id);

async function tallyFor(month: string) {
  const rows = await db.select({ option: votes.option }).from(votes).where(eq(votes.month, month));
  const tally = Object.fromEntries(optionIds.map((id) => [id, 0])) as Record<string, number>;
  for (const r of rows) tally[r.option] = (tally[r.option] ?? 0) + 1;
  return tally;
}

export const GET = handle(async (req) => {
  const { customerId } = parseQuery(req, z.object({ customerId: z.string().optional() }));
  const month = monthKey();
  const myVote = customerId
    ? (await db.select({ option: votes.option }).from(votes).where(and(eq(votes.customerId, customerId), eq(votes.month, month))))[0]?.option ?? null
    : null;
  return ok({ month, options: CONFIG.voteOptions, tally: await tallyFor(month), myVote });
});

export const POST = handle(async (req) => {
  const { customerId, option } = await parseBody(req, z.object({ customerId: z.string().min(1), option: z.string() }));
  if (!optionIds.includes(option)) return fail(`Unknown option. Choose one of ${optionIds.join(", ")}`);
  await ensureCustomer(customerId);
  const month = monthKey();
  const [existing] = await db.select().from(votes).where(and(eq(votes.customerId, customerId), eq(votes.month, month)));
  let awarded = 0;
  if (!existing) {
    await db.insert(votes).values({ customerId, option, month });
    awarded = (await award(customerId, "vote")).awarded;
  } else if (existing.option !== option) {
    await db.update(votes).set({ option }).where(eq(votes.id, existing.id));
  }
  return ok({ tally: await tallyFor(month), myVote: option, awarded });
});
