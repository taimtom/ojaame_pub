/** Maps nav permission keys / titles to Standard-only plan feature keys. */

export const NAV_PLAN_FEATURES = {
  'Service Log': 'service_log',
  'Usage dashboard': 'usage_dashboard',
  Inventory: 'store_transfers',
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
  'Balance Sheet': 'advanced_reports',
  'Trial Balance': 'advanced_reports',
  'Sales Trends': 'advanced_reports',
  'End of period': 'advanced_reports',
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
