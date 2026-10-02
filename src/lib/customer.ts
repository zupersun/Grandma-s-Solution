/** Client-side anonymous identity. Lives in localStorage; phase 2 adds a phone-number claim. */
const KEY = "grandma.customerId";

export function getCustomerId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = "cus_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "cus_anonymous";
  }
}
