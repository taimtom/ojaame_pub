import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import axiosInstance from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';
import { Image } from 'src/components/image';

export default function StoreProductsPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      if (!slug) {
        setLoading(false);
        setError('Store slug is missing.');
        return;
      }
      try {
        setLoading(true);
        setError('');
        const res = await axiosInstance.get(`/api/store-website/${slug}/products`);
        const productsData = Array.isArray(res.data) ? res.data : [];
        setProducts(productsData);
      } catch (err) {
        const detail = err?.response?.data?.detail || err?.message;
        setError(detail || 'Failed to load products.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
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
          Products unavailable
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        All Products
      </Typography>
      {products.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No products available at the moment.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card
                component={RouterLink}
                href={paths.publicStoreProduct(slug, product.id)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardMedia sx={{ height: 200, position: 'relative' }}>
                  {product.coverUrl ? (
                    <Image
                      alt={product.name}
                      src={product.coverUrl}
                      sx={{ height: 1, width: 1 }}
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
                        No image
                      </Typography>
                    </Box>
                  )}
                </CardMedia>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    {product.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', mb: 2, flexGrow: 1 }}
                  >
                    {product.description || 'Product description goes here.'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {fCurrency(product.price || 0)}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = paths.publicStoreProduct(slug, product.id);
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
