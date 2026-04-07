/**
 * Product movement rows shown under Usage History for production-input items:
 * manual usage (status usage) and BOM deductions (usage, or legacy sold + BOM note).
 */
export function isUsageHistoryMovement(row) {
  if (!row) return false;
  if (row.status === 'usage') return true;
  if (row.status === 'sold' && typeof row.description === 'string') {
    return row.description.includes('BOM consumption');
  }
  return false;
}
