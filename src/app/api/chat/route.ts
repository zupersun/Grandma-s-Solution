import { z } from "zod";
import { generateText } from "@/lib/brain/llm";
import { loadPersona } from "@/lib/brain/persona";
import { fail, handle, ok, parseBody } from "@/lib/validate";

/** Text fallback when ElevenLabs is unavailable. Same persona, no tools. */
export const POST = handle(async (req) => {
  const { persona, lang, messages } = await parseBody(req, z.object({
    persona: z.enum(["customer", "helper"]).default("customer"),
    lang: z.string().default("en"),
    messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).min(1).max(40),
  }));
  const system = (await loadPersona(persona === "helper" ? "grandma-helper" : "customer-grandma")) +
    `\n\nYou are chatting by text right now (your voice is resting), so tools are unavailable: if someone wants to order, vote, or leave a suggestion, tell them which button on the page does it. Reply in language code "${lang}" unless the person writes in another language. Keep replies to two sentences.`;
  try {
    return ok({ reply: await generateText({ system, messages, temperature: 0.8 }) });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Grandma is napping", 503);
  }
});
