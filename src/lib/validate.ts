import { NextResponse } from "next/server";
import { z } from "zod";

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  const body = await req.json().catch(() => ({}));
  return schema.parse(body);
}

export function parseQuery<T>(req: Request, schema: z.ZodType<T>): T {
  const url = new URL(req.url);
  return schema.parse(Object.fromEntries(url.searchParams.entries()));
}

type Ctx = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: Ctx) => Promise<Response>;

/** Wraps a route handler: zod errors become 400, everything else a logged 500. */
export function handle(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return fail(e.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "));
      }
      const message = e instanceof Error ? e.message : "Unknown error";
      console.error("[api]", message);
      return fail(message, 500);
    }
  };
}
