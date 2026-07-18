// Business Type Registry
// Maps industry/sub-industry/exact-business combinations to their configurations
// Format: "Industry|Sub Industry|Exact Business" -> configuration object

// Default configuration fallback
const DEFAULT_CONFIG = {
  terminology: {
    product: 'Product',
    service: 'Service',
    invoice: 'Invoice',
    sale: 'Sale',
    quantity: 'Quantity',
    price: 'Price',
    category: 'Category',
    customer: 'Customer',
    pos: 'Point of Sales',
    addItem: 'Add Item',
    item: 'Item',
    description: 'Description',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    shipping: 'Shipping',
    taxes: 'Taxes',
    productionInput: 'Production input',
    salePlural: 'Sales',
    todaySalesTitle: "Today's Sales",
    weeklySalesTitle: 'Total Weekly Sales',
    monthlySalesTitle: 'Total Monthly Sales',
    salesByPaymentTitle: 'Sales by Payment Method',
    heroActionHint: 'Tap to open Quick Sales',
    invoicePlural: 'Invoices',
    productPlural: 'Products',
  },
  fields: {
    product: {
      show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'images'],
      hide: ['batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
      labels: {
        name: 'Product name',
        quantity: 'Quantity',
        price: 'Price',
        category: 'Category',
        code: 'Barcode',
      },
    },
    service: {
      show: ['name', 'description', 'price'],
      hide: ['duration', 'appointment_required', 'session_count'],
      labels: {
        name: 'Service name',
        price: 'Price',
      },
    },
  },
  navigation: {
    productManagement: 'Product Management',
    serviceManagement: 'Service Management',
    pointOfSales: 'Point of Sales',
    salesInvoice: 'Sales Invoice',
    usageDashboard: 'Usage dashboard',
    quickDashboard: 'Quick Dashboard',
    serviceLog: 'Service Log',
    frontDesk: 'Front Desk',
    quickRestock: 'Quick Restock',
    salesAndOrdersSection: 'Sales & Orders',
    inventorySection: 'Inventory',
    storeTransfers: 'Store Transfers',
    consignment: 'Consignment',
    partnerReport: 'Partner Report',
  },
};

const WHOLESALE_PRODUCT_FIELDS = {
  show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'images', 'is_pack', 'quantity_per_pack', 'costPrice', 'expiry_date'],
  hide: ['gender', 'colors', 'sizes', 'prescription_info', 'dosage', 'duration', 'appointment_time', 'harvest_date'],
  labels: {
    name: 'SKU name',
    quantity: 'Stock on hand',
    price: 'Unit price',
    category: 'Product line',
    code: 'Barcode',
    costPrice: 'Landed cost',
  },
};

const WHOLESALE_DISTRIBUTOR_NAV = {
  productManagement: 'SKU Catalogue',
  serviceManagement: 'Service Management',
  pointOfSales: 'Sales Desk',
  salesInvoice: 'Invoices',
  usageDashboard: 'Usage dashboard',
  quickDashboard: 'Quick Sales',
  serviceLog: 'Service Log',
  quickRestock: 'Goods Received',
  salesAndOrdersSection: 'Sales & Dispatch',
  inventorySection: 'Stock & Depots',
  storeTransfers: 'Depot Dispatch',
  consignment: 'Sub-dealer Stock',
  partnerReport: 'Dealer Accounts',
};

const WHOLESALE_DISTRIBUTOR_TERMINOLOGY = {
  product: 'SKU',
  service: 'Service',
  invoice: 'Sales Invoice',
  sale: 'Dispatch',
  quantity: 'Stock Qty',
  price: 'Unit Price',
  category: 'Product Line',
  customer: 'Dealer',
  pos: 'Sales Desk',
  addItem: 'Add SKU',
  item: 'SKU',
  description: 'Description',
  total: 'Total',
  subtotal: 'Subtotal',
  discount: 'Discount',
  shipping: 'Delivery',
  taxes: 'Taxes',
  productionInput: 'Production input',
  salePlural: 'Dispatches',
  todaySalesTitle: "Today's Dispatches",
  weeklySalesTitle: 'Total Weekly Dispatches',
  monthlySalesTitle: 'Total Monthly Dispatches',
  salesByPaymentTitle: 'Dispatches by Payment Method',
  heroActionHint: 'Tap to open Quick Sales',
  invoicePlural: 'Invoices',
  productPlural: 'SKUs',
};

const IMPORT_TRADE_TERMINOLOGY = {
  ...WHOLESALE_DISTRIBUTOR_TERMINOLOGY,
  customer: 'Buyer',
  sale: 'Sale',
  invoice: 'Invoice',
};

const IMPORT_TRADE_NAV = {
  ...WHOLESALE_DISTRIBUTOR_NAV,
  quickRestock: 'Import Receipt',
  salesAndOrdersSection: 'Sales & Trade',
};

function wholesaleDistributorConfig(terminologyOverrides = {}, navigationOverrides = {}) {
  return {
    terminology: { ...WHOLESALE_DISTRIBUTOR_TERMINOLOGY, ...terminologyOverrides },
    fields: {
      product: WHOLESALE_PRODUCT_FIELDS,
      service: DEFAULT_CONFIG.fields.service,
    },
    navigation: { ...WHOLESALE_DISTRIBUTOR_NAV, ...navigationOverrides },
    dashboardShortcuts: [
      'quick-dispatch',
      'goods-received',
      'customers',
      'pos',
      'products',
      'transfers',
      'invoices',
      'customer-report',
      'consignment',
      'partner-report',
      'service-log',
      'expenses',
    ],
  };
}

function importTradeConfig(terminologyOverrides = {}, navigationOverrides = {}) {
  return {
    terminology: { ...IMPORT_TRADE_TERMINOLOGY, ...terminologyOverrides },
    fields: {
      product: WHOLESALE_PRODUCT_FIELDS,
      service: DEFAULT_CONFIG.fields.service,
    },
    navigation: { ...IMPORT_TRADE_NAV, ...navigationOverrides },
  };
}

// Helper function to create a registry key
const createKey = (industry, subIndustry, exactBusiness) => `${industry}|${subIndustry}|${exactBusiness}`;

// Business type configurations
const BUSINESS_TYPE_CONFIGS = {
  // ========== RETAIL & COMMERCE ==========
  [createKey('Trade & Commerce', 'Retail trade', 'Retail store')]: {
    terminology: {
      product: 'Item',
      service: 'Service',
      invoice: 'Receipt',
      sale: 'Sale',
      quantity: 'Quantity',
      price: 'Price',
      category: 'Department',
      customer: 'Customer',
      pos: 'Checkout',
      addItem: 'Add Item',
      item: 'Item',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Shipping',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'images', 'size', 'color', 'barcode'],
        hide: ['batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Item name',
          quantity: 'Quantity',
          price: 'Price',
          category: 'Department',
          code: 'Barcode',
        },
      },
      service: {
        show: ['name', 'description', 'price'],
        hide: ['duration', 'appointment_required', 'session_count'],
        labels: {
          name: 'Service name',
          price: 'Price',
        },
      },
    },
    navigation: {
      productManagement: 'Item Management',
      serviceManagement: 'Service Management',
      pointOfSales: 'Checkout',
      salesInvoice: 'Receipts',
    },
  },

  [createKey('Trade & Commerce', 'Retail trade', 'Supermarket')]: {
    terminology: {
      product: 'Product',
      service: 'Service',
      invoice: 'Receipt',
      sale: 'Sale',
      quantity: 'Quantity',
      price: 'Price',
      category: 'Aisle',
      customer: 'Customer',
      pos: 'Checkout',
      addItem: 'Add Product',
      item: 'Product',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'images', 'barcode', 'expiry_date'],
        hide: ['batch_number', 'harvest_date', 'prescription_info', 'dosage', 'duration', 'appointment_time', 'size', 'color'],
        labels: {
          name: 'Product name',
          quantity: 'Quantity',
          price: 'Price',
          category: 'Aisle',
          code: 'Barcode',
        },
      },
    },
    navigation: {
      productManagement: 'Product Management',
      serviceManagement: 'Service Management',
      pointOfSales: 'Checkout',
      salesInvoice: 'Receipts',
    },
  },

  [createKey('Trade & Commerce', 'E-commerce', 'Online store')]: {
    terminology: {
      product: 'Product',
      service: 'Service',
      invoice: 'Order',
      sale: 'Order',
      quantity: 'Quantity',
      price: 'Price',
      category: 'Category',
      customer: 'Customer',
      pos: 'Order Entry',
      addItem: 'Add Product',
      item: 'Product',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Shipping',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'images'],
        hide: ['batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Product name',
          quantity: 'Stock',
          price: 'Price',
          category: 'Category',
          code: 'Barcode',
        },
      },
    },
    navigation: {
      productManagement: 'Product Management',
      serviceManagement: 'Service Management',
      pointOfSales: 'Order Entry',
      salesInvoice: 'Orders',
    },
  },

  // ========== WHOLESALE / B2B / DISTRIBUTOR ==========
  [createKey('Trade & Commerce', 'Wholesale trade', 'Wholesale distribution')]:
    wholesaleDistributorConfig(),
  [createKey('Trade & Commerce', 'Wholesale trade', 'B2B trading')]:
    wholesaleDistributorConfig({ customer: 'Buyer', sale: 'Sale' }),
  [createKey('Trade & Commerce', 'Wholesale trade', 'Wholesale supply')]:
    wholesaleDistributorConfig({ sale: 'Supply' }),
  [createKey('Trade & Commerce', 'Import & export', 'Import business')]:
    importTradeConfig(),
  [createKey('Trade & Commerce', 'Import & export', 'Trading company')]:
    importTradeConfig({ customer: 'Dealer' }),
  [createKey('Trade & Commerce', 'Import & export', 'Export business')]:
    importTradeConfig({ customer: 'Buyer', pos: 'Export Desk' }, { pointOfSales: 'Export Desk' }),
  [createKey('Trade & Commerce', 'Import & export', 'International trade')]:
    importTradeConfig({ customer: 'Trade Partner' }),

  // ========== HEALTHCARE ==========
  [createKey('Health & Social Services', 'Hospitals', 'Private hospital')]: {
    terminology: {
      product: 'Medication',
      service: 'Treatment',
      invoice: 'Bill',
      sale: 'Visit',
      quantity: 'Dosage',
      price: 'Fee',
      category: 'Department',
      customer: 'Patient',
      pos: 'Billing',
      addItem: 'Add Item',
      item: 'Item',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'prescription_info', 'dosage', 'expiry_date'],
        hide: ['sku', 'code', 'size', 'color', 'barcode', 'batch_number', 'harvest_date', 'duration', 'appointment_time'],
        labels: {
          name: 'Medication name',
          quantity: 'Dosage',
          price: 'Fee',
          category: 'Department',
          code: 'Barcode',
        },
      },
      service: {
        show: ['name', 'description', 'price', 'duration', 'appointment_required'],
        hide: ['session_count'],
        labels: {
          name: 'Treatment name',
          price: 'Fee',
          duration: 'Duration (minutes)',
        },
      },
    },
    navigation: {
      productManagement: 'Medication Management',
      serviceManagement: 'Treatment Management',
      serviceLog: 'Service Log',
      pointOfSales: 'Billing',
      salesInvoice: 'Bills',
    },
  },

  [createKey('Health & Social Services', 'Clinics', 'Medical clinic')]: {
    terminology: {
      product: 'Medication',
      service: 'Treatment',
      invoice: 'Bill',
      sale: 'Visit',
      quantity: 'Dosage',
      price: 'Fee',
      category: 'Department',
      customer: 'Patient',
      pos: 'Billing',
      addItem: 'Add Item',
      item: 'Item',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'prescription_info', 'dosage', 'expiry_date'],
        hide: ['sku', 'code', 'size', 'color', 'barcode', 'batch_number', 'harvest_date', 'duration', 'appointment_time'],
        labels: {
          name: 'Medication name',
          quantity: 'Dosage',
          price: 'Fee',
          category: 'Department',
          code: 'Barcode',
        },
      },
      service: {
        show: ['name', 'description', 'price', 'duration', 'appointment_required'],
        hide: ['session_count'],
        labels: {
          name: 'Treatment name',
          price: 'Fee',
          duration: 'Duration (minutes)',
        },
      },
    },
    navigation: {
      productManagement: 'Medication Management',
      serviceManagement: 'Treatment Management',
      serviceLog: 'Visit Log',
      pointOfSales: 'Billing',
      salesInvoice: 'Bills',
    },
  },

  [createKey('Health & Social Services', 'Pharmacies', 'Pharmacy')]: {
    terminology: {
      product: 'Medication',
      service: 'Service',
      invoice: 'Receipt',
      sale: 'Sale',
      quantity: 'Quantity',
      price: 'Price',
      category: 'Category',
      customer: 'Customer',
      pos: 'Checkout',
      addItem: 'Add Medication',
      item: 'Medication',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'prescription_info', 'dosage', 'expiry_date'],
        hide: ['size', 'color', 'barcode', 'batch_number', 'harvest_date', 'duration', 'appointment_time'],
        labels: {
          name: 'Medication name',
          quantity: 'Quantity',
          price: 'Price',
          category: 'Category',
          code: 'Barcode',
        },
      },
    },
    navigation: {
      productManagement: 'Medication Management',
      serviceManagement: 'Service Management',
      pointOfSales: 'Checkout',
      salesInvoice: 'Receipts',
    },
  },

  // ========== RESTAURANT ==========
  [createKey('Tourism & Hospitality', 'Restaurants', 'Restaurant')]: {
    terminology: {
      productionInput: 'Ingredient',
      product: 'Menu Item',
      service: 'Service',
      invoice: 'Check',
      sale: 'Order',
      quantity: 'Quantity',
      price: 'Price',
      category: 'Category',
      customer: 'Customer',
      pos: 'Order Entry',
      addItem: 'Add Menu Item',
      item: 'Menu Item',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'code', 'images'],
        hide: ['sku', 'size', 'color', 'gender', 'barcode', 'batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Menu Item name',
          quantity: 'Quantity',
          price: 'Price',
          category: 'Category',
          code: 'Barcode',
        },
      },
    },
    navigation: {
      productManagement: 'Menu Management',
      serviceManagement: 'Service Management',
      pointOfSales: 'Order Entry',
      salesInvoice: 'Checks',
      usageDashboard: 'Ingredient usage',
    },
  },

  [createKey('Tourism & Hospitality', 'Restaurants', 'Fast food')]: {
    terminology: {
      product: 'Menu Item',
      service: 'Catering Service',
      invoice: 'Bill',
      sale: 'Order',
      quantity: 'Portions',
      price: 'Menu Price',
      category: 'Menu Category',
      customer: 'Diner',
      pos: 'Order Taking',
      addItem: 'Add Menu Item',
      item: 'Menu Item',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      taxes: 'Restaurant Tax',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'code', 'images'],
        hide: ['sku', 'size', 'color', 'gender', 'barcode', 'batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time', 'costPrice'],
        labels: {
          name: 'Menu Item name',
          quantity: 'Portions',
          price: 'Menu Price',
          category: 'Menu Category',
          code: 'Barcode',
        },
      },
      service: {
        show: ['name', 'description', 'price'],
        hide: ['duration', 'appointment_required', 'session_count', 'costPrice'],
        labels: {
          name: 'Catering Service name',
          price: 'Price',
        },
      },
    },
    navigation: {
      productManagement: 'Menu Management',
      serviceManagement: 'Catering Management',
      pointOfSales: 'Order Taking',
      salesInvoice: 'Bills',
    },
  },

  [createKey('Tourism & Hospitality', 'Restaurants', 'Cafe')]: {
    terminology: {
      product: 'Menu Item',
      service: 'Service',
      invoice: 'Check',
      sale: 'Order',
      quantity: 'Quantity',
      price: 'Price',
      category: 'Category',
      customer: 'Customer',
      pos: 'Order Entry',
      addItem: 'Add Item',
      item: 'Item',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'code', 'images'],
        hide: ['sku', 'size', 'color', 'gender', 'barcode', 'batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Item name',
          quantity: 'Quantity',
          price: 'Price',
          category: 'Category',
          code: 'Barcode',
        },
      },
    },
    navigation: {
      productManagement: 'Menu Management',
      serviceManagement: 'Service Management',
      pointOfSales: 'Order Entry',
      salesInvoice: 'Checks',
    },
  },

  // ========== EDUCATION ==========
  [createKey('Education', 'Tertiary education', 'University')]: {
    terminology: {
      product: 'Course Material',
      service: 'Course',
      invoice: 'Invoice',
      sale: 'Enrollment',
      quantity: 'Sessions',
      price: 'Fee',
      category: 'Department',
      customer: 'Student',
      pos: 'Enrollment',
      addItem: 'Add Item',
      item: 'Item',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Scholarship',
      shipping: 'Delivery',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'code', 'images'],
        hide: ['sku', 'size', 'color', 'barcode', 'batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Course Material name',
          quantity: 'Quantity',
          price: 'Fee',
          category: 'Department',
          code: 'Barcode',
        },
      },
      service: {
        show: ['name', 'description', 'price', 'duration', 'session_count'],
        hide: ['appointment_required'],
        labels: {
          name: 'Course name',
          price: 'Fee',
          duration: 'Duration (hours)',
          session_count: 'Number of Sessions',
        },
      },
    },
    navigation: {
      productManagement: 'Course Material Management',
      serviceManagement: 'Course Management',
      pointOfSales: 'Enrollment',
      salesInvoice: 'Invoices',
    },
  },

  // ========== AGRICULTURE ==========
  [createKey('Agriculture', 'Crop farming', 'Rice farming')]: {
    terminology: {
      product: 'Crop',
      service: 'Service',
      invoice: 'Invoice',
      sale: 'Sale',
      quantity: 'Units',
      price: 'Price per Unit',
      category: 'Category',
      customer: 'Customer',
      pos: 'Sales Entry',
      addItem: 'Add Crop',
      item: 'Crop',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'batch_number', 'harvest_date', 'expiry_date'],
        hide: ['sku', 'code', 'size', 'color', 'barcode', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Crop name',
          quantity: 'Units',
          price: 'Price per Unit',
          category: 'Category',
          batch_number: 'Batch Number',
          harvest_date: 'Harvest Date',
          expiry_date: 'Expiry Date',
          code: 'Barcode',
        },
      },
    },
    navigation: {
      productManagement: 'Crop Management',
      serviceManagement: 'Service Management',
      pointOfSales: 'Sales Entry',
      salesInvoice: 'Invoices',
    },
  },

  // ========== MANUFACTURING ==========
  [createKey('Manufacturing (Light & Heavy)', 'Food processing (flour, sugar, beverages)', 'Food manufacturing')]: {
    terminology: {
      productionInput: 'Raw material',
      product: 'Product',
      service: 'Service',
      invoice: 'Invoice',
      sale: 'Sale',
      quantity: 'Quantity',
      price: 'Price',
      category: 'Category',
      customer: 'Customer',
      pos: 'Sales Entry',
      addItem: 'Add Product',
      item: 'Product',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Shipping',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'batch_number', 'expiry_date'],
        hide: ['size', 'color', 'barcode', 'harvest_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Product name',
          quantity: 'Quantity',
          price: 'Price',
          category: 'Category',
          batch_number: 'Batch Number',
          expiry_date: 'Expiry Date',
          code: 'Barcode',
        },
      },
    },
    navigation: {
      productManagement: 'Product Management',
      serviceManagement: 'Service Management',
      pointOfSales: 'Sales Entry',
      salesInvoice: 'Invoices',
      usageDashboard: 'Raw material usage',
    },
  },

  // ========== CONSTRUCTION ==========
  [createKey('Construction', 'Residential building', 'Construction company')]: {
    terminology: {
      product: 'Material',
      service: 'Service',
      invoice: 'Invoice',
      sale: 'Project',
      quantity: 'Quantity',
      price: 'Price',
      category: 'Category',
      customer: 'Client',
      pos: 'Project Entry',
      addItem: 'Add Material',
      item: 'Material',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery',
      taxes: 'Taxes',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code'],
        hide: ['size', 'color', 'barcode', 'batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Material name',
          quantity: 'Quantity',
          price: 'Price',
          category: 'Category',
          code: 'Barcode',
        },
      },
    },
    navigation: {
      productManagement: 'Material Management',
      serviceManagement: 'Service Management',
      pointOfSales: 'Project Entry',
      salesInvoice: 'Invoices',
    },
  },

  // ========== TRANSPORTATION & LOGISTICS ==========
  [createKey('Transportation & Logistics', 'Courier services', 'Courier company')]: {
    terminology: {
      product: 'Package',
      service: 'Delivery Service',
      invoice: 'Waybill',
      sale: 'Shipment',
      quantity: 'Pieces',
      price: 'Shipping Rate',
      category: 'Shipment Type',
      customer: 'Sender',
      pos: 'Dispatch Counter',
      addItem: 'Add Package',
      item: 'Package',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery Fee',
      taxes: 'Taxes',
      productionInput: 'Logistics Input',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'images'],
        hide: ['batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Package name',
          quantity: 'Pieces',
          price: 'Shipping Rate',
          category: 'Shipment Type',
          code: 'Tracking Code',
        },
      },
      service: {
        show: ['name', 'description', 'price', 'duration'],
        hide: ['appointment_required', 'session_count'],
        labels: {
          name: 'Delivery Service name',
          price: 'Shipping Rate',
          duration: 'Transit Time (days)',
        },
      },
    },
    navigation: {
      productManagement: 'Package Management',
      serviceManagement: 'Delivery Services',
      pointOfSales: 'Dispatch Counter',
      salesInvoice: 'Waybills',
      usageDashboard: 'Usage dashboard',
      quickDashboard: 'Quick Tracking',
      quickRestock: 'Quick Booking',
      salesAndOrdersSection: 'Dispatch & Operations',
      inventorySection: 'Cargo Management',
    },
  },

  [createKey('Transportation & Logistics', 'Courier services', 'Package delivery')]: {
    terminology: {
      product: 'Package',
      service: 'Delivery Service',
      invoice: 'Waybill',
      sale: 'Shipment',
      quantity: 'Pieces',
      price: 'Shipping Rate',
      category: 'Shipment Type',
      customer: 'Sender',
      pos: 'Dispatch Counter',
      addItem: 'Add Package',
      item: 'Package',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Delivery Fee',
      taxes: 'Taxes',
      productionInput: 'Logistics Input',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'images'],
        hide: ['batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Package name',
          quantity: 'Pieces',
          price: 'Shipping Rate',
          category: 'Shipment Type',
          code: 'Tracking Code',
        },
      },
      service: {
        show: ['name', 'description', 'price', 'duration'],
        hide: ['appointment_required', 'session_count'],
        labels: {
          name: 'Delivery Service name',
          price: 'Shipping Rate',
          duration: 'Transit Time (days)',
        },
      },
    },
    navigation: {
      productManagement: 'Package Management',
      serviceManagement: 'Delivery Services',
      pointOfSales: 'Dispatch Counter',
      salesInvoice: 'Waybills',
      usageDashboard: 'Usage dashboard',
      quickDashboard: 'Quick Tracking',
      quickRestock: 'Quick Booking',
      salesAndOrdersSection: 'Dispatch & Operations',
      inventorySection: 'Cargo Management',
    },
  },

  [createKey('Transportation & Logistics', 'Courier services', 'Express delivery')]: {
    terminology: {
      product: 'Package',
      service: 'Express Service',
      invoice: 'Waybill',
      sale: 'Shipment',
      quantity: 'Pieces',
      price: 'Shipping Rate',
      category: 'Shipment Type',
      customer: 'Sender',
      pos: 'Dispatch Counter',
      addItem: 'Add Package',
      item: 'Package',
      description: 'Description',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      shipping: 'Express Fee',
      taxes: 'Taxes',
      productionInput: 'Logistics Input',
    },
    fields: {
      product: {
        show: ['name', 'description', 'price', 'quantity', 'category', 'sku', 'code', 'images'],
        hide: ['batch_number', 'harvest_date', 'expiry_date', 'prescription_info', 'dosage', 'duration', 'appointment_time'],
        labels: {
          name: 'Package name',
          quantity: 'Pieces',
          price: 'Shipping Rate',
          category: 'Shipment Type',
          code: 'Tracking Code',
        },
      },
      service: {
        show: ['name', 'description', 'price', 'duration'],
        hide: ['appointment_required', 'session_count'],
        labels: {
          name: 'Express Service name',
          price: 'Shipping Rate',
          duration: 'Transit Time (days)',
        },
      },
    },
    navigation: {
      productManagement: 'Package Management',
      serviceManagement: 'Express Services',
      pointOfSales: 'Dispatch Counter',
      salesInvoice: 'Waybills',
      usageDashboard: 'Usage dashboard',
      quickDashboard: 'Quick Tracking',
      quickRestock: 'Quick Booking',
      salesAndOrdersSection: 'Dispatch & Operations',
      inventorySection: 'Cargo Management',
    },
  },

  // ---- Hotels / Lodging (Front Desk) ----
  ...Object.fromEntries(
    [
      ['Hotels', 'Hotel'],
      ['Hotels', 'Lodge'],
      ['Hotels', 'Guest house'],
      ['Hotels', 'Boutique hotel'],
      ['Resorts', 'Resort'],
      ['Resorts', 'Beach resort'],
      ['Resorts', 'Spa resort'],
      ['Resorts', 'Holiday resort'],
    ].map(([sub, exact]) => [
      createKey('Tourism & Hospitality', sub, exact),
      {
        features: { frontDesk: true },
        terminology: {
          ...DEFAULT_CONFIG.terminology,
          customer: 'Guest',
          sale: 'Folio',
          invoice: 'Folio / Invoice',
          // Services = spa, laundry, etc. Rooms live under Front Desk → Setup.
          service: 'Service',
          product: 'Amenity / Product',
          pos: 'Front Desk / POS',
          salePlural: 'Folios',
          invoicePlural: 'Folios',
          todaySalesTitle: "Today's Folios",
        },
        fields: DEFAULT_CONFIG.fields,
        navigation: {
          ...DEFAULT_CONFIG.navigation,
          frontDesk: 'Front Desk',
          serviceLog: 'Service Log',
          serviceManagement: 'Other Services',
          salesAndOrdersSection: 'Front Desk & Sales',
          customer: 'Guests',
        },
      },
    ])
  ),
};

// Function to get business type configuration
export const getBusinessTypeConfig = (industry, subIndustry, exactBusiness) => {
  const key = createKey(industry, subIndustry, exactBusiness);
  return BUSINESS_TYPE_CONFIGS[key] || DEFAULT_CONFIG;
};

// Function to get terminology for a business type
export const getTerminology = (industry, subIndustry, exactBusiness) => {
  const config = getBusinessTypeConfig(industry, subIndustry, exactBusiness);
  return config.terminology;
};

// Function to get field configuration for a business type
export const getFieldConfig = (industry, subIndustry, exactBusiness, entityType = 'product') => {
  const config = getBusinessTypeConfig(industry, subIndustry, exactBusiness);
  return config.fields?.[entityType] || DEFAULT_CONFIG.fields[entityType];
};

// Function to get navigation labels for a business type
export const getNavigationLabels = (industry, subIndustry, exactBusiness) => {
  const config = getBusinessTypeConfig(industry, subIndustry, exactBusiness);
  return config.navigation || DEFAULT_CONFIG.navigation;
};

// Export default config for fallback
export { DEFAULT_CONFIG };
