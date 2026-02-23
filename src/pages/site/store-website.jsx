import { useEffect, useState } from 'react';

import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import axiosInstance from 'src/utils/axios';
import { useParams } from 'src/routes/hooks';

import { getStoreWebsiteTemplate } from 'src/config/store-website-templates';
import { StoreWebsiteView } from 'src/sections/store-website/store-website-view';

export default function StoreWebsitePage() {
  const { slug } = useParams();
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/store-website/${slug}`);
        if (!active) return;
        setWebsite(res.data);
      } catch (err) {
        if (!active) return;
        const detail = err?.detail || err?.response?.data?.detail || err?.message;
        setError(detail || 'Store website not found.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      load();
    }

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 8 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Store website unavailable
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
      </Container>
    );
  }

  const template = getStoreWebsiteTemplate(website?.template_id);

  return <StoreWebsiteView website={website} template={template} />;
}

