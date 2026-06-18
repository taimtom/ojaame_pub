/**
 * Permission aliases — keep in sync with POS_BK/services/permission_aliases.py
 */
export const PERMISSION_ALIASES = {
  'settings.store': ['settings.read', 'settings.manage', 'settings.update'],
  'settings.read': ['settings.store', 'settings.manage', 'settings.update'],
  'settings.manage': ['settings.store', 'settings.read', 'settings.update'],
  'settings.update': ['settings.store', 'settings.read', 'settings.manage'],
  'settings.company': ['settings.manage', 'settings.read'],
  'settings.integrations': ['settings.manage', 'settings.read'],
  'inventory.view': ['inventory.read'],
  'inventory.read': ['inventory.view'],
  'inventory.transfer': ['inventory.update', 'inventory.manage'],
  'orders.read': ['sales.read'],
  'orders.create': ['sales.create'],
  'orders.update': ['sales.update'],
  'orders.delete': ['sales.delete'],
  'sales.read': ['orders.read'],
  'sales.create': ['orders.create'],
  'sales.update': ['orders.update'],
  'sales.delete': ['orders.delete'],
  'reports.sales': ['reports.read'],
  'reports.inventory': ['reports.read'],
  'reports.financial': ['reports.read'],
  'reports.export': ['reports.read', 'reports.create'],
  'reports.read': ['reports.sales', 'reports.inventory', 'reports.financial'],
  'quick_dashboard.view': ['sales.create', 'orders.create'],
  'store_dashboard.view': ['stores.read', 'reports.read'],
  'company_dashboard.view': ['reports.read', 'stores.read'],
  'sales.receipt_adjust': ['sales.update', 'sales.manage'],
  'users.manage': ['users.update', 'roles.update'],
};

export function expandAliasPermissions(permissions) {
  if (!permissions?.length) return [];
  const expanded = new Set(permissions);
  let changed = true;
  while (changed) {
    changed = false;
    expanded.forEach((name) => {
      (PERMISSION_ALIASES[name] || []).forEach((alias) => {
        if (!expanded.has(alias)) {
          expanded.add(alias);
          changed = true;
        }
      });
    });
  }
  return [...expanded];
}
