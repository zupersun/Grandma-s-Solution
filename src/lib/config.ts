import config from "@/persona/config.json";
import type { Lang } from "@/lib/db/schema";

export type VoteOption = { id: string; emoji: string; label: Record<string, string> };
export const CONFIG = config as Omit<typeof config, "voteOptions" | "languages" | "languageNames"> & {
  voteOptions: VoteOption[]; languages: Lang[]; languageNames: Record<Lang, string>;
};
export const LANGS: Lang[] = CONFIG.languages;
export const grandmaName = () => process.env.GRANDMA_NAME || CONFIG.grandmaName;
