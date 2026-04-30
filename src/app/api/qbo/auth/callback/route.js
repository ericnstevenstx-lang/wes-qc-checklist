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

  if (error) {
    return NextResponse.redirect(`${origin}/?qbo=error&reason=${encodeURIComponent(error)}`);
  }
  if (!code || !realmId) {
    return NextResponse.redirect(`${origin}/?qbo=error&reason=missing_params`);
  }
  if (!state || state !== cookieState) {
    return NextResponse.redirect(`${origin}/?qbo=error&reason=state_mismatch`);
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
