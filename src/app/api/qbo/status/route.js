import { NextResponse } from "next/server";
import { loadTokens } from "@/lib/qbo";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tokens = await loadTokens();
    const debug = {
      tokensRaw: tokens,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLen: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").length,
      qboEnv: process.env.QBO_ENV,
    };
    if (!tokens) {
      return NextResponse.json({ connected: false, debug });
    }
    return NextResponse.json({
      connected: true,
      realmId: tokens.realm_id,
      env: process.env.QBO_ENV || "sandbox",
      updatedAt: tokens.updated_at,
      debug,
    });
  } catch (e) {
    return NextResponse.json({ connected: false, error: e.message, stack: e.stack }, { status: 500 });
  }
}
