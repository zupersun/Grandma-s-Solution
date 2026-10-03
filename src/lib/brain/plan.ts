/* The buying plan. Numbers come from code; the model only writes the words. */
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { CONFIG } from "@/lib/config";
import { monthKey } from "@/lib/ids";
import supplierData from "@/persona/suppliers.json";
import type { PlanLine } from "@/lib/db/schema";
import { BrainUnavailable, generateJSON } from "./llm";

const { menuItems, orders, orderItems, votes, requests, suggestions, directives, plans, suppliers, inventory } = schema;
const LABELS = supplierData.ingredientLabels as Record<string, string>;
export const label = (ingredient: string) => LABELS[ingredient] ?? ingredient;

const VOTE_TO_SLUG: Record<string, string> = { mango: "mango-pie", ube: "ube-cake", pistachio: "pistachio-croissant", black_sesame: "black-sesame-cookie" };
const KEYWORDS: Record<string, string[]> = {
  "mango-pie": ["mango"], "apple-pie": ["apple"], "ube-cake": ["ube"], "vanilla-pudding": ["pudding", "vanilla"],
  "chocolate-pudding": ["pudding", "chocolate"], "butter-croissant": ["croissant"], "pistachio-croissant": ["pistachio"],
  "sourdough-loaf": ["sourdough", "bread"], "black-sesame-cookie": ["sesame", "cookie"], "egg-tart": ["egg tart", "tart"],
  "cinnamon-bun": ["cinnamon"], "drip-coffee": ["coffee"],
};
const SIGNAL_CAP = 0.2;
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function computePlan(input: { periodDays?: number; lang?: string } = {}) {
  const periodDays = input.periodDays ?? 14;
  const lang = input.lang ?? "en";
  const menu = await db.select().from(menuItems).where(eq(menuItems.active, true));
  const sups = await db.select().from(suppliers);
  const inv = await db.select().from(inventory);

  // 1. baseline from the last 7 days of paid sales
  const since7 = new Date(Date.now() - 7 * 86_400_000);
  const sales = await db.select({ slug: menuItems.slug, qty: orderItems.qty }).from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(and(gte(orders.createdAt, since7), eq(orders.paid, true)));
  const unitsPerDay: Record<string, number> = {};
  for (const s of sales) unitsPerDay[s.slug] = (unitsPerDay[s.slug] ?? 0) + s.qty / 7;
  const totalUnits = Object.values(unitsPerDay).reduce((a, b) => a + b, 0) || 1;

  // 2. signals: votes, requests, suggestions (capped)
  const month = monthKey();
  const voteRows = await db.select().from(votes).where(eq(votes.month, month));
  const voteCount: Record<string, number> = {};
  for (const v of voteRows) voteCount[v.option] = (voteCount[v.option] ?? 0) + 1;
  const totalVotes = voteRows.length || 1;
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const reqRows = await db.select().from(requests).where(gte(requests.createdAt, since30));
  const sugRows = await db.select().from(suggestions).where(gte(suggestions.createdAt, since30));
  const texts = [...reqRows.map((r) => `${r.itemHint ?? ""} ${r.text}`), ...sugRows.map((s) => s.text)].map((t) => t.toLowerCase());
  const mentions: Record<string, number> = {};
  for (const slug of Object.keys(KEYWORDS)) mentions[slug] = texts.filter((t) => KEYWORDS[slug].some((k) => t.includes(k))).length;
  const signalPct: Record<string, number> = {};
  for (const m of menu) {
    let pct = 0;
    const voteId = Object.entries(VOTE_TO_SLUG).find(([, s]) => s === m.slug)?.[0];
    if (voteId) pct += ((voteCount[voteId] ?? 0) / totalVotes - 1 / CONFIG.voteOptions.length) * 0.5;
    pct += Math.min(0.15, (mentions[m.slug] ?? 0) * 0.015);
    signalPct[m.slug] = Math.max(-SIGNAL_CAP, Math.min(SIGNAL_CAP, pct));
  }

  // 3. Grandma's directives apply last, uncapped
  const activeDirectives = await db.select().from(directives).where(eq(directives.active, true));
  const multipliers: Record<string, number> = {};
  for (const d of activeDirectives) for (const a of d.adjustments) {
    for (const m of menu) if (m.slug === a.item || m.category === a.item) multipliers[m.slug] = (multipliers[m.slug] ?? 1) * a.multiplier;
  }
  const forecast: Record<string, number> = {};
  for (const m of menu) forecast[m.slug] = Math.round((unitsPerDay[m.slug] ?? 0) * periodDays * (1 + signalPct[m.slug]) * (multipliers[m.slug] ?? 1));

  // 4. explode recipes into ingredients, subtract stock, round to packs
  const need: Record<string, number> = {};
  const usedBy: Record<string, Set<string>> = {};
  for (const m of menu) for (const [ing, per] of Object.entries(m.recipe)) {
    need[ing] = (need[ing] ?? 0) + per * forecast[m.slug];
    (usedBy[ing] ??= new Set()).add(m.names.en);
  }
  const onHand = Object.fromEntries(inv.map((i) => [i.ingredient, i.onHand]));
  const lines: PlanLine[] = [];
  for (const [ing, gross] of Object.entries(need)) {
    const sup = sups.find((s) => s.ingredient === ing);
    if (!sup) continue;
    const net = gross - (onHand[ing] ?? 0);
    if (net <= 0) continue;
    const packs = Math.ceil(net / sup.packSize);
    lines.push({
      ingredient: ing, qty: round2(packs * sup.packSize), unit: sup.unit, packs, supplierId: sup.id, supplierName: sup.name,
      orderingMode: sup.orderingMode as "online" | "in_person", cost: round2(packs * sup.packPrice), reason: "",
    });
  }
  lines.sort((a, b) => b.cost - a.cost);
  const totalCost = round2(lines.reduce((s, l) => s + l.cost, 0));

  // 5. flags: hype, waste, lead time
  const flags: string[] = [];
  const [lastPlan] = await db.select().from(plans).where(eq(plans.status, "approved")).orderBy(desc(plans.createdAt)).limit(1);
  for (const m of menu) {
    const share = (unitsPerDay[m.slug] ?? 0) / totalUnits;
    if ((mentions[m.slug] ?? 0) >= 8 && share < 0.08) {
      flags.push(`${mentions[m.slug]} people asked for ${m.names.en}, but few buy it. Bake a small batch first.`);
    }
  }
  if (lastPlan) for (const prev of lastPlan.lines) {
    const needed = need[prev.ingredient] ?? 0;
    const now = lines.find((l) => l.ingredient === prev.ingredient);
    if (needed > 0 && prev.qty > needed * 1.4) flags.push(`Last month you threw away ${label(prev.ingredient)}. I am buying less this time.`);
    if (now && now.qty > prev.qty * 1.3) flags.push(`You need more ${label(prev.ingredient)} than last month.`);
  }
  for (const l of lines) {
    const sup = sups.find((s) => s.id === l.supplierId);
    if (sup && sup.leadDays >= 4) flags.push(`${sup.name} is slow. I ordered the ${label(l.ingredient)} early.`);
  }

  // 6. words from the model, with a plain fallback so the plan always exists
  let reasons: Record<string, string> = {};
  let summary = "";
  try {
    const out = await generateJSON({
      system: `You write for Grandma, who has baked for fifty years and left school at fourteen. Write in language code "${lang}".
RULES, follow every one:
- Sentences under twelve words. One idea each.
- Everyday words only. Say "throw away", not "waste". Say "sell more", not "push". Say "buy early", not "lead time".
- Round money to the nearest ten dollars and write it like $3,500. Never write kilograms, units or codes.
- Talk to her as "you". Warm, like her apprentice.
- The summary is three sentences: what she spends, what changed and why that is good, and one thing to watch.
- Each reason is one short sentence saying what the ingredient is for.
- Never change a number you are given and never invent one.`,
      user: JSON.stringify({
        task: "Give one short reason per ingredient (key = ingredient id) and a 3-sentence summary. Mention waste avoided versus last month if the data supports it, and any flag that matters.",
        lines: lines.map((l) => ({ ingredient: l.ingredient, label: label(l.ingredient), qty: l.qty, unit: l.unit, cost: l.cost, supplier: l.supplierName, usedBy: [...(usedBy[l.ingredient] ?? [])].slice(0, 4) })),
        totalCost, flags, directives: activeDirectives.map((d) => d.text),
        lastMonth: lastPlan ? { totalCost: lastPlan.totalCost, summary: lastPlan.summary } : null,
      }),
      schema: z.object({ reasons: z.record(z.string(), z.string()), summary: z.string().min(10) }),
    });
    reasons = out.reasons; summary = out.summary;
  } catch (e) {
    if (!(e instanceof BrainUnavailable)) console.warn("[brain] explain failed", e);
    summary = `You will spend about $${Math.round(totalCost / 10) * 10} on ingredients.` + (lastPlan ? ` Last month it was about $${Math.round(lastPlan.totalCost / 10) * 10}.` : "") + " I have the list ready below.";
  }
  for (const l of lines) l.reason = reasons[l.ingredient] ?? `Needed for ${[...(usedBy[l.ingredient] ?? [])].slice(0, 3).join(", ")}.`;

  const [plan] = await db.insert(plans).values({ period: periodDays >= 28 ? "for the next month" : periodDays === 14 ? "for the next two weeks" : `for the next ${periodDays} days`, lines, summary, flags, totalCost, status: "draft" }).returning();
  return plan;
}

export async function latestPlan() {
  const [plan] = await db.select().from(plans).orderBy(desc(plans.createdAt)).limit(1);
  return plan ?? null;
}
