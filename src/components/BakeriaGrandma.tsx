"use client";
/* The shared Grandma layer: one clipping window with two pixel-aligned images, gliding between the
   home and voice positions. Rendered directly with an onError fallback, so nothing gates on a probe. */
import { useState } from "react";

export function BakeriaGrandma({ voice, talking, listening }: { voice: boolean; talking: boolean; listening: boolean }) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const aura = `gm-aura${voice ? " is-voice" : ""}${voice && talking ? " on" : voice && listening ? " listen" : ""}`;
  return (
    <div className={aura} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div className="gm-win">
        {failed ? (
          <div className="gm-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 230, lineHeight: 1, userSelect: "none" }}>
            {talking ? "\u{1F60A}" : "\u{1F475}"}
          </div>
        ) : (
          <>
            <img className="gm-img gm-img-still" src="/grandma/grandma.png" alt="Grandma, arms crossed and smiling"
              style={{ opacity: ready ? 1 : 0 }} onLoad={() => setReady(true)} onError={() => setFailed(true)} />
            <img className="gm-img gm-img-talk" src="/grandma/grandma-talking.png" alt=""
              style={{ opacity: ready && talking ? 1 : 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </>
        )}
      </div>
    </div>
  );
}
