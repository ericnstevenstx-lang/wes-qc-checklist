import { NextResponse } from "next/server";
import { exchangeCodeForToken, saveTokens } from "@/lib/qbo";
import crypto from "crypto";

export const runtime = "nodejs";

function sign(payload) {
  const secret = process.env.QBO_CLIENT_SECRET || "fallback-not-secure";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
}

function validateState(state) {
  if (!state) return { ok: false, reason: "no_state" };
  const parts = state.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed_state" };
  const [nonce, ts, sig] = parts;
  const expectedSig = sign(`${nonce}.${ts}`);
  if (sig !== expectedSig) return { ok: false, reason: "bad_signature" };
  const ageMs = Date.now() - parseInt(ts, 10);
  if (ageMs > 10 * 60 * 1000) return { ok: false, reason: "state_expired" };
  return { ok: true };
}

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const realmId = url.searchParams.get("realmId");
  const error = url.searchParams.get("error");
  const origin = url.origin;

  console.log("[QBO callback]", {
    hasCode: !!code, state, realmId, error,
    env: process.env.QBO_ENV,
    hasClientId: !!process.env.QBO_CLIENT_ID,
    hasClientSecret: !!process.env.QBO_CLIENT_SECRET,
    redirectUri: process.env.QBO_REDIRECT_URI,
  });

  if (error) {
    return NextResponse.redirect(`${origin}/?qbo=error&reason=${encodeURIComponent(error)}`);
  }
  if (!code || !realmId) {
    return NextResponse.redirect(`${origin}/?qbo=error&reason=missing_params`);
  }

  const stateCheck = validateState(state);
  if (!stateCheck.ok) {
    return NextResponse.redirect(`${origin}/?qbo=error&reason=${encodeURIComponent(stateCheck.reason)}`);
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code);
    await saveTokens({ realmId, tokenResponse });
    return NextResponse.redirect(`${origin}/?qbo=connected`);
  } catch (e) {
    return NextResponse.redirect(
      `${origin}/?qbo=error&reason=${encodeURIComponent(e.message || "exchange_failed")}`
    );
  }
}
