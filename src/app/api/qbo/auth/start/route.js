import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/qbo";
import crypto from "crypto";

export const runtime = "nodejs";

function sign(payload) {
  const secret = process.env.QBO_CLIENT_SECRET || "fallback-not-secure";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
}

export async function GET() {
  try {
    const nonce = crypto.randomBytes(8).toString("hex");
    const ts = Date.now().toString();
    const payload = `${nonce}.${ts}`;
    const sig = sign(payload);
    const state = `${payload}.${sig}`;
    const authUrl = buildAuthUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
