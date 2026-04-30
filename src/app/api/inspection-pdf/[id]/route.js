import { NextResponse } from "next/server";
import { sbServer } from "@/lib/sbServer";
import { renderInspectionPdf } from "@/lib/pdfRenderer";

export const runtime = "nodejs";

async function loadInspectionBundle(id) {
  const [insps, checks, photoRows, defs] = await Promise.all([
    sbServer(`qc_inspections?id=eq.${encodeURIComponent(id)}&select=*`),
    sbServer(`qc_checklist_items?inspection_id=eq.${encodeURIComponent(id)}&order=sort_order&select=*`),
    sbServer(`item_photos?reference_id=eq.${encodeURIComponent(id)}&reference_type=eq.qc_inspection&select=photo_url`),
    sbServer(`inventory_deficiencies?inspection_id=eq.${encodeURIComponent(id)}&select=*`),
  ]);
  const inspection = insps && insps[0];
  if (!inspection) return null;
  return {
    inspection,
    checks: checks || [],
    photos: (photoRows || []).map((r) => r.photo_url).filter(Boolean),
    deficiencies: defs || [],
  };
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const bundle = await loadInspectionBundle(id);
    if (!bundle) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }
    const buffer = await renderInspectionPdf(bundle);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "PDF render failed" }, { status: 500 });
  }
}
