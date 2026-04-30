"use client";
import { useEffect, useState } from "react";
import { loadInspectors, createInspector, setCurrentInspector } from "../lib/inspector";

const LogoMark = ({ size = 32, color = "#58815a" }) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 212 191" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M113.977 155.659C106.789 156.563 99.7953 156.218 93.1887 154.777C92.0481 154.518 91.4671 153.227 92.0266 152.194L98.0737 141.134C98.418 140.489 99.1497 140.144 99.8814 140.23C101.904 140.51 103.992 140.661 106.101 140.661C131.236 140.661 151.702 120.197 151.702 95.0634C151.702 89.813 150.798 84.7562 149.162 80.0652L124.5 125.34C124.199 125.899 123.618 126.222 122.994 126.222H109.243C107.951 126.222 107.134 124.845 107.736 123.704L116.28 108.039C116.602 107.436 116.172 106.726 115.483 106.726H90.1328C89.724 106.726 89.3581 106.942 89.1645 107.307L77.2209 129.234L70.313 141.801C69.7534 142.834 68.3762 143.135 67.4508 142.382C52.4083 130.052 43.3054 110.664 45.2637 89.2965C47.9752 59.9887 71.8839 36.4692 101.237 34.1883C109.587 33.5427 117.614 34.5756 125.038 37.0071C126.286 37.416 126.824 38.8792 126.2 40.0412L120.67 50.1118C120.196 50.994 119.185 51.3814 118.216 51.1231C111.61 49.2941 104.422 48.9068 96.9762 50.3915C78.0601 54.1572 63.3835 69.8871 60.8872 89.0168C59.553 99.2595 61.6619 108.964 66.2026 117.141L93.3824 67.2403C93.5976 66.8315 94.0495 66.5732 94.5014 66.5732H109.221C110.189 66.5732 110.814 67.6061 110.34 68.4669L98.8269 89.6193C98.418 90.3509 98.956 91.2332 99.7953 91.2332H124.931C125.253 91.2332 125.555 91.061 125.727 90.7598L139.995 64.5721L139.952 64.529L146.903 51.7687C147.29 51.0586 148.258 50.9079 148.839 51.4674C161.386 63.7544 168.681 81.3993 166.959 100.658C164.441 128.933 142.19 152.108 114.02 155.659H113.977Z" fill={color}/>
  </svg>
);

export default function InspectorGate({ onSelect, onCancel }) {
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await loadInspectors();
        setInspectors(list || []);
      } catch (e) {
        setError("Could not load inspector list. Add yourself manually below.");
      }
      setLoading(false);
    })();
  }, []);

  const select = (insp) => {
    setCurrentInspector(insp);
    onSelect(insp);
  };

  const addNew = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createInspector(newName);
      select(created);
    } catch (e) {
      setError("Could not save: " + e.message);
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "rgba(15,23,42,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      fontFamily: "-apple-system,system-ui,sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%",
        boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={36} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#565756", letterSpacing: 2 }}>HARDIN</div>
              <div style={{ fontSize: 9, color: "#58815a", fontWeight: 700, letterSpacing: 1.5 }}>QUALITY CONTROL</div>
            </div>
          </div>
          {onCancel && (
            <button onClick={onCancel} style={{
              background: "none", border: "none", fontSize: 22, color: "#94a3b8",
              cursor: "pointer", padding: 0, lineHeight: 1,
            }}>×</button>
          )}
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: "#1f2937", marginBottom: 4 }}>Who's inspecting?</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          Tap your name to sign in. Stays remembered on this device.
        </div>

        {error && (
          <div style={{ padding: 10, background: "#fef2f2", color: "#dc2626", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {loading && <div style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>Loading...</div>}

        {!loading && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {inspectors.map((i) => (
                <button key={i.id} onClick={() => select(i)} style={{
                  padding: 14, border: "1px solid #e2e8f0", borderRadius: 10, background: "#f8fafc",
                  textAlign: "left", cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#1f2937",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span>{i.name}</span>
                  {i.role === "admin" && (
                    <span style={{
                      fontSize: 9, padding: "2px 6px", borderRadius: 4,
                      background: "#58815a18", color: "#58815a", fontWeight: 700, letterSpacing: 1,
                    }}>ADMIN</span>
                  )}
                </button>
              ))}
              {inspectors.length === 0 && !loading && (
                <div style={{ padding: 14, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                  No inspectors found. Add one below.
                </div>
              )}
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
              {!adding ? (
                <button onClick={() => setAdding(true)} style={{
                  width: "100%", padding: 12, border: "1px dashed #94a3b8", borderRadius: 10,
                  background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>+ I'm new, add me</button>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Full name"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") addNew(); }}
                    style={{
                      flex: 1, padding: 12, border: "1px solid #d1d5db", borderRadius: 8,
                      fontSize: 14, boxSizing: "border-box",
                    }}
                  />
                  <button onClick={addNew} disabled={busy || !newName.trim()} style={{
                    padding: "12px 16px", border: "none", borderRadius: 8,
                    background: "#58815a", color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: busy ? "default" : "pointer", opacity: busy || !newName.trim() ? 0.5 : 1,
                  }}>{busy ? "..." : "Add"}</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
