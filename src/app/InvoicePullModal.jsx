"use client";
import { useState, useEffect } from "react";
import { createInvoiceLinesAndItems } from "../lib/intake";

const EQUIP_TYPES = [
  "Switchgear","Panelboard","Transformer","Circuit Breaker",
  "Motor Control Center (MCC)","Bus Duct","Disconnect Switch",
  "UPS System","PDU","RPP (Remote Power Panel)",
  "ATS / Transfer Switch","VFD / Drive","Motor Starter",
  "Control Transformer","Trip Unit","Relay","CT / PT","Meter",
  "Temp Power Skid","Charging Station","Other",
];

const MFRS = [
  "Eaton / Cutler-Hammer","Siemens","Square D / Schneider","ABB","GE",
  "Westinghouse","ITE","Federal Pacific","Allen-Bradley / Rockwell",
  "Mitsubishi","Yaskawa","Danfoss","Liebert / Vertiv","APC / Schneider",
  "ABL Sursum","Hardin Power Group","Other",
];

const blankLine = () => ({
  equipmentType: "",
  manufacturer: "",
  description: "",
  phaseLabel: "",
  dueDate: "",
  qty: 1,
  templateKey: "",
});

const inputStyle = {
  width: "100%", padding: 10, border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: 13, boxSizing: "border-box", fontFamily: "inherit",
};
const labelStyle = {
  fontSize: 10, fontWeight: 700, color: "#475569",
  marginBottom: 3, display: "block", letterSpacing: 0.3,
};

export default function InvoicePullModal({ onClose, onCreated }) {
  const [header, setHeader] = useState({
    invoiceNumber: "",
    orderNumber: "",
    customerName: "",
    jobSite: "",
  });
  const [lines, setLines] = useState([blankLine()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // QBO connection state (v9b)
  const [qboStatus, setQboStatus] = useState({ loading: true, connected: false });
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/qbo/status");
        const j = await r.json();
        setQboStatus({ loading: false, ...j });
      } catch (e) {
        setQboStatus({ loading: false, connected: false });
      }
    })();
  }, []);

  const setH = (k, v) => setHeader((p) => ({ ...p, [k]: v }));
  const setL = (idx, k, v) => setLines((p) => p.map((l, i) => (i === idx ? { ...l, [k]: v } : l)));
  const addLine = () => setLines((p) => [...p, blankLine()]);
  const removeLine = (idx) => setLines((p) => p.filter((_, i) => i !== idx));

  const totalItems = lines.reduce((sum, l) => sum + (parseInt(l.qty, 10) || 0), 0);

  const pullFromQbo = async () => {
    setError(null);
    if (!header.invoiceNumber.trim()) {
      setError("Enter the invoice number first, then tap Pull from QuickBooks");
      return;
    }
    setPulling(true);
    try {
      const r = await fetch("/api/qbo/invoice-pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber: header.invoiceNumber.trim() }),
      });
      if (r.status === 404) {
        setError(`Invoice ${header.invoiceNumber} not found in QuickBooks`);
        setPulling(false);
        return;
      }
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || `QuickBooks pull failed (${r.status})`);
        setPulling(false);
        return;
      }
      const data = await r.json();
      // Auto-fill customer if we got it
      setHeader((p) => ({
        ...p,
        customerName: p.customerName || data.customerName || "",
      }));
      // Map QBO lines into the form. User still picks equipment type / manufacturer per line.
      const mapped = (data.lines || []).map((l) => ({
        equipmentType: "",
        manufacturer: "",
        description: l.description || "",
        phaseLabel: "",
        dueDate: "",
        qty: parseInt(l.qty, 10) || 1,
        templateKey: "",
      }));
      if (mapped.length === 0) {
        setError("Invoice found but contained no item lines");
      } else {
        setLines(mapped);
      }
    } catch (e) {
      setError(e.message || "QuickBooks pull failed");
    }
    setPulling(false);
  };

  const submit = async () => {
    setError(null);
    if (!header.invoiceNumber.trim()) {
      setError("Invoice number required");
      return;
    }
    const validLines = lines.filter((l) => l.equipmentType && (parseInt(l.qty, 10) || 0) >= 1);
    if (!validLines.length) {
      setError("At least one line with equipment type and qty required");
      return;
    }
    setBusy(true);
    try {
      const result = await createInvoiceLinesAndItems({ header, lines: validLines });
      onCreated(result, header);
    } catch (e) {
      setError(e.message || "Save failed");
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(15,23,42,0.85)", overflowY: "auto",
      padding: 12, fontFamily: "-apple-system,system-ui,sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 16, maxWidth: 520, margin: "20px auto",
        boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>Pull from Invoice</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Punch invoice details, explode into QC items</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 24, color: "#94a3b8",
            cursor: "pointer", padding: 0, lineHeight: 1,
          }}>×</button>
        </div>

        {error && (
          <div style={{ padding: 10, background: "#fef2f2", color: "#dc2626", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {/* QBO connection pill (v9b) */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 12px", borderRadius: 8, marginBottom: 12,
          background: qboStatus.connected ? "#ecfdf5" : "#f8fafc",
          border: `1px solid ${qboStatus.connected ? "#a7f3d0" : "#e2e8f0"}`,
        }}>
          <div style={{ fontSize: 11, color: qboStatus.connected ? "#065f46" : "#64748b", fontWeight: 700 }}>
            {qboStatus.loading ? "Checking QuickBooks..." :
             qboStatus.connected ? `🔌 QuickBooks connected (${qboStatus.env || "sandbox"})` :
             "🔌 QuickBooks not connected"}
          </div>
          {!qboStatus.loading && !qboStatus.connected && (
            <a href="/api/qbo/auth/start" style={{
              padding: "5px 10px", borderRadius: 6, background: "#58815a",
              color: "#fff", fontSize: 10, fontWeight: 700, textDecoration: "none",
            }}>Connect</a>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#58815a", marginBottom: 6, letterSpacing: 1 }}>HEADER</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={labelStyle}>Invoice # *</label>
              <input style={inputStyle} value={header.invoiceNumber} onChange={(e) => setH("invoiceNumber", e.target.value)} placeholder="315789" />
            </div>
            <div>
              <label style={labelStyle}>PO # (optional)</label>
              <input style={inputStyle} value={header.orderNumber} onChange={(e) => setH("orderNumber", e.target.value)} placeholder="252011-0025" />
            </div>
            <div>
              <label style={labelStyle}>Customer</label>
              <input style={inputStyle} value={header.customerName} onChange={(e) => setH("customerName", e.target.value)} placeholder="Morley-Moss" />
            </div>
            <div>
              <label style={labelStyle}>Job Site</label>
              <input style={inputStyle} value={header.jobSite} onChange={(e) => setH("jobSite", e.target.value)} placeholder="Equinix DA12" />
            </div>
          </div>
          {qboStatus.connected && (
            <button onClick={pullFromQbo} disabled={pulling || !header.invoiceNumber.trim()} style={{
              marginTop: 8, width: "100%", padding: 10,
              border: "1px solid #58815a", borderRadius: 8,
              background: pulling ? "#f8fafc" : "#fff", color: "#3d5e3f",
              fontWeight: 700, fontSize: 12,
              cursor: pulling || !header.invoiceNumber.trim() ? "default" : "pointer",
              opacity: pulling || !header.invoiceNumber.trim() ? 0.5 : 1,
            }}>
              {pulling ? "Pulling from QuickBooks..." : "↓ Pull lines from QuickBooks"}
            </button>
          )}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "#58815a", marginBottom: 6, letterSpacing: 1 }}>LINES</div>
        {lines.map((line, idx) => (
          <div key={idx} style={{
            border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 8, background: "#f8fafc",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Line {idx + 1}</span>
              {lines.length > 1 && (
                <button onClick={() => removeLine(idx)} style={{
                  background: "none", border: "none", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0,
                }}>Remove</button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={labelStyle}>Equipment Type *</label>
                <select style={inputStyle} value={line.equipmentType} onChange={(e) => setL(idx, "equipmentType", e.target.value)}>
                  <option value="">Select...</option>
                  {EQUIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Manufacturer</label>
                <select style={inputStyle} value={line.manufacturer} onChange={(e) => setL(idx, "manufacturer", e.target.value)}>
                  <option value="">Select...</option>
                  {MFRS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>Description (paste from invoice)</label>
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                value={line.description}
                onChange={(e) => setL(idx, "description", e.target.value)}
                placeholder="300KVA SKID / HV: 600A 480V 3PH 4W N3R MLO ..."
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 8 }}>
              <div>
                <label style={labelStyle}>Phase / Label</label>
                <input style={inputStyle} value={line.phaseLabel} onChange={(e) => setL(idx, "phaseLabel", e.target.value)} placeholder="Phase 1 Lay Down" />
              </div>
              <div>
                <label style={labelStyle}>Due Date</label>
                <input type="date" style={inputStyle} value={line.dueDate} onChange={(e) => setL(idx, "dueDate", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Qty *</label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  value={line.qty}
                  onChange={(e) => setL(idx, "qty", parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </div>
          </div>
        ))}

        <button onClick={addLine} style={{
          width: "100%", padding: 12, border: "1px dashed #94a3b8", borderRadius: 10,
          background: "transparent", color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 12,
        }}>+ Add Line</button>

        <div style={{
          padding: 12, background: "#58815a08", border: "1px solid #58815a40",
          borderRadius: 10, marginBottom: 12, fontSize: 13, color: "#3d5e3f", fontWeight: 700,
        }}>
          Will create {lines.length} invoice line{lines.length === 1 ? "" : "s"} and {totalItems} inventory item{totalItems === 1 ? "" : "s"}.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 14, border: "1px solid #d1d5db", borderRadius: 10,
            background: "#fff", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={submit} disabled={busy} style={{
            flex: 2, padding: 14, border: "none", borderRadius: 10,
            background: "#58815a", color: "#fff", fontWeight: 800, fontSize: 13,
            cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1,
          }}>{busy ? "Creating..." : `Create ${totalItems} Item${totalItems === 1 ? "" : "s"}`}</button>
        </div>
      </div>
    </div>
  );
}
