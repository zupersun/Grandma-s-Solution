import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { CONFIG, grandmaName } from "@/lib/config";

export type PersonaName = "customer-grandma" | "grandma-helper";

export async function menuForPrompt() {
  const items = await db.select().from(schema.menuItems).where(eq(schema.menuItems.active, true));
  return items.map((m) => ({ slug: m.slug, name: m.names.en, price: m.price, allergens: m.allergens.length ? m.allergens : ["none"], about: m.descriptions.en }));
}

/** Reads src/persona/<name>.md and fills {{PLACEHOLDERS}}. Server only. */
export async function loadPersona(name: PersonaName, extra: Record<string, string> = {}) {
  const file = readFileSync(resolve(process.cwd(), "src/persona", `${name}.md`), "utf8");
  const vars: Record<string, string> = {
    GRANDMA_NAME: grandmaName(),
    BAKERY: CONFIG.bakeryName,
    RIVAL: CONFIG.rivalName,
    MENU: JSON.stringify(await menuForPrompt(), null, 0),
    VOTE_OPTIONS: CONFIG.voteOptions.map((o) => `${o.id} (${o.label.en})`).join(", "),
    LOYALTY: JSON.stringify(CONFIG.loyalty),
    ...extra,
  };
  return file.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}
