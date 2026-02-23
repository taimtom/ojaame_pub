import React from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { paramCase } from 'src/utils/change-case';

import { Image } from 'src/components/image';

export function StoreItem({ store }) {
  const navigate = useNavigate();

  if (!store) {
    return null;
  }

  const { id, storeName, avatarUrl, status } = store;
  const storeParam = `${paramCase(storeName)}-${id}`;
  const linkTo = `${paths.dashboard.root}/${storeParam}`;

  const handleNavigation = () => {
    localStorage.setItem('activeWorkspace', JSON.stringify(store));
    navigate(linkTo);
  };

  // If store.status is not "active", consider it "Not Active"
  const isActive = store.status === "active";

  const renderImg = (
    <Box sx={{ position: 'relative', p: 1, cursor: 'pointer' }} onClick={handleNavigation}>
      <Tooltip title={!isActive ? 'Not Active' : ''} placement="bottom-end">
        {avatarUrl ? (
          <Image
            alt={storeName}
            src={avatarUrl}
            ratio="1/1"
            sx={{
              borderRadius: 1.5,
              ...(!isActive && { opacity: 0.48, filter: 'grayscale(1)' }),
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              paddingTop: '100%',
              position: 'relative',
              borderRadius: 1.5,
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(!isActive && { opacity: 0.48, filter: 'grayscale(1)' }),
            }}
          >
            <Typography
              variant="h6"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'text.disabled',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              {storeName.substring(0, 2).toUpperCase()}
            </Typography>
          </Box>
        )}
      </Tooltip>
    </Box>
  );

  const renderContent = (
    <Stack spacing={2.5} sx={{ p: 3, pt: 2 }}>
      <Link
        component={RouterLink}
        href={linkTo}
        color="inherit"
        variant="subtitle2"
        noWrap
        onClick={() => localStorage.setItem('activeWorkspace', JSON.stringify(store))}
        sx={{ cursor: 'pointer' }}
      >
        {storeName}
      </Link>
    </Stack>
  );

  return (
    <Card sx={{ '&:hover .add-cart-btn': { opacity: 1 } }}>
      {renderImg}
      {renderContent}
    </Card>
  );
}
