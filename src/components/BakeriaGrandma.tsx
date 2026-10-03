"use client";
/* The shared Grandma layer from the spec: one clipping window with two pixel-aligned images,
   gliding between the home and voice positions. The still image stays opaque; only the talking
   image fades, so her silhouette never goes translucent and the glow never flashes. */
import { useState } from "react";

export function BakeriaGrandma({ voice, talking, listening }: { voice: boolean; talking: boolean; listening: boolean }) {
  const [noArt, setNoArt] = useState(false);
  const aura = `gm-aura${voice ? " is-voice" : ""}${voice && talking ? " on" : voice && listening ? " listen" : ""}`;
  return (
    <div className={aura} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div className="gm-win">
        {noArt ? (
          <div className="gm-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 220, lineHeight: 1, userSelect: "none", transform: talking ? `scale(${1.03})` : undefined, transition: "transform 140ms ease-in-out" }}>
            {talking ? "😄" : listening ? "🧓" : "👵"}
          </div>
        ) : (
          <>
            <img className="gm-img gm-img-still" src="/grandma/grandma.png" alt="Grandma, arms crossed and smiling" style={{ opacity: 1 }} onError={() => setNoArt(true)} />
            <img className="gm-img gm-img-talk" src="/grandma/grandma-talking.png" alt="" style={{ opacity: talking ? 1 : 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </>
        )}
      </div>
    </div>
  );
}
