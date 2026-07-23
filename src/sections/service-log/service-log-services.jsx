import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

function emptyServiceRow() {
  return {
    service_id: null,
    service_name: '',
    unit_price: '',
  };
}

function ensureRows(items) {
  if (items?.length) return items;
  return [emptyServiceRow()];
}

export function ServiceLogServices({
  items,
  onChange,
  onServiceSelected,
  storeId,
  currencySymbol,
  disabled = false,
}) {
  const rows = useMemo(() => ensureRows(items), [items]);
  const selectedServiceIds = useMemo(
    () => new Set(rows.filter((row) => row.service_id).map((row) => row.service_id)),
    [rows]
  );
  const [optionsByIndex, setOptionsByIndex] = useState({});
  const [loadingByIndex, setLoadingByIndex] = useState({});
  const [queryByIndex, setQueryByIndex] = useState({});

  useEffect(() => {
    setOptionsByIndex((prev) => {
      const next = {};
      rows.forEach((_, index) => {
        if (prev[index]) next[index] = prev[index];
      });
      return next;
    });
  }, [rows]);

  useEffect(() => {
    if (!storeId) return undefined;

    const timers = rows.map((_, index) => {
      const query = queryByIndex[index] ?? '';
      return setTimeout(
        async () => {
          setLoadingByIndex((prev) => ({ ...prev, [index]: true }));
          try {
            const res = await axiosInstance.get('/api/quick-dashboard/search', {
              params: {
                query: query.trim(),
                store_id: storeId,
                item_type: 'service',
                limit: query.trim() ? 20 : 5,
              },
            });
            const services = (res.data?.results || []).filter((r) => r.type === 'service');
            setOptionsByIndex((prev) => ({ ...prev, [index]: services }));
          } catch {
            setOptionsByIndex((prev) => ({ ...prev, [index]: [] }));
          } finally {
            setLoadingByIndex((prev) => ({ ...prev, [index]: false }));
          }
        },
        query.trim() ? 300 : 0
      );
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [storeId, rows, queryByIndex]);

  const commitRows = (next) => {
    const filled = next.filter((row) => row.service_id);
    if (!filled.length) {
      onChange([emptyServiceRow()]);
      return;
    }
    onChange(next);
  };

  const updateRow = (index, patch) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    commitRows(next);
  };

  const handleSelect = async (index, service) => {
    if (!service) {
      updateRow(index, emptyServiceRow());
      setQueryByIndex((prev) => ({ ...prev, [index]: '' }));
      return;
    }

    const duplicate = rows.some((row, rowIndex) => rowIndex !== index && row.service_id === service.id);
    if (duplicate) {
      return;
    }

    updateRow(index, {
      service_id: service.id,
      service_name: service.name,
      unit_price: Number(service.price) || 0,
    });
    setQueryByIndex((prev) => ({ ...prev, [index]: service.name || '' }));

    if (onServiceSelected) {
      await onServiceSelected(service);
    }
  };

  const addRow = () => {
    commitRows([...rows, emptyServiceRow()]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) return;
    const next = rows.filter((_, i) => i !== index);
    commitRows(next.length ? next : [emptyServiceRow()]);
    setQueryByIndex(() => {
      const rebuilt = {};
      next.forEach((row, i) => {
        rebuilt[i] = row.service_name || '';
      });
      return rebuilt;
    });
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Services
      </Typography>

      <Stack spacing={1.25}>
        {rows.map((row, index) => {
          const isOptionAlreadySelected = (option) =>
            option?.id !== row.service_id && selectedServiceIds.has(option?.id);

          const selectedOption =
            row.service_id != null
              ? {
                  id: row.service_id,
                  name: row.service_name,
                  price: Number(row.unit_price) || 0,
                  type: 'service',
                }
              : null;

          return (
            <Stack
              key={`service-row-${index}`}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Autocomplete
                fullWidth
                disabled={disabled}
                options={optionsByIndex[index] || []}
                loading={Boolean(loadingByIndex[index])}
                value={selectedOption}
                inputValue={queryByIndex[index] ?? row.service_name ?? ''}
                onInputChange={(_, value, reason) => {
                  if (reason === 'reset') return;
                  setQueryByIndex((prev) => ({ ...prev, [index]: value }));
                }}
                onChange={(_, value) => handleSelect(index, value)}
                onOpen={() => {
                  setQueryByIndex((prev) => ({
                    ...prev,
                    [index]: prev[index] ?? row.service_name ?? '',
                  }));
                }}
                getOptionLabel={(opt) => opt?.name || ''}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                getOptionDisabled={isOptionAlreadySelected}
                filterOptions={(x) => x}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ width: 1 }}
                      spacing={2}
                    >
                      <Typography variant="body2">{opt.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currencySymbol}
                        {Number(opt.price || 0).toLocaleString()}
                      </Typography>
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={index === 0 ? 'Service' : `Service ${index + 1}`}
                    placeholder="Search or pick a service"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingByIndex[index] ? <CircularProgress color="inherit" size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <TextField
                size="medium"
                label="Price"
                type="number"
                disabled={disabled || !row.service_id}
                value={row.unit_price}
                onChange={(e) =>
                  updateRow(index, { unit_price: Math.max(0, Number(e.target.value) || 0) })
                }
                sx={{ width: { xs: 1, sm: 140 }, flexShrink: 0 }}
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ mr: 0.5, color: 'text.disabled', fontSize: 12 }}>
                      {currencySymbol}
                    </Typography>
                  ),
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />

              {rows.length > 1 && (
                <IconButton
                  size="small"
                  color="error"
                  disabled={disabled}
                  onClick={() => removeRow(index)}
                  sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
                  aria-label="Remove service"
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              )}
            </Stack>
          );
        })}
      </Stack>

      <Button
        size="small"
        variant="text"
        disabled={disabled}
        startIcon={<Iconify icon="eva:plus-fill" width={16} />}
        onClick={addRow}
        sx={{ mt: 1, alignSelf: 'flex-start', px: 0 }}
      >
        Add more services
      </Button>
    </Box>
  );
}
