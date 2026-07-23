/** Maps nav permission keys / titles to Standard-only plan feature keys. */

/**
 * When false (default), Basic sees all Standard features and can add stores.
 * Set VITE_PLAN_RESTRICTIONS_ENABLED=true to restore Basic vs Standard gating.
 */
const _FALSEY = new Set(['0', 'false', 'no', 'off', '']);

export function planRestrictionsEnabled() {
  const raw = import.meta.env.VITE_PLAN_RESTRICTIONS_ENABLED ?? 'false';
  return !_FALSEY.has(String(raw).trim().toLowerCase());
}

export const NAV_PLAN_FEATURES = {
  'Service Log': 'service_log',
  'Usage dashboard': 'usage_dashboard',
  Inventory: 'store_transfers',
  'Store Transfers': 'store_transfers',
  Consignment: 'consignment',
  'Partner Report': 'consignment',
  'Digital Product': 'digital_products',
  'Store Reports': null,
  'Essential Reports': null,
  'Advanced Reports': 'advanced_reports',
  'General Store Reports': null,
  'Inventory Report': null,
  'Financial Report': null,
  'Profit & Loss': 'advanced_reports',
  'Customer Report': null,
  'Cash Flow': 'advanced_reports',
  'Tax Estimates': 'advanced_reports',
  'VAT Return': 'advanced_reports',
  'Annual Tax Summary': 'advanced_reports',
  'Loans': 'advanced_reports',
  'Payroll': 'advanced_reports',
  'Withholding Tax': 'advanced_reports',
  'Balance Sheet': 'advanced_reports',
  'Trial Balance': 'advanced_reports',
  'Sales Trends': 'advanced_reports',
  'End of period': null,
  'Company Reports': 'company_reports',
  'All Company Reports': 'company_reports',
  Integrations: 'integrations',
  'Store Website': 'store_website',
};

export const STANDARD_ONLY_FEATURES = [
  'custom_roles',
  'advanced_reports',
  'company_reports',
  'store_transfers',
  'consignment',
  'integrations',
  'store_website',
  'digital_products',
  'finance_settings',
  'service_log',
  'usage_dashboard',
];

export function getNavPlanFeature(itemTitleOrKey) {
  return NAV_PLAN_FEATURES[itemTitleOrKey] ?? null;
}

export function isNavItemAllowedByPlan(itemTitleOrKey, hasPlanFeature) {
  const feature = getNavPlanFeature(itemTitleOrKey);
  if (!feature) {
    return true;
  }
  return hasPlanFeature(feature);
}
