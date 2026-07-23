import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import axiosInstance from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';
import { Image } from 'src/components/image';
import { useCheckoutContext } from 'src/sections/checkout/context';

// ----------------------------------------------------------------------

function MiniProductCard({ product, slug, accentColor }) {
  const theme = useTheme();
  const checkout = useCheckoutContext();
  const isOutOfStock = !product.quantity || product.quantity === 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    checkout.onAddToCart({
      id: product.id,
      name: product.name,
      coverUrl: product.coverUrl,
      available: product.quantity || 0,
      price: product.price || 0,
      colors: [],
      size: '',
      quantity: 1,
      subtotal: product.price || 0,
    });
  };

  return (
    <Box
      component={RouterLink}
      href={paths.publicStoreProduct(slug, product.id)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        textDecoration: 'none',
        color: 'text.primary',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'grey.100' }}>
        {product.coverUrl ? (
          <Image
            alt={product.name}
            src={product.coverUrl}
            sx={{ position: 'absolute', inset: 0, objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.disabled',
            }}
          >
            <Iconify icon="solar:gallery-bold" width={40} />
          </Box>
        )}
        {product.category_name && (
          <Chip
            label={product.category_name}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontSize: '0.68rem',
              height: 20,
              bgcolor: alpha(accentColor, 0.85),
              color: 'common.white',
            }}
          />
        )}
        {isOutOfStock && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" fontWeight={700} color="common.white">
              Out of stock
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
          {product.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: accentColor }}>
            {fCurrency(product.price || 0)}
          </Typography>
          <Button
            size="small"
            variant="contained"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            sx={{
              minWidth: 0,
              px: 1.5,
              py: 0.25,
              bgcolor: accentColor,
              '&:hover': { bgcolor: accentColor },
              fontSize: '0.7rem',
            }}
          >
            Add
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function ProductGridSection({ content, theme: themeConfig }) {
  const { slug } = useParams();
  const muiTheme = useTheme();
  const { title, maxItems = 8 } = content || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const accentColor = themeConfig?.accentColor || muiTheme.palette.primary.main;

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    axiosInstance
      .get(`/api/store-website/${slug}/products`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data.slice(0, maxItems) : [];
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [slug, maxItems]);

  return (
    <Box component="section" id="products" sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography component="h2" variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
          {title || 'Featured products'}
        </Typography>

        <Grid container spacing={2.5}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <Skeleton variant="rectangular" sx={{ pt: '75%' }} />
                    <Box sx={{ p: 1.5 }}>
                      <Skeleton width="70%" height={18} sx={{ mb: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton width={50} height={22} />
                        <Skeleton width={40} height={28} />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))
            : products.length === 0
            ? (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary">
                  No products available at the moment.
                </Typography>
              </Grid>
            )
            : products.map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product.id}>
                <MiniProductCard product={product} slug={slug} accentColor={accentColor} />
              </Grid>
            ))}
        </Grid>

        {products.length >= maxItems && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              component={RouterLink}
              href={paths.publicStoreProducts(slug)}
              variant="outlined"
              size="large"
              sx={{ px: 4 }}
            >
              View all products
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}
