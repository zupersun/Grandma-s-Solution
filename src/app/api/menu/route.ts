import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { handle, ok } from "@/lib/validate";

export const GET = handle(async () => {
  const items = await db.select().from(schema.menuItems).where(eq(schema.menuItems.active, true));
  return ok({ items });
});
