import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { bulkOnboardProducts } from 'src/actions/product';
import { listCatalogCategories, searchCatalogProducts } from 'src/actions/catalog';

const createEmptyRow = () => ({
  key: `${Date.now()}-${Math.random()}`,
  catalog_product_id: null,
  name: '',
  category_id: null,
  costPrice: '',
  price: '',
  taxes: '0',
  is_pack: false,
  quantity_per_pack: '',
  cost_price_per_pack: '',
  pack_sell_price: '',
  allow_variable_price: false,
  variable_price_min: '',
  variable_price_max: '',
});

export function ProductBulkOnboardView({ storeSlug, storeId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [rows, setRows] = useState([createEmptyRow()]);
  const [categories, setCategories] = useState([]);
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCatalogCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const handleSearch = async (value) => {
    const searchValue = (value || '').trim();
    setSearchLoading(true);
    try {
      const items = await searchCatalogProducts(searchValue, null, 12);
      setSearchOptions(items);
    } catch (error) {
      setSearchOptions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const updateRow = (key, patch) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeRow = (key) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.key !== key)));
  };

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);

  const formattedRows = useMemo(
    () =>
      rows
        .filter((row) => row.name || row.catalog_product_id || row.price)
        .map((row) => ({
          catalog_product_id: row.catalog_product_id || null,
          name: row.name || null,
          category_id: row.category_id || null,
          costPrice: row.costPrice === '' ? null : Number(row.costPrice),
          price: Number(row.price || 0),
          taxes: row.taxes === '' ? 0 : Number(row.taxes),
          is_pack: Boolean(row.is_pack),
          quantity_per_pack: row.quantity_per_pack === '' ? null : Number(row.quantity_per_pack),
          cost_price_per_pack: row.cost_price_per_pack === '' ? null : Number(row.cost_price_per_pack),
          pack_sell_price: row.pack_sell_price === '' ? null : Number(row.pack_sell_price),
          allow_variable_price: Boolean(row.allow_variable_price),
          variable_price_min: row.variable_price_min === '' ? null : Number(row.variable_price_min),
          variable_price_max: row.variable_price_max === '' ? null : Number(row.variable_price_max),
        })),
    [rows]
  );

  const submitBulk = async () => {
    if (!formattedRows.length) {
      toast.error('Add at least one product row before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await bulkOnboardProducts({
        store_id: Number(storeId),
        rows: formattedRows,
      });
      toast.success(`Created ${result.created_count} products.`);
      const failedRows = result.results?.filter((item) => item.status === 'failed') || [];
      if (failedRows.length) {
        toast.warning(`${failedRows.length} row(s) failed. Review and retry.`);
      } else {
        setRows([createEmptyRow()]);
      }
    } catch (error) {
      toast.error(error?.data?.detail || 'Bulk onboarding failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCatalogInput = (row) => (
    <Autocomplete
      size={isMobile ? 'medium' : 'small'}
      options={searchOptions}
      loading={searchLoading}
      getOptionLabel={(option) => option.name || ''}
      onOpen={() => {
        if (!searchOptions.length) {
          handleSearch('');
        }
      }}
      onInputChange={(_, value) => handleSearch(value)}
      onChange={(_, selected) => {
        if (!selected) return;
        updateRow(row.key, {
          catalog_product_id: selected.id,
          name: selected.name,
          category_id: selected.category_id ?? null,
          taxes: `${selected.default_tax_percent ?? 0}`,
        });
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Catalog Product"
          placeholder="Search catalog item"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {searchLoading ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );

  const renderCategoryInput = (row) => (
    <Autocomplete
      size={isMobile ? 'medium' : 'small'}
      options={categories}
      getOptionLabel={(option) => option.name || ''}
      value={categories.find((item) => item.id === row.category_id) || null}
      onChange={(_, selected) => updateRow(row.key, { category_id: selected?.id || null })}
      renderInput={(params) => <TextField {...params} label="Category" placeholder="Category" fullWidth />}
    />
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Bulk Add Products"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Products', href: paths.dashboard.product.root(storeSlug) },
          { name: 'Bulk Add' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Alert severity="info">
          Search from the shared catalog and adjust only your store pricing details before saving.
        </Alert>
        <Card>
          <CardContent sx={{ overflowX: 'auto' }}>
            {isMobile ? (
              <Stack spacing={2}>
                {rows.map((row, index) => (
                  <Card key={row.key} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                        Product Row {index + 1}
                      </Typography>
                      {renderCatalogInput(row)}
                      <TextField
                        size="medium"
                        label="Name"
                        fullWidth
                        value={row.name}
                        onChange={(e) => updateRow(row.key, { name: e.target.value })}
                      />
                      {renderCategoryInput(row)}
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <TextField
                            size="medium"
                            type="number"
                            label="Cost Price"
                            fullWidth
                            value={row.costPrice}
                            onChange={(e) => updateRow(row.key, { costPrice: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            size="medium"
                            type="number"
                            required
                            label="Selling Price"
                            fullWidth
                            value={row.price}
                            onChange={(e) => updateRow(row.key, { price: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            size="medium"
                            type="number"
                            label="Tax %"
                            fullWidth
                            value={row.taxes}
                            onChange={(e) => updateRow(row.key, { taxes: e.target.value })}
                          />
                        </Grid>
                      </Grid>

                      <Divider />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={row.is_pack}
                            onChange={(e) => updateRow(row.key, { is_pack: e.target.checked })}
                          />
                        }
                        label="Pack Pricing"
                      />
                      {row.is_pack && (
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <TextField
                              size="medium"
                              type="number"
                              label="Qty per pack"
                              fullWidth
                              value={row.quantity_per_pack}
                              onChange={(e) => updateRow(row.key, { quantity_per_pack: e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              size="medium"
                              type="number"
                              label="Cost per pack"
                              fullWidth
                              value={row.cost_price_per_pack}
                              onChange={(e) => updateRow(row.key, { cost_price_per_pack: e.target.value })}
                            />
                          </Grid>
                        </Grid>
                      )}

                      <FormControlLabel
                        control={
                          <Switch
                            checked={row.allow_variable_price}
                            onChange={(e) => updateRow(row.key, { allow_variable_price: e.target.checked })}
                          />
                        }
                        label="Allow Variable Price"
                      />
                      {row.allow_variable_price && (
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <TextField
                              size="medium"
                              type="number"
                              label="Min Price"
                              fullWidth
                              value={row.variable_price_min}
                              onChange={(e) => updateRow(row.key, { variable_price_min: e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              size="medium"
                              type="number"
                              label="Max Price"
                              fullWidth
                              value={row.variable_price_max}
                              onChange={(e) => updateRow(row.key, { variable_price_max: e.target.value })}
                            />
                          </Grid>
                        </Grid>
                      )}

                      <Button color="error" onClick={() => removeRow(row.key)}>
                        Remove Row
                      </Button>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 260 }}>Catalog Product</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Cost Price</TableCell>
                    <TableCell>Selling Price</TableCell>
                    <TableCell>Tax %</TableCell>
                    <TableCell>Pack</TableCell>
                    <TableCell>Variable Price</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{renderCatalogInput(row)}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          label="Name"
                          value={row.name}
                          onChange={(e) => updateRow(row.key, { name: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>{renderCategoryInput(row)}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          label="Cost"
                          value={row.costPrice}
                          onChange={(e) => updateRow(row.key, { costPrice: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          required
                          label="Selling"
                          value={row.price}
                          onChange={(e) => updateRow(row.key, { price: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          label="Tax"
                          value={row.taxes}
                          onChange={(e) => updateRow(row.key, { taxes: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={row.is_pack}
                                onChange={(e) => updateRow(row.key, { is_pack: e.target.checked })}
                              />
                            }
                            label="Pack"
                          />
                          {row.is_pack && (
                            <>
                              <TextField
                                size="small"
                                type="number"
                                label="Qty per pack"
                                value={row.quantity_per_pack}
                                onChange={(e) => updateRow(row.key, { quantity_per_pack: e.target.value })}
                              />
                              <TextField
                                size="small"
                                type="number"
                                label="Cost per pack"
                                value={row.cost_price_per_pack}
                                onChange={(e) => updateRow(row.key, { cost_price_per_pack: e.target.value })}
                              />
                            </>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={row.allow_variable_price}
                              onChange={(e) =>
                                updateRow(row.key, { allow_variable_price: e.target.checked })
                              }
                            />
                          }
                          label="Variable"
                        />
                        {row.allow_variable_price && (
                          <Stack spacing={1}>
                            <TextField
                              size="small"
                              type="number"
                              label="Min"
                              value={row.variable_price_min}
                              onChange={(e) => updateRow(row.key, { variable_price_min: e.target.value })}
                            />
                            <TextField
                              size="small"
                              type="number"
                              label="Max"
                              value={row.variable_price_max}
                              onChange={(e) => updateRow(row.key, { variable_price_max: e.target.value })}
                            />
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button color="error" onClick={() => removeRow(row.key)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                gap: 2,
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Button variant="outlined" onClick={addRow}>
                Add Row
              </Button>
              <Button variant="contained" onClick={submitBulk} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Products'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </DashboardContent>
  );
}
