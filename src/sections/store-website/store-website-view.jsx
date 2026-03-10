import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import { HeroSection } from './hero-section';
import { AboutSection } from './about-section';
import { ProductGridSection } from './product-grid-section';
import { ContactSection } from './contact-section';
import { FooterSection } from './footer-section';

export function StoreWebsiteView({ website, template }) {
  if (!website || !template) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const { content_config: contentConfig = {}, theme_config: themeConfig = {} } = website;
  const content = { ...template.defaultContent, ...contentConfig };

  return (
    <Box component="main">
      {template.sections.map((section) => {
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
