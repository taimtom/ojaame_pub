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
    // Overview items (always visible)
    'Company Dashboard': [],
    'Store Dashboard': [],
    
    // Sales & Orders items
    'Point of Sales': ['orders.create', 'sales.create'], // Show if user has ANY
    'Sales Invoice': ['orders.read', 'sales.read'], // Show if user has ANY
    
    // Inventory items
    Category: ['categories.read'],
    'Product Management': ['products.read'],
    'Service Management': ['services.read'],
    
    // Accounting items
    'Manage Store Payment': ['payment_methods.read'],
    Expenses: ['expenses.read'],
    
    // Customer Management items
    'Manage Customer': ['customers.read'],
    
    // User & Staff items
    'Manage User': ['users.read'],
    'Roles & Permission': ['users.manage'],
    
    // Settings & Integrations items
    Integrations: ['settings.read'],
    Calendar: ['settings.read'],
    'Store Website': ['stores.update', 'stores.read'], // Show if user can update or read stores
    
    // Misc items
    Permission: ['users.manage'],
    'View Public Site': [], // Always visible
    Blank: [], // Always visible
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
 * Check if a section should be visible based on permissions
 * @param {string[]} userPermissions - User's permissions
 * @param {string} sectionSubheader - The subheader/title of the section
 * @returns {boolean} True if section should be visible
 */
export function isSectionVisible(userPermissions, sectionSubheader) {
  const required = getSectionPermissions(sectionSubheader);
  if (required.length === 0) {
    return true; // No requirements means always visible
  }
  // Check if user has ANY of the required permissions
  return required.some((permission) => userPermissions.includes(permission));
}

/**
 * Check if an item should be visible based on permissions
 * @param {string[]} userPermissions - User's permissions
 * @param {string} itemTitle - The title of the navigation item
 * @returns {boolean} True if item should be visible
 */
export function isItemVisible(userPermissions, itemTitle) {
  const required = getItemPermissions(itemTitle);
  if (required.length === 0) {
    return true; // No requirements means always visible
  }
  // Check if user has ANY of the required permissions
  return required.some((permission) => userPermissions.includes(permission));
}
