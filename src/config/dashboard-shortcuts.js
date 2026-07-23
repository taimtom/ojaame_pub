import { paramCase } from 'src/utils/change-case';

import { paths } from 'src/routes/paths';

import { isItemVisible } from 'src/config/nav-permissions';
import { isNavItemAllowedByPlan } from 'src/config/plan-features';

// ----------------------------------------------------------------------

const callIfFunction = (value, ...args) =>
  typeof value === 'function' ? value(...args) : value;

export function getCurrentStoreParam() {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const { storeName, id: storeId } = JSON.parse(raw);
      if (storeName && storeId) {
        return `${paramCase(storeName)}-${storeId}`;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Master shortcut definitions. Labels resolve at runtime via getNavLabel / t().
 */
export const DASHBOARD_SHORTCUT_DEFS = [
  {
    id: 'quick-dispatch',
    permissionKey: 'Quick Dashboard',
    labelKey: 'quickDashboard',
    icon: 'solar:bolt-bold',
    tone: 'sales',
    path: (store) => paths.dashboard.quickDashboard,
    primary: true,
  },
  {
    id: 'goods-received',
    permissionKey: 'Quick Restock',
    labelKey: 'quickRestock',
    icon: 'solar:box-bold',
    tone: 'inventory',
    path: () => paths.dashboard.quickRestock,
    primary: true,
  },
  {
    id: 'customers',
    permissionKey: 'Manage Customer',
    label: (t) => `Manage ${t('customer')}`,
    icon: 'solar:users-group-rounded-bold',
    tone: 'sales',
    path: (store) => callIfFunction(paths.dashboard.customer.root, store),
    primary: true,
  },
  {
    id: 'pos',
    permissionKey: 'Point of Sales',
    labelKey: 'pointOfSales',
    icon: 'solar:cart-large-bold',
    tone: 'sales',
    path: (store) => callIfFunction(paths.dashboard.pos.root, store),
  },
  {
    id: 'invoices',
    permissionKey: 'Sales Invoice',
    labelKey: 'salesInvoice',
    icon: 'solar:bill-list-bold',
    tone: 'finance',
    path: (store) => callIfFunction(paths.dashboard.invoice.root, store),
  },
  {
    id: 'products',
    permissionKey: 'Product Management',
    labelKey: 'productManagement',
    icon: 'solar:tag-price-bold',
    tone: 'inventory',
    path: (store) => callIfFunction(paths.dashboard.product.root, store),
  },
  {
    id: 'customer-report',
    permissionKey: 'Customer Report',
    label: () => 'Customer Report',
    icon: 'solar:chart-2-bold',
    tone: 'reports',
    path: (store) => callIfFunction(paths.dashboard.reports.customers, store),
  },
  {
    id: 'transfers',
    permissionKey: 'Store Transfers',
    labelKey: 'storeTransfers',
    icon: 'solar:transfer-horizontal-bold',
    tone: 'inventory',
    path: (store) => callIfFunction(paths.dashboard.transfer.root, store),
  },
  {
    id: 'consignment',
    permissionKey: 'Consignment',
    labelKey: 'consignment',
    icon: 'solar:box-minimalistic-bold',
    tone: 'inventory',
    path: (store) => callIfFunction(paths.dashboard.consignment.root, store),
  },
  {
    id: 'partner-report',
    permissionKey: 'Partner Report',
    labelKey: 'partnerReport',
    icon: 'solar:chart-square-bold',
    tone: 'reports',
    path: (store) => callIfFunction(paths.dashboard.reports.partners, store),
  },
  {
    id: 'service-log',
    permissionKey: 'Service Log',
    labelKey: 'serviceLog',
    icon: 'solar:clipboard-list-bold',
    tone: 'default',
    path: () => paths.dashboard.serviceLog,
  },
  {
    id: 'expenses',
    permissionKey: 'Expenses',
    label: () => 'Expenses',
    icon: 'solar:wallet-money-bold',
    tone: 'finance',
    path: (store) => callIfFunction(paths.dashboard.expense.root, store),
  },
];

const DEFAULT_ORDER = DASHBOARD_SHORTCUT_DEFS.map((item) => item.id);

function resolveLabel(def, t, getNavLabel) {
  if (def.labelKey) {
    return getNavLabel(def.labelKey);
  }
  if (typeof def.label === 'function') {
    return def.label(t, getNavLabel);
  }
  return def.id;
}

function isShortcutAllowed(def, userPermissions, hasPlanFeature) {
  const key = def.permissionKey || '';
  if (key && !isItemVisible(userPermissions, key)) {
    return false;
  }
  if (key && !isNavItemAllowedByPlan(key, hasPlanFeature)) {
    return false;
  }
  return true;
}

/**
 * Build filtered, resolved shortcuts for the store dashboard launcher.
 */
export function buildDashboardShortcuts({
  t,
  getNavLabel,
  userPermissions,
  hasPlanFeature,
  currentStore,
  preferredOrder,
}) {
  const order = preferredOrder?.length ? preferredOrder : DEFAULT_ORDER;
  const defsById = Object.fromEntries(DASHBOARD_SHORTCUT_DEFS.map((def) => [def.id, def]));

  const resolved = order
    .map((id) => defsById[id])
    .filter(Boolean)
    .filter((def) => isShortcutAllowed(def, userPermissions, hasPlanFeature))
    .map((def) => ({
      id: def.id,
      label: resolveLabel(def, t, getNavLabel),
      icon: def.icon,
      tone: def.tone || 'default',
      path: def.path(currentStore),
      primary: Boolean(def.primary),
    }))
    .filter((item) => Boolean(item.path));

  return {
    primary: resolved.filter((item) => item.primary),
    grid: resolved.filter((item) => !item.primary),
  };
}
