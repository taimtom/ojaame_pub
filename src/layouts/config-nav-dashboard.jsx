import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { usePermissions } from 'src/hooks/use-permissions';
import { useBusinessType } from 'src/hooks/use-business-type';
import { usePlanFeatures } from 'src/hooks/use-plan-features';

import axiosInstance from 'src/utils/axios';
import { paramCase } from 'src/utils/change-case';
import { isHotelLodgingBusiness } from 'src/utils/hotel-lodging';

import { CONFIG } from 'src/config-global';
import { useCompany } from 'src/actions/company';
import { isNavItemAllowedByPlan } from 'src/config/plan-features';
import { isItemVisible, isSectionVisible } from 'src/config/nav-permissions';

// import { Label } from 'src/components/label';
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
  consignment: icon('ic-consignment'),
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
  const { hasPlanFeature } = usePlanFeatures();
  const { company } = useCompany({ skip: false });
  const showFrontDesk = isHotelLodgingBusiness(company);

  // 1. Hydrate currentStore from URL or localStorage.
  // A valid storeParam must end with a numeric ID (e.g. "my-store-42").
  // Reject strings like "null", "undefined", or plain page-names that can
  // land in :storeParam when a route is accidentally visited.
  const isValidStoreParam = (p) => Boolean(p && /^.+-\d+$/.test(p));

  let currentStore = isValidStoreParam(storeParam) ? storeParam : null;
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
    // Pages that are legitimately NOT store-scoped — never redirect from these.
    const isExempt = (
      location.pathname.startsWith(paths.dashboard.store.list) ||
      location.pathname === paths.dashboard.general.analytics ||
      location.pathname === paths.dashboard.role.root ||
      location.pathname === paths.dashboard.role.new ||
      location.pathname === paths.dashboard.reports.companyRoot ||
      location.pathname.startsWith(paths.dashboard.user.root) ||
      location.pathname.startsWith(paths.dashboard.integration.root) ||
      location.pathname === paths.dashboard.helpSupport
    );

    // List of store-scoped roots we guard (only meaningful when currentStore is truthy)
    const guardedRoots = [
      callIfFunction(paths.dashboard.pos.root, currentStore),
      callIfFunction(paths.dashboard.category.root, currentStore),
      callIfFunction(paths.dashboard.product.root, currentStore),
      callIfFunction(paths.dashboard.service.root, currentStore),
      callIfFunction(paths.dashboard.invoice.root, currentStore),
      callIfFunction(paths.dashboard.customer.root, currentStore),
      callIfFunction(paths.dashboard.paymentMethod.root, currentStore),
      callIfFunction(paths.dashboard.expense.root, currentStore),
      callIfFunction(paths.dashboard.reports.storeRoot, currentStore),
    ];

    const onGuardedPage = guardedRoots.some((root) =>
      location.pathname.startsWith(root || '')
    );

    if (!currentStore && onGuardedPage && !isExempt) {
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
        // Use permissionKey (stable) when available, otherwise fall back to the
        // display title. This keeps permission checks working when the title is
        // rendered dynamically via the business-type registry.
        const itemKey = item.permissionKey || item.title;
        const itemVisible = isItemVisible(userPermissions, itemKey);
        if (!itemVisible) {
          return null;
        }

        if (!isNavItemAllowedByPlan(itemKey, hasPlanFeature)) {
          return null;
        }

        if (item.requiresHotelLodging && !showFrontDesk) {
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
      {
        title: 'Store Dashboard',
        path: storeBasePath || paths.dashboard.store.list,
        icon: ICONS.dashboard,
      },
      { title: getNavLabel('quickDashboard'), path: paths.dashboard.quickDashboard, icon: ICONS.ecommerce },
      { title: 'AI Assistant', path: paths.dashboard.aiAgent, icon: ICONS.chat },
      { title: getNavLabel('serviceLog'), path: paths.dashboard.serviceLog, icon: ICONS.booking, permissionKey: 'Service Log' },
      {
        title: getNavLabel('frontDesk'),
        path: paths.dashboard.frontDesk,
        icon: ICONS.tour,
        permissionKey: 'Front Desk',
        requiresHotelLodging: true,
      },
      { title: getNavLabel('quickRestock'), path: paths.dashboard.quickRestock, icon: ICONS.product },
      {
        title: 'Customer Report',
        path: callIfFunction(paths.dashboard.reports.customers, currentStore),
        icon: ICONS.customer,
        permissionKey: 'Customer Report',
      },
      {
        title: getNavLabel('partnerReport'),
        path: callIfFunction(paths.dashboard.reports.partners, currentStore),
        icon: ICONS.user,
        permissionKey: 'Partner Report',
      },
    ],
  },
  /**
   * Sales & Orders
   */
  {
    sectionPermKey: 'Sales & Orders',
    subheader: getNavLabel('salesAndOrdersSection'),
    items: [
      {
        title: getNavLabel('pointOfSales'),
        path: callIfFunction(paths.dashboard.pos.root, currentStore),
        icon: ICONS.pos,
        permissionKey: 'Point of Sales',
        children: [{ title: `Add ${t('sale')}`, path: callIfFunction(paths.dashboard.pos.root, currentStore) }],
      },
      {
        title: getNavLabel('salesInvoice'),
        path: callIfFunction(paths.dashboard.invoice.root, currentStore),
        icon: ICONS.invoice,
        permissionKey: 'Sales Invoice',
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
    sectionPermKey: 'Inventory',
    subheader: getNavLabel('inventorySection'),
    items: [
      {
        title: t('category'),
        path: callIfFunction(paths.dashboard.category.root, currentStore),
        icon: ICONS.category,
        permissionKey: 'Category',
        children: [
          { title: `Add ${t('category')}`, path: callIfFunction(paths.dashboard.category.new, currentStore) },
          { title: `${t('category')} Report`, path: callIfFunction(paths.dashboard.category.root, currentStore )},
        ],
      },
      {
        title: getNavLabel('productManagement'),
        path: callIfFunction(paths.dashboard.product.root, currentStore),
        icon: ICONS.product,
        permissionKey: 'Product Management',
        children: [
          {
            title: `Add ${t('product')}`,
            path: callIfFunction(paths.dashboard.product.new, currentStore),
            permissionKey: 'Add Product',
          },
          // Temporarily hidden from nav while refining UX; route still works at .../product/bulk-add
          // { title: `Bulk add ${t('product')}`, path: callIfFunction(paths.dashboard.product.bulkAdd, currentStore) },
          {
            title: `${t('product')} Report`,
            path: callIfFunction(paths.dashboard.product.root, currentStore),
            permissionKey: 'Product Report',
          },
          {
            title: `${t('product')} History`,
            path: callIfFunction(paths.dashboard.product.history, currentStore),
            permissionKey: 'Product History',
          },
          {
            title: 'Restock History',
            path: callIfFunction(paths.dashboard.product.restockHistory, currentStore),
            permissionKey: 'Restock History',
          },
        ],
      },
      {
        title: getNavLabel('serviceManagement'),
        path: callIfFunction(paths.dashboard.service.root, currentStore),
        icon: ICONS.service,
        permissionKey: 'Service Management',
        children: [
          {
            title: `Add ${t('service')}`,
            path: callIfFunction(paths.dashboard.service.new, currentStore),
            permissionKey: 'Add Service',
          },
          {
            title: `${t('service')} Report`,
            path: callIfFunction(paths.dashboard.service.root, currentStore),
            permissionKey: 'Service Report',
          },
        ],
      },
      {
        title: getNavLabel('storeTransfers'),
        path: callIfFunction(paths.dashboard.transfer.root, currentStore),
        icon: ICONS.folder,
        permissionKey: 'Store Transfers',
      },
      {
        title: getNavLabel('consignment'),
        path: callIfFunction(paths.dashboard.consignment.root, currentStore),
        icon: ICONS.consignment,
        permissionKey: 'Consignment',
      },
      { title: 'Usage dashboard', path: paths.dashboard.usageDashboard, icon: ICONS.analytics },
      {
        title: 'Digital Product',
        path: callIfFunction(paths.dashboard.digitalProduct.root, currentStore),
        icon: ICONS.ecommerce,
        permissionKey: 'Digital Product',
        children: [
          { title: 'Add Digital Product', path: callIfFunction(paths.dashboard.digitalProduct.new, currentStore) },
          { title: 'Digital Product Report', path: callIfFunction(paths.dashboard.digitalProduct.root, currentStore) },
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
   * Reports
   */
  {
    subheader: 'Reports',
    items: [
      {
        title: 'Store Reports',
        path: callIfFunction(paths.dashboard.reports.storeRoot, currentStore),
        icon: ICONS.analytics,
        permissionKey: 'Store Reports',
        children: [
          {
            title: 'Essential',
            path: callIfFunction(paths.dashboard.reports.generalReport, currentStore),
            permissionKey: 'Essential Reports',
            children: [
              { title: 'General Store Reports', path: callIfFunction(paths.dashboard.reports.generalReport, currentStore), permissionKey: 'General Store Reports' },
              { title: 'Inventory Report', path: callIfFunction(paths.dashboard.reports.inventory, currentStore), permissionKey: 'Inventory Report' },
              { title: 'Financial Report', path: callIfFunction(paths.dashboard.reports.financial, currentStore), permissionKey: 'Financial Report' },
              { title: 'Profit & Loss', path: callIfFunction(paths.dashboard.reports.profitAndLoss, currentStore), permissionKey: 'Profit & Loss' },
              { title: 'Customer Report', path: callIfFunction(paths.dashboard.reports.customers, currentStore), permissionKey: 'Customer Report' },
              { title: 'End of period', path: callIfFunction(paths.dashboard.reports.endOfDay, currentStore), permissionKey: 'End of period' },
            ],
          },
          {
            title: 'Advanced',
            path: callIfFunction(paths.dashboard.reports.cashFlow, currentStore),
            permissionKey: 'Advanced Reports',
            children: [
              { title: 'Cash Flow', path: callIfFunction(paths.dashboard.reports.cashFlow, currentStore), permissionKey: 'Cash Flow' },
              { title: 'Tax Estimates', path: callIfFunction(paths.dashboard.reports.taxEstimates, currentStore), permissionKey: 'Tax Estimates' },
              { title: 'VAT Return', path: callIfFunction(paths.dashboard.reports.vatReturn, currentStore), permissionKey: 'VAT Return' },
              { title: 'Annual Tax Summary', path: callIfFunction(paths.dashboard.reports.taxAnnual, currentStore), permissionKey: 'Annual Tax Summary' },
              { title: 'Loans', path: callIfFunction(paths.dashboard.reports.loans, currentStore), permissionKey: 'Loans' },
              { title: 'Payroll / PAYE', path: callIfFunction(paths.dashboard.reports.payroll, currentStore), permissionKey: 'Payroll' },
              { title: 'Withholding Tax', path: callIfFunction(paths.dashboard.reports.wht, currentStore), permissionKey: 'Withholding Tax' },
              { title: 'Balance Sheet', path: callIfFunction(paths.dashboard.reports.balanceSheet, currentStore), permissionKey: 'Balance Sheet' },
              { title: 'Trial Balance', path: callIfFunction(paths.dashboard.reports.trialBalance, currentStore), permissionKey: 'Trial Balance' },
              { title: 'Sales Trends', path: callIfFunction(paths.dashboard.reports.salesTrends, currentStore), permissionKey: 'Sales Trends' },
            ],
          },
        ],
      },
      {
        title: 'Company Reports',
        path: paths.dashboard.reports.companyRoot,
        icon: ICONS.banking,
        children: [
          { title: 'All Company Reports', path: paths.dashboard.reports.companyRoot },
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
        permissionKey: 'Manage Customer',
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
      { title: 'Help & Support', path: paths.dashboard.helpSupport, icon: ICONS.mail },
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
      // Use sectionPermKey (stable) when available, otherwise fall back to the
      // display subheader. This keeps permission checks working when the subheader
      // is rendered dynamically via the business-type registry.
      const sectionVisible = isSectionVisible(
        userPermissions,
        section.sectionPermKey || section.subheader
      );
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
