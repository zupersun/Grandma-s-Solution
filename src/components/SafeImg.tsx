"use client";
/* Images fail before React attaches onError during hydration, so probe the file after mount
   and render the stand-in when it is missing. Art dropped into public/grandma/ appears on reload. */
import { useEffect, useState } from "react";

export function useAsset(src: string) {
  const [state, setState] = useState<"checking" | "ok" | "missing">("checking");
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => alive && setState(img.naturalWidth > 0 ? "ok" : "missing");
    img.onerror = () => alive && setState("missing");
    img.src = src;
    if (img.complete) setState(img.naturalWidth > 0 ? "ok" : "missing");
    return () => { alive = false; };
  }, [src]);
  return state;
}

export function SafeImg({ src, fallback, alt = "", className, style, width, height }: {
  src: string; fallback: React.ReactNode; alt?: string; className?: string;
  style?: React.CSSProperties; width?: number; height?: number;
}) {
  const state = useAsset(src);
  if (state !== "ok") return <>{state === "missing" ? fallback : null}</>;
  return <img className={className} src={src} alt={alt} width={width} height={height} style={style} />;
}
