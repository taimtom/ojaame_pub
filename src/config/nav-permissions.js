/**
 * Navigation Permission Mapping
 * Maps navigation sections and items to required permissions
 * 
 * Structure:
 * - sections: Maps section subheaders to required permissions
 * - items: Maps item titles to required permissions
 * 
 * Permission format: "category.action" (e.g., "users.read", "products.create")
 * 
 * Logic: Show if user has ANY of the listed permissions (OR logic)
 */

export const NAV_PERMISSIONS = {
  sections: {
    // Overview section is always visible (no permission required)
    Overview: {
      required: [], // Always visible
    },
    'Sales & Orders': {
      required: ['orders.read', 'sales.read'], // Show if user has ANY of these
    },
    Inventory: {
      required: ['inventory.read', 'products.read', 'categories.read'], // Show if user has ANY of these
    },
    Accounting: {
      required: ['payment_methods.read', 'expenses.read', 'payments.read'], // Show if user has ANY of these
    },
    Reports: {
      required: ['reports.read', 'reports.create', 'reports.update'], // Show if user has ANY report access
    },
    'Customer Management': {
      required: ['customers.read'], // Show if user has this permission
    },
    'User & Staff': {
      required: ['users.read', 'users.manage'], // Show if user has ANY of these
    },
    'Settings & Integrations': {
      required: ['settings.read'], // Show if user has this permission
    },
    Misc: {
      required: [], // Individual item permissions control visibility
    },
  },
  items: {
    // Overview items
    'Company Dashboard': ['reports.read', 'stores.read', 'stores.update'],
    'Store Dashboard': ['stores.read', 'stores.update'],
    'Quick Dashboard': [],
    'AI Assistant': [],
    'Service Log': [],
    'Usage dashboard': ['inventory.read', 'inventory.update', 'inventory.manage'],
    'Help & Support': [],
    'Front Desk': ['rooms.read', 'rooms.create', 'rooms.update', 'sales.read', 'sales.create'],
    'Quick Restock': ['inventory.update', 'inventory.manage', 'products.update'],
    
    // Sales & Orders items
    'Point of Sales': ['orders.create', 'sales.create'], // Show if user has ANY
    'Sales Invoice': ['orders.read', 'sales.read'], // Show if user has ANY
    
    // Inventory items
    Category: ['categories.read'],
    'Product Management': ['products.read'],
    'Add Product': ['products.create'],
    'Product Report': ['products.read'],
    'Product History': ['products.read'],
    'Restock History': ['products.update', 'inventory.update', 'inventory.manage'],
    'Service Management': ['services.read'],
    'Add Service': ['services.create'],
    'Service Report': ['services.read'],
    'Digital Product': ['digital_products.read', 'products.read', 'services.read'],
    
    // Accounting items
    'Manage Store Payment': ['payment_methods.read'],
    'Add Payment Method': ['payment_methods.create'],
    'Payment List': ['payment_methods.read'],
    Expenses: ['expenses.read'],
    'Add Expense': ['expenses.create'],
    'Expenses List': ['expenses.read'],
    
    // Customer Management items
    'Manage Customer': ['customers.read'],
    
    // User & Staff items
    'Manage User': ['users.read'],
    'Invite User': ['users.create'],
    'Roles & Permission': ['users.manage'],
    
    // Settings & Integrations items
    Integrations: ['settings.read'],
    Calendar: ['settings.read'],
    'Store Website': ['stores.update', 'stores.read'], // Show if user can update or read stores
    
    // Misc items
    Permission: ['users.manage'],
    'View Public Site': [], // Always visible
    Blank: [], // Always visible

    // Reports (store)
    'Store Reports': ['reports.read', 'reports.create', 'reports.update'],
    'Essential Reports': ['reports.read'],
    'Advanced Reports': ['reports.read'],
    'General Store Reports': ['reports.read'],
    'Inventory Report': ['reports.read'],
    'Financial Report': ['reports.read'],
    'Profit & Loss': ['reports.read'],
  'Cash Flow': ['reports.read'],
  'Tax Estimates': ['reports.read'],
  'VAT Return': ['reports.read'],
  'Annual Tax Summary': ['reports.read'],
  'Loans': ['reports.read'],
  'Payroll': ['reports.read'],
  'Withholding Tax': ['reports.read'],
  'Balance Sheet': ['reports.read'],
    'Trial Balance': ['reports.read'],
    'Sales Trends': ['reports.read'],
    'End of period': ['reports.read'],
    'Customer Report': ['reports.read'],
    'Company Reports': ['reports.create', 'reports.update'],
    'All Company Reports': ['reports.create', 'reports.update'],
    'End of day': ['reports.read'],
  },
};

/**
 * Get required permissions for a navigation section
 * @param {string} sectionSubheader - The subheader/title of the section
 * @returns {string[]} Array of required permissions (empty array means always visible)
 */
export function getSectionPermissions(sectionSubheader) {
  return NAV_PERMISSIONS.sections[sectionSubheader]?.required || [];
}

/**
 * Get required permissions for a navigation item
 * @param {string} itemTitle - The title of the navigation item
 * @returns {string[]} Array of required permissions (empty array means always visible)
 */
export function getItemPermissions(itemTitle) {
  return NAV_PERMISSIONS.items[itemTitle] || [];
}

/**
 * Check if a section should be visible based on permissions.
 * Accepts either the display subheader or a stable sectionPermKey (preferred when
 * the subheader is rendered dynamically via the business-type registry).
 * @param {string[]} userPermissions - User's permissions
 * @param {string} sectionSubheaderOrKey - The subheader or sectionPermKey of the section
 * @returns {boolean} True if section should be visible
 */
export function isSectionVisible(userPermissions, sectionSubheaderOrKey) {
  const sectionConfig = NAV_PERMISSIONS.sections[sectionSubheaderOrKey];
  // Unknown key (e.g. a dynamic business-type label) — item-level permissions govern
  if (!sectionConfig) {
    return true;
  }
  const required = sectionConfig.required;
  if (required.length === 0) {
    return true; // No requirements means always visible
  }
  // Check if user has ANY of the required permissions
  return required.some((permission) => userPermissions.includes(permission));
}

/**
 * Check if an item should be visible based on permissions.
 * Accepts either the display title or a stable permissionKey (preferred when the
 * title is rendered dynamically via the business-type registry).
 * @param {string[]} userPermissions - User's permissions
 * @param {string} itemTitleOrKey - The title or permissionKey of the navigation item
 * @returns {boolean} True if item should be visible
 */
export function isItemVisible(userPermissions, itemTitleOrKey) {
  const required = getItemPermissions(itemTitleOrKey);
  if (required.length === 0) {
    return true; // No requirements means always visible
  }
  // Check if user has ANY of the required permissions
  return required.some((permission) => userPermissions.includes(permission));
}
