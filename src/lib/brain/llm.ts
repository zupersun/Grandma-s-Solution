/* One door to the language model. Gemini keys are tried in order and rotated on failure;
   Anthropic is the optional fallback; otherwise BrainUnavailable so the UI can say "napping". */
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

export class BrainUnavailable extends Error {
  constructor(message: string) { super(message); this.name = "BrainUnavailable"; }
}

export type Msg = { role: "user" | "assistant"; content: string };

const geminiKeys = () => (process.env.GEMINI_API_KEYS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const geminiModel = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";
let cursor = 0;

async function callGemini(system: string, messages: Msg[], json: boolean, temperature: number): Promise<string> {
  const keys = geminiKeys();
  if (!keys.length) throw new BrainUnavailable("No GEMINI_API_KEYS set in .env");
  let lastError: unknown;
  for (let i = 0; i < keys.length; i++) {
    const idx = (cursor + i) % keys.length;
    try {
      const ai = new GoogleGenAI({ apiKey: keys[idx] });
      const res = await ai.models.generateContent({
        model: geminiModel(),
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        config: { systemInstruction: system, temperature, ...(json ? { responseMimeType: "application/json" } : {}) },
      });
      const text = res.text;
      if (!text) throw new Error("Gemini returned an empty reply");
      cursor = idx;
      return text;
    } catch (e) {
      lastError = e;
      console.warn(`[brain] Gemini key ${idx + 1}/${keys.length} failed: ${String((e as Error)?.message ?? e).slice(0, 200)}`);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function callAnthropic(system: string, messages: Msg[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new BrainUnavailable("No ANTHROPIC_API_KEY for fallback");
  const client = new Anthropic({ apiKey });
  // Optional later: betas ["server-side-fallback-2026-07-01"] + fallbacks: "default" for refusal routing.
  const res = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  if (res.stop_reason === "refusal") throw new Error("Claude declined this request");
  return res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

async function raw(system: string, messages: Msg[], json: boolean, temperature: number): Promise<string> {
  try {
    return await callGemini(system, messages, json, temperature);
  } catch (geminiError) {
    const reason = geminiError instanceof Error ? geminiError.message : String(geminiError);
    if (process.env.ANTHROPIC_API_KEY) {
      try { return await callAnthropic(system, messages); } catch (e) {
        throw new BrainUnavailable(`The Brain is napping. Gemini: ${reason.slice(0, 120)}. Claude: ${(e as Error).message.slice(0, 120)}`);
      }
    }
    throw new BrainUnavailable(`The Brain is napping. ${reason.slice(0, 200)}`);
  }
}

export async function generateText(opts: { system: string; messages: Msg[]; temperature?: number }): Promise<string> {
  return raw(opts.system, opts.messages, false, opts.temperature ?? 0.7);
}

export async function generateJSON<T>(opts: { system: string; user: string; schema: z.ZodType<T>; temperature?: number }): Promise<T> {
  const system = `${opts.system}\n\nReply with a single JSON object and nothing else. No markdown fences.`;
  let user = opts.user;
  let lastIssue = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await raw(system, [{ role: "user", content: user }], true, opts.temperature ?? 0.3);
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    try {
      return opts.schema.parse(JSON.parse(cleaned));
    } catch (e) {
      lastIssue = e instanceof Error ? e.message : String(e);
      user = `${opts.user}\n\nYour previous reply was not valid: ${lastIssue.slice(0, 300)}\nReply again with valid JSON in the required shape.`;
    }
  }
  throw new BrainUnavailable(`The Brain could not produce valid JSON: ${lastIssue.slice(0, 200)}`);
}

export const brainConfigured = () => geminiKeys().length > 0 || !!process.env.ANTHROPIC_API_KEY;
