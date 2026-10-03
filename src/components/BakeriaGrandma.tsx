"use client";
/* The shared Grandma layer: one clipping window with two pixel-aligned images, gliding between the
   home and voice positions. Nothing gates her visibility — she is painted as soon as the browser
   has her, and only an actual load failure swaps in the stand-in. */
import { useState } from "react";

export function BakeriaGrandma({ voice, talking, listening }: { voice: boolean; talking: boolean; listening: boolean }) {
  const [failed, setFailed] = useState(false);
  const [noTalk, setNoTalk] = useState(false);
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
            <img className="gm-img gm-img-still" src="/grandma/grandma.png" alt="Grandma, arms crossed and smiling" onError={() => setFailed(true)} />
            {!noTalk && (
              <img className="gm-img gm-img-talk" src="/grandma/grandma-talking.png" alt=""
                style={{ opacity: talking ? 1 : 0 }} onError={() => setNoTalk(true)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
