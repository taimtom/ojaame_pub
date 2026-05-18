import { getTemplateConfig } from 'src/config/store-website-template-configs';

export { getTemplateConfig };

export function getTemplateSections(templateId) {
  return getTemplateConfig(templateId)?.sections || ['hero', 'featured', 'cta'];
}

export function getTrustMetricDefaults(templateId) {
  const config = getTemplateConfig(templateId);
  return config.trustMetrics || [
    { value: '10+', label: 'Years of Experience', icon: '🏆' },
    { value: '2,400+', label: 'Happy Clients', icon: '❤️' },
    { value: '4.9', label: 'Average Rating', icon: '⭐' },
    { value: '< 1h', label: 'Response Time', icon: '⚡' },
  ];
}

export function getServiceDefaults(templateId) {
  const config = getTemplateConfig(templateId);
  return {
    title: 'What we offer',
    subtitle: 'Everything you need, delivered with care and expertise',
    items: config.services || [],
  };
}

export function getFeatureDefaults(templateId) {
  const config = getTemplateConfig(templateId);
  return {
    title: 'Why choose us',
    subtitle: 'What makes us different from the rest',
    items: config.features || [],
  };
}

export function getTestimonialDefaults() {
  return {
    title: 'What customers say',
    subtitle: 'Real reviews from real people',
    ratingSummary: '4.9 / 5',
    items: [
      { name: 'Amara O.', location: 'Lagos', rating: 5, text: 'Absolutely love this store...', avatar: 'AO' },
      { name: 'Chidi N.', location: 'Abuja', rating: 5, text: 'Best shopping experience...', avatar: 'CN' },
      { name: 'Fatima B.', location: 'Kano', rating: 5, text: 'I was skeptical at first...', avatar: 'FB' },
      { name: 'Emeka T.', location: 'Port Harcourt', rating: 4, text: 'Great selection...', avatar: 'ET' },
    ],
  };
}

export function getCtaDefaults(templateId, storeName = 'our store') {
  const config = getTemplateConfig(templateId);
  const isService = config?.family === 'service';
  return {
    eyebrow: isService ? 'Get started today' : 'Shop now',
    title: isService ? `Ready to experience ${storeName}?` : `Start shopping at ${storeName} today`,
    subtitle: isService
      ? 'Book your appointment or browse our services online — we make it easy.'
      : 'Browse our full catalogue and find exactly what you need, delivered to your door.',
    primaryCta: isService ? 'Book now' : 'Shop the catalogue',
    secondaryCta: 'View cart',
  };
}

export function getHeroDefaults(templateId) {
  const config = getTemplateConfig(templateId);
  return {
    title: config.heroText || '',
    subtitle: config.heroSubText || '',
    ctaLabel: config.ctaLabel || 'Shop now',
    badge: config.hero === 'centered' ? 'Trusted by 1,200+ clients' : '',
    trustBadge: config.hero === 'centered' ? 'Trusted by 1,200+ clients' : '',
  };
}

/** Deep-merge content_config path (only non-empty overrides). */
export function setContentConfigValue(methods, updater) {
  const current = methods.getValues('content_config') || {};
  methods.setValue('content_config', updater(current), { shouldDirty: true });
}

export function setNestedContent(methods, section, value) {
  setContentConfigValue(methods, (current) => ({
    ...current,
    [section]: value,
  }));
}

export function setListItemField(methods, section, index, field, value) {
  setContentConfigValue(methods, (current) => {
    const sectionData = { ...(current[section] || {}) };
    const items = [...(sectionData.items || [])];
    items[index] = { ...(items[index] || {}), [field]: value };
    return { ...current, [section]: { ...sectionData, items } };
  });
}

export function setListItemFieldDirect(methods, listKey, index, field, value) {
  setContentConfigValue(methods, (current) => {
    const items = [...(current[listKey] || [])];
    items[index] = { ...(items[index] || {}), [field]: value };
    return { ...current, [listKey]: items };
  });
}
