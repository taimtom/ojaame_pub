import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import { HeroSection } from './hero-section';
import { AboutSection } from './about-section';
import { ProductGridSection } from './product-grid-section';
import { ContactSection } from './contact-section';
import { FooterSection } from './footer-section';

const FALLBACK_SECTIONS = [
  { type: 'hero', key: 'hero' },
  { type: 'productGrid', key: 'featuredProducts' },
  { type: 'about', key: 'about' },
  { type: 'contact', key: 'contact' },
  { type: 'footer', key: 'footer' },
];

const FALLBACK_CONTENT = {
  hero: {
    title: 'Welcome to Your Store',
    subtitle: 'Discover our latest products and best deals.',
    ctaLabel: 'Shop now',
  },
  featuredProducts: {
    title: 'Featured products',
    source: 'auto',
    maxItems: 8,
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
  },
  footer: {
    copyrightText: '© Your Store. All rights reserved.',
    links: [],
  },
};

export function StoreWebsiteView({ website, template }) {
  if (!website || !template) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const { content_config: contentConfig = {}, theme_config: themeConfig = {} } = website;
  const sections = Array.isArray(template.sections) && template.sections.length
    ? template.sections
    : FALLBACK_SECTIONS;
  const content = { ...FALLBACK_CONTENT, ...(template.defaultContent || {}), ...contentConfig };

  return (
    <Box component="main">
      {sections.map((section) => {
        const key = section.key;
        const sectionContent = content[key] || {};

        switch (section.type) {
          case 'hero':
            return (
              <HeroSection
                key={key}
                content={sectionContent}
                theme={themeConfig}
              />
            );
          case 'productGrid':
            return (
              <ProductGridSection
                key={key}
                content={sectionContent}
                theme={themeConfig}
              />
            );
          case 'about':
            return (
              <AboutSection
                key={key}
                content={sectionContent}
                theme={themeConfig}
              />
            );
          case 'contact':
            return <ContactSection key={key} content={sectionContent} />;
          case 'footer':
            return <FooterSection key={key} content={sectionContent} />;
          default:
            return null;
        }
      })}
    </Box>
  );
}
