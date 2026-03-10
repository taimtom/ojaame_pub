import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useParams } from 'src/routes/hooks';
import axiosInstance from 'src/utils/axios';

import { StoreWebsiteContext } from './context';
import { StoreWebsiteHeader } from './header';

// ----------------------------------------------------------------------

export function StoreWebsiteLayout({ children }) {
  const { slug } = useParams();
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/store-website/${slug}`);
        if (active) setWebsite(res.data);
      } catch (err) {
        if (active) {
          const detail = err?.response?.data?.detail || err?.message;
          setError(detail || 'Store website not found.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 10 }}>
        <Typography variant="h5" gutterBottom>
          Store not available
        </Typography>
        <Typography color="text.secondary">{error}</Typography>
      </Container>
    );
  }

  return (
    <StoreWebsiteContext.Provider value={website}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <StoreWebsiteHeader storeName={website?.storeName} slug={slug} />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </StoreWebsiteContext.Provider>
  );
}
