const API = "https://api.elevenlabs.io";

export function agentId(agent: "customer" | "helper"): string | undefined {
  return agent === "helper" ? process.env.ELEVENLABS_AGENT_HELPER : process.env.ELEVENLABS_AGENT_CUSTOMER;
}

export async function signedUrlFor(agent: "customer" | "helper"): Promise<string> {
  const key = process.env.ELEVENLABS_API_KEY;
  const id = agentId(agent);
  if (!key || !id) throw new Error("Voice not configured: set ELEVENLABS_API_KEY and the agent IDs in .env");
  const res = await fetch(`${API}/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(id)}`, {
    headers: { "xi-api-key": key },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ElevenLabs refused the signed URL (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { signed_url: string };
  return data.signed_url;
}
