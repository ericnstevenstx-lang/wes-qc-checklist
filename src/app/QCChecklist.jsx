"use client";
import { useState, useEffect, useCallback } from "react";

/* ── Logo Components ───────────────────────────────────── */
const LogoMark = ({ size = 32, color = "#58815a" }) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 212 191" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M113.977 155.659C106.789 156.563 99.7953 156.218 93.1887 154.777C92.0481 154.518 91.4671 153.227 92.0266 152.194L98.0737 141.134C98.418 140.489 99.1497 140.144 99.8814 140.23C101.904 140.51 103.992 140.661 106.101 140.661C131.236 140.661 151.702 120.197 151.702 95.0634C151.702 89.813 150.798 84.7562 149.162 80.0652L124.5 125.34C124.199 125.899 123.618 126.222 122.994 126.222H109.243C107.951 126.222 107.134 124.845 107.736 123.704L116.28 108.039C116.602 107.436 116.172 106.726 115.483 106.726H90.1328C89.724 106.726 89.3581 106.942 89.1645 107.307L77.2209 129.234L70.313 141.801C69.7534 142.834 68.3762 143.135 67.4508 142.382C52.4083 130.052 43.3054 110.664 45.2637 89.2965C47.9752 59.9887 71.8839 36.4692 101.237 34.1883C109.587 33.5427 117.614 34.5756 125.038 37.0071C126.286 37.416 126.824 38.8792 126.2 40.0412L120.67 50.1118C120.196 50.994 119.185 51.3814 118.216 51.1231C111.61 49.2941 104.422 48.9068 96.9762 50.3915C78.0601 54.1572 63.3835 69.8871 60.8872 89.0168C59.553 99.2595 61.6619 108.964 66.2026 117.141L93.3824 67.2403C93.5976 66.8315 94.0495 66.5732 94.5014 66.5732H109.221C110.189 66.5732 110.814 67.6061 110.34 68.4669L98.8269 89.6193C98.418 90.3509 98.956 91.2332 99.7953 91.2332H124.931C125.253 91.2332 125.555 91.061 125.727 90.7598L139.995 64.5721L139.952 64.529L146.903 51.7687C147.29 51.0586 148.258 50.9079 148.839 51.4674C161.386 63.7544 168.681 81.3993 166.959 100.658C164.441 128.933 142.19 152.108 114.02 155.659H113.977Z" fill={color}/>
  </svg>
);

const SplashScreen = ({ onDone }) => {
  const [opacity, setOpacity] = useState(0);
  useEffect(() => {
    requestAnimationFrame(() => setOpacity(1));
    const fade = setTimeout(() => setOpacity(0), 2200);
    const done = setTimeout(onDone, 2800);
    return () => { clearTimeout(fade); clearTimeout(done); };
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity, transition: "opacity 0.6s ease",
    }}>
      <LogoMark size={120} />
      <div style={{ marginTop: 20, fontSize: 32, fontWeight: 800, letterSpacing: 6, color: "#565756", fontFamily: "-apple-system,system-ui,sans-serif" }}>
        HARDIN
      </div>
      <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, letterSpacing: 4, color: "#58815a" }}>
        POWER GROUP
      </div>
      <div style={{ marginTop: 32, fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 2 }}>
        QUALITY CONTROL
      </div>
    </div>
  );
};

/* ── Supabase ──────────────────────────────────────────── */
const SB_URL = "https://ulyycjtrshpsjpvbztkr.supabase.co";
const SB_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVseXljanRyc2hwc2pwdmJ6dGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzg1NzAsImV4cCI6MjA5MDcxNDU3MH0.UYwCdYrdy20xl_hCkO8t4CAB16vBHj-oMdflDv1XlVE";
const hdrs = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};
async function sb(path, opts = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { ...hdrs, ...(opts.headers || {}) },
  });
  if (!r.ok) throw new Error(`${r.status}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

/* ── Constants ─────────────────────────────────────────── */
const EQUIP_TYPES = [
  "Switchgear","Panelboard","Transformer","Circuit Breaker",
  "Motor Control Center (MCC)","Bus Duct","Disconnect Switch",
  "UPS System","PDU","RPP (Remote Power Panel)",
  "ATS / Transfer Switch","VFD / Drive","Motor Starter",
  "Control Transformer","Trip Unit","Relay","CT / PT","Meter","Other",
];
const MFRS = [
  "Eaton / Cutler-Hammer","Siemens","Square D / Schneider","ABB","GE",
  "Westinghouse","ITE","Federal Pacific","Allen-Bradley / Rockwell",
  "Mitsubishi","Yaskawa","Danfoss","Liebert / Vertiv","APC / Schneider",
  "ABL Sursum","Other",
];
const STATUSES = [
  { v: "received", l: "Received", c: "#6b7280" },
  { v: "in_qc", l: "In QC", c: "#f59e0b" },
  { v: "qc_pass", l: "QC Pass", c: "#16a34a" },
  { v: "qc_fail", l: "QC Fail", c: "#dc2626" },
  { v: "conditional", l: "Conditional", c: "#f59e0b" },
  { v: "refurb", l: "In Refurb", c: "#8b5cf6" },
  { v: "ready", l: "Ready", c: "#16a34a" },
  { v: "listed", l: "Listed", c: "#0369a1" },
  { v: "staged_for_ship", l: "Staged", c: "#0891b2" },
  { v: "shipped", l: "Shipped", c: "#475569" },
  { v: "sold", l: "Sold", c: "#065f46" },
  { v: "scrapped", l: "Scrapped", c: "#dc2626" },
];
const SC = {}; STATUSES.forEach((s) => (SC[s.v] = s.c));
const SL = {}; STATUSES.forEach((s) => (SL[s.v] = s.l));

const RESULTS = [
  { v: "pass", l: "PASS", c: "#16a34a", i: "✓" },
  { v: "fail", l: "FAIL", c: "#dc2626", i: "✗" },
  { v: "na", l: "N/A", c: "#94a3b8", i: "—" },
  { v: "flag", l: "FLAG", c: "#f59e0b", i: "⚠" },
];
const INSP_TYPES = [
  { v: "incoming", l: "Incoming" },
  { v: "pre_refurb", l: "Pre-Refurb" },
  { v: "post_refurb", l: "Post-Refurb" },
  { v: "outgoing", l: "Outgoing" },
];
const SECTIONS = [
  {
    s: "Visual / Physical",
    items: [
      "Enclosure condition (dents, rust, corrosion)",
      "Door latches, hinges, hardware functional",
      "Gaskets and seals intact",
      "Mounting hardware present and secure",
      "No water damage or moisture",
      "No overheating, arcing, or burn marks",
      "Interior clean, free of debris",
      "All covers and barriers in place",
      "Nameplates and labels legible",
      "Cable entry points sealed",
    ],
  },
  {
    s: "Bus Bars",
    items: [
      "Bus bars good condition (no pitting, warping)",
      "Bus bar insulation / coating intact",
      "Phase ID correct (A/B/C)",
      "Ground bus present and bonded",
      "Neutral bus properly terminated",
      "Bus bar hardware corrosion-free",
    ],
  },
  {
    s: "Lugs & Terminations",
    items: [
      "Lug type and size correct",
      "Lug crimps secure (no loose barrels)",
      "No heat damage / discoloration on lugs",
      "Anti-oxidant on aluminum connections",
      "Wire gauge matched to lug rating",
      "Set screw lugs to spec",
      "Mechanical lugs no cracks",
      "Landing pads clean, no oxidation",
    ],
  },
  {
    s: "Electrical Testing",
    items: [
      "Megger test performed",
      "Megger readings acceptable",
      "Contact resistance (micro-ohm) tested",
      "Hi-pot test (if applicable)",
      "Continuity all circuits",
      "Ground fault path verified",
      "Voltage verified vs nameplate",
      "Amperage verified vs nameplate",
    ],
  },
  {
    s: "Breakers / Switching",
    items: [
      "Breakers operate freely",
      "Trip unit functional",
      "Arc chutes present, good condition",
      "Breaker contacts good (no pitting)",
      "Mounting / stabs secure",
      "Correct frame size and trip rating",
      "Phasing correct",
      "Shunt trip OK (if equipped)",
      "Aux contacts OK (if equipped)",
    ],
  },
  {
    s: "Mechanical",
    items: [
      "Operating mechanism functional",
      "Interlocks operational",
      "Key interlocks verified",
      "Draw-out mechanism OK",
      "Spring charging OK",
      "Racking mechanism smooth",
      "Fan / ventilation OK",
      "Handles, latching hardware tight",
    ],
  },
  {
    s: "Safety & Compliance",
    items: [
      "Arc flash labels current",
      "Warning labels in place",
      "NFPA 70B compliance",
      "UL / CSA listing verified",
      "PPE requirements posted",
      "LOTO provisions functional",
      "Equipment grounding verified",
    ],
  },
  {
    s: "Final / Cosmetic",
    items: [
      "Cleaned inside and out",
      "Touch-up paint applied",
      "Hardin inventory label applied",
      "Serial number tag verified",
      "Photos taken and filed",
      "Shipping prep (if outgoing)",
    ],
  },
];

const today = () => new Date().toISOString().slice(0, 10);

/* ── Styles ────────────────────────────────────────────── */
const inputBase = {
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid #d1d5db",
  borderRadius: 10,
  fontSize: 16,
  background: "#fff",
  color: "#111",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  WebkitAppearance: "none",
};
const inputSm = { ...inputBase, fontSize: 14, padding: "10px 12px" };
const card = {
  background: "#fff",
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

/* ── Collapsible ───────────────────────────────────────── */
function Section({ title, children, badge, defaultOpen = false, color = "#475569", count, countColor }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          width: "100%", padding: "10px 12px", borderRadius: 8,
          border: "1px solid #e5e7eb", background: open ? "#f8fafc" : "#fff",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color }}>
          {open ? "▾" : "▸"} {title}{badge ? ` (${badge})` : ""}
        </span>
        {count != null && count > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
            background: (countColor || color) + "18", color: countColor || color,
          }}>{count}</span>
        )}
      </button>
      {open && <div style={{ padding: "10px 0 0" }}>{children}</div>}
    </div>
  );
}

/* ── Photo helper ──────────────────────────────────────── */
function compressImage(file, maxDim = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ── PWA install hook ──────────────────────────────────── */
function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua) && !window.MSStream);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const installed = () => setDeferredPrompt(null);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  };

  return { deferredPrompt, isStandalone, isIOS, promptInstall };
}

function InstallModal({ onClose, isIOS, deferredPrompt, promptInstall }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, padding: 20, maxWidth: 420, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LogoMark size={24} />
            <div style={{ fontSize: 16, fontWeight: 800, color: "#565756" }}>Install Hardin QC</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>

        {isIOS && (
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>iPhone / iPad (Safari)</div>
            <ol style={{ paddingLeft: 18, margin: 0 }}>
              <li>Open this page in <b>Safari</b> (not Chrome).</li>
              <li>Tap the <b>Share</b> icon (square with arrow up) in the bottom toolbar.</li>
              <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
              <li>Tap <b>Add</b> in the top right.</li>
            </ol>
            <div style={{ marginTop: 12, padding: 10, background: "#f1f5f9", borderRadius: 8, fontSize: 11, color: "#64748b" }}>
              The icon will appear on your home screen and behave like a native app.
            </div>
          </div>
        )}

        {!isIOS && deferredPrompt && (
          <div>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 14, lineHeight: 1.5 }}>
              Install the QC app on this device for faster access, full-screen mode, and a home-screen icon.
            </div>
            <button
              onClick={async () => { await promptInstall(); onClose(); }}
              style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#3d5e3f", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}
            >
              📲 Install Now
            </button>
          </div>
        )}

        {!isIOS && !deferredPrompt && (
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>Android (Chrome)</div>
            <ol style={{ paddingLeft: 18, margin: 0 }}>
              <li>Tap the <b>menu</b> (three dots, top right) in Chrome.</li>
              <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
              <li>Tap <b>Install</b> to confirm.</li>
            </ol>
            <div style={{ marginTop: 14, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>Desktop (Chrome / Edge)</div>
            <ol style={{ paddingLeft: 18, margin: 0 }}>
              <li>Click the <b>install icon</b> (⊕ or computer-with-arrow) in the address bar.</li>
              <li>Click <b>Install</b>.</li>
            </ol>
            <div style={{ marginTop: 12, padding: 10, background: "#fef3c7", borderRadius: 8, fontSize: 11, color: "#92400e" }}>
              If the install option does not appear, refresh the page once and try again. Some browsers require a few seconds before the install prompt is available.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Draft persistence (localStorage) ──────────────────── */
const DRAFT_PREFIX = "hardin_qc_draft:";
const draftKey = (itemId) => `${DRAFT_PREFIX}${itemId || "manual"}`;
const saveDraft = (itemId, data) => {
  try {
    localStorage.setItem(draftKey(itemId), JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch (e) {}
};
const loadDraft = (itemId) => {
  try {
    const raw = localStorage.getItem(draftKey(itemId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
};
const clearDraft = (itemId) => {
  try { localStorage.removeItem(draftKey(itemId)); } catch (e) {}
};
const listDrafts = () => {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(DRAFT_PREFIX)) {
        const id = k.slice(DRAFT_PREFIX.length);
        const raw = localStorage.getItem(k);
        if (raw) {
          try { out[id] = JSON.parse(raw); } catch (e) {}
        }
      }
    }
  } catch (e) {}
  return out;
};

/* ── Main App ──────────────────────────────────────────── */
function QCApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState("inventory");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* ── Install prompt ── */
  const { deferredPrompt, isStandalone, isIOS, promptInstall } = useInstallPrompt();
  const [showInstall, setShowInstall] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem("hardin_install_dismissed") === "1") setInstallDismissed(true);
    } catch (e) {}
  }, []);

  /* ── Drafts ── */
  const [drafts, setDrafts] = useState({});
  useEffect(() => { setDrafts(listDrafts()); }, []);

  /* ── Inventory load ── */
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sb("inventory_items?select=*&order=created_at.desc&limit=200");
      if (data) setItems(data);
    } catch (e) {}
    setLoading(false);
  }, []);
  useEffect(() => { loadItems(); }, [loadItems]);

  /* ── Orders ── */
  const [orders, setOrders] = useState([]);
  const loadOrders = useCallback(async () => {
    try {
      const data = await sb("orders?select=*&order=created_at.desc&limit=50");
      if (data) setOrders(data);
    } catch (e) {}
  }, []);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  /* ── Active item (from inventory) ── */
  const [activeItem, setActiveItem] = useState(null);

  /* ── Equipment form state ── */
  const [equip, setEquip] = useState({
    equipmentType: "", manufacturer: "", modelNumber: "", serialNumber: "",
    voltageRating: "", amperageRating: "", kvaRating: "", catalogNumber: "",
    jobSite: "", customerName: "", sourceLocation: "",
  });
  const setE = (k, v) => setEquip((p) => ({ ...p, [k]: v }));

  /* ── Inspector / meta ── */
  const [meta, setMeta] = useState({
    inspectedBy: "", inspectionDate: today(), inspectionType: "incoming", notes: "",
  });
  const [checks, setChecks] = useState([]);
  const [megger, setMegger] = useState({
    aToB: "", bToC: "", cToA: "", aToG: "", bToG: "", cToG: "", testV: "1000",
  });
  const [torques, setTorques] = useState([]);
  const [deficiencies, setDeficiencies] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [stickerNum, setStickerNum] = useState("");
  const [orderNum, setOrderNum] = useState("");
  const [invoiceNum, setInvoiceNum] = useState("");

  /* ── History ── */
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [expandedHist, setExpandedHist] = useState(null);
  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const data = await sb("qc_inspections?select=*&order=created_at.desc&limit=100");
      if (data) setHistory(data);
    } catch (e) {}
    setHistLoading(false);
  }, []);

  /* ── Draft autosave (debounced) ── */
  useEffect(() => {
    if (tab !== "inspect") return;
    const id = activeItem?.id || "manual";
    // Only save if something has actually been entered to avoid empty drafts
    const hasContent =
      meta.inspectedBy ||
      checks.some((c) => c.result !== "not_checked") ||
      deficiencies.length > 0 ||
      photos.length > 0 ||
      Object.entries(megger).some(([k, v]) => v && k !== "testV") ||
      torques.some((t) => t.actual) ||
      meta.notes ||
      stickerNum ||
      orderNum ||
      invoiceNum ||
      (!activeItem && (equip.equipmentType || equip.serialNumber));
    if (!hasContent) return;
    const t = setTimeout(() => {
      saveDraft(activeItem?.id, {
        activeItemId: activeItem?.id || null,
        equip, meta, checks, megger, torques, deficiencies, photos,
        stickerNum, orderNum, invoiceNum,
      });
      setDrafts((p) => ({ ...p, [id]: { savedAt: Date.now() } }));
    }, 800);
    return () => clearTimeout(t);
  }, [tab, activeItem, equip, meta, checks, megger, torques, deficiencies, photos, stickerNum, orderNum, invoiceNum]);

  /* ── Resume manual draft ── */
  const resumeManualDraft = () => {
    const draft = loadDraft(null);
    if (!draft) return;
    setActiveItem(null);
    setEquip(draft.equip || {});
    setMeta(draft.meta || { inspectedBy: "", inspectionDate: today(), inspectionType: "incoming", notes: "" });
    setChecks(draft.checks && draft.checks.length ? draft.checks : initChecks());
    setMegger(draft.megger || { aToB: "", bToC: "", cToA: "", aToG: "", bToG: "", cToG: "", testV: "1000" });
    setTorques(draft.torques || []);
    setDeficiencies(draft.deficiencies || []);
    setPhotos(draft.photos || []);
    setStickerNum(draft.stickerNum || "");
    setOrderNum(draft.orderNum || "");
    setInvoiceNum(draft.invoiceNum || "");
    setToast({ t: "success", m: "Resumed manual draft" });
    setTab("inspect");
  };

  const discardManualDraft = () => {
    clearDraft(null);
    setDrafts((p) => { const n = { ...p }; delete n.manual; return n; });
    setToast({ t: "success", m: "Manual draft discarded" });
  };

  /* ── Checklist init ── */
  const initChecks = () =>
    SECTIONS.flatMap((sec, si) =>
      sec.items.map((item, ii) => ({
        section: sec.s, checkItem: item, result: "not_checked", notes: "", sort: si * 100 + ii,
      }))
    );

  /* ── Torque specs loader ── */
  const loadTorqueSpecs = useCallback(async (mfr, eqType) => {
    try {
      const rows = await sb("torque_specs?select=*&order=connection_point");
      if (rows) {
        const filtered = rows.filter((r) => {
          const mfrMatch = !r.manufacturer || r.manufacturer === mfr;
          const typeMatch = !r.equipment_type || (eqType || "").toLowerCase().includes((r.equipment_type || "").toLowerCase());
          return mfrMatch && typeMatch;
        });
        const best = {};
        filtered.forEach((r) => {
          const k = r.connection_point;
          if (!best[k] || r.manufacturer) best[k] = r;
        });
        setTorques(
          Object.values(best).map((r) => ({
            loc: r.connection_point, boltSize: r.bolt_size || "",
            spec: String(r.spec_ft_lbs), specHigh: r.spec_range_high ? String(r.spec_range_high) : "",
            actual: "", pass: null,
          }))
        );
      }
    } catch (e) {}
  }, []);

  /* ── Start QC from inventory item ── */
  const startQCFromItem = async (item) => {
    setActiveItem(item);
    const draft = loadDraft(item.id);
    if (draft) {
      // Restore previous in-progress inspection
      setEquip(draft.equip || {
        equipmentType: item.equipment_type || "", manufacturer: item.manufacturer || "",
        modelNumber: item.model_number || "", serialNumber: item.serial_number || "",
        voltageRating: item.voltage_rating || "", amperageRating: item.amperage_rating || "",
        kvaRating: item.kva_rating || "", catalogNumber: item.catalog_number || "",
        jobSite: item.source_job_site || "", customerName: item.customer_origin || "",
        sourceLocation: item.location || "",
      });
      setMeta(draft.meta || { inspectedBy: "", inspectionDate: today(), inspectionType: "incoming", notes: "" });
      setChecks(draft.checks && draft.checks.length ? draft.checks : initChecks());
      setMegger(draft.megger || { aToB: "", bToC: "", cToA: "", aToG: "", bToG: "", cToG: "", testV: "1000" });
      setTorques(draft.torques || []);
      setDeficiencies(draft.deficiencies || []);
      setPhotos(draft.photos || []);
      setStickerNum(draft.stickerNum || "");
      setOrderNum(draft.orderNum || "");
      setInvoiceNum(draft.invoiceNum || "");
      // Reload torque specs in background if draft has none
      if (!draft.torques || draft.torques.length === 0) {
        loadTorqueSpecs(item.manufacturer, item.equipment_type);
      }
      setToast({ t: "success", m: "Resumed in-progress inspection" });
    } else {
      setEquip({
        equipmentType: item.equipment_type || "", manufacturer: item.manufacturer || "",
        modelNumber: item.model_number || "", serialNumber: item.serial_number || "",
        voltageRating: item.voltage_rating || "", amperageRating: item.amperage_rating || "",
        kvaRating: item.kva_rating || "", catalogNumber: item.catalog_number || "",
        jobSite: item.source_job_site || "", customerName: item.customer_origin || "",
        sourceLocation: item.location || "",
      });
      resetInspection(item.manufacturer, item.equipment_type);
    }
    if (item.status !== "in_qc") {
      try {
        await sb(`inventory_items?id=eq.${item.id}`, {
          method: "PATCH", body: JSON.stringify({ status: "in_qc" }),
        });
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "in_qc" } : i)));
      } catch (e) {}
    }
    setTab("inspect");
  };

  const resetInspection = (mfr, eqType) => {
    setChecks(initChecks());
    setMegger({ aToB: "", bToC: "", cToA: "", aToG: "", bToG: "", cToG: "", testV: "1000" });
    setDeficiencies([]);
    setPhotos([]);
    setStickerNum("");
    setOrderNum("");
    setInvoiceNum("");
    setMeta({ inspectedBy: "", inspectionDate: today(), inspectionType: "incoming", notes: "" });
    loadTorqueSpecs(mfr, eqType);
  };

  /* ── Status change helper ── */
  const changeStatus = async (id, status, extra = {}) => {
    try {
      await sb(`inventory_items?id=eq.${id}`, {
        method: "PATCH", body: JSON.stringify({ status, ...extra }),
      });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status, ...extra } : i)));
      setToast({ t: "success", m: `${SL[status] || status}` });
    } catch (e) {
      setToast({ t: "error", m: e.message });
    }
  };

  /* ── Photo upload ── */
  const handlePhoto = async (file) => {
    if (!file) return;
    const dataUrl = await compressImage(file);
    let url = dataUrl;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const name = `qc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const res = await fetch(`${SB_URL}/storage/v1/object/item-photos/${name}`, {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (res.ok) url = `${SB_URL}/storage/v1/object/public/item-photos/${name}`;
    } catch (e) {}
    setPhotos((p) => [...p, url]);
  };

  /* ── Save inspection ── */
  const saveInspection = async (result) => {
    if (!meta.inspectedBy) {
      setToast({ t: "error", m: "Inspector name required" });
      return;
    }
    setSaving(true);
    const inspId = `QC-${Date.now().toString(36).toUpperCase()}`;
    try {
      await sb("qc_inspections", {
        method: "POST",
        body: JSON.stringify({
          id: inspId,
          equipment_type: equip.equipmentType,
          manufacturer: equip.manufacturer,
          model_number: equip.modelNumber,
          serial_number: equip.serialNumber,
          voltage_rating: equip.voltageRating,
          amperage_rating: equip.amperageRating,
          job_site: equip.jobSite,
          customer_name: equip.customerName,
          source_location: equip.sourceLocation,
          inspected_by: meta.inspectedBy,
          inspection_date: meta.inspectionDate,
          inspection_type: meta.inspectionType,
          overall_result: result,
          notes: meta.notes,
          photos_count: photos.length,
          sticker_number: stickerNum || null,
          sticker_signed_by: meta.inspectedBy,
          sticker_date: stickerNum ? meta.inspectionDate : null,
          invoice_number: invoiceNum || null,
          qb_sync_status: "pending",
        }),
      });

      // Save checklist items
      const checkRows = checks
        .filter((c) => c.result !== "not_checked")
        .map((c) => ({
          inspection_id: inspId, section: c.section, check_item: c.checkItem,
          result: c.result, notes: c.notes || null, sort_order: c.sort,
        }));
      if (checkRows.length) await sb("qc_checklist_items", { method: "POST", body: JSON.stringify(checkRows) });

      // Save deficiencies
      if (activeItem) {
        const defRows = deficiencies
          .filter((d) => d.description)
          .map((d) => ({
            inventory_id: activeItem.id, category: d.category || "General",
            description: d.description, severity: d.severity || "moderate",
            repair_needed: d.repairNeeded || false,
            repair_estimate: d.repairEstimate ? parseFloat(d.repairEstimate) : null,
          }));
        if (defRows.length) await sb("inventory_deficiencies", { method: "POST", body: JSON.stringify(defRows) });
      }

      // Save photos
      if (photos.length) {
        const photoRows = photos.map((url) => ({
          reference_id: inspId, reference_type: "qc_inspection",
          photo_url: url, taken_by: meta.inspectedBy,
        }));
        await sb("item_photos", { method: "POST", body: JSON.stringify(photoRows) });
      }

      // Update inventory item
      if (activeItem) {
        const patch = {
          status: { pass: "qc_pass", fail: "qc_fail", conditional: "conditional" }[result] || "qc_pass",
          qc_inspection_id: inspId, qc_result: result,
          qc_date: meta.inspectionDate, qc_by: meta.inspectedBy,
          qc_sticker: stickerNum || null,
        };
        if (orderNum) patch.order_number = orderNum;
        if (invoiceNum) patch.invoice_number = invoiceNum;
        await sb(`inventory_items?id=eq.${activeItem.id}`, { method: "PATCH", body: JSON.stringify(patch) });
        setItems((prev) => prev.map((i) => (i.id === activeItem.id ? { ...i, ...patch } : i)));
      }

      setToast({ t: "success", m: `QC ${result.toUpperCase()} saved - ${inspId}` });
      // Clear draft now that it is saved to DB
      const draftId = activeItem?.id || "manual";
      clearDraft(activeItem?.id);
      setDrafts((p) => { const n = { ...p }; delete n[draftId]; return n; });
      setTab("inventory");
      loadItems();
    } catch (e) {
      setToast({ t: "error", m: "Save failed: " + e.message });
    }
    setSaving(false);
  };

  /* ── Checklist helpers ── */
  const setCheck = (idx, key, val) =>
    setChecks((prev) => prev.map((c, i) => (i === idx ? { ...c, [key]: val } : c)));
  const sectionChecks = (s) => checks.filter((c) => c.section === s);
  const sectionBadge = (s) => {
    const sc = sectionChecks(s);
    return `${sc.filter((c) => c.result !== "not_checked").length}/${sc.length}`;
  };
  const sectionColor = (s) => {
    const sc = sectionChecks(s);
    if (sc.some((c) => c.result === "fail")) return "#dc2626";
    if (sc.some((c) => c.result === "flag")) return "#f59e0b";
    if (sc.every((c) => c.result === "pass" || c.result === "na")) return "#16a34a";
    return "#475569";
  };

  /* ── Filtered inventory ── */
  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [item.serial_number, item.model_number, item.manufacturer, item.equipment_type, item.catalog_number, item.barcode_sku, item.id]
      .some((f) => f && String(f).toLowerCase().includes(q));
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ───────────────────────────────────────────────────── */
  /* ── RENDER ── */
  /* ───────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16, fontFamily: "-apple-system,system-ui,sans-serif", background: "#f1f5f9", minHeight: "100vh" }}>

      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "12px 0", borderBottom: "3px solid #58815a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark size={28} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#565756", letterSpacing: 2 }}>HARDIN</div>
            <div style={{ fontSize: 9, color: "#58815a", fontWeight: 700, letterSpacing: 1.5 }}>QUALITY CONTROL</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {!isStandalone && (
            <button onClick={() => setShowInstall(true)} title="Install app" style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: "#fffbeb", color: "#92400e", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📲</button>
          )}
          {[
            { k: "inventory", l: "📦" },
            { k: "form", l: "+" },
            { k: "history", l: "📋" },
          ].map((b) => (
            <button key={b.k} onClick={() => { setTab(b.k); if (b.k === "history") loadHistory(); if (b.k === "inventory") loadItems(); }}
              style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: tab === b.k ? "#3d5e3f" : "#e2e8f0", color: tab === b.k ? "#fff" : "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {b.l}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ padding: 12, background: toast.t === "error" ? "#fef2f2" : "#ecfdf5", border: `1px solid ${toast.t === "error" ? "#fecaca" : "#a7f3d0"}`, borderRadius: 10, color: toast.t === "error" ? "#dc2626" : "#065f46", fontSize: 13, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
          <span>{toast.m}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", fontWeight: 700, cursor: "pointer", color: "inherit" }}>×</button>
        </div>
      )}

      {/* Install banner */}
      {!isStandalone && !installDismissed && tab === "inventory" && (
        <div style={{ background: "linear-gradient(135deg, #3d5e3f 0%, #58815a 100%)", color: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>📲 Install on this device</div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                {isIOS ? "iPhone / iPad: tap for setup steps" : "Add to home screen for one-tap access"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setShowInstall(true)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#fff", color: "#3d5e3f", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Install</button>
              <button onClick={() => {
                setInstallDismissed(true);
                try { localStorage.setItem("hardin_install_dismissed", "1"); } catch (e) {}
              }} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", borderRadius: 8 }}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* Install modal */}
      {showInstall && (
        <InstallModal
          onClose={() => setShowInstall(false)}
          isIOS={isIOS}
          deferredPrompt={deferredPrompt}
          promptInstall={promptInstall}
        />
      )}

      {/* ── MANUAL ENTRY TAB ── */}
      {tab === "form" && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>New QC Inspection (Manual Entry)</div>
          {drafts.manual && (
            <div style={{ ...card, background: "#fffbeb", border: "1.5px solid #fde68a", padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>↻ Manual draft in progress</div>
              <div style={{ fontSize: 10, color: "#92400e", marginBottom: 8 }}>
                Last saved: {new Date(drafts.manual.savedAt).toLocaleString()}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={resumeManualDraft} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Resume Draft</button>
                <button onClick={discardManualDraft} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Discard</button>
              </div>
            </div>
          )}
          <div style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Equipment Type *</label>
                <select style={inputSm} value={equip.equipmentType} onChange={(e) => setE("equipmentType", e.target.value)}>
                  <option value="">Select</option>
                  {EQUIP_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Manufacturer</label>
                <select style={inputSm} value={equip.manufacturer} onChange={(e) => setE("manufacturer", e.target.value)}>
                  <option value="">Select</option>
                  {MFRS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>S/N</label><input style={inputSm} value={equip.serialNumber} onChange={(e) => setE("serialNumber", e.target.value)} /></div>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Model</label><input style={inputSm} value={equip.modelNumber} onChange={(e) => setE("modelNumber", e.target.value)} /></div>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Cat #</label><input style={inputSm} value={equip.catalogNumber} onChange={(e) => setE("catalogNumber", e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Amps</label><input style={inputSm} value={equip.amperageRating} onChange={(e) => setE("amperageRating", e.target.value)} /></div>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Volts</label><input style={inputSm} value={equip.voltageRating} onChange={(e) => setE("voltageRating", e.target.value)} /></div>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>KVA</label><input style={inputSm} value={equip.kvaRating} onChange={(e) => setE("kvaRating", e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Job Site</label><input style={inputSm} value={equip.jobSite} onChange={(e) => setE("jobSite", e.target.value)} placeholder="Origin" /></div>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Customer</label><input style={inputSm} value={equip.customerName} onChange={(e) => setE("customerName", e.target.value)} /></div>
            </div>
            {/* Date, Invoice, Order */}
            <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#0369a1" }}>Inspection Date</label>
              <input style={{ ...inputSm, border: "1.5px solid #7dd3fc", fontWeight: 700, fontSize: 16 }} type="date" value={meta.inspectionDate} onChange={(e) => setMeta((p) => ({ ...p, inspectionDate: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Invoice #</label><input style={inputSm} value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} placeholder="INV-001" /></div>
              <div><label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Order / PO #</label><input style={inputSm} value={orderNum} onChange={(e) => setOrderNum(e.target.value)} placeholder="PO-001" /></div>
            </div>
            <button onClick={() => {
              if (!equip.equipmentType) { setToast({ t: "error", m: "Equipment type required" }); return; }
              setActiveItem(null);
              const keepInv = invoiceNum;
              const keepOrd = orderNum;
              const keepDate = meta.inspectionDate;
              resetInspection(equip.manufacturer, equip.equipmentType);
              setInvoiceNum(keepInv);
              setOrderNum(keepOrd);
              setMeta((p) => ({ ...p, inspectionDate: keepDate }));
              setTab("inspect");
            }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#3d5e3f", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
              Start Inspection
            </button>
          </div>
        </div>
      )}

      {/* ── INVENTORY TAB ── */}
      {tab === "inventory" && (
        <div>
          {/* In-progress drafts banner */}
          {Object.keys(drafts).filter((k) => k !== "manual").length > 0 && (
            <div style={{ ...card, background: "#fffbeb", border: "1.5px solid #fde68a", padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#92400e", marginBottom: 6 }}>
                ↻ {Object.keys(drafts).filter((k) => k !== "manual").length} in-progress inspection(s)
              </div>
              <div style={{ fontSize: 10, color: "#92400e" }}>
                Look for the orange <b>Resume</b> button on items below to continue.
              </div>
            </div>
          )}
          <input style={{ ...inputBase, marginBottom: 8 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search S/N, model, SKU..." />
          <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
            {[{ v: "", l: "All" }, { v: "received", l: "Received" }, { v: "in_qc", l: "In QC" }, { v: "qc_pass", l: "Passed" }, { v: "qc_fail", l: "Failed" }, { v: "ready", l: "Ready" }, { v: "staged_for_ship", l: "Staged" }, { v: "refurb", l: "Refurb" }].map((f) => (
              <button key={f.v} onClick={() => setStatusFilter(f.v)} style={{
                padding: "6px 10px", borderRadius: 8,
                border: `1.5px solid ${statusFilter === f.v ? SC[f.v] || "#3d5e3f" : "#e2e8f0"}`,
                background: statusFilter === f.v ? (SC[f.v] || "#3d5e3f") + "15" : "#fff",
                color: statusFilter === f.v ? SC[f.v] || "#3d5e3f" : "#94a3b8",
                fontWeight: 700, fontSize: 10, cursor: "pointer", whiteSpace: "nowrap",
              }}>{f.l}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{filtered.length} items</div>

          {loading && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#475569" }}>No items</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Tap + for manual entry</div>
            </div>
          )}

          {filtered.map((item) => {
            const c = SC[item.status] || "#6b7280";
            return (
              <div key={item.id} style={{ ...card, borderLeft: `4px solid ${c}`, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>{item.equipment_type || "?"}</span>
                      {item.manufacturer && <span style={{ fontSize: 11, color: "#64748b" }}>{item.manufacturer}</span>}
                      <span style={{ padding: "2px 8px", borderRadius: 6, background: c + "18", color: c, fontSize: 9, fontWeight: 800 }}>{SL[item.status] || item.status}</span>
                      {item.qc_sticker && <span style={{ padding: "2px 6px", borderRadius: 6, background: "#16a34a18", color: "#16a34a", fontSize: 9, fontWeight: 700 }}>QC: {item.qc_sticker}</span>}
                      {item.order_number && <span style={{ padding: "2px 6px", borderRadius: 6, background: "#0369a118", color: "#0369a1", fontSize: 9, fontWeight: 700 }}>Order: {item.order_number}</span>}
                      {item.invoice_number && <span style={{ padding: "2px 6px", borderRadius: 6, background: "#7c3aed18", color: "#7c3aed", fontSize: 9, fontWeight: 700 }}>Inv: {item.invoice_number}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      {item.serial_number ? `S/N: ${item.serial_number}` : ""}
                      {item.amperage_rating ? ` ${item.amperage_rating}A` : ""}
                      {item.kva_rating ? ` ${item.kva_rating}KVA` : ""}
                      {item.voltage_rating ? ` ${item.voltage_rating}V` : ""}
                    </div>
                    {(item.putaway_location || item.barcode_sku) && (
                      <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                        {item.putaway_location && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#8b5cf618", color: "#8b5cf6", fontWeight: 600 }}>📍 {item.putaway_location}</span>}
                        {item.barcode_sku && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#f59e0b18", color: "#f59e0b", fontWeight: 600 }}>SKU: {item.barcode_sku}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(item.status === "received" || item.status === "in_qc") && (
                      drafts[item.id] ? (
                        <button onClick={() => startQCFromItem(item)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>↻ Resume</button>
                      ) : (
                        <button onClick={() => startQCFromItem(item)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#3d5e3f", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Start QC</button>
                      )
                    )}
                    {item.status === "qc_pass" && <button onClick={() => changeStatus(item.id, "ready")} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #16a34a", background: "#fff", color: "#16a34a", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>→ Ready</button>}
                    {item.status === "ready" && <button onClick={() => changeStatus(item.id, "staged_for_ship")} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #0891b2", background: "#fff", color: "#0891b2", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>→ Stage</button>}
                    {item.status === "staged_for_ship" && <button onClick={() => changeStatus(item.id, "shipped")} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #475569", background: "#fff", color: "#475569", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>→ Ship</button>}
                    {item.status === "qc_fail" && <button onClick={() => changeStatus(item.id, "refurb")} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #8b5cf6", background: "#fff", color: "#8b5cf6", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>→ Refurb</button>}
                  </div>
                </div>
                {!["received", "in_qc"].includes(item.status) && (
                  <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
                    {STATUSES.filter((s) => s.v !== item.status && ["received", "ready", "staged_for_ship", "refurb", "listed", "scrapped"].includes(s.v)).map((s) => (
                      <button key={s.v} onClick={() => changeStatus(item.id, s.v)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${s.c}22`, background: "#fff", color: s.c, fontWeight: 600, fontSize: 9, cursor: "pointer" }}>{s.l}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ textAlign: "center", padding: 12 }}>
            <button onClick={loadItems} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Refresh</button>
          </div>
        </div>
      )}

      {/* ── INSPECT TAB ── */}
      {tab === "inspect" && (
        <div>
          {/* Equipment header */}
          <div style={{ ...card, background: "#3d5e3f", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{equip.equipmentType}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {equip.manufacturer || ""} {equip.serialNumber ? `| S/N: ${equip.serialNumber}` : ""}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  {equip.amperageRating ? `${equip.amperageRating}A ` : ""}
                  {equip.kvaRating ? `${equip.kvaRating}KVA ` : ""}
                  {equip.voltageRating ? `${equip.voltageRating}V ` : ""}
                  {equip.catalogNumber ? `Cat: ${equip.catalogNumber}` : ""}
                </div>
              </div>
              {activeItem && (
                <div style={{ fontSize: 9, color: "#64748b", textAlign: "right" }}>
                  INV: {activeItem.id}<br />{activeItem.putaway_location || ""}
                </div>
              )}
            </div>
          </div>

          {/* Inspector Info */}
          <Section title="Inspector Info" defaultOpen={true} color="#3d5e3f">
            {/* Date prominent */}
            <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#0369a1" }}>Inspection Date</label>
              <input style={{ ...inputSm, border: "1.5px solid #7dd3fc", fontWeight: 700, fontSize: 16 }} type="date" value={meta.inspectionDate} onChange={(e) => setMeta((p) => ({ ...p, inspectionDate: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Inspector *</label>
                <input style={inputSm} value={meta.inspectedBy} onChange={(e) => setMeta((p) => ({ ...p, inspectedBy: e.target.value }))} placeholder="Name" />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Inspection Type</label>
                <div style={{ display: "flex", gap: 3 }}>
                  {INSP_TYPES.map((t) => (
                    <button key={t.v} onClick={() => setMeta((p) => ({ ...p, inspectionType: t.v }))} style={{
                      flex: 1, padding: "8px 0", borderRadius: 6,
                      border: `2px solid ${meta.inspectionType === t.v ? "#3d5e3f" : "#e2e8f0"}`,
                      background: meta.inspectionType === t.v ? "#3d5e3f" : "#fff",
                      color: meta.inspectionType === t.v ? "#fff" : "#94a3b8",
                      fontWeight: 700, fontSize: 9, cursor: "pointer",
                    }}>{t.l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Invoice #</label>
                <input style={inputSm} value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} placeholder="INV-001" />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Order #</label>
                <input style={inputSm} value={orderNum} onChange={(e) => setOrderNum(e.target.value)} placeholder="PO#" />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>QC Sticker #</label>
                <input style={inputSm} value={stickerNum} onChange={(e) => setStickerNum(e.target.value)} placeholder="QC-001" />
              </div>
            </div>
          </Section>

          {/* Checklist sections */}
          {SECTIONS.map((sec) => {
            const sc = sectionChecks(sec.s);
            const color = sectionColor(sec.s);
            return (
              <Section key={sec.s} title={sec.s} badge={sectionBadge(sec.s)} color={color} count={sc.filter((c) => c.result === "fail").length} countColor="#dc2626">
                {sc.map((c, ci) => {
                  const idx = checks.findIndex((ch) => ch.section === c.section && ch.checkItem === c.checkItem);
                  return (
                    <div key={ci} style={{
                      marginBottom: 8, padding: 10, borderRadius: 8,
                      background: c.result === "fail" ? "#fef2f215" : c.result === "flag" ? "#fef3c715" : "#fff",
                      border: `1px solid ${c.result === "fail" ? "#fecaca" : c.result === "flag" ? "#fde68a" : "#f1f5f9"}`,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>{c.checkItem}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {RESULTS.map((r) => (
                          <button key={r.v} onClick={() => setCheck(idx, "result", r.v)} style={{
                            flex: 1, padding: "8px 0", borderRadius: 6,
                            border: `2px solid ${c.result === r.v ? r.c : "#e5e7eb"}`,
                            background: c.result === r.v ? r.c + "15" : "#fff",
                            color: c.result === r.v ? r.c : "#cbd5e1",
                            fontWeight: 800, fontSize: 12, cursor: "pointer",
                          }}>{r.i} {r.l}</button>
                        ))}
                      </div>
                      {(c.result === "fail" || c.result === "flag") && (
                        <input style={{ ...inputSm, marginTop: 6, borderColor: c.result === "fail" ? "#fecaca" : "#fde68a" }}
                          value={c.notes} onChange={(e) => setCheck(idx, "notes", e.target.value)} placeholder="Notes..." />
                      )}
                    </div>
                  );
                })}
              </Section>
            );
          })}

          {/* Megger */}
          <Section title="Megger / Insulation Resistance" badge={Object.values(megger).filter((v) => v && v !== "1000").length > 0 ? "recorded" : ""} color="#7c3aed">
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>Test Voltage</label>
              <div style={{ display: "flex", gap: 4 }}>
                {["500", "1000", "2500", "5000"].map((v) => (
                  <button key={v} onClick={() => setMegger((p) => ({ ...p, testV: v }))} style={{
                    flex: 1, padding: "8px 0", borderRadius: 6,
                    border: `2px solid ${megger.testV === v ? "#7c3aed" : "#e5e7eb"}`,
                    background: megger.testV === v ? "#7c3aed15" : "#fff",
                    color: megger.testV === v ? "#7c3aed" : "#94a3b8",
                    fontWeight: 700, fontSize: 11, cursor: "pointer",
                  }}>{v}V</button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginTop: 8, marginBottom: 4 }}>Phase-to-Phase (MΩ)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              {[["A-B", "aToB"], ["B-C", "bToC"], ["C-A", "cToA"]].map(([label, key]) => (
                <div key={key}><label style={{ fontSize: 9, color: "#94a3b8" }}>{label}</label><input style={inputSm} value={megger[key]} onChange={(e) => setMegger((p) => ({ ...p, [key]: e.target.value }))} placeholder="MΩ" /></div>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 4 }}>Phase-to-Ground (MΩ)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[["A-G", "aToG"], ["B-G", "bToG"], ["C-G", "cToG"]].map(([label, key]) => (
                <div key={key}><label style={{ fontSize: 9, color: "#94a3b8" }}>{label}</label><input style={inputSm} value={megger[key]} onChange={(e) => setMegger((p) => ({ ...p, [key]: e.target.value }))} placeholder="MΩ" /></div>
              ))}
            </div>
          </Section>

          {/* Torque */}
          <Section title="Torque Verification" badge={torques.length > 0 ? `${torques.filter((t) => t.actual).length}/${torques.length}` : ""} color="#0369a1">
            {torques.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: 8 }}>No torque specs for this equipment.</div>}
            {torques.map((t, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 6, marginBottom: 6, alignItems: "end" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#475569" }}>{t.loc || "Custom"}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8" }}>{t.boltSize ? `${t.boltSize} ` : ""}{t.spec}{t.specHigh ? `-${t.specHigh}` : ""} ft-lbs</div>
                </div>
                <div>
                  <input style={{ ...inputSm, padding: "8px" }} value={t.actual} onChange={(e) => {
                    const n = [...torques]; n[i].actual = e.target.value;
                    n[i].pass = parseFloat(e.target.value) >= parseFloat(t.spec) && (!t.specHigh || parseFloat(e.target.value) <= parseFloat(t.specHigh));
                    setTorques(n);
                  }} placeholder="Actual" />
                </div>
                <div style={{ textAlign: "center" }}>
                  {t.actual && <span style={{ fontSize: 18, color: t.pass ? "#16a34a" : "#dc2626" }}>{t.pass ? "✓" : "✗"}</span>}
                </div>
              </div>
            ))}
            <button onClick={() => setTorques((p) => [...p, { loc: "", boltSize: "", spec: "", specHigh: "", actual: "", pass: null }])} style={{ padding: "6px 12px", borderRadius: 6, border: "1px dashed #94a3b8", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 10, cursor: "pointer", width: "100%" }}>+ Add Point</button>
          </Section>

          {/* Deficiencies */}
          <Section title="Deficiencies" badge={deficiencies.length || ""} color="#dc2626">
            {deficiencies.map((d, i) => (
              <div key={i} style={{ padding: 10, borderRadius: 8, border: "1px solid #fecaca", marginBottom: 6, background: "#fef2f2" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <select style={{ ...inputSm, flex: 1, padding: "8px" }} value={d.category} onChange={(e) => { const n = [...deficiencies]; n[i].category = e.target.value; setDeficiencies(n); }}>
                    <option value="">Category</option>
                    {["Cosmetic", "Structural", "Electrical", "Mechanical", "Safety", "Missing Part", "Other"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <select style={{ ...inputSm, flex: 1, padding: "8px" }} value={d.severity} onChange={(e) => { const n = [...deficiencies]; n[i].severity = e.target.value; setDeficiencies(n); }}>
                    {["minor", "moderate", "major", "critical"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => setDeficiencies((p) => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 18, cursor: "pointer" }}>×</button>
                </div>
                <input style={{ ...inputSm, marginBottom: 4 }} value={d.description} onChange={(e) => { const n = [...deficiencies]; n[i].description = e.target.value; setDeficiencies(n); }} placeholder="Describe..." />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    <input type="checkbox" checked={d.repairNeeded} onChange={(e) => { const n = [...deficiencies]; n[i].repairNeeded = e.target.checked; setDeficiencies(n); }} /> Repair
                  </label>
                  {d.repairNeeded && <input style={{ ...inputSm, width: 80, padding: "6px" }} type="number" value={d.repairEstimate || ""} onChange={(e) => { const n = [...deficiencies]; n[i].repairEstimate = e.target.value; setDeficiencies(n); }} placeholder="$" />}
                </div>
              </div>
            ))}
            <button onClick={() => setDeficiencies((p) => [...p, { category: "", description: "", severity: "moderate", repairNeeded: false, repairEstimate: "" }])} style={{ padding: 8, borderRadius: 6, border: "1px dashed #dc2626", background: "#fff", color: "#dc2626", fontWeight: 600, fontSize: 11, cursor: "pointer", width: "100%" }}>+ Deficiency</button>
          </Section>

          {/* Photos */}
          <Section title="Photos" badge={photos.length || ""} color="#475569">
            {photos.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", paddingBottom: 4 }}>
                {photos.map((url, i) => <img key={i} src={url} alt="" style={{ width: 70, height: 70, borderRadius: 8, objectFit: "cover", border: "2px solid #e5e7eb", flexShrink: 0 }} />)}
              </div>
            )}
            <label style={{ display: "block", padding: 12, borderRadius: 8, border: "1px dashed #94a3b8", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 12, textAlign: "center", cursor: "pointer" }}>
              📸 Add Photo
              <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhoto(e.target.files?.[0])} style={{ display: "none" }} />
            </label>
          </Section>

          {/* Notes */}
          <Section title="Notes" defaultOpen={false} color="#475569">
            <textarea style={{ ...inputSm, minHeight: 60, resize: "vertical" }} value={meta.notes} onChange={(e) => setMeta((p) => ({ ...p, notes: e.target.value }))} placeholder="General notes..." />
          </Section>

          {/* Summary / Save */}
          <div style={{ ...card, background: "#f8fafc", border: "2px solid #e2e8f0" }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
              {[
                { l: "Pass", c: "#16a34a", n: checks.filter((c) => c.result === "pass").length },
                { l: "Fail", c: "#dc2626", n: checks.filter((c) => c.result === "fail").length },
                { l: "Flag", c: "#f59e0b", n: checks.filter((c) => c.result === "flag").length },
                { l: "N/A", c: "#94a3b8", n: checks.filter((c) => c.result === "na").length },
              ].map((s) => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.n}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{s.l}</div>
                </div>
              ))}
            </div>
            {deficiencies.length > 0 && <div style={{ fontSize: 11, color: "#dc2626", marginBottom: 8, fontWeight: 600 }}>{deficiencies.length} deficiencies</div>}
            {(stickerNum || orderNum || invoiceNum) && (
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>
                {stickerNum ? `Sticker: ${stickerNum}` : ""}
                {stickerNum && orderNum ? " | " : ""}{orderNum ? `Order: ${orderNum}` : ""}
                {(stickerNum || orderNum) && invoiceNum ? " | " : ""}{invoiceNum ? `Invoice: ${invoiceNum}` : ""}
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={saving} onClick={() => saveInspection("pass")} style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>✓ PASS</button>
              <button disabled={saving} onClick={() => saveInspection("conditional")} style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "none", background: "#f59e0b", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>⚠ COND</button>
              <button disabled={saving} onClick={() => saveInspection("fail")} style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>✗ FAIL</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => {
                // Save & Exit: keep draft, keep in_qc status, just leave the screen
                setTab("inventory");
                setToast({ t: "success", m: "Draft saved. Resume from inventory." });
              }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1.5px solid #f59e0b", background: "#fffbeb", color: "#92400e", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>💾 Save & Exit</button>
              <button onClick={() => {
                if (!confirm("Discard this inspection? All entered data will be lost.")) return;
                const draftId = activeItem?.id || "manual";
                clearDraft(activeItem?.id);
                setDrafts((p) => { const n = { ...p }; delete n[draftId]; return n; });
                setTab("inventory");
                if (activeItem) changeStatus(activeItem.id, "received");
              }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Inspection History</div>
          {histLoading && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading...</div>}
          {!histLoading && history.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No inspections yet.</div>}
          {history.map((h) => {
            const c = h.overall_result === "pass" ? "#16a34a" : h.overall_result === "fail" ? "#dc2626" : "#f59e0b";
            const expanded = expandedHist === h.id;
            return (
              <div key={h.id} style={{ ...card, borderLeft: `4px solid ${c}`, padding: 14, cursor: "pointer" }} onClick={() => setExpandedHist(expanded ? null : h.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{h.equipment_type} {h.manufacturer || ""}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {h.serial_number ? `S/N: ${h.serial_number}` : ""} {h.amperage_rating ? `${h.amperage_rating}A` : ""}
                    </div>
                  </div>
                  <span style={{ padding: "4px 12px", borderRadius: 8, background: c + "18", color: c, fontWeight: 800, fontSize: 12 }}>
                    {(h.overall_result || "").toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                  {h.inspection_date} | {h.inspected_by} | {h.inspection_type}
                  {h.sticker_number ? ` | Sticker: ${h.sticker_number}` : ""}
                  {h.invoice_number ? ` | Inv: ${h.invoice_number}` : ""}
                  {h.qb_sync_status && h.qb_sync_status !== "pending" ? ` | QB: ${h.qb_sync_status}` : ""}
                </div>
                {h.notes && expanded && (
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 6, padding: 8, background: "#f8fafc", borderRadius: 6 }}>{h.notes}</div>
                )}
              </div>
            );
          })}
          <div style={{ textAlign: "center", padding: 12 }}>
            <button onClick={loadHistory} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Refresh</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QCApp;
