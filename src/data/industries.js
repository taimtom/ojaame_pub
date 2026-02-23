// Industry classification data structure
// Three levels: Industry -> Sub Industry -> Exact Business
// Industry shows sub-industries, Sub Industry shows exact businesses, Exact Business is filtered by sub-industry

export const industries = {
  "Agriculture": {
    subIndustries: {
      "Crop farming": [
        "Rice farming",
        "Maize farming",
        "Wheat farming",
        "Cassava farming",
        "Yam farming",
        "Vegetable farming",
        "Mixed crop farming"
      ],
      "Cash crops": [
        "Cocoa farming",
        "Coffee farming",
        "Cotton farming",
        "Rubber farming",
        "Oil palm farming",
        "Tea farming",
        "Sugarcane farming"
      ],
      "Horticulture": [
        "Fruit farming",
        "Vegetable cultivation",
        "Nursery operation",
        "Greenhouse farming",
        "Hydroponic farming"
      ],
      "Floriculture": [
        "Flower farming",
        "Ornamental plant production",
        "Flower export",
        "Landscaping services"
      ],
      "Organic farming": [
        "Organic crop production",
        "Organic vegetable farming",
        "Organic certification services"
      ],
      "Subsistence farming": [
        "Small-scale farming",
        "Family farming",
        "Traditional farming"
      ],
      "Commercial farming": [
        "Large-scale farming",
        "Agribusiness",
        "Farm management services"
      ]
    }
  },
  "Livestock & Animal Husbandry": {
    subIndustries: {
      "Cattle rearing": [
        "Beef cattle farming",
        "Dairy cattle farming",
        "Cattle breeding",
        "Cattle feed production"
      ],
      "Poultry farming": [
        "Poultry meat production",
        "Egg production",
        "Chicken farming",
        "Turkey farming",
        "Duck farming"
      ],
      "Pig farming": [
        "Pig breeding",
        "Pork production",
        "Pig feed manufacturing"
      ],
      "Sheep & goat farming": [
        "Goat farming",
        "Sheep farming",
        "Goat milk production",
        "Wool production"
      ],
      "Dairy farming": [
        "Milk production",
        "Dairy processing",
        "Cheese making",
        "Yogurt production"
      ],
      "Beekeeping (apiculture)": [
        "Honey production",
        "Bee farming",
        "Wax production",
        "Pollination services"
      ],
      "Snail farming": [
        "Snail breeding",
        "Snail production",
        "Heliciculture"
      ]
    }
  },
  "Fishing & Aquaculture": {
    subIndustries: {
      "Marine fishing": [
        "Deep sea fishing",
        "Coastal fishing",
        "Fish processing",
        "Seafood export"
      ],
      "Inland fishing": [
        "River fishing",
        "Lake fishing",
        "Freshwater fish processing"
      ],
      "Fish farming (catfish, tilapia)": [
        "Catfish farming",
        "Tilapia farming",
        "Fish hatchery",
        "Aquaculture feed production"
      ],
      "Shrimp farming": [
        "Shrimp production",
        "Shrimp processing",
        "Shrimp export"
      ],
      "Oyster farming": [
        "Oyster production",
        "Shellfish farming",
        "Mussel farming"
      ]
    }
  },
  "Forestry": {
    subIndustries: {
      "Timber logging": [
        "Timber export",
        "Sawmill operation",
        "Wood processing",
        "Lumber production"
      ],
      "Firewood production": [
        "Firewood supply",
        "Wood fuel production"
      ],
      "Charcoal production": [
        "Charcoal manufacturing",
        "Charcoal supply"
      ],
      "Pulpwood harvesting": [
        "Pulp production",
        "Paper raw material supply"
      ],
      "Rubber tapping": [
        "Natural rubber production",
        "Rubber processing"
      ],
      "Bamboo harvesting": [
        "Bamboo production",
        "Bamboo processing",
        "Bamboo products"
      ]
    }
  },
  "Mining & Quarrying": {
    subIndustries: {
      "Crude oil extraction": [
        "Oil & gas exploration",
        "Petroleum production",
        "Oil drilling services"
      ],
      "Natural gas extraction": [
        "Gas production",
        "Gas processing",
        "LNG production"
      ],
      "Coal mining": [
        "Coal production",
        "Coal processing",
        "Mining consultancy"
      ],
      "Gold mining": [
        "Gold extraction",
        "Gold processing",
        "Precious metals mining"
      ],
      "Iron ore mining": [
        "Iron ore extraction",
        "Iron processing",
        "Steel raw material supply"
      ],
      "Limestone quarrying": [
        "Limestone extraction",
        "Cement raw material supply"
      ],
      "Granite quarrying": [
        "Granite extraction",
        "Stone processing",
        "Marble quarrying"
      ],
      "Sand dredging": [
        "Sand extraction",
        "Sand supply",
        "Construction sand supply"
      ],
      "Salt mining": [
        "Salt production",
        "Salt processing",
        "Industrial salt supply"
      ]
    }
  },
  "Manufacturing (Light & Heavy)": {
    subIndustries: {
      "Food processing (flour, sugar, beverages)": [
        "Food manufacturing",
        "Beverage production",
        "Bakery",
        "Confectionery",
        "Flour mill",
        "Sugar factory"
      ],
      "Textile & garment production": [
        "Textile manufacturing",
        "Garment factory",
        "Clothing production",
        "Fabric manufacturing"
      ],
      "Leather & footwear manufacturing": [
        "Shoe manufacturing",
        "Leather goods production",
        "Bag manufacturing"
      ],
      "Plastic manufacturing": [
        "Plastic products manufacturing",
        "Plastic injection molding",
        "Packaging production"
      ],
      "Cement production": [
        "Cement factory",
        "Concrete production",
        "Building materials manufacturing"
      ],
      "Glass manufacturing": [
        "Glass production",
        "Glass products manufacturing"
      ],
      "Paper & pulp production": [
        "Paper mill",
        "Pulp production",
        "Paper products manufacturing"
      ],
      "Steel & metal fabrication": [
        "Metal works",
        "Welding services",
        "Steel production",
        "Metal fabrication"
      ],
      "Automobile manufacturing": [
        "Vehicle manufacturing",
        "Car assembly",
        "Auto parts manufacturing"
      ],
      "Electronics manufacturing": [
        "Electronics production",
        "Electronic components manufacturing",
        "Consumer electronics"
      ],
      "Furniture making": [
        "Furniture workshop",
        "Carpentry",
        "Furniture manufacturing",
        "Woodworking"
      ]
    }
  },
  "Processing Industries": {
    subIndustries: {
      "Oil refining": [
        "Oil refinery",
        "Petroleum refining",
        "Fuel production"
      ],
      "Palm oil processing": [
        "Palm oil mill",
        "Palm oil refining",
        "Edible oil production"
      ],
      "Cocoa processing": [
        "Cocoa processing plant",
        "Chocolate manufacturing",
        "Cocoa products"
      ],
      "Rice milling": [
        "Rice mill",
        "Rice processing",
        "Grain processing"
      ],
      "Sugar refining": [
        "Sugar factory",
        "Sugar processing",
        "Sweetener production"
      ],
      "Meat processing": [
        "Meat processing plant",
        "Abattoir",
        "Meat products manufacturing"
      ],
      "Dairy processing": [
        "Dairy processing plant",
        "Milk processing",
        "Dairy products manufacturing"
      ]
    }
  },
  "Construction": {
    subIndustries: {
      "Residential building": [
        "Construction company",
        "Real estate development",
        "Home building",
        "Residential construction"
      ],
      "Commercial building": [
        "Commercial construction",
        "Office building construction",
        "Retail space development"
      ],
      "Road construction": [
        "Road building",
        "Highway construction",
        "Infrastructure development"
      ],
      "Bridge construction": [
        "Bridge building",
        "Infrastructure engineering"
      ],
      "Dam construction": [
        "Dam building",
        "Water infrastructure"
      ],
      "Civil engineering works": [
        "Civil engineering",
        "Infrastructure projects",
        "Engineering consultancy"
      ],
      "Plumbing and electrical installation": [
        "Plumbing services",
        "Electrical installation",
        "HVAC services",
        "Interior design"
      ]
    }
  },
  "Assembly Industries": {
    subIndustries: {
      "Electronics assembly": [
        "Electronics manufacturing",
        "Electronic assembly",
        "Consumer electronics assembly"
      ],
      "Vehicle assembly": [
        "Vehicle manufacturing",
        "Car assembly plant",
        "Automotive assembly"
      ],
      "Appliance assembly": [
        "Appliance manufacturing",
        "Home appliance assembly",
        "White goods production"
      ],
      "Machinery assembly": [
        "Machinery manufacturing",
        "Industrial equipment assembly",
        "Machine building"
      ]
    }
  },
  "Trade & Commerce": {
    subIndustries: {
      "Wholesale trade": [
        "Wholesale distribution",
        "B2B trading",
        "Wholesale supply"
      ],
      "Retail trade": [
        "Retail store",
        "Supermarket",
        "Market stall",
        "Convenience store"
      ],
      "E-commerce": [
        "Online store",
        "E-commerce platform",
        "Online marketplace"
      ],
      "Import & export": [
        "Import business",
        "Export business",
        "Trading company",
        "International trade"
      ],
      "Market trading": [
        "Market stall",
        "Street vending",
        "Local trading"
      ]
    }
  },
  "Transportation & Logistics": {
    subIndustries: {
      "Road transport": [
        "Trucking services",
        "Taxi services",
        "Bus services",
        "Freight transport"
      ],
      "Rail transport": [
        "Railway services",
        "Rail freight",
        "Rail logistics"
      ],
      "Air transport": [
        "Airline",
        "Air cargo",
        "Aviation services"
      ],
      "Sea transport": [
        "Shipping company",
        "Maritime transport",
        "Cargo shipping"
      ],
      "Courier services": [
        "Courier company",
        "Package delivery",
        "Express delivery"
      ],
      "Warehousing": [
        "Warehouse management",
        "Storage services",
        "Distribution center"
      ],
      "Freight forwarding": [
        "Logistics company",
        "Freight forwarding",
        "Supply chain management"
      ]
    }
  },
  "Communication & Information": {
    subIndustries: {
      "Telecommunications": [
        "Mobile network operator",
        "Telecom services",
        "Telecommunications provider"
      ],
      "Internet service providers": [
        "Internet service provider",
        "ISP services",
        "Broadband provider"
      ],
      "Broadcasting (TV, radio)": [
        "TV station",
        "Radio station",
        "Broadcasting services",
        "Media production"
      ],
      "Publishing": [
        "Newspaper",
        "Magazine",
        "Book publishing",
        "Digital publishing"
      ],
      "Printing": [
        "Printing press",
        "Print services",
        "Commercial printing"
      ],
      "Media & advertising": [
        "Advertising agency",
        "Media company",
        "Marketing services"
      ]
    }
  },
  "Financial Services": {
    subIndustries: {
      "Banking": [
        "Commercial bank",
        "Retail banking",
        "Investment banking"
      ],
      "Microfinance": [
        "Microfinance bank",
        "Microcredit services",
        "Financial inclusion services"
      ],
      "Insurance": [
        "Insurance company",
        "Life insurance",
        "General insurance"
      ],
      "Investment services": [
        "Investment company",
        "Asset management",
        "Wealth management"
      ],
      "Stock brokerage": [
        "Stock brokerage",
        "Securities trading",
        "Investment advisory"
      ],
      "Fintech services": [
        "Fintech startup",
        "Digital banking",
        "Payment services",
        "Financial technology"
      ]
    }
  },
  "Professional & Business Services": {
    subIndustries: {
      "Software development": [
        "Software company",
        "Web development",
        "Mobile app development",
        "Software consulting"
      ],
      "IT services & cloud services": [
        "IT consultancy",
        "Cloud services",
        "IT support",
        "Managed IT services"
      ],
      "Consulting": [
        "Management consultancy",
        "Business consulting",
        "Strategy consulting"
      ],
      "Legal services": [
        "Law firm",
        "Legal consultancy",
        "Legal advisory"
      ],
      "Accounting & auditing": [
        "Accounting firm",
        "Audit firm",
        "Tax services",
        "Bookkeeping services"
      ],
      "Architecture": [
        "Architecture firm",
        "Architectural services",
        "Architectural design"
      ],
      "Engineering services": [
        "Engineering consultancy",
        "Engineering design",
        "Technical consulting"
      ],
      "Digital marketing": [
        "Digital marketing agency",
        "SEO services",
        "Social media marketing",
        "Online advertising"
      ]
    }
  },
  "Education": {
    subIndustries: {
      "Primary education": [
        "Primary school",
        "Elementary school",
        "Basic education"
      ],
      "Secondary education": [
        "Secondary school",
        "High school",
        "Secondary education"
      ],
      "Tertiary education": [
        "University",
        "College",
        "Higher education"
      ],
      "Vocational training": [
        "Vocational school",
        "Skills training",
        "Technical training"
      ],
      "Online education": [
        "Online learning platform",
        "E-learning",
        "Distance education"
      ]
    }
  },
  "Health & Social Services": {
    subIndustries: {
      "Hospitals": [
        "Private hospital",
        "Public hospital",
        "General hospital",
        "Specialty hospital"
      ],
      "Clinics": [
        "Medical clinic",
        "Dental clinic",
        "Health clinic",
        "Outpatient clinic"
      ],
      "Pharmacies": [
        "Pharmacy",
        "Drug store",
        "Pharmaceutical retail"
      ],
      "Diagnostic labs": [
        "Laboratory",
        "Diagnostic center",
        "Medical testing",
        "Pathology lab"
      ],
      "Nursing services": [
        "Nursing home",
        "Home care services",
        "Nursing care"
      ],
      "Mental health services": [
        "Mental health clinic",
        "Psychiatric services",
        "Counseling services"
      ]
    }
  },
  "Tourism & Hospitality": {
    subIndustries: {
      "Hotels": [
        "Hotel",
        "Lodge",
        "Guest house",
        "Boutique hotel"
      ],
      "Resorts": [
        "Resort",
        "Beach resort",
        "Spa resort",
        "Holiday resort"
      ],
      "Restaurants": [
        "Restaurant",
        "Cafe",
        "Fast food",
        "Fine dining",
        "Catering services"
      ],
      "Travel agencies": [
        "Travel agency",
        "Tour operator",
        "Travel services"
      ],
      "Event planning": [
        "Event planning company",
        "Event management",
        "Wedding planning"
      ],
      "Tour guiding": [
        "Tour guide services",
        "Tourism services",
        "Cultural tours"
      ]
    }
  },
  "Public & Government Services": {
    subIndustries: {
      "Public administration": [
        "Government agency",
        "Public service",
        "Administrative services"
      ],
      "Defense": [
        "Military services",
        "Defense contractor",
        "Security services"
      ],
      "Police services": [
        "Law enforcement",
        "Police department",
        "Security services"
      ],
      "Fire services": [
        "Fire department",
        "Fire safety services",
        "Emergency services"
      ],
      "Judiciary": [
        "Court services",
        "Legal system",
        "Judicial services"
      ]
    }
  },
  "Personal & Community Services": {
    subIndustries: {
      "Hairdressing & beauty services": [
        "Beauty salon",
        "Barbershop",
        "Spa",
        "Hair salon",
        "Nail salon"
      ],
      "Laundry services": [
        "Laundry service",
        "Dry cleaning",
        "Laundromat"
      ],
      "Cleaning services": [
        "Cleaning company",
        "Janitorial services",
        "Commercial cleaning"
      ],
      "Repair services (phones, electronics, vehicles)": [
        "Phone repair",
        "Electronics repair",
        "Vehicle repair",
        "Appliance repair"
      ],
      "Fitness & sports services": [
        "Gym",
        "Fitness center",
        "Sports club",
        "Personal training"
      ],
      "Religious services": [
        "Church",
        "Mosque",
        "Religious organization",
        "Place of worship"
      ]
    }
  }
};

// Helper functions to get data
export const getIndustries = () => Object.keys(industries).map(key => ({
  value: key,
  label: key
}));

export const getSubIndustries = (industry) => {
  if (!industry || !industries[industry]) {
    return [];
  }
  return Object.keys(industries[industry].subIndustries).map(subIndustry => ({
    value: subIndustry,
    label: subIndustry
  }));
};

export const getExactBusinesses = (industry, subIndustry) => {
  if (!industry || !subIndustry || !industries[industry]) {
    return [];
  }
  const exactBusinessesList = industries[industry].subIndustries[subIndustry];
  if (!exactBusinessesList) {
    return [];
  }
  return exactBusinessesList.map(business => ({
    value: business,
    label: business
  }));
};
