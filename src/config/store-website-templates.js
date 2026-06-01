// Store Website Templates Registry
// High-level template definitions for public store websites.

export const STORE_WEBSITE_TEMPLATES = [
  { id: 'product-01', name: 'Fresh Market', category: 'Product', thumbnail: '/assets/store-website/product-01.png', description: 'Bright grocery-first storefront.' },
  { id: 'product-02', name: 'Urban Boutique', category: 'Product', thumbnail: '/assets/store-website/product-02.png', description: 'Fashion-forward retail layout.' },
  { id: 'product-03', name: 'Tech Hub', category: 'Product', thumbnail: '/assets/store-website/product-03.png', description: 'Modern electronics and gadgets style.' },
  { id: 'product-04', name: 'Home & Living', category: 'Product', thumbnail: '/assets/store-website/product-04.png', description: 'Calm interiors and decor showcase.' },
  { id: 'product-05', name: 'Quick Mart', category: 'Product', thumbnail: '/assets/store-website/product-05.png', description: 'Fast-purchase convenience layout.' },
  { id: 'product-06', name: 'Craft Shop', category: 'Product', thumbnail: '/assets/store-website/product-06.png', description: 'Handmade and artisan focus.' },
  { id: 'product-07', name: 'Pharma Plus', category: 'Product', thumbnail: '/assets/store-website/product-07.png', description: 'Clean pharmacy storefront.' },
  { id: 'product-08', name: 'Kids World', category: 'Product', thumbnail: '/assets/store-website/product-08.png', description: 'Playful children product layout.' },
  { id: 'service-01', name: 'Salon & Spa', category: 'Service', thumbnail: '/assets/store-website/service-01.png', description: 'Beauty service landing style.' },
  { id: 'service-02', name: 'Auto Workshop', category: 'Service', thumbnail: '/assets/store-website/service-02.png', description: 'Automotive service focus.' },
  { id: 'service-03', name: 'Cafe & Bistro', category: 'Service', thumbnail: '/assets/store-website/service-03.png', description: 'Food and hospitality theme.' },
  { id: 'service-04', name: 'Fitness Studio', category: 'Service', thumbnail: '/assets/store-website/service-04.png', description: 'Energetic gym and trainer template.' },
  { id: 'service-05', name: 'Clinic Pro', category: 'Service', thumbnail: '/assets/store-website/service-05.png', description: 'Professional healthcare style.' },
  { id: 'service-06', name: 'Legal & Consulting', category: 'Service', thumbnail: '/assets/store-website/service-06.png', description: 'Corporate advisory style.' },
  { id: 'service-07', name: 'Event Planners', category: 'Service', thumbnail: '/assets/store-website/service-07.png', description: 'Event and booking-focused layout.' },
];

export function getStoreWebsiteTemplate(templateId) {
  return (
    STORE_WEBSITE_TEMPLATES.find((tpl) => tpl.id === templateId) ||
    STORE_WEBSITE_TEMPLATES[0] ||
    null
  );
}

