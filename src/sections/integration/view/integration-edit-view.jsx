import { Helmet } from 'react-helmet-async';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Card,
  Stack,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function IntegrationEditView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: '',
  });

  const fetchIntegrationDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `${endpoints.integrations.details}${id}`
      );
      const integrationData = response.data;
      setIntegration(integrationData);
      setFormData({
        name: integrationData.name || '',
        description: integrationData.description || '',
        config: JSON.stringify(integrationData.config || {}, null, 2),
      });
    } catch (err) {
      console.error('Error fetching integration details:', err);
      toast.error('Failed to load integration details');
      navigate(paths.dashboard.integration.list);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchIntegrationDetails();
    }
  }, [id, fetchIntegrationDetails]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Validate JSON config
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(formData.config);
      } catch (err) {
        toast.error('Invalid JSON configuration');
        return;
      }

      const updateData = {
        name: formData.name,
        description: formData.description,
        config: parsedConfig,
      };

      await axiosInstance.put(`${endpoints.integrations.update}${id}`, updateData);
      toast.success('Integration updated successfully!');
      navigate(paths.dashboard.integration.details(id));
    } catch (err) {
      console.error('Error updating integration:', err);
      toast.error('Failed to update integration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!integration) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6" align="center">
          Integration not found
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Integration | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading="Edit Integration"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: 'List', href: paths.dashboard.integration.list },
            { name: integration.name, href: paths.dashboard.integration.details(id) },
            { name: 'Edit' },
          ]}
          sx={{ mb: 5 }}
        />

        <Card sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Typography variant="h6" gutterBottom>
                Integration Information
              </Typography>

              <TextField
                name="name"
                label="Integration Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />

              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />

              <TextField
                name="config"
                label="Configuration (JSON)"
                value={formData.config}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={10}
                helperText="Enter valid JSON configuration"
                required
              />

              <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <Iconify icon="eva:save-fill" />}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate(paths.dashboard.integration.details(id))}
                  disabled={saving}
                  startIcon={<Iconify icon="eva:arrow-back-fill" />}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </form>
        </Card>
      </Box>
    </>
  );
}

