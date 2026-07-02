import { paramCase } from 'src/utils/change-case';

/** Parse numeric store id from route param like `great-store-ventures-17`. */
export function parseStoreId(storeParam) {
  if (!storeParam) return null;
  const raw = String(storeParam).split('-').pop();
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Read active workspace from localStorage. */
export function getActiveWorkspace() {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Resolve store id from route param or active workspace. */
export function resolveReportStoreId(storeParam) {
  const fromRoute = parseStoreId(storeParam);
  if (fromRoute) return fromRoute;

  const ws = getActiveWorkspace();
  if (ws?.id) {
    const id = Number(ws.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
  return null;
}

/**
 * Company id for company-scoped report APIs.
 * Prefer the store's company when workspace is set; fall back to the logged-in user.
 */
export function resolveReportCompanyId(userCompanyId, storeId) {
  const ws = getActiveWorkspace();
  if (storeId && ws?.id?.toString() === storeId.toString() && ws.company_id != null) {
    return Number(ws.company_id);
  }
  return userCompanyId ?? null;
}

/** Build store slug param for links when only id/name are known. */
export function buildStoreParam(storeName, storeId) {
  if (!storeName || !storeId) return null;
  return `${paramCase(storeName)}-${storeId}`;
}
