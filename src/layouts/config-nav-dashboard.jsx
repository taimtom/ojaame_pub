import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { paramCase } from 'src/utils/change-case';

import { usePermissions } from 'src/hooks/use-permissions';
import { useBusinessType } from 'src/hooks/use-business-type';

import { isItemVisible, isSectionVisible } from 'src/config/nav-permissions';
import { CONFIG } from 'src/config-global';
import axiosInstance from 'src/utils/axios';

// import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  customer: icon('ic-customer'),
  supplier: icon('ic-supplier'),
  category: icon('ic-category'),
  pos: icon('ic-pos'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  service: icon('ic-service'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

// Helper: If value is a function, call it with provided args; otherwise, return the value as-is.
const callIfFunction = (value, ...args) =>
  typeof value === 'function' ? value(...args) : value;


// ----------------------------------------------------------------------
// Custom hook that returns navigation data with store-specific paths when needed.
export const useNavData = () => {
  const params = useParams();
  const { storeParam, id } = params;
  const location = useLocation();
  const navigate = useNavigate();
  const { getNavLabel, t } = useBusinessType();
  const { userPermissions } = usePermissions();

  // 1. Hydrate currentStore from URL or localStorage
  let currentStore = storeParam;
  if (!currentStore) {
    try {
      const raw = localStorage.getItem('activeWorkspace');
      if (raw) {
        const { storeName, id: storeId } = JSON.parse(raw);
        if (storeName && storeId) {
          currentStore = `${paramCase(storeName)}-${storeId}`;
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // 2. Redirect away from any store-scoped page if no currentStore
  React.useEffect(() => {
    const isStoreMgmt = location.pathname.startsWith(paths.dashboard.store.list);
    const isAnalytics = location.pathname === paths.dashboard.general.analytics;
    const isRoleList = location.pathname === paths.dashboard.role.root;
    const isRoleNew = location.pathname === paths.dashboard.role.new;

    // List of store-scoped roots we guard
    const guardedRoots = [
      callIfFunction(paths.dashboard.pos.root, currentStore),
      callIfFunction(paths.dashboard.category.root, currentStore),
      callIfFunction(paths.dashboard.product.root, currentStore),
      callIfFunction(paths.dashboard.service.root, currentStore),
      callIfFunction(paths.dashboard.invoice.root, currentStore),
      callIfFunction(paths.dashboard.customer.root, currentStore),
      callIfFunction(paths.dashboard.paymentMethod.root, currentStore),
      callIfFunction(paths.dashboard.expense.root, currentStore),
    ];

    const onGuardedPage = guardedRoots.some((root) =>
      location.pathname.startsWith(root || '')
    );

    if (!currentStore && onGuardedPage && !isStoreMgmt && !isAnalytics && !isRoleList && !isRoleNew) {
      navigate(paths.dashboard.store.list, { replace: true });
    }
  }, [currentStore, location.pathname, navigate]);

  // 3. Build storeBasePath for links
  const storeBasePath = currentStore
    ? `${paths.dashboard.root}/${currentStore}`
    : null;

  // 3.5. Get current store ID for store-specific links
  const getCurrentStoreId = () => {
    // First, check if we're on a store route with an id param (e.g., /app/store/:id/website)
    if (id && location.pathname.includes('/store/')) {
      return id.toString();
    }
    
    // Second, check if we have a storeParam in the URL
    if (currentStore) {
      const parts = currentStore.split('-');
      return parts[parts.length - 1]; // Get the ID from the end
    }
    
    // Finally, check localStorage
    try {
      const raw = localStorage.getItem('activeWorkspace');
      if (raw) {
        const workspace = JSON.parse(raw);
        return workspace?.id?.toString();
      }
    } catch {
      // ignore parse errors
    }
    return null;
  };

  const currentStoreId = getCurrentStoreId();

  // 3.6. Fetch store slug for public site link
  const [storeSlug, setStoreSlug] = React.useState(null);
  React.useEffect(() => {
    if (currentStoreId) {
      axiosInstance.get(`/api/stores/details/${currentStoreId}`)
        .then((res) => {
          const store = res.data;
          if (store?.slug && store?.has_public_site) {
            setStoreSlug(store.slug);
          }
        })
        .catch(() => {
          // Silently fail - link will just not work
        });
    }
  }, [currentStoreId]);

  // 4. Helper function to filter navigation items based on permissions
  const filterNavItems = (items) => {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items
      .map((item) => {
        // Check if item is visible based on permissions
        const itemVisible = isItemVisible(userPermissions, item.title);
        if (!itemVisible) {
          return null;
        }

        // If item has children, filter them recursively
        if (item.children && Array.isArray(item.children)) {
          const filteredChildren = filterNavItems(item.children);
          // If no children are visible, hide the parent item
          if (filteredChildren.length === 0) {
            return null;
          }
          return { ...item, children: filteredChildren };
        }

        return item;
      })
      .filter((item) => item !== null);
  };

  // 5. Build navigation data
  const navData = [

  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      { title: 'Company Dashboard', path: paths.dashboard.general.analytics, icon: ICONS.analytics },
      { title: 'Store Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: 'Quick Dashboard', path: paths.dashboard.quickDashboard, icon: ICONS.ecommerce },
    ],
  },
  /**
   * Sales & Orders
   */
  {
    subheader: 'Sales & Orders',
    items: [
      {
        title: getNavLabel('pointOfSales'),
        path: callIfFunction(paths.dashboard.pos.root, currentStore),
        icon: ICONS.pos,
        children: [{ title: `Add ${t('sale')}`, path: callIfFunction(paths.dashboard.pos.root, currentStore) }],
      },
      {
        title: getNavLabel('salesInvoice'),
        path: callIfFunction(paths.dashboard.invoice.root, currentStore),
        icon: ICONS.invoice,
        children: [
          { title: `${t('sale')} Report`, path: callIfFunction(paths.dashboard.invoice.root, currentStore  ) },
          { title: `${t('sale')} History`, path: callIfFunction(paths.dashboard.invoice.history, currentStore  ) },
        ],
      },
    ],
  },
  /**
   * Inventory
   */
  {
    subheader: 'Inventory',
    items: [
      {
        title: 'Category',
        path: callIfFunction(paths.dashboard.category.root, currentStore),
        icon: ICONS.category,
        children: [
          { title: 'Add Category', path: callIfFunction(paths.dashboard.category.new, currentStore) },
          { title: 'Category Report', path: callIfFunction(paths.dashboard.category.root, currentStore )},
        ],
      },
      {
        title: getNavLabel('productManagement'),
        path: callIfFunction(paths.dashboard.product.root, currentStore),
        icon: ICONS.product,
        children: [
          { title: `Add ${t('product')}`, path: callIfFunction(paths.dashboard.product.new, currentStore) },
          { title: `${t('product')} Report`, path: callIfFunction(paths.dashboard.product.root, currentStore) },
          { title: `${t('product')} History`, path: callIfFunction(paths.dashboard.product.history, currentStore) },
        ],
      },
      {
        title: getNavLabel('serviceManagement'),
        path: callIfFunction(paths.dashboard.service.root, currentStore),
        icon: ICONS.service,
        children: [
          { title: `Add ${t('service')}`, path: callIfFunction(paths.dashboard.service.new, currentStore) },
          { title: `${t('service')} Report`, path: callIfFunction(paths.dashboard.service.root, currentStore) },
        ],
      },
    ],
  },
  /**
   * Accounting
   */
  {
    subheader: 'Accounting',
    items: [
      {
        title: 'Manage Store Payment',
        path: callIfFunction(paths.dashboard.paymentMethod.root, currentStore),
        icon: ICONS.order,
        children: [
          { title: 'Add Payment Method', path: callIfFunction(paths.dashboard.paymentMethod.new, currentStore  ) },
          { title: 'Payment List', path: callIfFunction(paths.dashboard.paymentMethod.root, currentStore  ) },
        ],
      },
      {
        title: 'Expenses',
        path: callIfFunction(paths.dashboard.expense.root, currentStore),
        icon: ICONS.order,
        children: [
          { title: 'Add Expense', path: callIfFunction(paths.dashboard.expense.new, currentStore  ) },
          { title: 'Expenses List', path: callIfFunction(paths.dashboard.expense.root, currentStore  ) },
        ],
      },
    ],
  },
  /**
   * Customer Management
   */
  {
    subheader: 'Customer Management',
    items: [
      {
        title: `Manage ${t('customer')}`,
        path: callIfFunction(paths.dashboard.customer.root, currentStore),
        icon: ICONS.customer,
        children: [
          { title: `Add ${t('customer')}`, path: callIfFunction(paths.dashboard.customer.new, currentStore  ) },
          { title: `${t('customer')} List`, path: callIfFunction(paths.dashboard.customer.root, currentStore  ) },
        ],
      },
    ],
  },
  /**
   * User & Staff
   */
  {
    subheader: 'User & Staff',
    items: [
      {
        title: 'Manage User',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        children: [
          { title: 'User List', path: paths.dashboard.user.list },
          { title: 'Invite User', path: paths.dashboard.user.invite },
        ],
      },
      {
        title: 'Roles & Permission',
        path: paths.dashboard.role.root,
        icon: ICONS.lock,
        children: [
          { title: 'List', path: paths.dashboard.role.root },
          { title: 'Create', path: paths.dashboard.role.new },
        ],
      },
    ],
  },
  /**
   * Settings & Integrations
   */
  {
    subheader: 'Settings & Integrations',
    items: [
      {
        title: 'Integrations',
        path: paths.dashboard.integration.root,
        icon: ICONS.job,
        children: [
          { title: 'Manage Integrations', path: paths.dashboard.integration.list },
          { title: 'Integration Dashboard', path: paths.dashboard.integration.dashboard },
        ],
      },
      { title: 'Calendar', path: paths.dashboard.calendar, icon: ICONS.calendar },
      ...(currentStoreId ? [{
        title: 'Store Website',
        path: paths.dashboard.store.website(currentStoreId),
        icon: ICONS.external,
        children: [
          { title: 'Website Settings', path: paths.dashboard.store.website(currentStoreId) },
        ],
      }] : []),
    ],
  },
];

  // 6. Filter navigation data based on permissions
  const filteredNavData = navData
    .map((section) => {
      // Check if section is visible
      const sectionVisible = isSectionVisible(userPermissions, section.subheader);
      if (!sectionVisible) {
        return null;
      }

      // Filter items within the section
      const filteredItems = filterNavItems(section.items);
      
      // If no items are visible, hide the entire section
      if (filteredItems.length === 0) {
        return null;
      }

      return { ...section, items: filteredItems };
    })
    .filter((section) => section !== null);

  return filteredNavData;
};
