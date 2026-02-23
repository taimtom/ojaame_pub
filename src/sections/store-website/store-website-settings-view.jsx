import { useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';

import { Form, Field } from 'src/components/hook-form';
import { STORE_WEBSITE_TEMPLATES, getStoreWebsiteTemplate } from 'src/config/store-website-templates';
import { StoreWebsiteView } from './store-website-view';

export function StoreWebsiteSettingsView({
  methods,
  onSubmit,
  website,
}) {
  const templateId = methods.watch('template_id');
  const selectedTemplate = getStoreWebsiteTemplate(templateId || website?.template_id);

  useEffect(() => {
    if (!methods.getValues('template_id') && selectedTemplate) {
      methods.setValue('template_id', selectedTemplate.id);
    }
  }, [methods, selectedTemplate]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Website settings</Typography>
              <Field.Switch name="has_public_site" label="Enable public website" />
              <Field.Text name="slug" label="Slug (subdomain identifier)" helperText="Used for URLs like /site/your-slug and mystore.yourapp.com later." />
              <Field.Select name="template_id" label="Template">
                {STORE_WEBSITE_TEMPLATES.map((tpl) => (
                  <MenuItem key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text name="seo_title" label="SEO title" />
              <Field.Text
                name="seo_description"
                label="SEO description"
                multiline
                rows={3}
              />
              <Field.Text
                name="seo_keywords"
                label="SEO keywords (comma-separated)"
              />
              <Button type="submit" variant="contained">
                Save website
              </Button>
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 0, overflow: 'hidden' }}>
            <StoreWebsiteView
              website={{
                ...website,
                template_id: methods.watch('template_id') || website?.template_id,
                seo_title: methods.watch('seo_title') || website?.seo_title,
                seo_description:
                  methods.watch('seo_description') || website?.seo_description,
                theme_config: website?.theme_config || {},
                content_config: website?.content_config || {},
              }}
              template={selectedTemplate}
            />
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}

