import { useRef, useMemo, useState, Fragment, useCallback } from 'react';

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
import { alpha, useTheme, useMediaQuery } from '@mui/material';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { withOnboardingQuery } from 'src/utils/onboarding-routes';
import { DashboardContent } from 'src/layouts/dashboard';
import { OnboardingSetupShell } from 'src/components/onboarding/onboarding-setup-shell';
import { useAdvanceOnboarding, useOnboardingMode } from 'src/hooks/use-onboarding-mode';
import { useOnboardingProgress } from 'src/actions/onboarding';
import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { bulkOnboardProducts } from 'src/actions/product';
import { addCategory, useGetCategories } from 'src/actions/category';
import { CategoryQuickAddDialog } from '../category-quick-add-dialog';
import {
  createEmptyRow,
  parseBulkUploadFile,
  matchCategoryFromList,
  parsePositionalPasteText,
} from '../utils/bulk-import-parse';

// ----------------------------------------------------------------------

function rowQualifiesForBulkSubmit(row) {
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
}

function formatRowForBulkApi(row) {
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
}

/** API payload rows in submission order, plus row keys for mapping `results[].row_index` back to the grid. */
function buildBulkSubmitPackage(rows) {
  const sourceRowKeys = [];
  const apiRows = [];
  rows.forEach((row) => {
    if (!rowQualifiesForBulkSubmit(row)) return;
    sourceRowKeys.push(row.key);
    apiRows.push(formatRowForBulkApi(row));
  });
  return { apiRows, sourceRowKeys };
}

function buildFormattedBulkRows(rows) {
  return buildBulkSubmitPackage(rows).apiRows;
}

// ----------------------------------------------------------------------

export function ProductBulkOnboardView({ storeSlug, storeId }) {
  const router = useRouter();
  const onboarding = useOnboardingMode();
  const advanceOnboarding = useAdvanceOnboarding();
  const { mutateProgress } = useOnboardingProgress({ skip: !onboarding });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Pre-load 10 empty rows on mount
  const [rows, setRows] = useState(() => Array.from({ length: 10 }, createEmptyRow));
  const { categories, categoriesLoading, mutateCategories } = useGetCategories(storeId);
  const [submitting, setSubmitting] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvExpanded, setCsvExpanded] = useState(false);
  const [fileParsing, setFileParsing] = useState(false);
  const fileInputRef = useRef(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [categoryQuickAddRowKey, setCategoryQuickAddRowKey] = useState(null);
  /** Last bulk-save API error message per row key (shown inline above that row). */
  const [rowSubmitErrors, setRowSubmitErrors] = useState(() => ({}));
  const [sessionCreatedCount, setSessionCreatedCount] = useState(0);

  const clearSubmitErrorForRow = (key) => {
    setRowSubmitErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resolvePendingCategoriesOnRows = useCallback(
    async (currentRows) => {
      const uniquePending = [
        ...new Set(
          currentRows
            .filter((r) => r.pending_category_name?.trim() && !r.category_id)
            .map((r) => r.pending_category_name.trim())
        ),
      ];
      if (!uniquePending.length) return currentRows;

      if (!storeId) {
        toast.error('Store not found. Categories could not be created.');
        return currentRows;
      }

      const working = [...(categories || [])];
      const idByName = {};
      const createdNames = [];
      const needsCreate = [];

      for (let i = 0; i < uniquePending.length; i += 1) {
        const name = uniquePending[i];
        const existing = matchCategoryFromList(name, working);
        if (existing) {
          idByName[name] = existing.id;
        } else {
          needsCreate.push(name);
        }
      }

      needsCreate.sort((a, b) => b.length - a.length);

      await needsCreate.reduce(async (prevPromise, name) => {
        await prevPromise;
        const retryMatch = matchCategoryFromList(name, working);
        if (retryMatch) {
          idByName[name] = retryMatch.id;
          return Promise.resolve();
        }
        try {
          const created = await addCategory({
            name,
            publish: 'publish',
            store_id: Number(storeId),
          });
          idByName[name] = created.id;
          working.push(created);
          createdNames.push(created.name);
        } catch (err) {
          const msg =
            err?.response?.data?.detail || err?.message || 'Failed to create category.';
          toast.error(`Category "${name}": ${msg}`);
        }
        return Promise.resolve();
      }, Promise.resolve());

      if (createdNames.length) {
        const preview = createdNames.slice(0, 5).join(', ');
        toast.success(
          `Created ${createdNames.length} new categor${createdNames.length === 1 ? 'y' : 'ies'}: ${preview}${
            createdNames.length > 5 ? '…' : ''
          }.`
        );
      }

      await mutateCategories?.();

      return currentRows.map((r) => {
        const pending = r.pending_category_name?.trim();
        if (!pending || r.category_id) return r;
        const id = idByName[pending];
        if (!id) return r;
        return { ...r, category_id: id, pending_category_name: '' };
      });
    },
    [categories, storeId, mutateCategories]
  );

  const updateRow = (key, patch) => {
    clearSubmitErrorForRow(key);
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeRow = (key) => {
    clearSubmitErrorForRow(key);
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.key !== key)));
  };

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);

  const addTenRows = () =>
    setRows((prev) => [...prev, ...Array.from({ length: 10 }, createEmptyRow)]);

  const handlePasteCSV = async () => {
    if (!csvText.trim()) {
      toast.error('Paste some data first.');
      return;
    }
    const parsed = parsePositionalPasteText(csvText, categories);
    if (!parsed.length) {
      toast.error('No valid rows found. Check that columns are in the right order.');
      return;
    }
    let mergedSnapshot;
    setRows((prev) => {
      const nonEmpty = prev.filter((r) => r.name || r.price);
      mergedSnapshot = [...nonEmpty, ...parsed];
      return mergedSnapshot;
    });
    const resolved = await resolvePendingCategoriesOnRows(mergedSnapshot);
    setRows(resolved);
    setRowSubmitErrors({});
    setCsvText('');
    setCsvExpanded(false);
    toast.success(`${parsed.length} row(s) imported from paste.`);
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setFileParsing(true);
    try {
      const parsed = await parseBulkUploadFile(file, categories);
      if (!parsed.length) {
        toast.error(
          'No product rows found. Add a header row with columns like Name, Category, Qty, Price — or use positional paste.'
        );
        return;
      }
      let mergedSnapshot;
      setRows((prev) => {
        const nonEmpty = prev.filter((r) => r.name || r.price);
        mergedSnapshot = [...nonEmpty, ...parsed];
        return mergedSnapshot;
      });
      const resolved = await resolvePendingCategoriesOnRows(mergedSnapshot);
      setRows(resolved);
      setRowSubmitErrors({});
      toast.success(`Loaded ${parsed.length} row(s) from "${file.name}". Review the table, then Save.`);
    } catch (err) {
      console.error(err);
      toast.error('Could not read that file. Try .csv or .xlsx.');
    } finally {
      setFileParsing(false);
    }
  };

  const formattedRows = useMemo(() => buildFormattedBulkRows(rows), [rows]);

  const submitBulk = async () => {
    const payloadPreview = buildFormattedBulkRows(rows);
    if (!payloadPreview.length) {
      toast.error('Add at least one valid product row before submitting.');
      return;
    }
    setSubmitting(true);
    setRowSubmitErrors({});
    try {
      const resolvedRows = await resolvePendingCategoriesOnRows(rows);
      setRows(resolvedRows);
      const { apiRows, sourceRowKeys } = buildBulkSubmitPackage(resolvedRows);
      if (!apiRows.length) {
        toast.error('Add at least one valid product row before submitting.');
        return;
      }
      const result = await bulkOnboardProducts({
        store_id: Number(storeId),
        rows: apiRows,
      });

      const results = result.results || [];
      const failed = results.filter((item) => item.status === 'failed');
      const createdCount = Number(result.created_count) || 0;
      const failedCount = failed.length;

      const failedIndexSet = new Set(failed.map((item) => Number(item.row_index)));
      const failedKeys = new Set(
        [...failedIndexSet].map((i) => sourceRowKeys[i]).filter((k) => k != null)
      );

      const nextSubmitErrors = {};
      failed.forEach((item) => {
        const i = Number(item.row_index);
        const k = sourceRowKeys[i];
        if (k != null && item.error) {
          nextSubmitErrors[k] = String(item.error);
        }
      });
      setRowSubmitErrors(nextSubmitErrors);

      setRows((prev) => {
        const submittedSet = new Set(sourceRowKeys);
        const next = prev.filter((row) => {
          if (!submittedSet.has(row.key)) return true;
          return failedKeys.has(row.key);
        });
        if (next.length === 0) return Array.from({ length: 10 }, createEmptyRow);
        return next;
      });

      if (failedCount > 0 && createdCount > 0) {
        toast.success(`Created ${createdCount} product${createdCount === 1 ? '' : 's'}.`);
        toast.error(
          `${failedCount} row(s) were not created. The exact reason is shown above each failed row.`
        );
      } else if (failedCount > 0 && createdCount === 0) {
        toast.error('Nothing was saved. The exact reason is shown above each row below.');
      } else {
        setRowSubmitErrors({});
        toast.success(`Created ${createdCount} product${createdCount === 1 ? '' : 's'}.`);
      }

      if (createdCount > 0) {
        setSessionCreatedCount((prev) => prev + createdCount);
        if (onboarding) await mutateProgress();
      }
    } catch (error) {
      toast.error(error?.data?.detail || 'Bulk onboarding failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRowSubmitError = (rowKey, options = {}) => {
    const { desktopTable } = options;
    const msg = rowSubmitErrors[rowKey];
    if (!msg) return null;
    return (
      <Alert
        severity="error"
        variant="outlined"
        onClose={() => clearSubmitErrorForRow(rowKey)}
        sx={{
          py: 0.75,
          width: '100%',
          '& .MuiAlert-message': { width: '100%' },
          ...(desktopTable
            ? {
                borderColor: 'error.main',
                color: 'text.primary',
                bgcolor: (t) =>
                  t.palette.mode === 'dark'
                    ? alpha(t.palette.error.main, 0.18)
                    : alpha(t.palette.error.main, 0.08),
                '& .MuiAlert-message': {
                  width: '100%',
                  color: 'text.primary',
                },
                '& .MuiAlert-icon': {
                  color: 'error.main',
                },
              }
            : {}),
        }}
      >
        {msg}
      </Alert>
    );
  };

  const renderCategoryInput = (row) => {
    const catList = categories || [];
    const selectedObj = catList.find((item) => item.id === row.category_id) || null;
    const pending = row.pending_category_name?.trim();
    const value = selectedObj || pending || null;

    return (
      <Autocomplete
        freeSolo
        size={isMobile ? 'medium' : 'small'}
        options={catList}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option?.name || '';
        }}
        value={value}
        isOptionEqualToValue={(opt, val) => {
          if (opt?.__isAddNew || val?.__isAddNew) return false;
          if (typeof val === 'object' && val?.id && typeof opt === 'object' && opt?.id) {
            return opt.id === val.id;
          }
          if (typeof val === 'string' && typeof opt === 'string') return val === opt;
          return false;
        }}
        loading={categoriesLoading}
        onChange={(_, selected) => {
          if (selected?.__isAddNew) {
            setCategoryQuickAddRowKey(row.key);
            setQuickAddOpen(true);
            return;
          }
          if (selected == null) {
            updateRow(row.key, { category_id: null, pending_category_name: '' });
            return;
          }
          if (typeof selected === 'string') {
            updateRow(row.key, {
              category_id: null,
              pending_category_name: selected.trim(),
            });
            return;
          }
          updateRow(row.key, { category_id: selected.id, pending_category_name: '' });
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
  };

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

      <OnboardingSetupShell subtitle="Add many products at once — upload a spreadsheet or paste rows, then continue setup when ready.">
      <Stack spacing={3}>
        {onboarding && (
          <Button
            variant="text"
            size="small"
            sx={{ alignSelf: 'flex-start' }}
            onClick={() =>
              router.push(withOnboardingQuery(paths.dashboard.product.new(storeSlug)))
            }
          >
            ← Back to quick add (one at a time)
          </Button>
        )}

        <Alert severity="info">
          Fill rows below, paste from a spreadsheet, or upload a CSV / Excel file. Each row becomes
          one product. Pack and variable-price columns are recognized by common header names. Category
          labels from a file are linked to existing categories when the name is exact or very close;
          otherwise a new category is created for your store. Review the table (optional), then click
          Save Products.
        </Alert>

        {/* ── File upload ─────────────────────────────────────────────── */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Upload CSV or Excel
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  First sheet is used. With a header row, columns are matched by name (e.g. Name,
                  Category, Qty, Cost, Selling price, Tax, Is pack, Qty per pack, Cost per pack,
                  Variable price, Min price, Max price). Without headers, use the same column order
                  as paste import.
                </Typography>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />
              <Button
                variant="contained"
                disabled={fileParsing}
                onClick={() => fileInputRef.current?.click()}
                startIcon={fileParsing ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {fileParsing ? 'Reading…' : 'Choose file'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

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
                <strong>Positional paste (no header):</strong>
                <br />
                <code>
                  Name | Category | Qty | Cost Price | Selling Price | Is Pack (yes/no) | Qty per
                  Pack | Cost per Pack
                </code>
                <br />
                <strong>Or</strong> upload a CSV/Excel file with your own header row — columns are
                matched automatically (see upload card above). New category names are created for
                your store when they do not match an existing category (close names are matched
                automatically).
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
                      {renderRowSubmitError(row.key)}

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
                    <Fragment key={row.key}>
                      {rowSubmitErrors[row.key] ? (
                        <TableRow>
                          <TableCell
                            colSpan={10}
                            sx={{
                              py: 1,
                              borderBottom: (t) => `1px solid ${t.palette.divider}`,
                              bgcolor: 'transparent',
                            }}
                          >
                            {renderRowSubmitError(row.key, { desktopTable: true })}
                          </TableCell>
                        </TableRow>
                      ) : null}
                      <TableRow>
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
                    </Fragment>
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained"
                  onClick={submitBulk}
                  disabled={submitting || !formattedRows.length}
                >
                  {submitting ? 'Saving...' : `Save Products (${formattedRows.length})`}
                </Button>
                {onboarding && sessionCreatedCount > 0 && (
                  <Button
                    variant="contained"
                    color="success"
                    disabled={submitting}
                    onClick={() => advanceOnboarding()}
                  >
                    Continue setup ({sessionCreatedCount} added)
                  </Button>
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
      </OnboardingSetupShell>

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
            updateRow(rowKey, { category_id: newCat.id, pending_category_name: '' });
          }
        }}
      />
    </DashboardContent>
  );
}
