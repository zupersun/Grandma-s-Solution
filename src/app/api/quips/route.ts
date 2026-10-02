import quips from "@/persona/quips.json";
import { ok } from "@/lib/validate";

export async function GET() {
  return ok({ quips });
}
