// Store Website Templates Registry
// High-level template definitions for public store websites.

export const STORE_WEBSITE_TEMPLATES = [
  {
    id: 'retail-classic',
    name: 'Retail Classic',
    thumbnail: '/assets/store-website/retail-classic.png',
    description: 'Clean, product-focused layout ideal for retail stores.',
    sections: [
      { type: 'hero', key: 'hero' },
      { type: 'productGrid', key: 'featuredProducts' },
      { type: 'about', key: 'about' },
      { type: 'contact', key: 'contact' },
      { type: 'footer', key: 'footer' },
    ],
    defaultContent: {
      hero: {
        title: 'Welcome to Your Store',
        subtitle: 'Discover our latest products and best deals.',
        ctaLabel: 'Shop now',
        ctaUrl: '#products',
        backgroundImage: '',
        layoutVariant: 'image-right',
      },
      featuredProducts: {
        title: 'Featured products',
        source: 'auto',
        categoryIds: [],
        productIds: [],
        maxItems: 8,
        sortOrder: 'newest',
      },
      about: {
        title: 'About us',
        body: 'Share your story, mission, and what makes your business unique.',
      },
      contact: {
        title: 'Visit or contact us',
        address: '',
        phoneNumber: '',
        email: '',
        mapEmbedUrl: '',
      },
      footer: {
        copyrightText: '© Your Store. All rights reserved.',
        links: [],
      },
    },
  },
  {
    id: 'service-portfolio',
    name: 'Service Portfolio',
    thumbnail: '/assets/store-website/service-portfolio.png',
    description: 'Elegant layout tailored for service-based businesses.',
    sections: [
      { type: 'hero', key: 'hero' },
      { type: 'serviceList', key: 'services' },
      { type: 'testimonials', key: 'testimonials' },
      { type: 'contact', key: 'contact' },
      { type: 'footer', key: 'footer' },
    ],
    defaultContent: {
      hero: {
        title: 'Professional services you can trust',
        subtitle: 'Highlight your expertise and build credibility.',
        ctaLabel: 'Book an appointment',
        ctaUrl: '#contact',
        backgroundImage: '',
        layoutVariant: 'centered',
      },
      services: {
        title: 'Our services',
        source: 'auto',
        serviceIds: [],
        maxItems: 6,
      },
      testimonials: {
        title: 'What our clients say',
        items: [],
      },
      contact: {
        title: 'Get in touch',
        address: '',
        phoneNumber: '',
        email: '',
        mapEmbedUrl: '',
      },
      footer: {
        copyrightText: '© Your Business. All rights reserved.',
        links: [],
      },
    },
  },
];

export function getStoreWebsiteTemplate(templateId) {
  return (
    STORE_WEBSITE_TEMPLATES.find((tpl) => tpl.id === templateId) ||
    STORE_WEBSITE_TEMPLATES[0] ||
    null
  );
}

