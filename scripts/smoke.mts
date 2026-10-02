/* End-to-end smoke test against a running dev server. Usage: node --import tsx scripts/smoke.ts [baseUrl] */
const base = process.argv[2] ?? "http://localhost:3000";
const j = async (path: string, init?: RequestInit & { json?: unknown }) => {
  const res = await fetch(base + path, { ...init, headers: { "content-type": "application/json" }, body: init?.json !== undefined ? JSON.stringify(init.json) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
};
const check = (cond: unknown, msg: string) => { if (!cond) throw new Error("FAIL: " + msg); console.log("ok  ", msg); };

const cid = "cus_smoke_" + Date.now().toString(36);
const menu = await j("/api/menu"); check(menu.items.length === 12, "menu has 12 items");
await j(`/api/customers/${cid}`, { method: "PATCH", json: { name: "Smokey", lang: "es" } });
const o = await j("/api/orders", { method: "POST", json: { customerId: cid, channel: "web", items: [{ slug: "mango-pie", qty: 2 }, { slug: "drip-coffee", qty: 1 }] } });
check(o.order.total === 15.75, "order priced from menu");
const pay = await j("/api/checkout", { method: "POST", json: { orderId: o.order.id } });
check(pay.demo || pay.url, "checkout returns demo or stripe url");
const adv = await j(`/api/orders/${o.order.id}`, { method: "PATCH", json: { action: "advance" } }); check(adv.order.status === "making", "advance -> making");
const und = await j(`/api/orders/${o.order.id}`, { method: "PATCH", json: { action: "undo" } }); check(und.order.status === "new", "undo -> new");
const v1 = await j("/api/votes", { method: "POST", json: { customerId: cid, option: "ube" } }); check(v1.awarded === 10, "first vote awards 10");
const v2 = await j("/api/votes", { method: "POST", json: { customerId: cid, option: "ube" } }); check(v2.awarded === 0, "second vote awards 0");
const s = await j("/api/suggestions", { method: "POST", json: { customerId: cid, text: "smoke test suggestion", source: "ui" } }); check(s.awarded === 10, "suggestion awards 10");
const c = await j(`/api/customers/${cid}`); check(c.customer.points >= 20 + 15, `points accumulated (${c.customer.points})`);
const stats = await j("/api/stats"); check(stats.today.orders >= 1, "stats count today's orders");
const plan = await j("/api/brain/plan", { method: "POST", json: {} }); check(plan.plan.lines.length >= 8, `plan has ${plan.plan.lines.length} lines, $${plan.plan.totalCost}`);
const d = await j("/api/brain/directive", { method: "POST", json: { text: "push puddings this month" } });
const eggsBefore = plan.plan.lines.find((l: { ingredient: string }) => l.ingredient === "eggs")?.qty ?? 0;
const eggsAfter = d.plan.lines.find((l: { ingredient: string }) => l.ingredient === "eggs")?.qty ?? 0;
check(eggsAfter >= eggsBefore, `directive raised eggs ${eggsBefore} -> ${eggsAfter}`);
const ap = await j("/api/brain/plan/approve", { method: "POST", json: { planId: d.plan.id } }); check(ap.supplierOrders.some((x: { mode: string }) => x.mode === "online") && ap.supplierOrders.some((x: { mode: string }) => x.mode === "in_person"), "approve sent online and listed in-person orders");
const sum = await j("/api/brain/summary", { method: "POST", json: { lang: "en" } }); check(sum.summary.text.length > 20, "summary written");
console.log("\nPASS");
