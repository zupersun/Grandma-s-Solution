"use client";
/* Exactly the customer voice-screen crop from the spec: a 200x188 window with the art at
   310x310 offset -41.5 / -43.7, the 78% mask fade, and the same silhouette glow. */
import { useAsset } from "@/components/SafeImg";

export function HelperAvatar({ talking, listening }: { talking: boolean; listening: boolean }) {
  const still = useAsset("/grandma/grandma.png");
  const talk = useAsset("/grandma/grandma-talking.png");
  const cls = `gm-aura is-voice${talking ? " on" : listening ? " listen" : ""}`;
  const img: React.CSSProperties = { position: "absolute", left: -41.5, top: -43.7, width: 310, height: 310, maxWidth: "none" };
  const fade = "linear-gradient(to bottom,#000 78%,transparent 100%)";
  return (
    <div className={cls} style={{ width: 200, height: 188, flexShrink: 0 }}>
      <div style={{ position: "relative", width: 200, height: 188, overflow: "hidden", WebkitMaskImage: fade, maskImage: fade }}>
        {still === "ok" ? (
          <>
            <img src="/grandma/grandma.png" alt="" style={img} />
            {talk === "ok" && <img src="/grandma/grandma-talking.png" alt="" style={{ ...img, opacity: talking ? 1 : 0, transition: "opacity 140ms ease-in-out" }} />}
          </>
        ) : (
          <div style={{ ...img, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 150 }}>{talking ? "\u{1F60A}" : "\u{1F475}"}</div>
        )}
      </div>
    </div>
  );
}
