// Server-only Supabase REST client using the service role key.
// Bypasses RLS. Never import this file in client components.

import { SB_URL } from "./sb";

function key() {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  return k;
}

const baseHeaders = () => ({
  apikey: key(),
  Authorization: `Bearer ${key()}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

export async function sbServer(path, opts = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { ...baseHeaders(), ...(opts.headers || {}) },
    cache: "no-store",
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`sbServer ${r.status}: ${t}`);
  }
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

export const SB_URL_SERVER = SB_URL;
