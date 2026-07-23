import { useState } from 'react';

import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePathname } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { useCheckoutContext } from 'src/sections/checkout/context';

// ----------------------------------------------------------------------

export function StoreWebsiteHeader({ storeName, slug }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const checkout = useCheckoutContext();
  const cartCount = checkout?.totalItems ?? 0;

  const navLinks = [
    { title: 'Home', path: paths.publicStore(slug) },
    { title: 'Products', path: paths.publicStoreProducts(slug) },
    { title: 'About', path: `${paths.publicStore(slug)}#about` },
    { title: 'Contact', path: `${paths.publicStore(slug)}#contact` },
  ];

  const isActive = (path) => {
    const base = path.split('#')[0];
    return pathname === base;
  };

  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(var(--palette-background-defaultChannel) / 0.92)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          {/* Store name / logo */}
          <Typography
            component={RouterLink}
            href={paths.publicStore(slug)}
            variant="h6"
            fontWeight={700}
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'text.primary',
              letterSpacing: '-0.02em',
            }}
          >
            {storeName || 'Store'}
          </Typography>

          {/* Desktop nav */}
          {!isMobile && (
            <Stack direction="row" spacing={0.5} sx={{ mr: 2 }}>
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  component={link.path.includes('#') ? 'a' : RouterLink}
                  href={link.path}
                  underline="none"
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontWeight: isActive(link.path) ? 600 : 400,
                    color: isActive(link.path) ? 'primary.main' : 'text.primary',
                    '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
                    transition: 'color 0.15s, background 0.15s',
                  }}
                >
                  {link.title}
                </Link>
              ))}
            </Stack>
          )}

          {/* Cart icon */}
          <IconButton
            component={RouterLink}
            href={paths.product.checkout}
            color="inherit"
            aria-label="cart"
            sx={{ ml: 0.5 }}
          >
            <Badge badgeContent={cartCount} color="error" max={99}>
              <Iconify icon="solar:cart-large-bold" width={24} />
            </Badge>
          </IconButton>

          {/* Mobile hamburger */}
          {isMobile && (
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ ml: 0.5 }}
            >
              <Iconify icon="eva:menu-2-fill" width={22} />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 260, pt: 2 } }}
      >
        <Box sx={{ px: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" fontWeight={700}>
            {storeName || 'Store'}
          </Typography>
        </Box>
        <List>
          {navLinks.map((link) => (
            <ListItemButton
              key={link.title}
              component={link.path.includes('#') ? 'a' : RouterLink}
              href={link.path}
              onClick={() => setDrawerOpen(false)}
              selected={isActive(link.path)}
            >
              <ListItemText
                primary={link.title}
                primaryTypographyProps={{
                  fontWeight: isActive(link.path) ? 600 : 400,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </>
  );
}
