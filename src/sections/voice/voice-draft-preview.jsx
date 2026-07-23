import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance from 'src/utils/axios';
import { Iconify } from 'src/components/iconify';
import { saveVoiceAlias } from 'src/actions/voice';

// ----------------------------------------------------------------------

function lineNeedsPicker(line) {
  const hasId = Boolean(line?.product_id || line?.service_id);
  return (
    line?.match_status === 'ambiguous' ||
    line?.match_status === 'unresolved' ||
    !hasId
  );
}

function lineIsResolved(line) {
  return Boolean(line?.product_id || line?.service_id) && !lineNeedsPicker(line);
}

export function VoiceDraftPreview({
  open,
  result,
  storeId,
  intentHint = 'sale',
  onClose,
  onConfirm,
  onSpeakAgain,
}) {
  const draft = result?.draft;
  const [lines, setLines] = useState([]);
  const [addProductForm, setAddProductForm] = useState({
    name: '',
    quantity: 1,
    price: '',
    cost: '',
  });

  useEffect(() => {
    if (!draft) return;
    if (draft.intent === 'add_product') {
      setAddProductForm({
        name: draft.name || '',
        quantity: draft.quantity || 1,
        price: draft.price ?? '',
        cost: draft.cost ?? '',
      });
      setLines([]);
      return;
    }
    setLines(
      (draft.items || []).map((item, idx) => ({
        ...item,
        _key: `${item.spoken_name}-${idx}`,
        quantity: Number(item.quantity) || 1,
      }))
    );
  }, [draft]);

  const canConfirm = useMemo(() => {
    if (!draft) return false;
    if (draft.intent === 'add_product') {
      return Boolean(addProductForm.name?.trim());
    }
    if (!lines.length) return false;
    return lines.every((l) => lineIsResolved(l));
  }, [draft, lines, addProductForm]);

  const updateLine = (key, patch) => {
    setLines((prev) => prev.map((l) => (l._key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key) => {
    setLines((prev) => prev.filter((l) => l._key !== key));
  };

  const pickProduct = (key, product, spokenName) => {
    if (!product) return;
    if (product.forcePicker) {
      updateLine(key, {
        product_id: null,
        service_id: null,
        match_status: 'ambiguous',
        candidates: product.candidates || [],
      });
      return;
    }
    const itemType = product.type === 'service' ? 'service' : 'product';
    setLines((prev) =>
      prev.map((l) => {
        if (l._key !== key) return l;
        const unitPrice = Number(product.price ?? product.unit_price) || 0;
        const lineAmount =
          l.line_amount != null && Number(l.line_amount) > 0 ? Number(l.line_amount) : null;
        const useAmount = lineAmount != null && unitPrice > 0;
        return {
          ...l,
          product_id: itemType === 'product' ? product.id : null,
          service_id: itemType === 'service' ? product.id : null,
          name: product.name,
          unit_price: unitPrice,
          cost_price: product.cost_price ?? product.costPrice ?? null,
          stock: product.stock ?? product.quantity ?? null,
          match_status: 'matched',
          allow_variable_price: product.allow_variable_price,
          is_pack: itemType === 'product' ? product.is_pack : false,
          quantity_per_pack: itemType === 'product' ? product.quantity_per_pack : null,
          pack_sell_price: itemType === 'product' ? product.pack_sell_price : null,
          cost_price_per_pack: itemType === 'product' ? product.cost_price_per_pack : null,
          ...(product.is_pack && itemType === 'product' ? {} : { pack_sale_mode: 'unit' }),
          type: itemType,
          candidates: [],
          ...(useAmount
            ? {
                quantity: lineAmount / unitPrice,
                line_amount: lineAmount,
                input_mode: 'amount',
              }
            : { input_mode: 'qty' }),
        };
      })
    );
    if (spokenName && storeId && itemType === 'product') {
      saveVoiceAlias({
        storeId,
        spokenPhrase: spokenName,
        productId: product.id,
      }).catch(() => {});
    }
  };

  const handleConfirm = () => {
    if (draft?.intent === 'add_product') {
      onConfirm?.({
        intent: 'add_product',
        ...addProductForm,
        name: addProductForm.name.trim(),
        quantity: Number(addProductForm.quantity) || 1,
        price: addProductForm.price === '' ? null : Number(addProductForm.price),
        cost: addProductForm.cost === '' ? null : Number(addProductForm.cost),
        transcript: result?.transcript,
      });
      return;
    }

    const resolved = lines.map((l) => ({
      ...l,
      quantity: Number(l.quantity) || 1,
    }));

    resolved.forEach((l) => {
      if (l.spoken_name && l.product_id && storeId) {
        saveVoiceAlias({
          storeId,
          spokenPhrase: l.spoken_name,
          productId: l.product_id,
        }).catch(() => {});
      }
    });

    onConfirm?.({
      intent: draft.intent,
      items: resolved,
      payment_method: draft.payment_method || null,
      customer_spoken: draft.customer_spoken || null,
      supplier_spoken: draft.supplier_spoken || null,
      transcript: result?.transcript,
    });
  };

  const title =
    intentHint === 'restock'
      ? 'Voice restock'
      : intentHint === 'add_product'
        ? 'Voice add product'
        : 'Voice sale';

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '85vh',
          px: 2,
          pt: 1.5,
          pb: 2.5,
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Box>
          <Typography variant="h6">{title}</Typography>
          {result?.transcript ? (
            <Typography variant="caption" color="text.secondary" display="block">
              “{result.transcript}”
            </Typography>
          ) : null}
          {result?.provider_used ? (
            <Typography variant="caption" color="text.disabled" display="block">
              Speech engine: {result.provider_used}
              {result.language_detected ? ` · ${result.language_detected}` : ''}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {draft?.intent === 'add_product' ? (
        <Stack spacing={1.5}>
          <TextField
            label="Product name"
            value={addProductForm.name}
            onChange={(e) => setAddProductForm((p) => ({ ...p, name: e.target.value }))}
            fullWidth
          />
          <Stack direction="row" spacing={1}>
            <TextField
              label="Qty"
              type="number"
              value={addProductForm.quantity}
              onChange={(e) =>
                setAddProductForm((p) => ({ ...p, quantity: e.target.value }))
              }
              sx={{ width: 100 }}
            />
            <TextField
              label="Sell price"
              type="number"
              value={addProductForm.price}
              onChange={(e) => setAddProductForm((p) => ({ ...p, price: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Cost"
              type="number"
              value={addProductForm.cost}
              onChange={(e) => setAddProductForm((p) => ({ ...p, cost: e.target.value }))}
              fullWidth
            />
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {lines.map((line) => (
            <DraftLine
              key={line._key}
              line={line}
              storeId={storeId}
              intentHint={intentHint}
              onChangeQty={(qty, patch = {}) =>
                updateLine(line._key, { quantity: qty, ...patch })
              }
              onChangePackMode={(mode) =>
                updateLine(line._key, {
                  pack_sale_mode: mode,
                })
              }
              onPick={(product) => pickProduct(line._key, product, line.spoken_name)}
              onRemove={() => removeLine(line._key)}
            />
          ))}
          {!lines.length && (
            <Typography color="text.secondary">
              No products detected. Speak again or type.
            </Typography>
          )}
        </Stack>
      )}

      <Stack direction="row" spacing={1} mt={2.5}>
        <Button variant="outlined" color="inherit" onClick={onClose} fullWidth>
          Discard
        </Button>
        <Button variant="outlined" onClick={onSpeakAgain} fullWidth>
          Speak again
        </Button>
        <Button
          variant="contained"
          disabled={!canConfirm}
          onClick={handleConfirm}
          fullWidth
        >
          {intentHint === 'add_product' ? 'Apply' : 'Add to cart'}
        </Button>
      </Stack>
    </Drawer>
  );
}

function DraftLine({ line, storeId, intentHint, onChangeQty, onChangePackMode, onPick, onRemove }) {
  const needsPicker = lineNeedsPicker(line);
  const [options, setOptions] = useState(line.candidates || []);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(line.spoken_name || '');
  const isPackProduct = Boolean(line.is_pack && line.quantity_per_pack);
  const packMode = line.pack_sale_mode === 'pack' ? 'pack' : 'unit';
  const suggestions = (line.candidates || []).slice(0, 4);

  useEffect(() => {
    setOptions(line.candidates || []);
    setInput(line.spoken_name || '');
  }, [line]);

  const mergeOptions = (remote) => {
    const byId = new Map();
    [...(line.candidates || []), ...(remote || [])].forEach((o) => {
      if (o?.id != null) byId.set(o.id, o);
    });
    return Array.from(byId.values());
  };

  const search = async (q) => {
    if (!storeId) return;
    if (!q || q.length < 1) {
      setOptions(line.candidates || []);
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/quick-dashboard/search', {
        params: {
          store_id: storeId,
          query: q,
          item_type: intentHint === 'sale' ? 'all' : 'product',
          product_kind: intentHint === 'restock' ? undefined : 'sellable',
          limit: 8,
        },
      });
      setOptions(mergeOptions(res.data?.results || []));
    } catch {
      setOptions(line.candidates || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1,
        border: '1px solid',
        borderColor: needsPicker ? 'warning.main' : 'divider',
        bgcolor: needsPicker ? 'warning.lighter' : 'background.paper',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          type="number"
          label={
            line.input_mode === 'amount' && line.line_amount != null
              ? 'Amount'
              : packMode === 'pack'
                ? 'Packs'
                : 'Qty'
          }
          value={
            line.input_mode === 'amount' && line.line_amount != null
              ? line.line_amount
              : line.quantity
          }
          onChange={(e) => {
            const n = Math.max(0.01, Number(e.target.value) || 1);
            if (line.input_mode === 'amount' && line.unit_price > 0) {
              onChangeQty(n / Number(line.unit_price), { line_amount: n, input_mode: 'amount' });
            } else {
              onChangeQty(n, { input_mode: 'qty', line_amount: null });
            }
          }}
          sx={{ width: 100 }}
        />
        {needsPicker ? (
          <Autocomplete
            fullWidth
            size="small"
            options={options}
            loading={loading}
            filterOptions={(opts) => opts}
            getOptionLabel={(o) => o.name || ''}
            isOptionEqualToValue={(a, b) =>
              a?.id === b?.id && (a?.type || 'product') === (b?.type || 'product')
            }
            inputValue={input}
            onInputChange={(_, v, reason) => {
              setInput(v);
              if (reason === 'input') search(v);
            }}
            onChange={(_, v) => onPick(v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  line.match_by_price
                    ? `Pick product at ₦${Number(line.unit_price || 0).toLocaleString()}`
                    : `Pick product for “${line.spoken_name}”`
                }
                placeholder={line.match_by_price ? 'Products at this price…' : 'Did you mean…?'}
                helperText={
                  line.match_by_price && !suggestions.length
                    ? 'No catalog item at that price — search by name'
                    : undefined
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={`${option.type || 'product'}-${option.id}`}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: 1, gap: 1 }}>
                  <span>
                    {option.name}
                    {option.type === 'service' ? ' · service' : ''}
                  </span>
                  {option.price != null && (
                    <Typography component="span" variant="caption" color="text.secondary">
                      ₦{Number(option.price).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
          />
        ) : (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {line.name}
              {line.type === 'service' ? (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                  service
                </Typography>
              ) : null}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {intentHint === 'restock'
                ? `Cost ${line.cost_price ?? '—'} · Stock ${line.stock ?? '—'}`
                : line.input_mode === 'amount' && line.line_amount != null
                  ? `₦${Number(line.line_amount).toLocaleString()} total · qty ${Number(line.quantity).toFixed(2)} · ₦${line.unit_price}/unit`
                  : line.type === 'service'
                    ? `₦${line.unit_price ?? '—'}`
                    : `₦${line.unit_price ?? '—'} · Stock ${line.stock ?? '—'}`}
            </Typography>
          </Box>
        )}
        {!needsPicker && (
          <IconButton
            size="small"
            aria-label="Change product"
            onClick={() =>
              onPick({
                ...line,
                id: null,
                forcePicker: true,
                candidates: line.candidates?.length ? line.candidates : suggestions,
              })
            }
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
        )}
        <IconButton size="small" color="error" aria-label="Remove line" onClick={onRemove}>
          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
        </IconButton>
      </Stack>
      {needsPicker && suggestions.length > 0 && (
        <Stack direction="row" spacing={0.75} mt={1} flexWrap="wrap" useFlexGap>
          {suggestions.map((c) => (
            <Chip
              key={`${c.type || 'product'}-${c.id}`}
              size="small"
              variant="outlined"
              color="warning"
              label={
                c.price != null
                  ? `${c.name}${c.type === 'service' ? ' (svc)' : ''} · ₦${Number(c.price).toLocaleString()}`
                  : c.name
              }
              onClick={() => onPick(c)}
            />
          ))}
        </Stack>
      )}
      {isPackProduct && intentHint === 'sale' && (
        <Stack direction="row" spacing={0.75} mt={1}>
          <Chip
            size="small"
            label="Units"
            color={packMode === 'unit' ? 'primary' : 'default'}
            variant={packMode === 'unit' ? 'filled' : 'outlined'}
            onClick={() => onChangePackMode?.('unit')}
          />
          <Chip
            size="small"
            label="Packs"
            color={packMode === 'pack' ? 'primary' : 'default'}
            variant={packMode === 'pack' ? 'filled' : 'outlined'}
            onClick={() => onChangePackMode?.('pack')}
          />
        </Stack>
      )}
    </Box>
  );
}
