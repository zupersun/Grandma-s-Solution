import { z } from "zod";
import { applyDirective } from "@/lib/brain/directive";
import { latestPlan } from "@/lib/brain/plan";
import { ordersForPlan } from "@/lib/brain/orders";
import { todayStats } from "@/lib/brain/summary";
import { generateJSON, generateText } from "@/lib/brain/llm";
import { CONFIG, grandmaName } from "@/lib/config";
import supplierData from "@/persona/suppliers.json";
import { handle, ok, parseBody } from "@/lib/validate";

/** Anything Grandma types to her helper. Works out whether she is changing the plan or
    asking a question, acts on it, and returns both the reply and the fresh plan. */
export const POST = handle(async (req) => {
  const { text, lang } = await parseBody(req, z.object({ text: z.string().trim().min(1).max(400), lang: z.string().default("en") }));

  const asksSomething = /^(how|what|when|why|who|where|is|are|do|does|did|can|could|should|tell me)\b|\?\s*$/i.test(text.trim());
  const wantsChange = /\b(more|less|fewer|push|extra|double|stop|cut|drop|skip|bake|make|order|want|add|remove)\b/i.test(text);
  let kind: "change" | "question" = wantsChange && !asksSomething ? "change" : asksSomething ? "question" : "question";
  if (!wantsChange && !asksSomething) {
    try {
      kind = (await generateJSON({
        system: `Decide what the bakery owner wants. "change" means different amounts baked or bought. "question" means anything else.`,
        user: text,
        schema: z.object({ kind: z.enum(["change", "question"]) }),
      })).kind;
    } catch { kind = "question"; }
  }

  if (kind === "change") {
    const before = await latestPlan();
    const { plan, note } = await applyDirective(text, lang);
    let reply = note ?? "";
    if (!reply) {
      const prev = new Map((before?.lines ?? []).map((l) => [l.ingredient, l.qty]));
      const grew = plan.lines.filter((l) => (prev.get(l.ingredient) ?? 0) < l.qty).sort((a, b) => b.cost - a.cost).slice(0, 3);
      const names = grew.map((l) => (supplierData.ingredientLabels as Record<string, string>)[l.ingredient] ?? l.ingredient);
      const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
      reply = names.length
        ? `Done. I added more ${list.toLowerCase()}. That comes to about $${Math.round(plan.totalCost).toLocaleString()}.`
        : `Done. Your list comes to about $${Math.round(plan.totalCost).toLocaleString()}.`;
    }
    return ok({ kind, reply, plan, supplierOrders: await ordersForPlan(plan.id) });
  }

  const stats = await todayStats();
  const plan = await latestPlan();
  const context = {
    today: stats,
    shopping: plan ? { total: Math.round(plan.totalCost), period: plan.period, status: plan.status, items: plan.lines.slice(0, 8).map((l) => `${l.ingredient} ${l.qty} ${l.unit} $${Math.round(l.cost)}`) } : null,
  };
  let reply: string;
  try {
    reply = await generateText({
      system: `You are the helper at ${CONFIG.bakeryName}, talking to ${grandmaName()}, who left school at fourteen. Language code "${lang}".
Answer in at most two sentences, each under twelve words. Everyday words, no jargon, no lists.
Round money to whole dollars. Only use the numbers you are given; never invent one.`,
      messages: [{ role: "user", content: `She asked: "${text}"\nWhat I know: ${JSON.stringify(context)}` }],
      temperature: 0.5,
    });
  } catch {
    reply = plan ? `You are spending about $${Math.round(plan.totalCost)} ${plan.period}.` : "I have not written your list yet. Ask me to make it.";
  }
  return ok({ kind, reply, plan, supplierOrders: plan ? await ordersForPlan(plan.id) : [] });
});
