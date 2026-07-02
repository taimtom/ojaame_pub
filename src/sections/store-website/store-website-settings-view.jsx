import { useCallback, useEffect, useMemo, useState } from 'react';

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
import { getStoreSiteUrl } from 'src/utils/store-site-url';
import { StoreWebsiteContentEditors } from './store-website-content-editors';

export function StoreWebsiteSettingsView({ methods, onSubmit, website, previewVersion = 0 }) {
  const templateId = methods.watch('template_id');
  const selectedTemplate = getStoreWebsiteTemplate(templateId || website?.template_id);
  const previewSlug = methods.watch('slug') || website?.slug;
  const previewUrl = previewSlug ? getStoreSiteUrl(previewSlug) : '';
  const [previewKey, setPreviewKey] = useState(0);

  const refreshPreview = useCallback(() => {
    setPreviewKey((key) => key + 1);
  }, []);

  const previewSrc = useMemo(() => {
    if (!previewUrl) return '';
    const separator = previewUrl.includes('?') ? '&' : '?';
    return `${previewUrl}${separator}_preview=${previewKey}`;
  }, [previewUrl, previewKey]);

  useEffect(() => {
    if (!methods.getValues('template_id') && selectedTemplate) {
      methods.setValue('template_id', selectedTemplate.id);
    }
  }, [methods, selectedTemplate]);

  useEffect(() => {
    if (previewVersion > 0) {
      refreshPreview();
    }
  }, [previewVersion, refreshPreview]);

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
                  helperText="Public URL: {slug}.ojaa.me (local dev uses VITE_DEV_SLUG in store_site_fe/.env)"
                />
                <Field.Text
                  name="content_config.displayName"
                  label="Online store name"
                  placeholder={website?.storeName || 'Your professional store name'}
                  helperText="Shown on your public storefront header. Leave blank to use your store name."
                  onChange={(e) => {
                    const current = methods.getValues('content_config') || {};
                    methods.setValue('content_config', {
                      ...current,
                      displayName: e.target.value,
                    });
                  }}
                />
                <Field.Text
                  name="content_config.promo"
                  label="Promo banner"
                  multiline
                  rows={2}
                  placeholder="Free delivery on orders over NGN 5,000 · Next-day dispatch · 30-day returns"
                  helperText="Top banner on your store (use · between messages). Leave blank to hide the promo bar."
                  onChange={(e) => {
                    const current = methods.getValues('content_config') || {};
                    methods.setValue('content_config', {
                      ...current,
                      promo: e.target.value,
                    });
                  }}
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

            <StoreWebsiteContentEditors
              methods={methods}
              templateId={templateId || website?.template_id}
              storeName={website?.storeName}
            />

            {/* Colors & theme — hidden for now; storefront colors come from the selected template */}
            {/*
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
            */}

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
            <Card sx={{ overflow: 'hidden' }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="subtitle2">Storefront preview</Typography>
                {previewUrl && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={refreshPreview}
                      startIcon={<Iconify icon="eva:refresh-fill" />}
                    >
                      Refresh preview
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<Iconify icon="eva:external-link-fill" />}
                    >
                      Open in new tab
                    </Button>
                  </Stack>
                )}
              </Stack>
              {previewUrl ? (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pt: 1 }}>
                    Local dev loads {import.meta.env.VITE_STORE_SITE_URL || 'the storefront app'} using{' '}
                    <code>VITE_DEV_SLUG</code> in store_site_fe/.env (match this store&apos;s slug). Save
                    settings, then use Refresh preview to reload the storefront.
                  </Typography>
                  <Box
                    component="iframe"
                    key={previewSrc}
                    title="Storefront preview"
                    src={previewSrc}
                    sx={{
                      display: 'block',
                      width: '100%',
                      height: { xs: 480, md: 'min(80vh, 900px)' },
                      border: 0,
                      bgcolor: 'background.neutral',
                    }}
                  />
                </>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Enter a slug and enable the public website to preview your storefront.
                  </Typography>
                </Box>
              )}
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Form>
  );
}
