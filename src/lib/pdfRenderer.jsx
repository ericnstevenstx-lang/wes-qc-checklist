// PDF renderer for QC inspection reports.
// Hardin branded. Server-side use via renderToBuffer.

import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image, Svg, Path,
  renderToBuffer,
} from "@react-pdf/renderer";

const HARDIN_GREEN = "#58815a";
const HARDIN_DARK = "#3d5e3f";
const GREY_TEXT = "#475569";
const LIGHT_GREY = "#94a3b8";
const BORDER = "#e2e8f0";

const RESULT_COLORS = {
  pass: "#16a34a",
  fail: "#dc2626",
  conditional: "#f59e0b",
  na: "#94a3b8",
  flag: "#f59e0b",
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: HARDIN_GREEN,
    paddingBottom: 8,
    marginBottom: 14,
  },
  brand: { flexDirection: "row", alignItems: "center" },
  brandText: { marginLeft: 10 },
  brandPrimary: {
    fontSize: 14, fontWeight: 700, letterSpacing: 2, color: "#565756",
  },
  brandSecondary: {
    fontSize: 7, color: HARDIN_GREEN, letterSpacing: 1.5, fontWeight: 700,
  },
  reportTitle: {
    fontSize: 11, fontWeight: 700, color: HARDIN_DARK, letterSpacing: 1,
  },
  reportId: { fontSize: 8, color: LIGHT_GREY, marginTop: 2 },

  resultBanner: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultLabel: { fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: 2 },
  resultMeta: { fontSize: 8, color: "#fff", textAlign: "right" },

  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 9, fontWeight: 700, color: HARDIN_GREEN,
    letterSpacing: 1, marginBottom: 4,
    borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingBottom: 2,
  },

  kvGrid: { flexDirection: "row", flexWrap: "wrap" },
  kv: { width: "50%", flexDirection: "row", marginBottom: 3 },
  kvLabel: { width: 70, color: GREY_TEXT, fontWeight: 700, fontSize: 8 },
  kvValue: { flex: 1, fontSize: 9 },

  checkRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  checkBadge: {
    width: 36,
    fontSize: 7,
    fontWeight: 700,
    color: "#fff",
    textAlign: "center",
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 6,
  },
  checkText: { flex: 1, fontSize: 8.5 },
  checkNote: { fontSize: 7.5, color: LIGHT_GREY, marginTop: 1, fontStyle: "italic" },
  sectionGroupTitle: {
    fontSize: 8.5, fontWeight: 700, color: HARDIN_DARK,
    marginTop: 6, marginBottom: 2,
  },

  meggerTable: { flexDirection: "row", flexWrap: "wrap" },
  meggerCell: {
    width: "33.3%", padding: 4, borderWidth: 0.5, borderColor: BORDER,
  },
  meggerLabel: { fontSize: 7, color: LIGHT_GREY, marginBottom: 2 },
  meggerValue: { fontSize: 11, fontWeight: 700, color: HARDIN_DARK },

  torqueRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    fontSize: 8,
  },
  torqueCell: { flex: 1 },

  defRow: {
    padding: 6,
    borderLeftWidth: 3,
    marginBottom: 4,
    backgroundColor: "#fef2f2",
  },
  defCat: { fontSize: 7, fontWeight: 700, color: GREY_TEXT, letterSpacing: 0.5 },
  defDesc: { fontSize: 9, marginTop: 1 },

  notes: {
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 3,
    fontSize: 9,
    color: GREY_TEXT,
  },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 7,
    color: LIGHT_GREY,
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 4,
  },

  photoPage: { padding: 36 },
  photoPair: { flexDirection: "row", marginBottom: 12, gap: 10 },
  photoBox: {
    flex: 1,
    height: 280,
    borderWidth: 0.5,
    borderColor: BORDER,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  photoImg: { maxWidth: "100%", maxHeight: 260, objectFit: "contain" },
  photoLabel: { fontSize: 7, color: LIGHT_GREY, marginTop: 2 },
});

const HardinLogo = () => (
  <Svg width="32" height="29" viewBox="0 0 212 191">
    <Path
      d="M113.977 155.659C106.789 156.563 99.7953 156.218 93.1887 154.777C92.0481 154.518 91.4671 153.227 92.0266 152.194L98.0737 141.134C98.418 140.489 99.1497 140.144 99.8814 140.23C101.904 140.51 103.992 140.661 106.101 140.661C131.236 140.661 151.702 120.197 151.702 95.0634C151.702 89.813 150.798 84.7562 149.162 80.0652L124.5 125.34C124.199 125.899 123.618 126.222 122.994 126.222H109.243C107.951 126.222 107.134 124.845 107.736 123.704L116.28 108.039C116.602 107.436 116.172 106.726 115.483 106.726H90.1328C89.724 106.726 89.3581 106.942 89.1645 107.307L77.2209 129.234L70.313 141.801C69.7534 142.834 68.3762 143.135 67.4508 142.382C52.4083 130.052 43.3054 110.664 45.2637 89.2965C47.9752 59.9887 71.8839 36.4692 101.237 34.1883C109.587 33.5427 117.614 34.5756 125.038 37.0071C126.286 37.416 126.824 38.8792 126.2 40.0412L120.67 50.1118C120.196 50.994 119.185 51.3814 118.216 51.1231C111.61 49.2941 104.422 48.9068 96.9762 50.3915C78.0601 54.1572 63.3835 69.8871 60.8872 89.0168C59.553 99.2595 61.6619 108.964 66.2026 117.141L93.3824 67.2403C93.5976 66.8315 94.0495 66.5732 94.5014 66.5732H109.221C110.189 66.5732 110.814 67.6061 110.34 68.4669L98.8269 89.6193C98.418 90.3509 98.956 91.2332 99.7953 91.2332H124.931C125.253 91.2332 125.555 91.061 125.727 90.7598L139.995 64.5721L139.952 64.529L146.903 51.7687C147.29 51.0586 148.258 50.9079 148.839 51.4674C161.386 63.7544 168.681 81.3993 166.959 100.658C164.441 128.933 142.19 152.108 114.02 155.659H113.977Z"
      fill={HARDIN_GREEN}
    />
  </Svg>
);

const Header = ({ inspectionId }) => (
  <View style={styles.header} fixed>
    <View style={styles.brand}>
      <HardinLogo />
      <View style={styles.brandText}>
        <Text style={styles.brandPrimary}>HARDIN</Text>
        <Text style={styles.brandSecondary}>POWER GROUP</Text>
      </View>
    </View>
    <View>
      <Text style={styles.reportTitle}>QC INSPECTION REPORT</Text>
      <Text style={styles.reportId}>{inspectionId}</Text>
    </View>
  </View>
);

const Footer = () => (
  <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) =>
    `Hardin Power Group  ·  Quality Control  ·  Page ${pageNumber} of ${totalPages}`
  } />
);

const ResultBanner = ({ result, date, inspector }) => {
  const color = RESULT_COLORS[result] || HARDIN_DARK;
  return (
    <View style={[styles.resultBanner, { backgroundColor: color }]}>
      <Text style={styles.resultLabel}>{(result || "").toUpperCase()}</Text>
      <View>
        <Text style={styles.resultMeta}>Date: {date || "N/A"}</Text>
        <Text style={styles.resultMeta}>Inspector: {inspector || "N/A"}</Text>
      </View>
    </View>
  );
};

const KV = ({ label, value }) => (
  <View style={styles.kv}>
    <Text style={styles.kvLabel}>{label}</Text>
    <Text style={styles.kvValue}>{value || "—"}</Text>
  </View>
);

function groupChecksBySection(checks) {
  const map = new Map();
  for (const c of checks || []) {
    const key = c.section || "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(c);
  }
  return Array.from(map.entries());
}

const InspectionDoc = ({ inspection, checks, photos, deficiencies }) => {
  const checkGroups = groupChecksBySection(checks);
  const hasMegger = ["megger_a_to_b","megger_b_to_c","megger_c_to_a","megger_a_to_g","megger_b_to_g","megger_c_to_g"]
    .some((k) => inspection[k]);
  const torques = Array.isArray(inspection.torques) ? inspection.torques : [];
  const photoPairs = [];
  for (let i = 0; i < (photos || []).length; i += 2) {
    photoPairs.push([photos[i], photos[i + 1]]);
  }

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header inspectionId={inspection.id} />

        <ResultBanner
          result={inspection.overall_result}
          date={inspection.inspection_date}
          inspector={inspection.inspected_by}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EQUIPMENT</Text>
          <View style={styles.kvGrid}>
            <KV label="Type" value={inspection.equipment_type} />
            <KV label="Manufacturer" value={inspection.manufacturer} />
            <KV label="Model" value={inspection.model_number} />
            <KV label="Serial" value={inspection.serial_number} />
            <KV label="Voltage" value={inspection.voltage_rating} />
            <KV label="Amperage" value={inspection.amperage_rating} />
            <KV label="KVA" value={inspection.kva_rating} />
            <KV label="Catalog" value={inspection.catalog_number} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INSPECTION</Text>
          <View style={styles.kvGrid}>
            <KV label="Inspector" value={inspection.inspected_by} />
            <KV label="Date" value={inspection.inspection_date} />
            <KV label="Type" value={inspection.inspection_type} />
            <KV label="Sticker #" value={inspection.sticker_number} />
            <KV label="Invoice #" value={inspection.invoice_number} />
            <KV label="Job Site" value={inspection.job_site} />
            <KV label="Customer" value={inspection.customer_name} />
            <KV label="Location" value={inspection.source_location} />
          </View>
        </View>

        {checkGroups.length > 0 && (
          <View style={styles.section} wrap>
            <Text style={styles.sectionTitle}>CHECKLIST</Text>
            {checkGroups.map(([sec, items]) => (
              <View key={sec} wrap={false}>
                <Text style={styles.sectionGroupTitle}>{sec}</Text>
                {items.map((c, idx) => (
                  <View key={idx} style={styles.checkRow}>
                    <Text style={[styles.checkBadge, { backgroundColor: RESULT_COLORS[c.result] || LIGHT_GREY }]}>
                      {(c.result || "").toUpperCase()}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkText}>{c.check_item}</Text>
                      {c.notes && <Text style={styles.checkNote}>{c.notes}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {hasMegger && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>
              MEGGER / INSULATION RESISTANCE {inspection.megger_test_v ? `(${inspection.megger_test_v}V)` : ""}
            </Text>
            <View style={styles.meggerTable}>
              {[
                ["A-B", inspection.megger_a_to_b],
                ["B-C", inspection.megger_b_to_c],
                ["C-A", inspection.megger_c_to_a],
                ["A-G", inspection.megger_a_to_g],
                ["B-G", inspection.megger_b_to_g],
                ["C-G", inspection.megger_c_to_g],
              ].map(([label, val]) => (
                <View key={label} style={styles.meggerCell}>
                  <Text style={styles.meggerLabel}>{label}</Text>
                  <Text style={styles.meggerValue}>{val ? `${val} MΩ` : "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {torques.length > 0 && (
          <View style={styles.section} wrap>
            <Text style={styles.sectionTitle}>TORQUE VERIFICATION</Text>
            <View style={[styles.torqueRow, { fontWeight: 700, backgroundColor: "#f8fafc" }]}>
              <Text style={styles.torqueCell}>Location</Text>
              <Text style={styles.torqueCell}>Bolt</Text>
              <Text style={styles.torqueCell}>Spec (ft-lb)</Text>
              <Text style={styles.torqueCell}>Actual</Text>
            </View>
            {torques.map((t, i) => (
              <View key={i} style={styles.torqueRow}>
                <Text style={styles.torqueCell}>{t.loc || "—"}</Text>
                <Text style={styles.torqueCell}>{t.boltSize || "—"}</Text>
                <Text style={styles.torqueCell}>{t.spec || "—"}{t.specHigh ? `–${t.specHigh}` : ""}</Text>
                <Text style={styles.torqueCell}>{t.actual || "—"}</Text>
              </View>
            ))}
          </View>
        )}

        {(deficiencies || []).length > 0 && (
          <View style={styles.section} wrap>
            <Text style={styles.sectionTitle}>DEFICIENCIES</Text>
            {deficiencies.map((d, i) => (
              <View key={i} style={[styles.defRow, { borderLeftColor: RESULT_COLORS.fail }]}>
                <Text style={styles.defCat}>
                  {(d.category || "GENERAL").toUpperCase()} · {(d.severity || "").toUpperCase()}
                  {d.repair_needed ? " · REPAIR REQUIRED" : ""}
                </Text>
                <Text style={styles.defDesc}>{d.description}</Text>
              </View>
            ))}
          </View>
        )}

        {inspection.notes && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <Text style={styles.notes}>{inspection.notes}</Text>
          </View>
        )}

        <Footer />
      </Page>

      {photoPairs.length > 0 && photoPairs.map((pair, idx) => (
        <Page key={`p${idx}`} size="LETTER" style={styles.photoPage}>
          <Header inspectionId={inspection.id} />
          <Text style={styles.sectionTitle}>PHOTOS ({idx * 2 + 1}–{idx * 2 + (pair[1] ? 2 : 1)} of {photos.length})</Text>
          <View style={styles.photoPair}>
            {pair.map((url, j) => (
              <View key={j} style={styles.photoBox}>
                {url ? <Image src={url} style={styles.photoImg} /> : null}
              </View>
            ))}
          </View>
          <Footer />
        </Page>
      ))}
    </Document>
  );
};

/**
 * Render an inspection to a PDF Buffer.
 *   inspection: row from qc_inspections (with megger_*, torques jsonb, etc.)
 *   checks:     rows from qc_checklist_items
 *   photos:     array of photo URLs (strings)
 *   deficiencies: rows from inventory_deficiencies (filtered to this inspection)
 */
export async function renderInspectionPdf({ inspection, checks, photos, deficiencies }) {
  return await renderToBuffer(
    <InspectionDoc
      inspection={inspection}
      checks={checks || []}
      photos={photos || []}
      deficiencies={deficiencies || []}
    />
  );
}
