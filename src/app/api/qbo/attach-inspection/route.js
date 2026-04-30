import { NextResponse } from "next/server";
import { sbServer } from "@/lib/sbServer";
import {
  findInvoiceByDocNumber,
  attachFileToInvoice,
  deleteAttachable,
} from "@/lib/qbo";
import { renderInspectionPdf } from "@/lib/pdfRenderer";

export const runtime = "nodejs";
// Allow longer execution for PDF render + multipart upload
export const maxDuration = 60;

async function loadBundle(id) {
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

async function patchInspection(id, patch) {
  await sbServer(`qc_inspections?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function POST(req) {
  let inspectionId = null;
  try {
    const body = await req.json().catch(() => ({}));
    inspectionId = (body.inspectionId || "").trim();
    if (!inspectionId) {
      return NextResponse.json({ error: "inspectionId required" }, { status: 400 });
    }

    // Mark as pending (best effort; do not fail the request if this errors)
    try {
      await patchInspection(inspectionId, { qb_attach_status: "pending", qb_attach_error: null });
    } catch (e) {}

    const bundle = await loadBundle(inspectionId);
    if (!bundle) {
      return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
    }
    const { inspection } = bundle;

    if (!inspection.invoice_number) {
      await patchInspection(inspectionId, {
        qb_attach_status: "failed",
        qb_attach_error: "Inspection has no invoice_number",
      });
      return NextResponse.json({ error: "Inspection has no invoice_number" }, { status: 400 });
    }

    // Resolve the QBO Invoice Id (cache it on the row after first lookup)
    let qboInvoiceId = inspection.qb_invoice_id;
    if (!qboInvoiceId) {
      const inv = await findInvoiceByDocNumber(inspection.invoice_number);
      if (!inv) {
        await patchInspection(inspectionId, {
          qb_attach_status: "failed",
          qb_attach_error: `Invoice ${inspection.invoice_number} not found in QBO`,
        });
        return NextResponse.json(
          { error: `Invoice ${inspection.invoice_number} not found in QBO` },
          { status: 404 }
        );
      }
      qboInvoiceId = inv.Id;
    }

    // If re-syncing a stale attachment, try to delete the old one first.
    // Best effort: continue even if delete fails (the old will remain alongside the new).
    if (inspection.qb_attach_status === "stale" && inspection.qb_attachment_id) {
      try {
        await deleteAttachable(inspection.qb_attachment_id);
      } catch (e) {}
    }

    const pdfBuffer = await renderInspectionPdf(bundle);
    const fileName = `Hardin_QC_${inspectionId}.pdf`;

    const attached = await attachFileToInvoice({
      invoiceId: qboInvoiceId,
      fileName,
      fileBuffer: pdfBuffer,
      contentType: "application/pdf",
      includeOnSend: false, // confirmed: internal record only
    });

    await patchInspection(inspectionId, {
      qb_invoice_id: qboInvoiceId,
      qb_attachment_id: attached.id,
      qb_attachment_url: attached.fileAccessUri || attached.tempDownloadUri || null,
      qb_attached_at: new Date().toISOString(),
      qb_attach_status: "attached",
      qb_attach_error: null,
    });

    return NextResponse.json({
      ok: true,
      qbInvoiceId: qboInvoiceId,
      attachmentId: attached.id,
      url: attached.fileAccessUri || attached.tempDownloadUri || null,
    });
  } catch (e) {
    if (inspectionId) {
      try {
        await patchInspection(inspectionId, {
          qb_attach_status: "failed",
          qb_attach_error: (e.message || "attach failed").slice(0, 500),
        });
      } catch (inner) {}
    }
    return NextResponse.json({ error: e.message || "attach failed" }, { status: 500 });
  }
}
