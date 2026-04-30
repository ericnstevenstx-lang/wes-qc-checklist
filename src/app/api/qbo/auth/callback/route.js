import { NextResponse } from "next/server";
import { exchangeCodeForToken, saveTokens } from "@/lib/qbo";

export const runtime = "nodejs";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const realmId = url.searchParams.get("realmId");
  const error = url.searchParams.get("error");

  const cookieState = req.cookies.get("qbo_state")?.value;
  const origin = url.origin;

  // DEBUG: log everything we see so we can diagnose
  console.log("[QBO callback]", {
    hasCode: !!code,
    state,
    cookieState,
    realmId,
    error,
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
  if (!state || state !== cookieState) {
    const reason = `state_mismatch|url=${state || "null"}|cookie=${cookieState || "null"}`;
    return NextResponse.redirect(`${origin}/?qbo=error&reason=${encodeURIComponent(reason)}`);
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code);
    await saveTokens({ realmId, tokenResponse });
    const res = NextResponse.redirect(`${origin}/?qbo=connected`);
    res.cookies.delete("qbo_state");
    return res;
  } catch (e) {
    return NextResponse.redirect(
      `${origin}/?qbo=error&reason=${encodeURIComponent(e.message || "exchange_failed")}`
    );
  }
}
