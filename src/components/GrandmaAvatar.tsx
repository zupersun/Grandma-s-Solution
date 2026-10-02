"use client";
/* Layer-swap avatar. Drop transparent PNGs into public/grandma/: base.png (required),
   mouth-open.png, mouth-half.png, eyes-closed.png, hand-wave.png (optional). Missing layers hide themselves. */
import { useEffect, useState } from "react";
import type { AvatarState } from "@/hooks/useGrandmaVoice";

type Props = { state: AvatarState; volume: number; size?: number };

export function GrandmaAvatar({ state, volume, size = 260 }: Props) {
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const [blink, setBlink] = useState(false);
  const hide = (name: string) => setMissing((m) => ({ ...m, [name]: true }));

  useEffect(() => {
    const t = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 140); }, 4000 + Math.random() * 1500);
    return () => clearInterval(t);
  }, []);

  const speaking = state === "speaking";
  const mouth = speaking ? (volume > 0.3 ? "open" : volume > 0.12 ? "half" : "closed") : "closed";
  const hasBase = !missing["base"];
  const motion = state === "listening" ? "scale-105 -rotate-2" : state === "thinking" ? "anim-sway" : "anim-bob";
  const squash = speaking && missing["mouth-open"] ? { transform: `scaleY(${1 + volume * 0.12}) scaleX(${1 - volume * 0.06})` } : undefined;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-label={`Grandma is ${state}`}>
      {state === "listening" && <div className="absolute inset-0 rounded-full bg-jam/30 anim-ring" />}
      <div className={`relative h-full w-full transition-transform duration-300 ${motion}`} style={squash}>
        {hasBase ? (
          <>
            <img src="/grandma/base.png" alt="" className="absolute inset-0 h-full w-full object-contain" onError={() => hide("base")} />
            {!missing["eyes-closed"] && <img src="/grandma/eyes-closed.png" alt="" className={`absolute inset-0 h-full w-full object-contain ${blink ? "" : "opacity-0"}`} onError={() => hide("eyes-closed")} />}
            {!missing["mouth-half"] && <img src="/grandma/mouth-half.png" alt="" className={`absolute inset-0 h-full w-full object-contain ${mouth === "half" ? "" : "opacity-0"}`} onError={() => hide("mouth-half")} />}
            {!missing["mouth-open"] && <img src="/grandma/mouth-open.png" alt="" className={`absolute inset-0 h-full w-full object-contain ${mouth === "open" || (mouth === "half" && missing["mouth-half"]) ? "" : "opacity-0"}`} onError={() => hide("mouth-open")} />}
            {!missing["hand-wave"] && <img src="/grandma/hand-wave.png" alt="" className={`absolute inset-0 h-full w-full object-contain ${state === "listening" ? "" : "opacity-0"}`} onError={() => hide("hand-wave")} />}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-butter text-[9rem] leading-none select-none shadow-inner" style={{ transform: speaking ? `scale(${1 + volume * 0.15})` : undefined }}>
            {blink ? "😌" : speaking ? "😄" : state === "listening" ? "🧓" : state === "thinking" ? "🤔" : "👵"}
          </div>
        )}
      </div>
    </div>
  );
}
