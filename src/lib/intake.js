import { sb } from "./sb";

/**
 * Create invoice header lines and explode each line into N inventory items.
 * Each exploded item gets status='received', invoice_line_id, line_item_index 1..N.
 * Returns { lineCount, itemCount, invoiceNumber }.
 */
export async function createInvoiceLinesAndItems({ header, lines }) {
  if (!header.invoiceNumber || !header.invoiceNumber.trim()) {
    throw new Error("Invoice number required");
  }
  if (!lines || !lines.length) {
    throw new Error("At least one line required");
  }

  let totalItems = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const qty = parseInt(line.qty, 10);
    if (!qty || qty < 1) {
      throw new Error(`Line ${idx + 1}: qty must be at least 1`);
    }
    if (!line.equipmentType) {
      throw new Error(`Line ${idx + 1}: equipment type required`);
    }

    const lineRows = await sb("invoice_lines", {
      method: "POST",
      body: JSON.stringify({
        invoice_number: header.invoiceNumber.trim(),
        order_number: header.orderNumber?.trim() || null,
        customer_name: header.customerName?.trim() || null,
        job_site: header.jobSite?.trim() || null,
        line_number: idx + 1,
        equipment_type: line.equipmentType || null,
        manufacturer: line.manufacturer || null,
        description: line.description || null,
        qty,
        phase_label: line.phaseLabel?.trim() || null,
        due_date: line.dueDate || null,
        template_key: line.templateKey || null,
        source: "manual",
      }),
    });
    const lineId = lineRows[0].id;

    const itemRows = Array.from({ length: qty }, (_, i) => ({
      equipment_type: line.equipmentType || null,
      manufacturer: line.manufacturer || null,
      status: "received",
      order_number: header.orderNumber?.trim() || null,
      invoice_number: header.invoiceNumber.trim(),
      source_job_site: header.jobSite?.trim() || null,
      customer_origin: header.customerName?.trim() || null,
      invoice_line_id: lineId,
      line_item_index: i + 1,
    }));
    await sb("inventory_items", {
      method: "POST",
      body: JSON.stringify(itemRows),
    });
    totalItems += qty;
  }

  return {
    lineCount: lines.length,
    itemCount: totalItems,
    invoiceNumber: header.invoiceNumber.trim(),
  };
}
