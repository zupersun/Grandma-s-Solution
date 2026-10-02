import { randomBytes } from "node:crypto";

export const newId = (prefix: string) => `${prefix}_${randomBytes(8).toString("base64url")}`;

export function newPickupCode(taken: Set<string>): string {
  for (let i = 0; i < 60; i++) {
    const code = String(100 + Math.floor(Math.random() * 900));
    if (!taken.has(code)) return code;
  }
  return String(100 + Math.floor(Math.random() * 900));
}

export const money = (n: number) => Math.round(n * 100) / 100;
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
