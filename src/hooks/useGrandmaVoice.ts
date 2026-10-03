"use client";
/* Wraps the ElevenLabs React SDK (must render under <ConversationProvider>). Falls back to the Gemini
   text chat when voice is unavailable so Grandma always answers. Client tools dispatch through a ref. */
import { useConversation, type HookOptions } from "@elevenlabs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";

export type VoiceMode = "voice" | "text";
export type ClientTools = Record<string, (params: Record<string, unknown>) => Promise<string | void> | string | void>;
export type Turn = { role: "user" | "grandma"; text: string };
export type AvatarState = "idle" | "listening" | "speaking" | "thinking";

export function useGrandmaVoice(opts: { agent: "customer" | "helper"; lang: string; clientTools: ClientTools; greeting?: string }) {
  const toolsRef = useRef(opts.clientTools);
  toolsRef.current = opts.clientTools;
  const toolNames = Object.keys(opts.clientTools).join(",");
  const proxiedTools = useMemo(
    () => Object.fromEntries(toolNames.split(",").filter(Boolean).map((name) => [name, async (params: Record<string, unknown>) => {
      try { const r = await toolsRef.current[name]?.(params ?? {}); return typeof r === "string" ? r : "Done."; }
      catch (e) { return `That did not work: ${(e as Error).message}`; }
    }])),
    [toolNames],
  );

  const [mode, setMode] = useState<VoiceMode>("voice");
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [starting, setStarting] = useState(false);

  const conversation = useConversation({
    clientTools: proxiedTools,
    onMessage: ({ message, source }) => {
      const text = message?.trim();
      if (!text) return;
      setTranscript((t) => [...t, { role: source === "user" ? "user" : "grandma", text }]);
    },
    onError: (message) => setError(typeof message === "string" ? message : "Voice error"),
    onConnect: () => setStarting(false),
    onDisconnect: () => setStarting(false),
  });

  const connected = fallback || conversation.status === "connected";
  const status: "disconnected" | "connecting" | "connected" =
    fallback ? "connected" : starting || conversation.status === "connecting" ? "connecting" : conversation.status === "connected" ? "connected" : "disconnected";

  const fallbackGreeting = useCallback(() => {
    setMode("text"); setFallback(true); setStarting(false);
    setTranscript((t) => t.length ? t : [{ role: "grandma", text: opts.greeting ?? (opts.agent === "helper" ? "I'm here, Grandma. Type to me." : "My voice is resting, dear. Type to me.") }]);
  }, [opts.agent]);

  // A session that errors out before connecting becomes a text chat.
  useEffect(() => {
    if (conversation.status === "error" && !fallback) fallbackGreeting();
  }, [conversation.status, fallback, fallbackGreeting]);

  useEffect(() => {
    if (!connected || fallback) { setVolume(0); return; }
    let raf = 0; let last = 0;
    const tick = () => {
      try { const v = conversation.getOutputVolume(); if (Math.abs(v - last) > 0.03) { last = v; setVolume(v); } } catch {}
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [connected, fallback, conversation]);

  const start = useCallback(async (m: VoiceMode = "voice") => {
    setError(null); setMode(m); setFallback(false); setStarting(true);
    try {
      if (m === "voice") await navigator.mediaDevices.getUserMedia({ audio: true });
      const { signedUrl } = await api<{ signedUrl: string }>(`/api/voice/signed-url?agent=${opts.agent}`);
      const session = { signedUrl, connectionType: "websocket", textOnly: m === "text", overrides: { agent: { language: opts.lang } }, clientTools: proxiedTools } as unknown as HookOptions;
      conversation.startSession(session);
    } catch (e) {
      setError(m === "voice" ? (e as Error).message : null);
      fallbackGreeting();
    }
  }, [conversation, opts.agent, opts.lang, proxiedTools, fallbackGreeting]);

  const stop = useCallback(() => {
    setFallback(false); setStarting(false);
    try { conversation.endSession(); } catch {}
  }, [conversation]);

  const sendText = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setTranscript((t) => [...t, { role: "user", text: clean }]);
    if (!fallback) {
      try { conversation.sendUserMessage(clean); return; } catch { /* no live session: answer over the API instead */ }
    }
    setThinking(true);
    try {
      const history = [...transcript, { role: "user" as const, text: clean }].slice(-12).map((t) => ({ role: t.role === "user" ? "user" : "assistant", content: t.text }));
      const { reply } = await api<{ reply: string }>("/api/chat", { method: "POST", json: { persona: opts.agent, lang: opts.lang, messages: history } });
      setTranscript((t) => [...t, { role: "grandma", text: reply }]);
    } catch (e) {
      setTranscript((t) => [...t, { role: "grandma", text: `Oh dear, I dozed off. ${(e as Error).message}` }]);
    } finally { setThinking(false); }
  }, [conversation, fallback, transcript, opts.agent, opts.lang]);

  const seedGrandma = useCallback((text: string) => {
    setTranscript((t) => (t.some((x) => x.text === text) ? t : [...t, { role: "grandma", text }]));
  }, []);

  const sendContext = useCallback((text: string) => {
    try { conversation.sendContextualUpdate(text); } catch {}
  }, [conversation]);

  const avatarState: AvatarState = !connected ? "idle" : conversation.isSpeaking ? "speaking" : thinking ? "thinking" : mode === "voice" ? "listening" : "idle";

  return { status, mode, fallback, seedGrandma, sendContext, isSpeaking: conversation.isSpeaking, volume, transcript, error, avatarState, start, stop, sendText };
}
