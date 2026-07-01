import { useCallback, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import { inputBaseClasses } from '@mui/material/InputBase';

import { fCurrency } from 'src/utils/format-number';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';
import { useQuickSearch } from 'src/hooks/use-quick-search';
import { lineKeyForFormItem, searchItemToFormFields } from 'src/utils/quick-search';

import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { SearchResultCard } from 'src/components/quick-search/search-result-card';

import { useBusinessType } from 'src/hooks/use-business-type';

export function InvoiceNewEditDetails({ storeId: storeIdProp }) {
  const { currencySymbol } = useCurrencyFormat();
  const { control, setValue, watch } = useFormContext();
  const { t } = useBusinessType();

  const { fields, append, remove, update } = useFieldArray({ control, name: 'items' });
  const values = watch();

  const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
  const activeWorkspace = activeWorkspaceJson ? JSON.parse(activeWorkspaceJson) : null;
  const storeId = storeIdProp || activeWorkspace?.id || null;

  const { query, setQuery, searchResults, searching, searchImmediate, clearSearch } =
    useQuickSearch(storeId);

  const subtotal = (values.items || []).reduce((acc, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return acc + quantity * price;
  }, 0);

  const totalAmount =
    subtotal -
    (Number(values.discount) || 0) -
    (Number(values.shipping) || 0) +
    (Number(values.taxes) || 0);

  const itemsByKey = useMemo(() => {
    const map = new Map();
    (values.items || []).forEach((item, index) => {
      const key = lineKeyForFormItem(item);
      if (key) map.set(key, index);
    });
    return map;
  }, [values.items]);

  const handleAddSearchItem = useCallback(
    (item) => {
      const key = `${item.type}-${item.id}`;
      const existingIndex = itemsByKey.get(key);

      if (existingIndex != null) {
        const current = values.items[existingIndex];
        const isService = item.type === 'service';
        const maxStock = item.stock != null ? Number(item.stock) : Infinity;
        const nextQty = isService ? 1 : Number(current.quantity || 0) + 1;

        if (!isService && nextQty > maxStock) {
          toast.error(`Quantity cannot exceed available stock of ${maxStock}.`);
          return;
        }

        const price = Number(current.price) || 0;
        update(existingIndex, {
          ...current,
          quantity: nextQty,
          total: nextQty * price,
        });
        toast.success(`${item.name} quantity updated`);
        return;
      }

      append(searchItemToFormFields(item));
      toast.success(`${item.name} added`);
    },
    [append, itemsByKey, update, values.items]
  );

  const handleSearchKeyDown = async (e) => {
    if (e.key !== 'Enter' || !query.trim()) return;
    const results = await searchImmediate(query);
    if (results.length === 1) {
      const item = results[0];
      const isExact =
        item.code?.toLowerCase() === query.trim().toLowerCase() ||
        item.sku?.toLowerCase() === query.trim().toLowerCase();
      if (isExact) handleAddSearchItem(item);
    }
  };

  const handleChangeQuantity = useCallback(
    (event, index) => {
      const enteredQuantity = Number(event.target.value);
      const row = values.items[index];
      const meta = row?._meta || {};
      const price = Number(row?.price) || 0;

      if (meta.type === 'service') {
        setValue(`items[${index}].quantity`, 1);
        setValue(`items[${index}].total`, price);
        return;
      }

      if (meta.stock != null && enteredQuantity > meta.stock) {
        toast.error(`Quantity cannot exceed available stock of ${meta.stock}.`);
        setValue(`items[${index}].quantity`, meta.stock);
        setValue(`items[${index}].total`, meta.stock * price);
        return;
      }

      setValue(`items[${index}].quantity`, enteredQuantity);
      setValue(`items[${index}].total`, enteredQuantity * price);
    },
    [setValue, values.items]
  );

  const handleChangePrice = useCallback(
    (event, index) => {
      const raw = event.target.value;
      if (raw === '') return;
      const enteredPrice = Number.parseFloat(String(raw).replace(',', '.'));
      if (!Number.isFinite(enteredPrice)) return;

      const row = values.items[index];
      const meta = row?._meta || {};
      const originalPrice = Number(row?.originalPrice) || 0;
      const costPrice = Number(row?.costPrice) || 0;
      const qty = Number(row?.quantity) || 1;

      if (meta.allow_variable_price) {
        const min = meta.variable_price_min;
        const max = meta.variable_price_max;
        if (min != null && enteredPrice < min) {
          toast.error(`Price cannot be less than ${currencySymbol}${min}.`);
          setValue(`items[${index}].price`, originalPrice);
          setValue(`items[${index}].total`, originalPrice * qty);
          return;
        }
        if (max != null && enteredPrice > max) {
          toast.error(`Price cannot be greater than ${currencySymbol}${max}.`);
          setValue(`items[${index}].price`, originalPrice);
          setValue(`items[${index}].total`, originalPrice * qty);
          return;
        }
      } else if (enteredPrice !== originalPrice) {
        toast.error(`Variable pricing is not enabled. Using default price ${currencySymbol}${originalPrice}.`);
        setValue(`items[${index}].price`, originalPrice);
        setValue(`items[${index}].total`, originalPrice * qty);
        return;
      }

      if (meta.type === 'product' && costPrice > 0 && enteredPrice < costPrice) {
        toast.error(`Price cannot be lower than cost (${currencySymbol}${costPrice}).`);
        setValue(`items[${index}].price`, originalPrice);
        setValue(`items[${index}].total`, originalPrice * qty);
        return;
      }

      setValue(`items[${index}].price`, enteredPrice);
      setValue(`items[${index}].total`, enteredPrice * qty);
    },
    [currencySymbol, setValue, values.items]
  );

  const handleRemove = (index) => {
    const itemToRemove = values.items[index];
    if (itemToRemove) {
      const itemTotal = (itemToRemove.quantity || 0) * (itemToRemove.price || 0);
      if (itemTotal > 0 && values.id) {
        const confirmRemove = window.confirm(
          `Remove ${itemToRemove.item || 'this item'}? This will reduce the total by ${currencySymbol}${itemTotal.toFixed(2)}.`
        );
        if (!confirmRemove) return;
      }
    }
    remove(index);
    toast.success('Item removed');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 2 }}>
        Search &amp; add items
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Type name, SKU or barcode…"
        value={query}
        disabled={!storeId}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearchKeyDown}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {searching ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
              )}
            </InputAdornment>
          ),
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={clearSearch}>
                <Iconify icon="eva:close-fill" width={16} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      <Stack spacing={1} sx={{ mb: 3, maxHeight: 280, overflowY: 'auto' }}>
        {searchResults.length === 0 && !searching && query && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            No results for &quot;{query}&quot;
          </Typography>
        )}
        {searchResults.length === 0 && !searching && !query && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            Type to search products and services, or receive consigned stock to sell borrowed items
          </Typography>
        )}
        {!query && searchResults.length > 0 && (
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Consigned stock (ready to sell)
          </Typography>
        )}
        {searchResults.map((item) => (
          <SearchResultCard
            key={`${item.type}-${item.id}`}
            item={item}
            onAdd={handleAddSearchItem}
          />
        ))}
      </Stack>

      <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Line items
      </Typography>

      {fields.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No items yet — search above to add products or services.
        </Typography>
      )}

      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={2}>
        {fields.map((field, index) => {
          const row = values.items[index] || {};
          const meta = row._meta || {};
          const lineTotal = (Number(row.quantity) || 0) * (Number(row.price) || 0);
          const isService = meta.type === 'service' || row.service_id != null;

          return (
            <Stack key={field.id} spacing={1}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {row.item || row.product_name || row.service_name || row.description || 'Item'}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      {isService ? 'Service' : 'Product'}
                    </Typography>
                    {meta.has_consigned && (
                      <Typography variant="caption" color="info.main">
                        · Consignment
                      </Typography>
                    )}
                  </Stack>
                </Box>

                <Field.Text
                  size="small"
                  type="number"
                  name={`items[${index}].quantity`}
                  label={t('quantity')}
                  placeholder="0"
                  onInput={(event) => handleChangeQuantity(event, index)}
                  disabled={isService}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 0.01 }}
                  sx={{ width: { md: 96 } }}
                />

                <Field.Text
                  size="small"
                  type="number"
                  name={`items[${index}].price`}
                  label={
                    meta.allow_variable_price ? `${t('price')} (variable)` : t('price')
                  }
                  placeholder="0.00"
                  onBlur={(event) => handleChangePrice(event, index)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>
                          {currencySymbol}
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { md: 120 } }}
                />

                <Field.Text
                  disabled
                  size="small"
                  name={`items[${index}].total`}
                  label={t('total')}
                  value={lineTotal.toFixed(2)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>
                          {currencySymbol}
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: { md: 120 },
                    [`& .${inputBaseClasses.input}`]: { textAlign: { md: 'right' } },
                  }}
                />

                <IconButton color="error" onClick={() => handleRemove(index)}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Stack
        spacing={2}
        justifyContent="flex-end"
        direction={{ xs: 'column', md: 'row' }}
        sx={{ mb: 3 }}
      >
        <Field.Text
          size="small"
          label={`${t('shipping')}(${currencySymbol})`}
          name="shipping"
          type="number"
          sx={{ maxWidth: { md: 120 } }}
        />
        <Field.Text
          size="small"
          label={`${t('discount')}(${currencySymbol})`}
          name="discount"
          type="number"
          sx={{ maxWidth: { md: 120 } }}
        />
        <Field.Text
          size="small"
          label={`${t('taxes')}(%)`}
          name="taxes"
          type="number"
          sx={{ maxWidth: { md: 120 } }}
        />
      </Stack>

      <Stack spacing={2} alignItems="flex-end" sx={{ textAlign: 'right', typography: 'body2' }}>
        <Stack direction="row">
          <Box sx={{ color: 'text.secondary' }}>{t('subtotal')}</Box>
          <Box sx={{ width: 160, typography: 'subtitle2' }}>{fCurrency(subtotal) || '-'}</Box>
        </Stack>
        <Stack direction="row" sx={{ typography: 'subtitle1' }}>
          <div>{t('total')}</div>
          <Box sx={{ width: 160 }}>{fCurrency(totalAmount) || '-'}</Box>
        </Stack>
      </Stack>
    </Box>
  );
}
