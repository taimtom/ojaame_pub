import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import TextField from '@mui/material/TextField';

import axiosInstance from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';
import { Image } from 'src/components/image';
import { useCheckoutContext } from 'src/sections/checkout/context';

export default function StoreProductDetailPage() {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const checkout = useCheckoutContext();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug || !productId) {
        setLoading(false);
        setError('Missing store slug or product ID.');
        return;
      }
      try {
        setLoading(true);
        setError('');
        const res = await axiosInstance.get(`/api/store-website/${slug}/products/${productId}`);
        setProduct(res.data);
      } catch (err) {
        const detail = err?.response?.data?.detail || err?.message;
        setError(detail || 'Product not found.');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug, productId]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const cartItem = {
      id: product.id,
      name: product.name,
      coverUrl: product.coverUrl,
      available: product.quantity || 0,
      price: product.price || 0,
      colors: [],
      size: '',
      quantity,
      subtotal: (product.price || 0) * quantity,
    };

    checkout.onAddToCart(cartItem);
    navigate(paths.product.checkout);
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container sx={{ py: 8 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Product not found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error || 'The product you are looking for does not exist.'}
        </Typography>
        <Button
          component={RouterLink}
          href={paths.publicStoreProducts(slug)}
          sx={{ mt: 2 }}
        >
          Back to Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Button
        component={RouterLink}
        href={paths.publicStoreProducts(slug)}
        sx={{ mb: 4 }}
      >
        ← Back to Products
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia sx={{ height: 500, position: 'relative' }}>
              {product.coverUrl ? (
                <Image
                  alt={product.name}
                  src={product.coverUrl}
                  sx={{ height: 1, width: 1, objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 1,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No image available
                  </Typography>
                </Box>
              )}
            </CardMedia>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                {product.name}
              </Typography>
              {product.category_name && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Category: {product.category_name}
                </Typography>
              )}
              <Typography variant="h4" color="primary" sx={{ mb: 3 }}>
                {fCurrency(product.price || 0)}
              </Typography>
            </Box>

            {product.description && (
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Description
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {product.description}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Available Quantity: {product.quantity || 0}
              </Typography>
            </Box>

            <Box>
              <TextField
                type="number"
                label="Quantity"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 0 && val <= (product.quantity || 1)) {
                    setQuantity(val);
                  }
                }}
                inputProps={{ min: 1, max: product.quantity || 1 }}
                sx={{ width: 120, mr: 2 }}
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleAddToCart}
                disabled={!product.quantity || product.quantity === 0}
              >
                Add to Cart
              </Button>
            </Box>

            {(!product.quantity || product.quantity === 0) && (
              <Typography variant="body2" color="error">
                This product is currently out of stock.
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
