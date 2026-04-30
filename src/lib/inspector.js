"use client";
import { sb } from "./sb";

const KEY_ID = "hardin_inspector_id";
const KEY_NAME = "hardin_inspector_name";
const KEY_ROLE = "hardin_inspector_role";

export function getCurrentInspector() {
  if (typeof window === "undefined") return null;
  try {
    const id = localStorage.getItem(KEY_ID);
    const name = localStorage.getItem(KEY_NAME);
    const role = localStorage.getItem(KEY_ROLE) || "inspector";
    if (id && name) return { id, name, role };
  } catch (e) {}
  return null;
}

export function setCurrentInspector(inspector) {
  try {
    localStorage.setItem(KEY_ID, inspector.id);
    localStorage.setItem(KEY_NAME, inspector.name);
    localStorage.setItem(KEY_ROLE, inspector.role || "inspector");
  } catch (e) {}
}

export function clearCurrentInspector() {
  try {
    localStorage.removeItem(KEY_ID);
    localStorage.removeItem(KEY_NAME);
    localStorage.removeItem(KEY_ROLE);
  } catch (e) {}
}

export async function loadInspectors() {
  return await sb("inspectors?select=*&active=eq.true&order=name.asc");
}

export async function createInspector(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new Error("Name required");
  const rows = await sb("inspectors", {
    method: "POST",
    body: JSON.stringify({ name: trimmed, role: "inspector" }),
  });
  return rows[0];
}

/**
 * Return true if the current inspector is allowed to edit this inspection.
 * Rules:
 *   - Owned by current inspector (inspector_id match), OR
 *   - Legacy row with no inspector_id whose inspected_by name matches, AND
 *   - Created within the last 24 hours.
 *   - Admin role can edit anything within the 24h window regardless of owner.
 */
export function canEditInspection(inspection, currentInspector) {
  if (!inspection || !currentInspector) return false;
  const createdAt = inspection.created_at ? new Date(inspection.created_at) : null;
  if (!createdAt) return false;
  const ageMs = Date.now() - createdAt.getTime();
  if (ageMs > 24 * 60 * 60 * 1000) return false;
  if (currentInspector.role === "admin") return true;
  if (inspection.inspector_id && inspection.inspector_id === currentInspector.id) return true;
  if (!inspection.inspector_id && inspection.inspected_by === currentInspector.name) return true;
  return false;
}

export function editWindowRemaining(inspection) {
  if (!inspection?.created_at) return null;
  const createdAt = new Date(inspection.created_at).getTime();
  const expires = createdAt + 24 * 60 * 60 * 1000;
  const remainingMs = expires - Date.now();
  if (remainingMs <= 0) return "expired";
  const hrs = Math.floor(remainingMs / (60 * 60 * 1000));
  const mins = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  return hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
}
