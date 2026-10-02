import { z } from "zod";
import { db, schema } from "@/lib/db";
import { generateJSON } from "./llm";
import { computePlan } from "./plan";

const { menuItems, directives } = schema;

const Adjustments = z.object({
  adjustments: z.array(z.object({ item: z.string(), multiplier: z.number().min(0).max(5), note: z.string().optional() })),
  note: z.string().optional(),
});

function heuristic(text: string, menu: { slug: string; category: string; name: string }[]) {
  const t = text.toLowerCase();
  const up = /more|push|promote|boost|extra|double|lots|feature/.test(t);
  const down = /less|fewer|stop|cut|drop|skip|pause/.test(t);
  const multiplier = down ? 0.6 : up ? 1.5 : 1.25;
  const hits = new Set<string>();
  for (const m of menu) {
    if (t.includes(m.category) || t.includes(m.name.toLowerCase()) || m.slug.split("-").some((w) => w.length > 3 && t.includes(w))) hits.add(m.category === "pudding" && t.includes("pudding") ? m.category : m.slug);
  }
  return { adjustments: [...hits].map((item) => ({ item, multiplier })), note: hits.size ? undefined : "I did not catch which bake you meant. Which one, Grandma?" };
}

export async function applyDirective(text: string, lang = "en") {
  const rows = await db.select({ slug: menuItems.slug, category: menuItems.category, names: menuItems.names }).from(menuItems);
  const menu = rows.map((r) => ({ slug: r.slug, category: r.category, name: r.names.en }));
  let parsed: z.infer<typeof Adjustments>;
  try {
    parsed = await generateJSON({
      system: `You turn a bakery owner's wish into forecast multipliers. Menu slugs: ${menu.map((m) => m.slug).join(", ")}. Categories: ${[...new Set(menu.map((m) => m.category))].join(", ")}. A multiplier of 1.5 means bake 50 percent more, 0.5 means half. Use only listed slugs or categories as "item". If the wish is unclear, return an empty list and ask one short question in "note", in language "${lang}".`,
      user: text,
      schema: Adjustments,
    });
    if (!parsed.adjustments.length && !parsed.note) parsed = heuristic(text, menu);
  } catch {
    parsed = heuristic(text, menu);
  }
  const [directive] = await db.insert(directives).values({ text, adjustments: parsed.adjustments, active: parsed.adjustments.length > 0 }).returning();
  const plan = await computePlan({ lang });
  return { directive, plan, note: parsed.note };
}
