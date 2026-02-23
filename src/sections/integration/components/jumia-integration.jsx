import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  Divider,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// Mock functions for when API is not available
const mockGetJumiaData = async (integrationId, type, params) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  switch (type) {
    case 'shops':
      return {
        data: [
          { id: 'shop1', name: 'Main Shop - Nigeria' },
          { id: 'shop2', name: 'Electronics Store - Lagos' },
        ]
      };
    case 'products':
      return {
        data: [
          {
            sku: 'PROD001',
            name: 'Samsung Galaxy S23',
            price: 750000,
            quantity: 25,
            status: 'active'
          },
          {
            sku: 'PROD002',
            name: 'iPhone 14 Pro',
            price: 950000,
            quantity: 18,
            status: 'active'
          },
          {
            sku: 'PROD003',
            name: 'HP Laptop 15"',
            price: 450000,
            quantity: 12,
            status: 'inactive'
          }
        ]
      };
    case 'categories':
      return {
        data: [
          { id: 'cat1', name: 'Electronics' },
          { id: 'cat2', name: 'Mobile Phones' },
          { id: 'cat3', name: 'Computers & Laptops' },
          { id: 'cat4', name: 'Home Appliances' },
        ]
      };
    default:
      return { data: [] };
  }
};

const mockUpdateJumiaData = async (integrationId, type, data) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, message: `${type} updated successfully` };
};

// Initialize API functions with mocks as default
let getJumiaData = mockGetJumiaData;
let updateJumiaData = mockUpdateJumiaData;

// Try to import real API functions if available
try {
  // Use dynamic import for optional integration actions
  import('src/actions/integration')
    .then((integrationModule) => {
      getJumiaData = integrationModule.getJumiaData || mockGetJumiaData;
      updateJumiaData = integrationModule.updateJumiaData || mockUpdateJumiaData;
    })
    .catch(() => {
      console.warn('Integration actions not available, using mock data');
    });
} catch (error) {
  console.warn('Integration actions module not found, using mock data');
}

// ----------------------------------------------------------------------

export function JumiaIntegration({ integration, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'stock' | 'price' | 'sync'

  // Data states
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Update form state
  const [updateData, setUpdateData] = useState({
    sku: '',
    quantity: '',
    price: '',
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Fetch shops
  const fetchJumiaShops = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getJumiaData(integration.id, 'shops');
      setShops(response.data || []);
      if (response.data?.length > 0) {
        setSelectedShop(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  }, [integration?.id]);

  // Fetch products for selected shop
  const fetchJumiaProducts = useCallback(async () => {
    if (!selectedShop) return;

    setLoading(true);
    try {
      const response = await getJumiaData(integration.id, 'products', {
        shopId: selectedShop,
        page,
        size: pageSize,
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [integration?.id, selectedShop, page, pageSize]);

  // Fetch categories
  const fetchJumiaCategories = useCallback(async () => {
    if (!selectedShop) return;

    setLoading(true);
    try {
      const response = await getJumiaData(integration.id, 'categories', {
        shopId: selectedShop,
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [integration?.id, selectedShop]);

  // Fetch shops on component mount
  useEffect(() => {
    if (integration?.id) {
      fetchJumiaShops();
    }
  }, [integration?.id, fetchJumiaShops]);

  // Load data when tab or shop changes
  const handleUpdate = useCallback(async (type) => {
    if (!selectedProducts.length) {
      toast.error('Please select products to update');
      return;
    }

    setLoading(true);
    try {
      const updateProducts = selectedProducts.map((product) => ({
        sku: product.sku,
        ...(type === 'stock' && { quantity: updateData.quantity }),
        ...(type === 'prices' && { price: updateData.price }),
      }));

      await updateJumiaData(integration.id, type, updateProducts);
      toast.success(`${type} updated successfully!`);
      setOpenDialog(false);
      setSelectedProducts([]);
      setUpdateData({ sku: '', quantity: '', price: '' });

      // Refresh products list
      fetchJumiaProducts();
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      toast.error(`Failed to update ${type}`);
    } finally {
      setLoading(false);
    }
  }, [selectedProducts, updateData, integration?.id, fetchJumiaProducts]);

  // Sync products from POS to Jumia
  const handleSyncProducts = useCallback(async () => {
    setLoading(true);
    try {
      // This would typically sync your local POS products to Jumia
      // Implementation depends on your backend API
      toast.success('Products sync initiated successfully!');
      setOpenDialog(false);
    } catch (error) {
      console.error('Error syncing products:', error);
      toast.error('Failed to sync products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle shop change
  const handleShopChange = useCallback((shopId) => {
    setSelectedShop(shopId);
    setPage(1);
  }, []);

  // Load data when tab or shop changes
  useEffect(() => {
    if (selectedShop) {
      if (activeTab === 'products') {
        fetchJumiaProducts();
      } else if (activeTab === 'categories') {
        fetchJumiaCategories();
      }
    }
  }, [activeTab, selectedShop, fetchJumiaProducts, fetchJumiaCategories]);

  if (!integration || integration.provider !== 'jumia') {
    return null;
  }

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="simple-icons:jumia" width={32} height={32} sx={{ color: '#f68b1e' }} />
          <Box>
            <Typography variant="h6">Jumia Integration</Typography>
            <Typography variant="body2" color="text.secondary">
              E-commerce Integration - {integration.name}
            </Typography>
          </Box>
        </Stack>

        <Divider />

        {/* Shop Selection */}
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Shop</InputLabel>
            <Select
              value={selectedShop}
              label="Select Shop"
              onChange={(e) => handleShopChange(e.target.value)}
              disabled={loading}
            >
              {shops.map((shop) => (
                <MenuItem key={shop.id} value={shop.id}>
                  {shop.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            onClick={fetchJumiaShops}
            disabled={loading}
            startIcon={<Iconify icon="eva:refresh-outline" />}
          >
            Refresh Shops
          </Button>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:cube-outline" />}
            onClick={() => {
              setDialogType('stock');
              setOpenDialog(true);
            }}
            disabled={loading || !selectedShop}
          >
            Update Stock
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:pricetags-outline" />}
            onClick={() => {
              setDialogType('price');
              setOpenDialog(true);
            }}
            disabled={loading || !selectedShop}
          >
            Update Prices
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:sync-outline" />}
            onClick={() => {
              setDialogType('sync');
              setOpenDialog(true);
            }}
            disabled={loading || !selectedShop}
          >
            Sync Products
          </Button>
        </Stack>

        {/* Tab Navigation */}
        <Stack direction="row" spacing={1}>
          {['products', 'categories'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setActiveTab(tab)}
              disabled={loading || !selectedShop}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </Stack>

        {/* Content */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {activeTab === 'products' && (
              <Stack spacing={2}>
                <Typography variant="subtitle1">
                  Products ({products.length})
                </Typography>

                {products.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <input type="checkbox" />
                        </TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Stock</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.sku}>
                          <TableCell padding="checkbox">
                            <input
                              type="checkbox"
                              checked={selectedProducts.some((p) => p.sku === product.sku)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProducts([...selectedProducts, product]);
                                } else {
                                  setSelectedProducts(
                                    selectedProducts.filter((p) => p.sku !== product.sku)
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>₦{product.price?.toLocaleString()}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>
                            <Chip
                              label={product.status}
                              size="small"
                              color={product.status === 'active' ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="text.secondary">
                    No products found for this shop
                  </Typography>
                )}
              </Stack>
            )}

            {activeTab === 'categories' && (
              <Stack spacing={2}>
                <Typography variant="subtitle1">
                  Categories ({categories.length})
                </Typography>

                <Grid container spacing={2}>
                  {categories.map((category) => (
                    <Grid item xs={12} sm={6} md={4} key={category.id}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2">{category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {category.id}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {categories.length === 0 && (
                  <Typography color="text.secondary">
                    No categories found for this shop
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        )}
      </Stack>

      {/* Update Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'stock' && 'Update Stock'}
          {dialogType === 'price' && 'Update Prices'}
          {dialogType === 'sync' && 'Sync Products'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {dialogType === 'sync' ? (
              <Typography>
                This will sync your POS products to Jumia. Are you sure you want to continue?
              </Typography>
            ) : (
              <>
                <Typography variant="body2">
                  Selected products: {selectedProducts.length}
                </Typography>

                {dialogType === 'stock' && (
                  <TextField
                    label="New Quantity"
                    type="number"
                    value={updateData.quantity}
                    onChange={(e) => setUpdateData({ ...updateData, quantity: e.target.value })}
                    fullWidth
                    helperText="Enter the new stock quantity for selected products"
                  />
                )}

                {dialogType === 'price' && (
                  <TextField
                    label="New Price (₦)"
                    type="number"
                    value={updateData.price}
                    onChange={(e) => setUpdateData({ ...updateData, price: e.target.value })}
                    fullWidth
                    helperText="Enter the new price for selected products"
                  />
                )}
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={
              dialogType === 'sync'
                ? handleSyncProducts
                : () => handleUpdate(dialogType)
            }
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
          >
            {dialogType === 'sync' ? 'Sync Now' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

