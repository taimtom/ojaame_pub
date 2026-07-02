import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import axiosInstance from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';
import { Image } from 'src/components/image';
import { useCheckoutContext } from 'src/sections/checkout/context';
import { useStoreWebsite } from 'src/layouts/store-website/context';

// ----------------------------------------------------------------------

function ProductCard({ product, slug }) {
  const theme = useTheme();
  const checkout = useCheckoutContext();
  const website = useStoreWebsite();
  const accentColor = website?.theme_config?.accentColor || theme.palette.primary.main;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!product) return;
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
    if (slug) checkout.onSetStoreSlug?.(slug);
  };

  const isOutOfStock = !product.quantity || product.quantity === 0;

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
          boxShadow: theme.customShadows?.z16 || '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* Image */}
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
            <Iconify icon="solar:gallery-bold" width={48} />
          </Box>
        )}

        {/* Category badge */}
        {product.category_name && (
          <Chip
            label={product.category_name}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontSize: '0.7rem',
              height: 22,
              bgcolor: alpha(accentColor, 0.85),
              color: 'common.white',
            }}
          />
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.4)',
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

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
          {product.name}
        </Typography>

        {product.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              flexGrow: 1,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              mb: 1.5,
            }}
          >
            {product.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: accentColor }}>
              {fCurrency(product.price || 0)}
            </Typography>
            {product.priceSale && product.priceSale < product.price && (
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', textDecoration: 'line-through' }}
              >
                {fCurrency(product.priceSale)}
              </Typography>
            )}
          </Box>

          <Button
            size="small"
            variant="contained"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            sx={{
              minWidth: 0,
              px: 1.5,
              py: 0.5,
              bgcolor: accentColor,
              '&:hover': { bgcolor: accentColor },
              fontSize: '0.75rem',
            }}
          >
            Add
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function ProductCardSkeleton() {
  return (
    <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <Skeleton variant="rectangular" sx={{ pt: '75%' }} />
      <Box sx={{ p: 2 }}>
        <Skeleton width="70%" height={20} sx={{ mb: 0.5 }} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="60%" height={16} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={60} height={24} />
          <Skeleton width={50} height={32} />
        </Box>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function StoreProductsPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  useEffect(() => {
    if (!slug) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.allSettled([
          axiosInstance.get(`/api/store-website/${slug}/products`),
          axiosInstance.get(`/api/store-website/${slug}/categories`),
        ]);
        if (productsRes.status === 'fulfilled') {
          setProducts(Array.isArray(productsRes.value.data) ? productsRes.value.data : []);
        }
        if (categoriesRes.status === 'fulfilled') {
          setCategories(Array.isArray(categoriesRes.value.data) ? categoriesRes.value.data : []);
        }
      } catch (err) {
        const detail = err?.response?.data?.detail || err?.message;
        setError(detail || 'Failed to load products.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategoryId) {
      list = list.filter((p) => p.category_id === activeCategoryId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategoryId, search]);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          All Products
        </Typography>
        <TextField
          size="small"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={18} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
      </Box>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All"
            variant={activeCategoryId === null ? 'filled' : 'outlined'}
            color={activeCategoryId === null ? 'primary' : 'default'}
            onClick={() => setActiveCategoryId(null)}
          />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              variant={activeCategoryId === cat.id ? 'filled' : 'outlined'}
              color={activeCategoryId === cat.id ? 'primary' : 'default'}
              onClick={() => setActiveCategoryId(cat.id)}
            />
          ))}
        </Stack>
      )}

      {/* Error */}
      {error && (
        <Typography color="error" sx={{ mb: 3 }}>
          {error}
        </Typography>
      )}

      {/* Products grid */}
      <Grid container spacing={3}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <ProductCardSkeleton />
              </Grid>
            ))
          : filtered.length === 0
          ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Iconify icon="solar:box-bold" width={56} sx={{ color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {search || activeCategoryId ? 'No products match your search.' : 'No products available yet.'}
                </Typography>
              </Box>
            </Grid>
          )
          : filtered.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard product={product} slug={slug} />
            </Grid>
          ))}
      </Grid>
    </Container>
  );
}
