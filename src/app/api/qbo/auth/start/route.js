import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/qbo";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET() {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const authUrl = buildAuthUrl(state);
    const res = NextResponse.redirect(authUrl);
    res.cookies.set("qbo_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
