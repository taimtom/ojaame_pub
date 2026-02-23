import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { useGetStores } from 'src/actions/store';

import { Iconify } from 'src/components/iconify';

import { StoreShopView } from 'src/sections/store/view';


const metadata = { title: `Company Store - ${CONFIG.site.name}` };

export default function Page() {
  const { stores, storesLoading } = useGetStores();
  const navigate = useNavigate();

  // If loading is complete and there are no stores, show a plus icon to create a new store.
  if (!storesLoading && (!stores || stores.length === 0)) {
    return (
      <>
        <Helmet>
          <title>{metadata.title}</title>
        </Helmet>
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
            No store found. Please create a new store.
          </Typography>
        </Box>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <StoreShopView stores={stores} loading={storesLoading} />
    </>
  );
}
