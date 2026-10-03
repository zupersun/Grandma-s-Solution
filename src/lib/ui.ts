/* Bakeria design tokens (docs/PROMPT.md §2), reused on Grandma's in-store screen at iPad scale. */
import type { CSSProperties } from "react";

export const C = {
  bg: "#f9f8f7",
  text: "#2b2222",
  muted: "#5a5959",
  line: "#d9d9d9",
  maroon: "#5a1a1f",
  maroonDark: "#3d0f13",
  listening: "#a3243b",
  bubble: "#f6f1eb",
  tint: "#f6efe6",
  tintLine: "#e6d6c3",
  white: "#ffffff",
} as const;

export const BORDER = `0.75px solid ${C.line}`;
export const FONT = "'Hanken Grotesk', system-ui, sans-serif";

export const card: CSSProperties = { background: C.white, border: BORDER, borderRadius: 18, padding: 20 };
export const h2: CSSProperties = { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.2px" };
export const label: CSSProperties = { fontSize: 15, fontWeight: 600, color: C.muted, letterSpacing: "-0.15px" };

export const pill = (kind: "solid" | "soft" | "ghost" = "ghost"): CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  minHeight: 56, padding: "0 22px", borderRadius: 28, font: "inherit", fontSize: 17, fontWeight: 600,
  cursor: "pointer", whiteSpace: "nowrap",
  ...(kind === "solid" ? { background: C.maroon, color: C.white, border: 0 }
    : kind === "soft" ? { background: C.tint, color: C.text, border: `0.75px solid ${C.tintLine}` }
    : { background: C.white, color: C.text, border: BORDER }),
});
