import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useForm } from 'react-hook-form';

import { DashboardContent } from 'src/layouts/dashboard';
import { useParams } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import axiosInstance from 'src/utils/axios';
import { useBoolean } from 'src/hooks/use-boolean';
import { Iconify } from 'src/components/iconify';
import { StoreWebsiteSettingsView } from 'src/sections/store-website/store-website-settings-view';
import { toast } from 'src/components/snackbar';

export default function StoreWebsiteSettingsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loading = useBoolean(true);
  const [website, setWebsite] = useState(null);

  useEffect(() => {
    if (!id) {
      toast.error('Store ID is required');
      navigate(paths.dashboard.store.list);
    }
  }, [id, navigate]);

  const methods = useForm({
    defaultValues: {
      has_public_site: false,
      slug: '',
      template_id: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      content_config: {},
      theme_config: {},
    },
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/api/stores/details/${id}`);
        const store = res.data;
        const websiteData = {
          storeName: store.storeName,
          slug: store.slug || '',
          template_id: store.template_id || '',
          has_public_site: store.has_public_site || false,
          seo_title: store.seo_title || '',
          seo_description: store.seo_description || '',
          seo_keywords: store.seo_keywords || [],
          theme_config: store.theme_config || {},
          content_config: store.content_config || {},
        };
        setWebsite(websiteData);
        reset({
          has_public_site: store.has_public_site || false,
          slug: store.slug || '',
          template_id: store.template_id || '',
          seo_title: store.seo_title || '',
          seo_description: store.seo_description || '',
          seo_keywords: (store.seo_keywords || []).join(', '),
          content_config: store.content_config || {},
          theme_config: store.theme_config || {},
        });
      } catch (error) {
        console.error('Failed to load store website settings', error);
        toast.error('Failed to load website settings');
      } finally {
        loading.onFalse();
      }
    };

    if (id) {
      load();
    }
  }, [id, loading, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        has_public_site: data.has_public_site,
        slug: data.slug || null,
        template_id: data.template_id || null,
        seo_title: data.seo_title || null,
        seo_description: data.seo_description || null,
        seo_keywords: data.seo_keywords
          ? data.seo_keywords.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        content_config: data.content_config || {},
        theme_config: data.theme_config || {},
      };

      const res = await axiosInstance.put(`/api/store-website/${id}`, payload);
      const updated = res.data;
      setWebsite((prev) => ({ ...prev, ...updated }));
      toast.success('Website settings saved');
      reset({
        ...data,
        slug: updated.slug || data.slug,
        content_config: updated.content_config || data.content_config,
        theme_config: updated.theme_config || data.theme_config,
      });
    } catch (error) {
      console.error('Failed to save website settings', error);
      const detail = error?.detail || error?.response?.data?.detail || error?.message;
      toast.error(detail || 'Failed to save website settings');
    }
  });

  if (!id) {
    return null;
  }

  return (
    <DashboardContent maxWidth="xl">
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Store website</Typography>
          {website?.slug && website?.has_public_site && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="eva:external-link-fill" />}
              href={`/site/${website.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Public Site
            </Button>
          )}
        </Box>
        {!loading.value && (
          <StoreWebsiteSettingsView methods={methods} onSubmit={onSubmit} website={website || {}} />
        )}
      </Container>
    </DashboardContent>
  );
}

