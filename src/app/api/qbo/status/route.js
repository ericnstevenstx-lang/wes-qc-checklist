import { NextResponse } from "next/server";
import { loadTokens } from "@/lib/qbo";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tokens = await loadTokens();
    if (!tokens) {
      return NextResponse.json({ connected: false });
    }
    return NextResponse.json({
      connected: true,
      realmId: tokens.realm_id,
      env: process.env.QBO_ENV || "sandbox",
      updatedAt: tokens.updated_at,
    });
  } catch (e) {
    return NextResponse.json({ connected: false, error: e.message }, { status: 500 });
  }
}
