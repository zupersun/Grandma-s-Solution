/* Seeds a fictional world: Grandma's menu, suppliers, 30 days of till sales,
   past customers, past Grandma conversations, votes, suggestions, requests.
   Deterministic (seeded PRNG) so every teammate sees the same data. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";

try { process.loadEnvFile?.(".env"); } catch {}

const { db, schema } = await import("../src/lib/db/index.ts");
const {
  customers, menuItems, orders, orderItems, loyaltyEvents, votes, suggestions, requests,
  conversations, directives, plans, summaries, suppliers, supplierOrders, inventory, settings,
} = schema;

const read = (p: string) => JSON.parse(readFileSync(resolve(process.cwd(), p), "utf8"));
const menu = read("src/persona/menu.json") as Array<{
  slug: string; category: string; emoji: string; price: number; allergens: string[];
  names: Record<string, string>; descriptions: Record<string, string>; recipe: Record<string, number>;
}>;
const supplierData = read("src/persona/suppliers.json");
const config = read("src/persona/config.json");

// ---------- deterministic randomness ----------
let seed = 20261002;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randInt = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const pickOne = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const weighted = <T,>(entries: Array<[T, number]>) => {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of entries) { r -= w; if (r <= 0) return v; }
  return entries[entries.length - 1][0];
};
const id = (prefix: string) => `${prefix}_${Math.floor(rand() * 1e9).toString(36)}${Math.floor(rand() * 1e6).toString(36)}`;
const code = () => String(randInt(100, 999));

const DAY = 86_400_000;
const today = new Date(); today.setHours(0, 0, 0, 0);
const at = (daysAgo: number, hour: number, minute = randInt(0, 59)) =>
  new Date(today.getTime() - daysAgo * DAY + hour * 3_600_000 + minute * 60_000);
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// ---------- wipe ----------
for (const table of [supplierOrders, orderItems, orders, loyaltyEvents, votes, suggestions, requests,
  conversations, directives, plans, summaries, inventory, suppliers, menuItems, customers, settings]) {
  await db.delete(table);
}

// ---------- menu, suppliers, inventory ----------
await db.insert(menuItems).values(menu.map((m) => ({ ...m, active: true })));
const menuRows = await db.select().from(menuItems);
const bySlug = Object.fromEntries(menuRows.map((m) => [m.slug, m]));

await db.insert(suppliers).values(supplierData.suppliers);
await db.insert(inventory).values(
  Object.entries(supplierData.inventory as Record<string, number>).map(([ingredient, onHand]) => {
    const unit = (supplierData.suppliers as Array<{ ingredient: string; unit: string }>).find((s) => s.ingredient === ingredient)?.unit ?? "kg";
    return { ingredient, onHand, unit };
  }),
);
await db.insert(settings).values([
  { key: "grandmaLang", value: "en" },
  { key: "autoSendOnlineOrders", value: config.autoSendOnlineOrders },
  { key: "seededAt", value: new Date().toISOString() },
]);

// ---------- customers ----------
const firstNames = ["Maya", "Jun", "Priya", "Tomas", "Aisha", "Liam", "Sofía", "Wei", "Noor", "Elena", "Kofi", "Hana",
  "Mateo", "Zara", "Ethan", "Yuki", "Amara", "Leo", "Fatima", "Nikolai", "Chloé", "Ravi", "Ingrid", "Diego", "Mei",
  "Owen", "Lucía", "Kenji", "Sana", "Theo", "Ana", "Jamal", "Ivy", "Marco", "Lena", "Tariq", "Rosa", "Felix", "Nia", "Hugo"];
const langs: Array<[string, number]> = [["en", 55], ["es", 15], ["zh", 20], ["fr", 10]];
const customerRows = firstNames.map((name, i) => ({
  id: `cus_seed${String(i + 1).padStart(3, "0")}`,
  name,
  lang: weighted(langs),
  points: 0,
  visits: randInt(1, 24),
  createdAt: at(randInt(8, 60), 10),
}));
await db.insert(customers).values(customerRows);
const regulars = customerRows.slice(0, 18);

// ---------- 30 days of till sales ----------
const popularity: Array<[string, number]> = [
  ["drip-coffee", 22], ["butter-croissant", 14], ["mango-pie", 11], ["egg-tart", 9], ["cinnamon-bun", 8],
  ["apple-pie", 7], ["sourdough-loaf", 6], ["ube-cake", 6], ["pistachio-croissant", 5], ["black-sesame-cookie", 5],
  ["vanilla-pudding", 4], ["chocolate-pudding", 3],
];
const orderRows: (typeof orders.$inferInsert)[] = [];
const itemRows: (typeof orderItems.$inferInsert)[] = [];
const pointsRows: (typeof loyaltyEvents.$inferInsert)[] = [];
const pointsByCustomer: Record<string, number> = {};
const grant = (customerId: string, points: number, reason: string, when: Date) => {
  pointsRows.push({ customerId, points, reason, createdAt: when });
  pointsByCustomer[customerId] = (pointsByCustomer[customerId] ?? 0) + points;
};

for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
  const weekday = new Date(today.getTime() - daysAgo * DAY).getDay();
  const base = weekday === 0 || weekday === 6 ? randInt(52, 74) : randInt(34, 52);
  // ube is trending up over the last 10 days, puddings are slow
  const trend = popularity.map(([slug, w]) => [slug, slug === "ube-cake" && daysAgo <= 10 ? w * 1.6 : w] as [string, number]);
  for (let n = 0; n < base; n++) {
    const when = at(daysAgo, randInt(7, 18));
    const lineCount = weighted([[1, 55], [2, 30], [3, 15]]);
    const chosen = new Map<string, number>();
    for (let k = 0; k < lineCount; k++) {
      const slug = weighted(trend);
      chosen.set(slug, (chosen.get(slug) ?? 0) + weighted([[1, 75], [2, 20], [3, 5]]));
    }
    const isRegular = rand() < 0.22;
    const customerId = isRegular ? pickOne(regulars).id : null;
    const oid = id("ord");
    let total = 0;
    for (const [slug, qty] of chosen) {
      const m = bySlug[slug];
      total += m.price * qty;
      itemRows.push({ orderId: oid, menuItemId: m.id, qty, unitPrice: m.price });
    }
    total = Math.round(total * 100) / 100;
    orderRows.push({ id: oid, customerId, channel: "till", status: "picked_up", total, pickupCode: code(),
      paid: true, paidHow: "counter", createdAt: when, updatedAt: when });
    if (customerId) grant(customerId, Math.round(total), "order", when);
  }
}

// ---------- web orders in the last 7 days, a few live ones today ----------
for (let i = 0; i < 26; i++) {
  const daysAgo = i < 4 ? 0 : randInt(1, 7);
  const when = i < 4 ? new Date(Date.now() - randInt(3, 40) * 60_000) : at(daysAgo, randInt(8, 17));
  const c = pickOne(customerRows);
  const oid = id("ord");
  const picks = new Map<string, number>();
  for (let k = 0; k < weighted([[1, 40], [2, 40], [3, 20]]); k++) {
    const slug = weighted(popularity); picks.set(slug, (picks.get(slug) ?? 0) + 1);
  }
  let total = 0;
  for (const [slug, qty] of picks) { const m = bySlug[slug]; total += m.price * qty; itemRows.push({ orderId: oid, menuItemId: m.id, qty, unitPrice: m.price }); }
  total = Math.round(total * 100) / 100;
  const status = i === 0 ? "new" : i === 1 ? "making" : i < 4 ? "ready" : "picked_up";
  orderRows.push({ id: oid, customerId: c.id, channel: i % 3 === 0 ? "voice" : "web", status, total, pickupCode: code(),
    paid: true, paidHow: "demo", createdAt: when, updatedAt: when, note: i === 2 ? "Extra napkins please, it's for my mom" : null });
  grant(c.id, Math.round(total), "order", when);
}

const chunk = <T,>(arr: T[], n = 150) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
for (const part of chunk(orderRows)) await db.insert(orders).values(part);
for (const part of chunk(itemRows)) await db.insert(orderItems).values(part);

// ---------- past conversations with Grandma and the signals they produced ----------
const wants = ["ube", "vegan", "matcha", "mango", "gluten-free", "pandan", "oat milk", "savoury", "mini pies", "sunday hours",
  "birthday cake", "less sugar", "pistachio", "durian", "chai"];
const convoTemplates = [
  (c: { name: string }) => `${c.name} asked about allergens in the pistachio croissant, then ordered two egg tarts and laughed at Grandma's joke about the bakery next door.`,
  (c: { name: string }) => `${c.name} wanted to know if there is anything vegan. Grandma said not yet and logged it. They voted ube for flavour of the month.`,
  (c: { name: string }) => `${c.name} chatted about their exam week; Grandma recommended a cinnamon bun and gave chat points.`,
  (c: { name: string }) => `${c.name} asked for a matcha anything. Grandma promised to tell her helper. They pre-ordered a mango pie for pickup.`,
  (c: { name: string }) => `${c.name} asked why ube cake sells out by noon. Grandma blamed the regulars. They suggested bigger batches.`,
  (c: { name: string }) => `${c.name} spoke in Spanish; Grandma switched languages, explained the egg tart has eggs and dairy, and took a vote for mango.`,
  (c: { name: string }) => `${c.name} asked if Grandma could do a birthday cake. Grandma said to ask in store. Logged as a request.`,
  (c: { name: string }) => `${c.name} said The Bakery's croissants were "fine". Grandma had opinions. They bought three butter croissants.`,
];
const convoRows: (typeof conversations.$inferInsert)[] = [];
const requestRows: (typeof requests.$inferInsert)[] = [];
for (let i = 0; i < 64; i++) {
  const c = pickOne(customerRows);
  const daysAgo = randInt(0, 30);
  const when = at(daysAgo, randInt(8, 20));
  const want = pickOne(wants);
  const ordered = rand() < 0.5 ? [weighted(popularity)] : [];
  convoRows.push({
    id: id("conv"), customerId: c.id, agent: "customer", lang: c.lang, mode: rand() < 0.7 ? "voice" : "text",
    durationSec: randInt(40, 400), summary: pickOne(convoTemplates)(c),
    signals: { wants: [want], sentiment: weighted([["happy", 70], ["neutral", 25], ["grumpy", 5]]), ordered },
    createdAt: when,
  });
  if (rand() < 0.65) {
    requestRows.push({ customerId: c.id, text: `Asked for ${want}`, itemHint: want, source: "voice", createdAt: when });
  }
  grant(c.id, config.loyalty.chat, "chat", when);
}
// make ube clearly hyped in chat so the Brain has a hype-versus-sales story
for (let i = 0; i < 14; i++) {
  const c = pickOne(customerRows);
  requestRows.push({ customerId: c.id, text: "Please make more ube, it is always gone", itemHint: "ube", source: "voice", createdAt: at(randInt(0, 9), randInt(9, 18)) });
}
await db.insert(conversations).values(convoRows);
await db.insert(requests).values(requestRows);

// ---------- votes this month, suggestions ----------
const month = monthKey(new Date());
const voteTally: Array<[string, number]> = [["ube", 9], ["mango", 7], ["pistachio", 4], ["black_sesame", 3]];
const voters = [...customerRows].sort(() => rand() - 0.5);
const voteRows: (typeof votes.$inferInsert)[] = [];
let vi = 0;
for (const [option, n] of voteTally) for (let k = 0; k < n; k++) {
  const c = voters[vi++];
  const when = at(randInt(0, 12), randInt(9, 20));
  voteRows.push({ customerId: c.id, option, month, createdAt: when });
  grant(c.id, config.loyalty.vote, "vote", when);
}
await db.insert(votes).values(voteRows);

const suggestionTexts = [
  "A vegan cookie please, my roommate can't have the others", "More ube! It is gone by 11", "Open on Sundays, even just mornings",
  "Matcha anything. Matcha egg tart?", "Mini mango pies for lunchboxes", "Oat milk for the coffee", "Savoury hand pies for lunch",
  "Grandma should sell the sourdough starter", "Pandan chiffon like my aunt makes", "A loyalty card I can show my dad",
  "Chai in the afternoon", "Less sugar in the cinnamon bun, it's perfect otherwise",
];
const suggestionRows = suggestionTexts.map((text, i) => {
  const c = customerRows[(i * 3) % customerRows.length];
  const when = at(randInt(0, 20), randInt(9, 20));
  grant(c.id, config.loyalty.suggestion, "suggestion", when);
  return { customerId: c.id, text, source: i % 2 ? "voice" : "ui", createdAt: when };
});
await db.insert(suggestions).values(suggestionRows);

// ---------- loyalty totals ----------
for (const part of chunk(pointsRows)) await db.insert(loyaltyEvents).values(part);
for (const [customerId, points] of Object.entries(pointsByCustomer)) {
  await db.update(customers).set({ points }).where(eq(customers.id, customerId));
}

// ---------- last month's approved plan, so the Brain can compare ----------
const lastMonth = monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1));
await db.insert(plans).values({
  period: lastMonth,
  lines: [
    { ingredient: "flour", qty: 160, unit: "kg", packs: 8, supplierId: 1, supplierName: "Prairie Mills", orderingMode: "online", cost: 192, reason: "Croissants, pies, and bread are the backbone." },
    { ingredient: "butter", qty: 70, unit: "kg", packs: 7, supplierId: 2, supplierName: "Dairyland Co-op", orderingMode: "in_person", cost: 665, reason: "27 folds take butter." },
    { ingredient: "eggs", qty: 150, unit: "dozen", packs: 10, supplierId: 5, supplierName: "Sunny Side Eggs", orderingMode: "in_person", cost: 520, reason: "Egg tarts and puddings." },
    { ingredient: "milk", qty: 150, unit: "L", packs: 15, supplierId: 3, supplierName: "Dairyland Co-op", orderingMode: "in_person", cost: 330, reason: "Coffee, puddings, tarts." },
    { ingredient: "coffee", qty: 30, unit: "kg", packs: 6, supplierId: 16, supplierName: "Bean There Roasters", orderingMode: "online", cost: 660, reason: "Bottomless cups for the regulars." },
    { ingredient: "mango", qty: 48, unit: "kg", packs: 6, supplierId: 7, supplierName: "Tropical Imports Ltd", orderingMode: "online", cost: 252, reason: "Signature pie, steady seller." },
    { ingredient: "apple", qty: 60, unit: "kg", packs: 6, supplierId: 6, supplierName: "Ontario Orchards", orderingMode: "online", cost: 168, reason: "Apple pie season, we hoped." },
    { ingredient: "sugar", qty: 80, unit: "kg", packs: 4, supplierId: 9, supplierName: "Sweet & Co Wholesale", orderingMode: "online", cost: 120, reason: "Everything sweet." },
    { ingredient: "chocolate", qty: 10, unit: "kg", packs: 2, supplierId: 12, supplierName: "Sweet & Co Wholesale", orderingMode: "online", cost: 120, reason: "Chocolate pudding." },
    { ingredient: "ube", qty: 10, unit: "kg", packs: 2, supplierId: 8, supplierName: "Tropical Imports Ltd", orderingMode: "online", cost: 76, reason: "Ube cake, modest batch." },
  ],
  summary: "Last month we bought the usual. Ube ran out most days by noon and about 9 kg of apples went soft. Puddings were slow.",
  flags: ["Ube under-ordered", "Apples over-ordered"],
  totalCost: 3103,
  status: "approved",
  createdAt: at(31, 9),
});

await db.insert(summaries).values({
  text: "Yesterday was a good day, Grandma. 58 orders, mostly coffee and croissants. The ube cake sold out by 11 again. Three people asked for something vegan.",
  lang: "en",
  stats: { orders: 58, revenue: 312.5, topItems: ["drip-coffee", "butter-croissant", "ube-cake"], newSuggestions: 2 },
  createdAt: at(1, 21),
});

const counts = {
  customers: customerRows.length, orders: orderRows.length, orderItems: itemRows.length,
  conversations: convoRows.length, requests: requestRows.length, votes: voteRows.length, suggestions: suggestionRows.length,
};
console.log("Seeded fictional world:", counts);
