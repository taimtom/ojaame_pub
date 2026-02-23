import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance from 'src/utils/axios';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';
import { Image } from 'src/components/image';

export function ProductGridSection({ content }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { title, maxItems = 8 } = content || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/store-website/${slug}/products`);
        // Limit to maxItems for featured products
        const limitedProducts = Array.isArray(res.data) ? res.data.slice(0, maxItems) : [];
        setProducts(limitedProducts);
      } catch (error) {
        console.error('Failed to load products', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [slug, maxItems]);

  const handleProductClick = (productId) => {
    navigate(paths.publicStoreProduct(slug, productId));
  };

  if (loading) {
    return (
      <Box component="section" id="products" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <Box component="section" id="products" sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography component="h2" variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
            {title || 'Featured products'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No products available at the moment.
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box component="section" id="products" sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography component="h2" variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
          {title || 'Featured products'}
        </Typography>
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={3} key={product.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleProductClick(product.id)}
              >
                <CardMedia
                  sx={{
                    height: 200,
                    position: 'relative',
                  }}
                >
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
                        e.stopPropagation();
                        handleProductClick(product.id);
                      }}
                    >
                      View
                    </Button>
                  </Box>
                </CardContent>
              </Card>
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
            >
              View All Products
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}

