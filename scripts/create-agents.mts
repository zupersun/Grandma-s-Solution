/* Creates or updates the two ElevenLabs agents from the persona files. Prints agent IDs for .env.
   Usage: pnpm agents:create */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

try { process.loadEnvFile?.(".env"); } catch {}

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("Set ELEVENLABS_API_KEY in .env first."); process.exit(1); }
const API = "https://api.elevenlabs.io";
const headers = { "xi-api-key": KEY, "content-type": "application/json" };

const { db, schema } = await import("../src/lib/db/index.ts");
const config = JSON.parse(readFileSync(resolve("src/persona/config.json"), "utf8"));
const menu = await db.select().from(schema.menuItems);
const menuForPrompt = menu.map((m) => ({ slug: m.slug, name: m.names.en, price: m.price, allergens: m.allergens.length ? m.allergens : ["none"], about: m.descriptions.en }));

const fill = (file: string) => readFileSync(resolve("src/persona", file), "utf8").replace(/\{\{(\w+)\}\}/g, (_, k: string) => ({
  GRANDMA_NAME: process.env.GRANDMA_NAME || config.grandmaName, BAKERY: config.bakeryName, RIVAL: config.rivalName,
  MENU: JSON.stringify(menuForPrompt), VOTE_OPTIONS: config.voteOptions.map((o: { id: string; label: { en: string } }) => `${o.id} (${o.label.en})`).join(", "),
  LOYALTY: JSON.stringify(config.loyalty),
} as Record<string, string>)[k] ?? "");

type Tool = { name: string; description: string; parameters: Record<string, unknown> };
const str = (description: string) => ({ type: "string", description });
const customerTools: Tool[] = [
  { name: "addLoyaltyPoints", description: "Give the customer loyalty points. Call once early in the chat with reason 'chat'.", parameters: { type: "object", properties: { reason: str("chat") }, required: ["reason"] } },
  { name: "addToCart", description: "Add a menu item to the customer's pickup order.", parameters: { type: "object", properties: { itemSlug: str("menu slug such as mango-pie"), qty: { type: "integer", description: "how many" } }, required: ["itemSlug", "qty"] } },
  { name: "placeOrder", description: "Place and pay the pickup order after confirming items and total.", parameters: { type: "object", properties: {} } },
  { name: "voteFlavour", description: "Record the customer's flavour of the month vote.", parameters: { type: "object", properties: { option: str("one of mango, ube, pistachio, black_sesame") }, required: ["option"] } },
  { name: "submitSuggestion", description: "Save a suggestion the customer made.", parameters: { type: "object", properties: { text: str("the suggestion in their words") }, required: ["text"] } },
  { name: "logRequest", description: "Log something the customer asked for that is not on the menu or that they want more of.", parameters: { type: "object", properties: { text: str("what they asked for"), itemHint: str("a short keyword such as ube or vegan") }, required: ["text"] } },
  { name: "getMyPoints", description: "Read the customer's loyalty points.", parameters: { type: "object", properties: {} } },
];
const helperTools: Tool[] = [
  { name: "getDailySummary", description: "How today is going at the bakery.", parameters: { type: "object", properties: {} } },
  { name: "getFeedback", description: "What customers voted for and asked for.", parameters: { type: "object", properties: {} } },
  { name: "getPlan", description: "The current buying plan.", parameters: { type: "object", properties: {} } },
  { name: "updatePlan", description: "Apply Grandma's wish to the plan, for example 'push puddings this month'.", parameters: { type: "object", properties: { directive: str("Grandma's wish in her words") }, required: ["directive"] } },
  { name: "approvePlan", description: "Approve the plan: order online suppliers, list in-person ones. Only after a clear yes.", parameters: { type: "object", properties: {} } },
  { name: "getOrders", description: "Orders waiting right now.", parameters: { type: "object", properties: { status: str("new, making, or ready") } } },
];

async function call(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

async function ensureTools(tools: Tool[]): Promise<string[]> {
  const existing = await call("/v1/convai/tools").catch(() => ({ tools: [] }));
  const byName = new Map<string, string>();
  for (const t of (existing.tools ?? []) as { id: string; tool_config?: { name?: string } }[]) if (t.tool_config?.name) byName.set(t.tool_config.name, t.id);
  const ids: string[] = [];
  for (const t of tools) {
    const tool_config = { type: "client", name: t.name, description: t.description, parameters: t.parameters, expects_response: true };
    if (byName.has(t.name)) {
      await call(`/v1/convai/tools/${byName.get(t.name)}`, { method: "PATCH", body: JSON.stringify({ tool_config }) }).catch((e) => console.warn("  (tool update skipped)", String(e).slice(0, 120)));
      ids.push(byName.get(t.name)!);
    } else {
      const created = await call("/v1/convai/tools", { method: "POST", body: JSON.stringify({ tool_config }) });
      ids.push(created.id);
    }
  }
  return ids;
}

const firstMessages = {
  customer: { en: "Oh, hello sweetheart! Come in, come in. What can Grandma get you today?", es: "¡Hola, cariño! Pasa, pasa. ¿Qué te preparo hoy?", zh: "哎呀，宝贝，快进来！外婆今天给你做点什么？", fr: "Oh, bonjour mon cœur ! Entre, entre. Qu'est-ce que Grand-mère te prépare aujourd'hui ?" },
  helper: { en: "I'm here, Grandma. Want to hear how today is going, or look at what to buy?", es: "Aquí estoy, abuela. ¿Te cuento cómo va el día o vemos qué comprar?", zh: "我在呢，外婆。想听听今天怎么样，还是看看要买什么？", fr: "Je suis là, Grand-mère. On regarde la journée ou la liste des courses ?" },
};

async function upsertAgent(kind: "customer" | "helper", envKey: string, persona: string, tools: Tool[]) {
  const toolIds = await ensureTools(tools);
  const fm = firstMessages[kind];
  const body = {
    name: kind === "customer" ? `${config.grandmaName} (customers)` : `${config.grandmaName}'s Helper (iPad)`,
    conversation_config: {
      agent: {
        first_message: fm.en, language: "en",
        prompt: { prompt: fill(persona), llm: config.agentLlm, temperature: 0.6, tool_ids: toolIds },
      },
      tts: { voice_id: config.voices[kind] },
      language_presets: Object.fromEntries((["es", "zh", "fr"] as const).map((l) => [l, { overrides: { agent: { first_message: fm[l] } } }])),
    },
  };
  const existingId = process.env[envKey];
  if (existingId) {
    await call(`/v1/convai/agents/${existingId}`, { method: "PATCH", body: JSON.stringify(body) });
    console.log(`${envKey}=${existingId}  (updated)`);
    return existingId;
  }
  const created = await call("/v1/convai/agents/create", { method: "POST", body: JSON.stringify(body) });
  console.log(`${envKey}=${created.agent_id}  (created)`);
  return created.agent_id;
}

try {
  await upsertAgent("customer", "ELEVENLABS_AGENT_CUSTOMER", "customer-grandma.md", customerTools);
  await upsertAgent("helper", "ELEVENLABS_AGENT_HELPER", "grandma-helper.md", helperTools);
  console.log("\nPaste the lines above into .env, then restart `pnpm dev`.");
} catch (e) {
  console.error("\nElevenLabs said:", (e as Error).message);
  console.error("Fallback: create the agents in the ElevenLabs dashboard, paste the persona from src/persona/*.md, add the client tools by name, and put the agent IDs in .env.");
  process.exit(1);
}
