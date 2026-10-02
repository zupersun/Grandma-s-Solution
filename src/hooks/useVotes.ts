"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export type VoteOption = { id: string; emoji: string; label: Record<string, string> };
type VotesData = { month: string; options: VoteOption[]; tally: Record<string, number>; myVote: string | null };

export function useVotes(customerId: string, pollMs?: number) {
  const [data, setData] = useState<VotesData>({ month: "", options: [], tally: {}, myVote: null });
  const [awarded, setAwarded] = useState(0);
  const refresh = useCallback(async () => {
    const d = await api<VotesData>(`/api/votes?customerId=${encodeURIComponent(customerId)}`);
    setData(d);
  }, [customerId]);
  useEffect(() => {
    refresh().catch(() => {});
    if (!pollMs) return;
    const t = setInterval(() => refresh().catch(() => {}), pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  const vote = useCallback(async (option: string) => {
    setData((d) => {
      const tally = { ...d.tally };
      if (d.myVote && d.myVote !== option) tally[d.myVote] = Math.max(0, (tally[d.myVote] ?? 1) - 1);
      if (d.myVote !== option) tally[option] = (tally[option] ?? 0) + 1;
      return { ...d, tally, myVote: option };
    });
    const res = await api<{ tally: Record<string, number>; myVote: string; awarded: number }>("/api/votes", { method: "POST", json: { customerId, option } });
    setData((d) => ({ ...d, tally: res.tally, myVote: res.myVote }));
    setAwarded(res.awarded);
    return res;
  }, [customerId]);

  return { ...data, awarded, vote, refresh };
}
