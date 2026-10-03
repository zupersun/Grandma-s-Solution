"use client";
import { useAsset } from "@/components/SafeImg";

/** Grandma's helper portrait: the same art, with the spec's silhouette glow. */
export function HelperAvatar({ talking, listening, size = 190 }: { talking: boolean; listening: boolean; size?: number }) {
  const still = useAsset("/grandma/grandma.png");
  const talk = useAsset("/grandma/grandma-talking.png");
  const cls = `gm-aura is-voice${talking ? " on" : listening ? " listen" : ""}`;
  return (
    <div className={cls} style={{ width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: "relative", width: size, height: size, overflow: "hidden", WebkitMaskImage: "linear-gradient(to bottom,#000 80%,transparent 100%)", maskImage: "linear-gradient(to bottom,#000 80%,transparent 100%)" }}>
        {still === "ok" ? (
          <>
            <img src="/grandma/grandma.png" alt="" style={{ position: "absolute", inset: 0, width: size, height: size, objectFit: "contain" }} />
            {talk === "ok" && <img src="/grandma/grandma-talking.png" alt="" style={{ position: "absolute", inset: 0, width: size, height: size, objectFit: "contain", opacity: talking ? 1 : 0, transition: "opacity 140ms ease-in-out" }} />}
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: size * 0.62 }}>{talking ? "\u{1F60A}" : "\u{1F475}"}</div>
        )}
      </div>
    </div>
  );
}
