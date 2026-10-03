"use client";
/* The shared Grandma layer: one clipping window with two pixel-aligned images, gliding between the
   home and voice positions. The still image stays opaque; only the talking image fades, so her
   silhouette never goes translucent and the glow never flashes. */
import { useAsset } from "./SafeImg";

export function BakeriaGrandma({ voice, talking, listening }: { voice: boolean; talking: boolean; listening: boolean }) {
  const still = useAsset("/grandma/grandma.png");
  const talk = useAsset("/grandma/grandma-talking.png");
  const aura = `gm-aura${voice ? " is-voice" : ""}${voice && talking ? " on" : voice && listening ? " listen" : ""}`;
  return (
    <div className={aura} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div className="gm-win">
        {still === "ok" ? (
          <>
            <img className="gm-img gm-img-still" src="/grandma/grandma.png" alt="Grandma, arms crossed and smiling" style={{ opacity: 1 }} />
            {talk === "ok" && <img className="gm-img gm-img-talk" src="/grandma/grandma-talking.png" alt="" style={{ opacity: talking ? 1 : 0 }} />}
          </>
        ) : still === "missing" ? (
          <div className="gm-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 230, lineHeight: 1, userSelect: "none", transform: talking ? "scale(1.04)" : undefined, transition: "transform 140ms ease-in-out" }}>
            {talking ? "\u{1F60A}" : "\u{1F475}"}
          </div>
        ) : null}
      </div>
    </div>
  );
}
