import { useMemo, useState } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMediaQuery, useTheme } from '@mui/material';

import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { bulkOnboardProducts } from 'src/actions/product';
import { useGetCategories } from 'src/actions/category';
import { CategoryQuickAddDialog } from '../category-quick-add-dialog';

// ----------------------------------------------------------------------

const createEmptyRow = () => ({
  key: `${Date.now()}-${Math.random()}`,
  name: '',
  category_id: null,
  quantity: '1',
  costPrice: '',
  price: '',
  taxes: '0',
  product_kind: 'sellable',
  is_pack: false,
  quantity_per_pack: '',
  cost_price_per_pack: '',
  pack_sell_price: '',
  allow_variable_price: false,
  variable_price_min: '',
  variable_price_max: '',
});

// Parse pasted CSV or tab-separated text into row objects.
// Expected column order: Name | Category | Qty | Cost Price | Selling Price | Is Pack | Qty/Pack | Cost/Pack
function parseSpreadsheetText(text, categories) {
  const list = categories || [];
  return text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const delimiter = line.includes('\t') ? '\t' : ',';
      return line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
    })
    .filter((cols) => {
      const firstCol = (cols[0] || '').toLowerCase();
      const isHeader =
        firstCol === 'name' || firstCol === 'product name' || firstCol === 'item';
      return !isHeader && Boolean(cols[0]);
    })
    .map((cols) => {
      const categoryName = cols[1] || '';
      const matchedCat = list.find(
        (c) => c.name?.trim().toLowerCase() === categoryName.trim().toLowerCase()
      );
      const isPackRaw = (cols[5] || '').toLowerCase();
      const isPack = isPackRaw === 'yes' || isPackRaw === 'true' || isPackRaw === '1';

      return {
        ...createEmptyRow(),
        name: cols[0] || '',
        category_id: matchedCat ? matchedCat.id : null,
        quantity: cols[2] || '1',
        costPrice: cols[3] || '',
        price: cols[4] || '',
        is_pack: isPack,
        quantity_per_pack: cols[6] || '',
        cost_price_per_pack: cols[7] || '',
      };
    });
}

// ----------------------------------------------------------------------

export function ProductBulkOnboardView({ storeSlug, storeId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Pre-load 10 empty rows on mount
  const [rows, setRows] = useState(() => Array.from({ length: 10 }, createEmptyRow));
  const { categories, categoriesLoading, mutateCategories } = useGetCategories(storeId);
  const [submitting, setSubmitting] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvExpanded, setCsvExpanded] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [categoryQuickAddRowKey, setCategoryQuickAddRowKey] = useState(null);

  const updateRow = (key, patch) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const removeRow = (key) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.key !== key)));

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);

  const addTenRows = () =>
    setRows((prev) => [...prev, ...Array.from({ length: 10 }, createEmptyRow)]);

  const handlePasteCSV = () => {
    if (!csvText.trim()) {
      toast.error('Paste some data first.');
      return;
    }
    const parsed = parseSpreadsheetText(csvText, categories);
    if (!parsed.length) {
      toast.error('No valid rows found. Check that columns are in the right order.');
      return;
    }
    setRows((prev) => {
      // Replace trailing empty rows, then append parsed rows
      const nonEmpty = prev.filter((r) => r.name || r.price);
      return [...nonEmpty, ...parsed];
    });
    setCsvText('');
    setCsvExpanded(false);
    toast.success(`${parsed.length} row(s) imported from paste.`);
  };

  const formattedRows = useMemo(
    () =>
      rows
        .filter((row) => {
          if (!row.name?.trim()) return false;
          const kind = row.product_kind || 'sellable';
          if (kind === 'production_input') {
            return row.costPrice !== '' && Number(row.costPrice) >= 0;
          }
          const hasSelling = row.price !== '' && Number(row.price) >= 1;
          const hasVarRange =
            row.allow_variable_price &&
            row.variable_price_min !== '' &&
            row.variable_price_max !== '' &&
            Number(row.variable_price_max) >= 1;
          return hasSelling || hasVarRange;
        })
        .map((row) => {
          const kind = row.product_kind || 'sellable';
          const isPack = Boolean(row.is_pack) && kind === 'sellable';
          const isVar = Boolean(row.allow_variable_price) && kind === 'sellable';

          let costPrice = row.costPrice === '' ? null : Number(row.costPrice);
          if (isPack && row.cost_price_per_pack !== '' && row.quantity_per_pack !== '') {
            const cpp = Number(row.cost_price_per_pack);
            const qpp = Number(row.quantity_per_pack);
            if (Number.isFinite(cpp) && Number.isFinite(qpp) && qpp > 0) {
              costPrice = cpp / qpp;
            }
          }

          let price = row.price === '' ? 0 : Number(row.price);
          if (isVar) {
            const vmin = row.variable_price_min === '' ? null : Number(row.variable_price_min);
            const vmax = row.variable_price_max === '' ? null : Number(row.variable_price_max);
            if ((!price || price < 1) && vmin != null && vmax != null && vmax >= 1) {
              price = vmax;
            }
          }

          return {
            name: row.name || null,
            category_id: row.category_id || null,
            quantity: Number(row.quantity || 1),
            costPrice,
            price,
            taxes: row.taxes === '' ? 0 : Number(row.taxes),
            product_kind: kind,
            is_pack: isPack,
            quantity_per_pack: row.quantity_per_pack === '' ? null : Number(row.quantity_per_pack),
            cost_price_per_pack:
              row.cost_price_per_pack === '' ? null : Number(row.cost_price_per_pack),
            pack_sell_price: row.pack_sell_price === '' ? null : Number(row.pack_sell_price),
            allow_variable_price: isVar,
            variable_price_min:
              row.variable_price_min === '' ? null : Number(row.variable_price_min),
            variable_price_max:
              row.variable_price_max === '' ? null : Number(row.variable_price_max),
          };
        }),
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
        setRows(Array.from({ length: 10 }, createEmptyRow));
      }
    } catch (error) {
      toast.error(error?.data?.detail || 'Bulk onboarding failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategoryInput = (row) => (
    <Autocomplete
      size={isMobile ? 'medium' : 'small'}
      options={categories || []}
      getOptionLabel={(option) => option.name || ''}
      isOptionEqualToValue={(opt, val) => opt.id === (typeof val === 'object' ? val?.id : val)}
      value={(categories || []).find((item) => item.id === row.category_id) || null}
      loading={categoriesLoading}
      onChange={(_, selected) => {
        if (selected?.__isAddNew) {
          setCategoryQuickAddRowKey(row.key);
          setQuickAddOpen(true);
        } else {
          updateRow(row.key, { category_id: selected?.id || null });
        }
      }}
      filterOptions={(opts, state) => {
        const list = opts || [];
        const filtered = list.filter((o) =>
          (o.name || '').toLowerCase().includes(state.inputValue.toLowerCase())
        );
        filtered.push({
          id: '__add__',
          name: `+ Add "${state.inputValue || 'new category'}"`,
          __isAddNew: true,
        });
        return filtered;
      }}
      renderOption={(props, option) => (
        <li
          {...props}
          key={option.id}
          style={option.__isAddNew ? { color: 'var(--palette-primary-main)', fontWeight: 600 } : {}}
        >
          {option.name}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Category"
          placeholder="Category"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {categoriesLoading ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────

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
          Fill rows below or import from a spreadsheet. Each row becomes one product. Pack products
          are supported per row — enable the Pack toggle to reveal pack fields.
        </Alert>

        {/* ── Paste from spreadsheet ──────────────────────────────────── */}
        <Accordion
          expanded={csvExpanded}
          onChange={(_, expanded) => setCsvExpanded(expanded)}
          disableGutters
          elevation={0}
          sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 1, '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<span style={{ fontSize: 18 }}>▾</span>}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2">Paste from spreadsheet (fastest)</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                — copy rows directly from Google Sheets or Excel
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Alert severity="info" sx={{ py: 0.5 }}>
                <strong>Column order (no header row needed):</strong>
                <br />
                <code>
                  Name | Category | Qty | Cost Price | Selling Price | Is Pack (yes/no) | Qty per
                  Pack | Cost per Pack
                </code>
                <br />
                Category must match an existing category name exactly. Header rows are skipped
                automatically.
              </Alert>
              <TextField
                multiline
                rows={6}
                fullWidth
                placeholder="Paste rows here…"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
              />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handlePasteCSV} disabled={!csvText.trim()}>
                  Parse &amp; add rows
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setCsvText('')}
                  disabled={!csvText.trim()}
                >
                  Clear
                </Button>
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* ── Row table / cards ─────────────────────────────────────────── */}
        <Card>
          <CardContent sx={{ overflowX: 'auto' }}>
            {isMobile ? (
              // ── Mobile card layout ──────────────────────────────────────
              <Stack spacing={2}>
                {rows.map((row, index) => (
                  <Card key={row.key} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                        Product Row {index + 1}
                      </Typography>

                      <TextField
                        size="medium"
                        label="Name"
                        fullWidth
                        value={row.name}
                        onChange={(e) => updateRow(row.key, { name: e.target.value })}
                      />

                      {renderCategoryInput(row)}

                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={row.product_kind === 'production_input'}
                            onChange={(e) => {
                              const isInput = e.target.checked;
                              updateRow(row.key, {
                                product_kind: isInput ? 'production_input' : 'sellable',
                                ...(isInput && {
                                  is_pack: false,
                                  quantity_per_pack: '',
                                  cost_price_per_pack: '',
                                  pack_sell_price: '',
                                  allow_variable_price: false,
                                  variable_price_min: '',
                                  variable_price_max: '',
                                }),
                              });
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption">Input only (not sold to customers)</Typography>
                        }
                      />

                      <Divider />

                      {row.product_kind === 'sellable' && (
                        <>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={row.is_pack}
                                onChange={(e) =>
                                  updateRow(row.key, {
                                    is_pack: e.target.checked,
                                    ...(!e.target.checked && {
                                      quantity_per_pack: '',
                                      cost_price_per_pack: '',
                                      pack_sell_price: '',
                                    }),
                                  })
                                }
                              />
                            }
                            label="Pack product"
                          />

                          {row.is_pack && (
                            <Grid container spacing={1.5}>
                              <Grid item xs={6}>
                                <TextField
                                  size="medium"
                                  type="number"
                                  label="Units per pack *"
                                  fullWidth
                                  value={row.quantity_per_pack}
                                  helperText="Items in one pack"
                                  onChange={(e) =>
                                    updateRow(row.key, { quantity_per_pack: e.target.value })
                                  }
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  size="medium"
                                  type="number"
                                  label="Cost per pack *"
                                  fullWidth
                                  value={row.cost_price_per_pack}
                                  helperText="Purchase cost for one pack"
                                  onChange={(e) =>
                                    updateRow(row.key, { cost_price_per_pack: e.target.value })
                                  }
                                />
                              </Grid>
                            </Grid>
                          )}

                          <FormControlLabel
                            control={
                              <Switch
                                checked={row.allow_variable_price}
                                onChange={(e) =>
                                  updateRow(row.key, { allow_variable_price: e.target.checked })
                                }
                              />
                            }
                            label="Allow variable price"
                          />

                          {row.allow_variable_price && (
                            <Grid container spacing={1.5}>
                              <Grid item xs={6}>
                                <TextField
                                  size="medium"
                                  type="number"
                                  label="Min price *"
                                  fullWidth
                                  value={row.variable_price_min}
                                  onChange={(e) =>
                                    updateRow(row.key, { variable_price_min: e.target.value })
                                  }
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  size="medium"
                                  type="number"
                                  label="Max price *"
                                  fullWidth
                                  value={row.variable_price_max}
                                  onChange={(e) =>
                                    updateRow(row.key, { variable_price_max: e.target.value })
                                  }
                                />
                              </Grid>
                            </Grid>
                          )}
                        </>
                      )}

                      <Divider />

                      <TextField
                        size="medium"
                        type="number"
                        label={
                          row.product_kind === 'production_input'
                            ? 'Quantity *'
                            : row.is_pack
                              ? 'Number of packs *'
                              : 'Quantity *'
                        }
                        fullWidth
                        value={row.quantity}
                        inputProps={{ min: 1 }}
                        helperText={
                          row.is_pack &&
                          row.product_kind === 'sellable' &&
                          row.quantity_per_pack &&
                          Number(row.quantity_per_pack) > 0
                            ? `Total units in stock: ${(Number(row.quantity) || 0) * Number(row.quantity_per_pack)}`
                            : undefined
                        }
                        onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                      />

                      {row.product_kind === 'production_input' ? (
                        <TextField
                          size="medium"
                          type="number"
                          label="Cost price *"
                          fullWidth
                          value={row.costPrice}
                          onChange={(e) => updateRow(row.key, { costPrice: e.target.value })}
                        />
                      ) : row.is_pack ? (
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <TextField
                              size="medium"
                              type="number"
                              required
                              label="Selling price (per item) *"
                              fullWidth
                              value={row.price}
                              helperText="What you charge for one unit from the pack"
                              onChange={(e) => updateRow(row.key, { price: e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={6}>
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
                      ) : (
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <TextField
                              size="medium"
                              type="number"
                              label="Cost price"
                              fullWidth
                              value={row.costPrice}
                              onChange={(e) => updateRow(row.key, { costPrice: e.target.value })}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              size="medium"
                              type="number"
                              required={
                                !(
                                  row.allow_variable_price &&
                                  row.variable_price_min !== '' &&
                                  row.variable_price_max !== ''
                                )
                              }
                              label={
                                row.allow_variable_price &&
                                row.variable_price_min !== '' &&
                                row.variable_price_max !== ''
                                  ? 'List price (optional)'
                                  : 'Selling price *'
                              }
                              fullWidth
                              value={row.price}
                              helperText={
                                row.allow_variable_price &&
                                row.variable_price_min !== '' &&
                                row.variable_price_max !== ''
                                  ? 'Leave blank to use max price from the range above'
                                  : undefined
                              }
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
                      )}

                      <Button color="error" onClick={() => removeRow(row.key)}>
                        Remove Row
                      </Button>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ) : (
              // ── Desktop table layout ──────────────────────────────────
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 150 }}>Name</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Category</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Pack</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Variable price</TableCell>
                    <TableCell sx={{ minWidth: 72 }}>Qty</TableCell>
                    <TableCell sx={{ minWidth: 88 }}>Cost</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Selling</TableCell>
                    <TableCell sx={{ minWidth: 60 }}>Tax %</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Input only</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const isSellable = row.product_kind !== 'production_input';
                    const isPack = Boolean(row.is_pack) && isSellable;
                    const hideCostForPack = isPack;
                    const varRangeFilled =
                      row.allow_variable_price &&
                      row.variable_price_min !== '' &&
                      row.variable_price_max !== '';

                    return (
                    <TableRow key={row.key}>
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
                        {isSellable ? (
                          <Stack spacing={1}>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={row.is_pack}
                                  onChange={(e) =>
                                    updateRow(row.key, {
                                      is_pack: e.target.checked,
                                      ...(!e.target.checked && {
                                        quantity_per_pack: '',
                                        cost_price_per_pack: '',
                                        pack_sell_price: '',
                                      }),
                                    })
                                  }
                                />
                              }
                              label="Pack"
                            />
                            {row.is_pack && (
                              <Stack spacing={1}>
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Units/pack"
                                  value={row.quantity_per_pack}
                                  helperText="Per pack"
                                  onChange={(e) =>
                                    updateRow(row.key, { quantity_per_pack: e.target.value })
                                  }
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Cost/pack"
                                  value={row.cost_price_per_pack}
                                  helperText="Purchase / pack"
                                  onChange={(e) =>
                                    updateRow(row.key, { cost_price_per_pack: e.target.value })
                                  }
                                />
                              </Stack>
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {isSellable ? (
                          <>
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
                              <Stack spacing={1} sx={{ mt: 1 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Min"
                                  value={row.variable_price_min}
                                  onChange={(e) =>
                                    updateRow(row.key, { variable_price_min: e.target.value })
                                  }
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Max"
                                  value={row.variable_price_max}
                                  onChange={(e) =>
                                    updateRow(row.key, { variable_price_max: e.target.value })
                                  }
                                />
                              </Stack>
                            )}
                          </>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          label={isPack ? 'Packs' : 'Qty'}
                          value={row.quantity}
                          inputProps={{ min: 1, style: { width: 56 } }}
                          onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                        />
                      </TableCell>

                      <TableCell>
                        {hideCostForPack ? (
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', maxWidth: 72 }}>
                            From pack
                          </Typography>
                        ) : (
                          <TextField
                            size="small"
                            type="number"
                            label="Cost"
                            value={row.costPrice}
                            onChange={(e) => updateRow(row.key, { costPrice: e.target.value })}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          required={isPack ? true : !varRangeFilled}
                          label={isPack ? 'Per item' : varRangeFilled ? 'List (opt.)' : 'Selling'}
                          value={row.price}
                          helperText={varRangeFilled && !isPack ? 'Blank = max' : undefined}
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
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={row.product_kind === 'production_input'}
                              onChange={(e) => {
                                const isInput = e.target.checked;
                                updateRow(row.key, {
                                  product_kind: isInput ? 'production_input' : 'sellable',
                                  ...(isInput && {
                                    is_pack: false,
                                    quantity_per_pack: '',
                                    cost_price_per_pack: '',
                                    pack_sell_price: '',
                                    allow_variable_price: false,
                                    variable_price_min: '',
                                    variable_price_max: '',
                                  }),
                                });
                              }}
                            />
                          }
                          label={
                            <Typography variant="caption">Not sold</Typography>
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Button color="error" size="small" onClick={() => removeRow(row.key)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* ── Bottom actions ──────────────────────────────────────── */}
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                gap: 2,
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                flexWrap: 'wrap',
                alignItems: { sm: 'center' },
              }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="outlined" onClick={addRow}>
                  Add Row
                </Button>
                <Button variant="outlined" onClick={addTenRows}>
                  Add 10 More Rows
                </Button>
              </Stack>
              <Button
                variant="contained"
                onClick={submitBulk}
                disabled={submitting || !formattedRows.length}
              >
                {submitting ? 'Saving...' : `Save Products (${formattedRows.length})`}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>

      <CategoryQuickAddDialog
        open={quickAddOpen}
        storeId={storeId}
        onClose={() => {
          setQuickAddOpen(false);
          setCategoryQuickAddRowKey(null);
        }}
        onCreated={async (newCat) => {
          const rowKey = categoryQuickAddRowKey;
          await mutateCategories();
          if (rowKey != null) {
            updateRow(rowKey, { category_id: newCat.id });
          }
        }}
      />
    </DashboardContent>
  );
}
