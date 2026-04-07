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
  },
};

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
