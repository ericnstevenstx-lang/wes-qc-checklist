import { NextResponse } from "next/server";
import { findInvoiceByDocNumber, mapQboInvoiceToLines } from "@/lib/qbo";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const docNumber = (body.invoiceNumber || "").trim();
    if (!docNumber) {
      return NextResponse.json({ error: "invoiceNumber required" }, { status: 400 });
    }
    const invoice = await findInvoiceByDocNumber(docNumber);
    if (!invoice) {
      return NextResponse.json({ found: false }, { status: 404 });
    }
    return NextResponse.json({ found: true, ...mapQboInvoiceToLines(invoice) });
  } catch (e) {
    return NextResponse.json({ error: e.message || "pull failed" }, { status: 500 });
  }
}
