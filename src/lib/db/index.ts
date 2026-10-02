import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/grandma.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const g = globalThis as unknown as { __grandmaClient?: Client };
const client = g.__grandmaClient ?? createClient({ url, authToken });
if (process.env.NODE_ENV !== "production") g.__grandmaClient = client;

export const db = drizzle(client, { schema });
export { schema };
