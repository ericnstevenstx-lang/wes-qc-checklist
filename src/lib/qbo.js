// QuickBooks Online client.
// Handles OAuth 2.0 token exchange, refresh, invoice queries, and Attachable uploads.

import { sbServer } from "./sbServer";

const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer_token";
const QBO_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

function qboBase() {
  return process.env.QBO_ENV === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

function basicAuth() {
  const id = process.env.QBO_CLIENT_ID;
  const secret = process.env.QBO_CLIENT_SECRET;
  if (!id || !secret) throw new Error("QBO_CLIENT_ID / QBO_CLIENT_SECRET not set");
  return Buffer.from(`${id}:${secret}`).toString("base64");
}

function redirectUri() {
  const u = process.env.QBO_REDIRECT_URI;
  if (!u) throw new Error("QBO_REDIRECT_URI not set");
  return u;
}

/* ── OAuth flow ──────────────────────────────────────────── */

export function buildAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.QBO_CLIENT_ID,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: redirectUri(),
    state,
  });
  return `${QBO_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const r = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    }).toString(),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    const debug = {
      status: r.status,
      body: txt.slice(0, 300),
      tokenUrl: QBO_TOKEN_URL,
      redirectUriSent: redirectUri(),
      clientIdLen: (process.env.QBO_CLIENT_ID || "").length,
      clientSecretLen: (process.env.QBO_CLIENT_SECRET || "").length,
      qboEnv: process.env.QBO_ENV,
    };
    throw new Error(`TokenExchange:${JSON.stringify(debug)}`);
  }
  return await r.json();
}

async function refreshAccessToken(refresh_token) {
  const r = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }).toString(),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Refresh failed (${r.status}): ${txt}`);
  }
  return await r.json();
}

/* ── Token persistence (qbo_tokens, key='default') ──────── */

export async function saveTokens({ realmId, tokenResponse }) {
  const now = Date.now();
  const expiresAt = new Date(now + (tokenResponse.expires_in || 3600) * 1000).toISOString();
  const refreshExpiresAt = tokenResponse.x_refresh_token_expires_in
    ? new Date(now + tokenResponse.x_refresh_token_expires_in * 1000).toISOString()
    : null;

  const row = {
    key: "default",
    realm_id: realmId,
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    expires_at: expiresAt,
    refresh_token_expires_at: refreshExpiresAt,
    updated_at: new Date().toISOString(),
  };
  // Upsert via PostgREST: POST with Prefer: resolution=merge-duplicates
  await sbServer("qbo_tokens?on_conflict=key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
}

export async function loadTokens() {
  const rows = await sbServer("qbo_tokens?key=eq.default&select=*");
  return rows && rows[0] ? rows[0] : null;
}

export async function getValidAccessToken() {
  const tokens = await loadTokens();
  if (!tokens) throw new Error("QBO not connected");
  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at).getTime() : 0;
  // Refresh if less than 60 seconds of validity remain
  if (expiresAt - Date.now() > 60_000) {
    return { accessToken: tokens.access_token, realmId: tokens.realm_id };
  }
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  await saveTokens({
    realmId: tokens.realm_id,
    tokenResponse: {
      ...refreshed,
      // Some flows rotate refresh_token; some keep the same. Prefer new if returned.
      refresh_token: refreshed.refresh_token || tokens.refresh_token,
    },
  });
  return { accessToken: refreshed.access_token, realmId: tokens.realm_id };
}

/* ── Invoice query ──────────────────────────────────────── */

export async function findInvoiceByDocNumber(docNumber) {
  const { accessToken, realmId } = await getValidAccessToken();
  const escaped = String(docNumber).replace(/'/g, "\\'");
  const query = `SELECT * FROM Invoice WHERE DocNumber = '${escaped}'`;
  const url = `${qboBase()}/v3/company/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=70`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`QBO invoice query ${r.status}: ${txt}`);
  }
  const json = await r.json();
  return json?.QueryResponse?.Invoice?.[0] || null;
}

/**
 * Map a QBO Invoice to our internal lines shape used by InvoicePullModal.
 * Skips SubTotal lines and tax-only lines.
 */
export function mapQboInvoiceToLines(invoice) {
  if (!invoice) return null;
  const lines = (invoice.Line || [])
    .filter((l) => l.DetailType === "SalesItemLineDetail")
    .map((l) => {
      const detail = l.SalesItemLineDetail || {};
      return {
        description: l.Description || "",
        qty: detail.Qty || 1,
        unit_price: detail.UnitPrice,
        amount: l.Amount,
        item_ref: detail.ItemRef?.name || null,
      };
    });
  return {
    qboInvoiceId: invoice.Id,
    docNumber: invoice.DocNumber,
    customerName: invoice.CustomerRef?.name || "",
    txnDate: invoice.TxnDate,
    totalAmount: invoice.TotalAmt,
    lines,
  };
}

/* ── Attachable upload ──────────────────────────────────── */

/**
 * Attach a file (PDF) to a QBO Invoice.
 * Builds multipart/form-data manually because QBO requires specific structure.
 */
export async function attachFileToInvoice({
  invoiceId,
  fileName,
  fileBuffer,
  contentType = "application/pdf",
  includeOnSend = false,
}) {
  const { accessToken, realmId } = await getValidAccessToken();
  const url = `${qboBase()}/v3/company/${realmId}/upload?minorversion=70`;
  const boundary = "----HardinAttach" + Date.now() + Math.random().toString(36).slice(2, 8);

  const metadata = {
    AttachableRef: [
      {
        EntityRef: { type: "Invoice", value: String(invoiceId) },
        IncludeOnSend: includeOnSend,
      },
    ],
    FileName: fileName,
    ContentType: contentType,
  };

  const parts = [];
  parts.push(Buffer.from(`--${boundary}\r\n`));
  parts.push(Buffer.from(`Content-Disposition: form-data; name="file_metadata_01"\r\n`));
  parts.push(Buffer.from(`Content-Type: application/json\r\n\r\n`));
  parts.push(Buffer.from(JSON.stringify(metadata) + "\r\n"));
  parts.push(Buffer.from(`--${boundary}\r\n`));
  parts.push(
    Buffer.from(
      `Content-Disposition: form-data; name="file_content_01"; filename="${fileName}"\r\n`
    )
  );
  parts.push(Buffer.from(`Content-Type: ${contentType}\r\n\r\n`));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Attach failed (${r.status}): ${txt}`);
  }
  const json = await r.json();
  // Response contains AttachableResponse[].Attachable
  const attachable = json?.AttachableResponse?.[0]?.Attachable;
  if (!attachable) throw new Error("Attach response missing Attachable");
  return {
    id: attachable.Id,
    fileAccessUri: attachable.FileAccessUri || null,
    tempDownloadUri: attachable.TempDownloadUri || null,
  };
}

/**
 * Delete an existing Attachable. Used when re-syncing a stale attachment.
 */
export async function deleteAttachable(attachableId, syncToken = "0") {
  const { accessToken, realmId } = await getValidAccessToken();
  const url = `${qboBase()}/v3/company/${realmId}/attachable?operation=delete&minorversion=70`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ Id: String(attachableId), SyncToken: String(syncToken) }),
  });
  if (!r.ok) {
    // Non-fatal: the new attachment will exist alongside the stale one.
    // Log and continue rather than throwing.
    return { ok: false, status: r.status };
  }
  return { ok: true };
}
