import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, IconButton, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

export function NoStoresView() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to the "new store" page after 5 seconds.
    const timer = setTimeout(() => {
      navigate(paths.dashboard.store.new);
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <IconButton
        onClick={() => navigate(paths.dashboard.store.new)}
        sx={{
          width: 64,
          height: 64,
          border: '2px dashed',
          borderColor: 'grey.500',
          borderRadius: '50%',
          color: 'grey.500',
          mb: 2,
        }}
      >
        <Iconify icon="mdi:plus" width={32} />
      </IconButton>
      <Typography variant="h6">
        No store found. Redirecting to create a new store in 5 seconds...
      </Typography>
    </Box>
  );
}
