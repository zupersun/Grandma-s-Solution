"use client";
import { useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { GrandmaAvatar } from "./GrandmaAvatar";
import { useGrandmaVoice, type ClientTools } from "@/hooks/useGrandmaVoice";
import { t } from "@/lib/i18n/strings";
import type { Lang } from "@/lib/db/schema";

type Props = { agent: "customer" | "helper"; lang: Lang; clientTools: ClientTools; title?: string; compact?: boolean };

export function TalkToGrandma(props: Props) {
  return (
    <ConversationProvider>
      <TalkToGrandmaInner {...props} />
    </ConversationProvider>
  );
}

function TalkToGrandmaInner({ agent, lang, clientTools, title, compact }: Props) {
  const voice = useGrandmaVoice({ agent, lang, clientTools });
  const [draft, setDraft] = useState("");
  const live = voice.status === "connected";

  return (
    <div className="card flex flex-col gap-3">
      {!compact && <GrandmaAvatar state={voice.avatarState} volume={voice.volume} size={240} />}
      {title && <h2 className="text-center text-2xl font-black">{title}</h2>}
      {voice.status === "connecting" && <p className="text-center text-sm">{t("connecting", lang)}</p>}
      {voice.error && <p className="rounded-xl bg-blush px-3 py-2 text-sm">{t("voiceUnavailable", lang)}</p>}

      {!live ? (
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn-primary text-xl" onClick={() => voice.start("voice")} disabled={voice.status === "connecting"}>🎙️ {t("talkToGrandma", lang)}</button>
          <button className="btn-ghost" onClick={() => voice.start("text")}>⌨️ {t("typeInstead", lang)}</button>
        </div>
      ) : (
        <>
          <div className="max-h-56 overflow-y-auto rounded-2xl bg-white/70 p-3 text-base space-y-2" aria-live="polite">
            {voice.transcript.length === 0 && <p className="opacity-60">{voice.mode === "voice" ? t("listening", lang) : t("typeMessage", lang)}</p>}
            {voice.transcript.map((turn, i) => (
              <p key={i} className={turn.role === "grandma" ? "rounded-xl bg-butter/70 px-3 py-1.5" : "text-right px-3 py-1.5 opacity-80"}>{turn.text}</p>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); voice.sendText(draft); setDraft(""); }}>
            <input className="min-h-12 flex-1 rounded-2xl border border-crust/20 bg-white px-4" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("typeMessage", lang)} />
            <button className="btn-soft" type="submit">{t("send", lang)}</button>
          </form>
          <div className="flex justify-between">
            <span className="text-sm opacity-60">{voice.mode === "voice" ? "🎙️ " + t("listening", lang) : "⌨️"}</span>
            <button className="btn-ghost py-1 min-h-10" onClick={() => voice.stop()}>{t("endChat", lang)}</button>
          </div>
        </>
      )}
    </div>
  );
}
