import axios from 'axios';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.site.serverUrl });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Fetcher error:', {
      url: args,
      error: error.response?.data || error.message,
    });
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
    googleAuth: 'api/auth/google-auth',
    verifyEmail: '/api/auth/verify-email',
    resendVerification: '/api/auth/resend-verification',
    invitation: '/api/auth/invite',
    updateInvite: '/api/auth/update/',
    sendResetOtp: '/api/auth/send-reset-otp',
    resetPassword:  '/api/auth/reset-password',
  },
  user: {
    invite: '/api/auth/invite', // POST endpoint to invite a user
    updateInvite: '/api/auth/update/', // POST endpoint to update details; append invitation_id
    resendInvite: '/api/auth/resend/', // POST endpoint to resend invite; append user_id
    list: '/api/auth/list',
    details: '/api/auth/details',
    edit: '/api/auth/edit',
  },
  expense:{
    list: '/api/expense/list',
    edit: '/api/expense',
    add: '/api/expense/add',
    delete: '/api/expense',
    summary:'/api/expense/summary',
  },
  company: {
    me: '/api/companies',        // ← no trailing slash
    create: '/api/companies/create',
    update: '/api/companies/update',
  },
  role: {
    // List all roles (GET    /api/role/)
    list: '/api/role/',
    // Get one role    (GET    /api/role/{role_id})
    details: (roleId) => `/api/role/${roleId}`,
    // Create a custom role (POST   /api/role/custom)
    create: '/api/role/custom',
    // Update a role   (PUT    /api/role/{role_id})
    update: (roleId) => `/api/role/${roleId}`,
    // Delete a role   (DELETE /api/role/{role_id})
    delete: (roleId) => `/api/role/${roleId}`,
    // Add permissions to role    (POST   /api/role/{role_id}/permissions)
    addPermissions: (roleId) => `/api/role/${roleId}/permissions`,
    // Remove permissions from role (DELETE /api/role/{role_id}/permissions)
    removePermissions: (roleId) => `/api/role/${roleId}/permissions`,
    // Get all possible permissions  (GET    /api/role/permissions/all)
    permissionOptions: '/api/role/permissions/all',
    // Get a user’s custom permissions   (GET    /api/role/users/{user_id}/permissions)
    userPermissions: (userId) => `/api/role/users/${userId}/permissions`,
    // Assign/change a user’s role       (PUT    /api/role/users/{user_id}/role)
    updateUserRole: (userId) => `/api/role/users/${userId}/role`,
    // Update a user’s custom permissions (PUT    /api/role/users/{user_id}/permissions)
    updateUserPermissions: (userId) => `/api/role/users/${userId}/permissions`,
  },

  product: {
    list: '/api/product/get/', // Correct endpoint
    details: '/api/product/details', // Keep the parameter-based URL
    search: '/api/product/search',
    edit: '/api/product/edit',
    add: '/api/product/add',
    quantity: '/api/product/quantity',
    history: '/api/product/history',
    movement: '/api/product/movement',
    salesHistory: '/api/product/sales-history',
  },
  shop: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
  categories: {
    list: '/api/categories/list', // Correct endpoint
    details: '/api/categories/details', // Keep the parameter-based URL
    search: '/api/categories/search',
    edit: '/api/categories/edit',
    add: '/api/categories/add',
    addDefaults: '/api/categories/add-defaults', // Add default categories endpoint
  },

  store: {
    list: '/api/stores/list/',
    details: '/api/stores/details/',
    search: '/api/stores/search',
    edit: '/api/stores/update',
    add: '/api/stores/add',
  },
  integrations: {
    // CREATE a new integration
    create: '/api/integrations/create', // (POST)
    oauthUrl: '/api/integrations/oauth-url/', // (GET) append {integration_id}
    oauthCallback: '/api/integrations/oauth-callback', // (POST)
    list: '/api/integrations/list', // (GET)
    details: '/api/integrations/', // (GET) append {integration_id}
    update: '/api/integrations/', // (PUT) append {integration_id}
    delete: '/api/integrations/', // (DELETE) append {integration_id}
    test: '/api/integrations/test/', // (GET) append {integration_id}
    emailSend: '/api/integrations/email/send', // (POST)
    emailMeetingInvite: '/api/integrations/email/meeting-invite', // (POST)
    driveUpload: '/api/integrations/drive/upload', // (POST)
    driveCreateFolder: '/api/integrations/drive/create-folder', // (POST)
    driveFiles: '/api/integrations/drive/files', // (GET)
    jumiaData: '/api/integrations/jumia/data', // (POST)
    jumiaUpdate: '/api/integrations/jumia/update', // (POST)
    jumiaFeedStatus: '/api/integrations/jumia/feed-status/', // (GET) append {feed_id}
    emailLogs: '/api/integrations/email-logs', // (GET)
    driveFilesList: '/api/integrations/drive-files', // (GET)
    jumiaSyncs: '/api/integrations/jumia-syncs', // (GET)
    sendInvoiceEmail: '/api/integrations/send-invoice-email', // (POST)
    scheduleMeeting: '/api/integrations/schedule-meeting', // (POST)
  },
  uploads: {
    upload: '/api/uploads',
  },
  dashboard: {
    // company-level (no storeId)
    summary: '/api/dashboard/summary',
    weeklySales: '/api/dashboard/weekly-sales',
    monthlySales: '/api/dashboard/monthly-sales',
    purchaseOrders: '/api/dashboard/purchase-orders',
    salesAccumulation: '/api/dashboard/sales-accumulation',
    currentVisits: '/api/dashboard/current-visits',
    yearlyStoreSales: '/api/dashboard/yearly-store-sales',
    storeLocationSales: '/api/dashboard/store-location-sales',
    storePerformance: '/api/dashboard/store-performance',
    monthlyRevenueTrends: '/api/dashboard/monthly-revenue-trends',
    topSellingProducts: '/api/dashboard/top-selling-products',
    topStaff: '/api/dashboard/top-staff',
    recentInvoices: '/api/dashboard/recent-invoices',
    expenseSummary: '/api/dashboard/expense-summary',
    orderTimeline: '/api/dashboard/order-timeline',
    dailySales: '/api/dashboard/daily-sales',
    companySummary:'/api/dashboard/summary',
    conversionMetrics: '/api/dashboard/conversion-metrics',
    salesByPaymentMethod: '/api/dashboard/sales-by-payment-method',
    relatedApplications: '/api/dashboard/related-applications',
    search: '/api/dashboard/search',
    // dynamic company-level
    company: {
      summary: (companyId) => `/api/dashboard/company/${companyId}/dashboard/summary`,
      storeComparison: (companyId) => `/api/dashboard/company/${companyId}/dashboard/store-comparison`,
      yearlySales: (companyId) => `/api/dashboard/company/${companyId}/dashboard/yearly-sales`
    },
    // dynamic store-level
    store: {
      dailySales:(storeId) => `/api/dashboard/${storeId}/dashboard/daily-sales`,
      salesByPaymentMethod: (storeId) => `/api/dashboard/${storeId}/dashboard/payment-methods`,
      search: (storeId) => `/api/dashboard/${storeId}/dashboard/search`,
      topCahier: (storeId) => `/api/dashboard/${storeId}/dashboard/top-cashiers`,
      recentInvoices: (storeId) => `/api/dashboard/${storeId}/dashboard/recent-invoices`,
      weeklySales: (storeId) => `/api/dashboard/${storeId}/dashboard/weekly-sales`,
      monthlySales: (storeId) => `/api/dashboard/${storeId}/dashboard/monthly-sales`,
      performance: (storeId) => `/api/dashboard/${storeId}/dashboard/performance`,
      topProducts: (storeId) => `/api/dashboard/${storeId}/dashboard/top-products`,
      expenses: (storeId) => `/api/dashboard/${storeId}/dashboard/expenses`,
      yearlySales: (storeId) => `/api/dashboard/${storeId}/dashboard/yearly-sales`,
      featured: (storeId) => `/api/dashboard/${storeId}/dashboard/featured`,
      verify: (storeId) => `/api/dashboard/${storeId}/verify`
    }
  },

  // Store-level dashboard / report endpoints (query-param style: ?store_id=X)
  storeDashboard: {
    stats: '/api/store-dashboard/stats',
    inventoryAlerts: '/api/store-dashboard/inventory-alerts',
    salesTrend: '/api/store-dashboard/sales-trend',
    categoryPerformance: '/api/store-dashboard/category-performance',
  },
  // Company dashboard (query-param style: ?company_id=X)
  companyDashboard: {
    revenueTrend: '/api/company-dashboard/revenue-trend',
  },
  // Financial / company-level reports (query-param style: ?company_id=X)
  reports: {
    profitLoss: '/api/reports/profit-loss',
    cashFlow: '/api/reports/cash-flow',
    tax: '/api/reports/tax',
  },

  paymentMethod:{
    add: '/api/payment/add',
    list:'/api/payment/list',
    details:'/api/payment',
    edit:'/api/payment',
    delete:'/api/payment',
  },

  service: {
    list: '/api/services/list', // For listing services (with optional ?store_id=)
    search: '/api/services/search', // For searching services
    add: '/api/services/add', // For adding a new service
    edit: '/api/services/edit', // For editing a service (append /{serviceId})
    detail: '/api/services/detail',
    saleHistory: '/api/services/sale-history',
  },
  customers: {
    list: '/api/customers/list/',
    details: '/api/customers/details/',
    search: '/api/customers/search',
    edit: '/api/customers/update',
    add: '/api/customers/add',
  },

  sales: {
    list: '/api/sales/list/',
    detail: '/api/sales/detail', // used with storeId and saleId appended dynamically
    search: '/api/sales/search/',
    add: '/api/sales/add',
    edit: '/api/sales/edit',
    history: '/api/sales/history/',
    saleslist: '/api/sales/historylist/',
  },
};
