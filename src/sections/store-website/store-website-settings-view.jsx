import { useEffect } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { STORE_WEBSITE_TEMPLATES, getStoreWebsiteTemplate } from 'src/config/store-website-templates';
import { StoreWebsiteView } from './store-website-view';

export function StoreWebsiteSettingsView({ methods, onSubmit, website }) {
  const templateId = methods.watch('template_id');
  const selectedTemplate = getStoreWebsiteTemplate(templateId || website?.template_id);

  useEffect(() => {
    if (!methods.getValues('template_id') && selectedTemplate) {
      methods.setValue('template_id', selectedTemplate.id);
    }
  }, [methods, selectedTemplate]);

  const watchedContentConfig = methods.watch('content_config') || {};

  const previewWebsite = {
    ...website,
    template_id: templateId || website?.template_id,
    seo_title: methods.watch('seo_title') || website?.seo_title,
    seo_description: methods.watch('seo_description') || website?.seo_description,
    theme_config: methods.watch('theme_config') || website?.theme_config || {},
    content_config: {
      ...(website?.content_config || {}),
      ...watchedContentConfig,
    },
  };

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            {/* Basic Settings */}
            <Card sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Website settings</Typography>
                <Field.Switch name="has_public_site" label="Enable public website" />
                <Field.Text
                  name="slug"
                  label="Slug (subdomain identifier)"
                  helperText="Used for URLs like /site/your-slug"
                />
                <Typography variant="subtitle2">Template</Typography>
                <Grid container spacing={1.5}>
                  {STORE_WEBSITE_TEMPLATES.map((tpl) => {
                    const selected = (templateId || website?.template_id) === tpl.id;
                    return (
                      <Grid item xs={12} sm={6} key={tpl.id}>
                        <Card
                          onClick={() => methods.setValue('template_id', tpl.id)}
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: selected ? 'primary.main' : 'divider',
                            boxShadow: selected ? 4 : 0,
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle2">{tpl.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tpl.category}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tpl.description}
                            </Typography>
                            <Typography variant="caption" color={selected ? 'primary.main' : 'text.secondary'}>
                              {selected ? 'Selected' : 'Click to select'}
                            </Typography>
                          </Stack>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            </Card>

            {/* Hero Content */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Hero section</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Field.Text
                    name="content_config.hero.title"
                    label="Heading"
                    placeholder="Welcome to our store"
                    onChange={(e) => {
                      const current = methods.getValues('content_config') || {};
                      methods.setValue('content_config', {
                        ...current,
                        hero: { ...(current.hero || {}), title: e.target.value },
                      });
                    }}
                  />
                  <Field.Text
                    name="content_config.hero.subtitle"
                    label="Subtitle"
                    multiline
                    rows={2}
                    onChange={(e) => {
                      const current = methods.getValues('content_config') || {};
                      methods.setValue('content_config', {
                        ...current,
                        hero: { ...(current.hero || {}), subtitle: e.target.value },
                      });
                    }}
                  />
                  <Field.Text
                    name="content_config.hero.ctaLabel"
                    label="Button label"
                    placeholder="Shop now"
                    onChange={(e) => {
                      const current = methods.getValues('content_config') || {};
                      methods.setValue('content_config', {
                        ...current,
                        hero: { ...(current.hero || {}), ctaLabel: e.target.value },
                      });
                    }}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* About Content */}
            <Accordion>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">About section</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Field.Text
                    name="content_config.about.title"
                    label="Title"
                    placeholder="About us"
                    onChange={(e) => {
                      const current = methods.getValues('content_config') || {};
                      methods.setValue('content_config', {
                        ...current,
                        about: { ...(current.about || {}), title: e.target.value },
                      });
                    }}
                  />
                  <Field.Text
                    name="content_config.about.body"
                    label="Body text"
                    multiline
                    rows={4}
                    placeholder="Tell your story..."
                    onChange={(e) => {
                      const current = methods.getValues('content_config') || {};
                      methods.setValue('content_config', {
                        ...current,
                        about: { ...(current.about || {}), body: e.target.value },
                      });
                    }}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Contact Content */}
            <Accordion>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Contact section</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Field.Text
                    name="content_config.contact.title"
                    label="Section title"
                    placeholder="Visit or contact us"
                    onChange={(e) => {
                      const current = methods.getValues('content_config') || {};
                      methods.setValue('content_config', {
                        ...current,
                        contact: { ...(current.contact || {}), title: e.target.value },
                      });
                    }}
                  />
                  <Field.Text
                    name="content_config.contact.address"
                    label="Address"
                    multiline
                    rows={2}
                    onChange={(e) => {
                      const current = methods.getValues('content_config') || {};
                      methods.setValue('content_config', {
                        ...current,
                        contact: { ...(current.contact || {}), address: e.target.value },
                      });
                    }}
                  />
                  <Field.Text
                    name="content_config.contact.phoneNumber"
                    label="Phone number"
                    onChange={(e) => {
                      const current = methods.getValues('content_config') || {};
                      methods.setValue('content_config', {
                        ...current,
                        contact: { ...(current.contact || {}), phoneNumber: e.target.value },
                      });
                    }}
                  />
                  <Field.Text
                    name="content_config.contact.email"
                    label="Email"
                    type="email"
                    onChange={(e) => {
                      const current = methods.getValues('content_config') || {};
                      methods.setValue('content_config', {
                        ...current,
                        contact: { ...(current.contact || {}), email: e.target.value },
                      });
                    }}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Footer Content */}
            <Accordion>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Footer</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Field.Text
                  name="content_config.footer.copyrightText"
                  label="Copyright text"
                  placeholder="© Your Store. All rights reserved."
                  onChange={(e) => {
                    const current = methods.getValues('content_config') || {};
                    methods.setValue('content_config', {
                      ...current,
                      footer: { ...(current.footer || {}), copyrightText: e.target.value },
                    });
                  }}
                />
              </AccordionDetails>
            </Accordion>

            {/* Theme */}
            <Accordion>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Colors & theme</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      Accent color (buttons, prices, highlights)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        component="input"
                        type="color"
                        value={methods.watch('theme_config.accentColor') || '#1976d2'}
                        onChange={(e) => {
                          const current = methods.getValues('theme_config') || {};
                          methods.setValue('theme_config', { ...current, accentColor: e.target.value });
                        }}
                        sx={{
                          width: 48,
                          height: 40,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      />
                      <Field.Text
                        name="theme_config.accentColor"
                        label="Hex value"
                        size="small"
                        sx={{ flex: 1 }}
                        onChange={(e) => {
                          const current = methods.getValues('theme_config') || {};
                          methods.setValue('theme_config', { ...current, accentColor: e.target.value });
                        }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* SEO */}
            <Accordion>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">SEO</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Field.Text name="seo_title" label="SEO title" />
                  <Field.Text name="seo_description" label="SEO description" multiline rows={3} />
                  <Field.Text name="seo_keywords" label="SEO keywords (comma-separated)" />
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Box>
              <Button type="submit" variant="contained" size="large" fullWidth>
                Save website
              </Button>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box sx={{ position: 'sticky', top: 80 }}>
            <Card sx={{ p: 0, overflow: 'hidden' }}>
              <StoreWebsiteView website={previewWebsite} template={selectedTemplate} />
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Form>
  );
}
