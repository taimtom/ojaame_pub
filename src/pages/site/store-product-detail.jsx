import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
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

function StockChip({ quantity }) {
  if (!quantity || quantity === 0) {
    return <Chip label="Out of stock" color="error" size="small" />;
  }
  if (quantity <= 5) {
    return <Chip label={`Only ${quantity} left`} color="warning" size="small" />;
  }
  return <Chip label="In stock" color="success" size="small" />;
}

// ----------------------------------------------------------------------

export default function StoreProductDetailPage() {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const checkout = useCheckoutContext();
  const website = useStoreWebsite();
  const theme = useTheme();
  const accentColor = website?.theme_config?.accentColor || theme.palette.primary.main;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!slug || !productId) {
      setLoading(false);
      setError('Missing store slug or product ID.');
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/store-website/${slug}/products/${productId}`);
        setProduct(res.data);
      } catch (err) {
        const detail = err?.response?.data?.detail || err?.message;
        setError(detail || 'Product not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, productId]);

  const allImages = product
    ? [product.coverUrl, ...(product.images || [])].filter(Boolean)
    : [];

  const handleAddToCart = () => {
    if (!product) return;
    checkout.onAddToCart({
      id: product.id,
      name: product.name,
      coverUrl: product.coverUrl,
      available: product.quantity || 0,
      price: product.price || 0,
      colors: [],
      size: '',
      quantity,
      subtotal: (product.price || 0) * quantity,
    });
    if (slug) checkout.onSetStoreSlug?.(slug);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate(paths.product.checkout);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" sx={{ borderRadius: 2, pt: '100%' }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton width="60%" height={40} sx={{ mb: 1 }} />
            <Skeleton width="30%" height={32} sx={{ mb: 2 }} />
            <Skeleton width="100%" height={16} />
            <Skeleton width="100%" height={16} />
            <Skeleton width="70%" height={16} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h5" gutterBottom>
          Product not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button
          component={RouterLink}
          href={paths.publicStoreProducts(slug)}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
        >
          Back to products
        </Button>
      </Container>
    );
  }

  const isOutOfStock = !product.quantity || product.quantity === 0;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<Iconify icon="eva:chevron-right-fill" width={16} />}
        sx={{ mb: 3 }}
      >
        <Link
          component={RouterLink}
          href={paths.publicStore(slug)}
          underline="hover"
          color="text.secondary"
          variant="body2"
        >
          Home
        </Link>
        <Link
          component={RouterLink}
          href={paths.publicStoreProducts(slug)}
          underline="hover"
          color="text.secondary"
          variant="body2"
        >
          Products
        </Link>
        <Typography variant="body2" color="text.primary">
          {product.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={5}>
        {/* Image gallery */}
        <Grid item xs={12} md={6}>
          <Stack spacing={1.5}>
            {/* Main image */}
            <Box
              sx={{
                position: 'relative',
                pt: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: 'grey.100',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {allImages.length > 0 ? (
                <Image
                  alt={product.name}
                  src={allImages[activeImage]}
                  sx={{ position: 'absolute', inset: 0, objectFit: 'contain', p: 2 }}
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
                  <Iconify icon="solar:gallery-bold" width={80} />
                </Box>
              )}
            </Box>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                {allImages.map((img, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    sx={{
                      flexShrink: 0,
                      width: 72,
                      height: 72,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: `2px solid ${idx === activeImage ? accentColor : theme.palette.divider}`,
                      bgcolor: 'grey.100',
                    }}
                  >
                    <Image alt="" src={img} sx={{ width: 1, height: 1, objectFit: 'cover' }} />
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        </Grid>

        {/* Product info */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Name + category */}
            <Box>
              {product.category_name && (
                <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  {product.category_name}
                </Typography>
              )}
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                {product.name}
              </Typography>
            </Box>

            {/* Price + stock */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: accentColor }}>
                  {fCurrency(product.price || 0)}
                </Typography>
                {product.priceSale && product.priceSale < product.price && (
                  <Typography
                    variant="body1"
                    sx={{ color: 'text.disabled', textDecoration: 'line-through' }}
                  >
                    {fCurrency(product.priceSale)}
                  </Typography>
                )}
              </Box>
              <StockChip quantity={product.quantity} />
            </Box>

            <Divider />

            {/* Description */}
            {product.description && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {product.description}
                </Typography>
              </Box>
            )}

            {product.subDescription && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {product.subDescription}
              </Typography>
            )}

            {/* Quantity + actions */}
            {!isOutOfStock && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Quantity
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    sx={{ border: `1px solid ${theme.palette.divider}` }}
                  >
                    <Iconify icon="eva:minus-fill" width={16} />
                  </IconButton>
                  <TextField
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val > 0 && val <= (product.quantity || 1)) setQuantity(val);
                    }}
                    inputProps={{ min: 1, max: product.quantity || 1 }}
                    sx={{ width: 72 }}
                    size="small"
                  />
                  <IconButton
                    size="small"
                    onClick={() => setQuantity((q) => Math.min(product.quantity || 1, q + 1))}
                    sx={{ border: `1px solid ${theme.palette.divider}` }}
                  >
                    <Iconify icon="eva:plus-fill" width={16} />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary">
                    / {product.quantity} available
                  </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleAddToCart}
                    startIcon={
                      addedToCart
                        ? <Iconify icon="eva:checkmark-fill" />
                        : <Iconify icon="solar:cart-plus-bold" />
                    }
                    sx={{
                      bgcolor: accentColor,
                      '&:hover': { bgcolor: alpha(accentColor, 0.85) },
                    }}
                  >
                    {addedToCart ? 'Added!' : 'Add to cart'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    onClick={handleBuyNow}
                    sx={{
                      borderColor: accentColor,
                      color: accentColor,
                      '&:hover': { borderColor: accentColor, bgcolor: alpha(accentColor, 0.06) },
                    }}
                  >
                    Buy now
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                  {product.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
