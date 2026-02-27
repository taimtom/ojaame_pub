import { useState, useEffect, useCallback } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { inputBaseClasses } from '@mui/material/InputBase';

import { fCurrency } from 'src/utils/format-number';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

import { useGetServices } from 'src/actions/service';
import { useGetProducts } from 'src/actions/product';

import { toast } from 'src/components/snackbar';
// import { INVOICE_SERVICE_OPTIONS, INVOICE_PRODUCT_OPTIONS } from 'src/_mock';

import { useBusinessType } from 'src/hooks/use-business-type';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

export function InvoiceNewEditDetails() {
  const { currencySymbol } = useCurrencyFormat();
  const { control, setValue, getValues, watch } = useFormContext();
  const { t, getLabel } = useBusinessType();

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const values = watch();

  const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
  const activeWorkspace = activeWorkspaceJson ? JSON.parse(activeWorkspaceJson) : null;
  const storeId = activeWorkspace ? activeWorkspace.id : null;

  const { products, productsLoading } = useGetProducts(storeId);
  const { services, servicesLoading } = useGetServices(storeId);

  const [itemTypes, setItemTypes] = useState([]);
  // const [prevPrices, setPrevPrices] = useState({});

  useEffect(() => {
    const initialTypes = fields.map((field, index) => {
      if (values.items[index]?.product_id) return 'product';
      if (values.items[index]?.service_id) return 'service';
      return 'none';
    });
    setItemTypes(initialTypes);
  }, [fields, values.items]);

 // Consolidate duplicate items if needed
 useEffect(() => {
  const items = getValues('items') || [];
  const consolidatedMap = {};
  const deduped = [];
  items.forEach(item => {
    const key =
      item.product_id != null
        ? `product-${item.product_id}`
        : item.service_id != null
        ? `service-${item.service_id}`
        : null;
    if (key) {
      if (consolidatedMap[key]) {
        consolidatedMap[key].quantity += item.quantity;
      } else {
        consolidatedMap[key] = { ...item };
      }
    } else {
      deduped.push(item);
    }
  });
  const newItems = [...deduped, ...Object.values(consolidatedMap)];
  if (newItems.length !== items.length) {
    setValue('items', newItems);
  }
}, [values.items, setValue, getValues]);


  // const [itemType, setItemType] = useState('service');
  const [prevQuantities, setPrevQuantities] = useState({});

  useEffect(() => {
    fields.forEach((field) => {
      if (getValues(`items[${fields.indexOf(field)}].quantity`) === undefined) {
        setValue(`items[${fields.indexOf(field)}].quantity`, 1);
      }
    });
  }, [fields, setValue, getValues]);


  const totalOnRow = values.items.map((item) => item.quantity * item.price);
  const subtotal = values.items.reduce((acc, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return acc + quantity * price;
  }, 0);
  const total_amount = subtotal - (Number(values.discount) || 0) - (Number(values.shipping) || 0) + (Number(values.taxes) || 0);

  useEffect(() => {
    setValue('total_amount', total_amount);
  }, [setValue, total_amount]);

  useEffect(() => {
    fields.forEach((field, index) => {
      const currentType = itemTypes[index] || 'none';
      let currentItemValue = getValues(`items[${index}].item`);

      if (currentType === 'service' && !currentItemValue) {
        const serviceId = getValues(`items[${index}].service_id`);
        if (serviceId && services.length) {
          const found = services.find((s) => s.id === serviceId);
          if (found) {
            setValue(`items[${index}].item`, found.name);
            currentItemValue = found.name;
          }
        }
      } else if (currentType === 'product' && !currentItemValue) {
        const productId = getValues(`items[${index}].product_id`);
        if (productId && products.length) {
          const found = products.find((p) => p.id === productId);
          if (found) {
            setValue(`items[${index}].item`, found.name);
            currentItemValue = found.name;
          }
        }
      }
      setValue(`items[${index}].type`, currentType);
      if (!currentItemValue) {
        setValue(`items[${index}].item`, '');
      }
    });
  }, [fields, itemTypes, setValue, getValues, services, products]);


  useEffect(() => {
    setPrevQuantities((prev) => {
      const newPrev = { ...prev };
      fields.forEach((field) => {
        if (newPrev[field.id] === undefined) {
          newPrev[field.id] = 1;
        }
      });
      return newPrev;
    });
  }, [fields]);

  // useEffect(() => {
  //   const initialPrices = {};
  //   fields.forEach((field, index) => {
  //     // Initialize with the current price or costPrice if current price is not set.
  //     initialPrices[field.id] = values.items[index]?.price || values.items[index]?.costPrice || 0;
  //   });
  //   setPrevPrices(initialPrices);
  // }, [fields, values.items]);

  const handleAdd = () => {
    // Append a new row. The dropdown options already filter out duplicates.
    append({
      product_id: undefined,
      service_id: undefined,
      item: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
      costPrice: 0,
      originalPrice: 0,
    });
    setItemTypes(prev => [...prev, 'none']);
  };



  const handleRemove = (index) => {
    const itemToRemove = values.items[index];
    const isEditMode = !!values.id; // Check if we're editing an existing sale

    // Show confirmation if removing item will significantly change total in edit mode
    if (isEditMode && itemToRemove) {
      const itemTotal = (itemToRemove.quantity || 0) * (itemToRemove.price || 0);
      if (itemTotal > 0) {
        const confirm = window.confirm(
          `Remove ${itemToRemove.item || 'this item'}? This will reduce the total by ${currencySymbol}${itemTotal.toFixed(2)}.`
        );
        if (!confirm) return;
      }
    }

    remove(index);
    setItemTypes(prev => prev.filter((_, i) => i !== index));

    // Show success message
    toast.success('Item removed successfully');
  };

  const handleTypeChange = (index, value) => {
    setItemTypes(prev => {
      const updatedTypes = [...prev];
      updatedTypes[index] = value;
      return updatedTypes;
    });
    setValue(`items[${index}].item`, '');
    setValue(`items[${index}].price`, 0);
    setValue(`items[${index}].total`, 0);
    setValue(`items[${index}].product_id`, undefined);
    setValue(`items[${index}].service_id`, undefined);
    setValue(`items[${index}].costPrice`, value === 'product' ? 0 : undefined);
    setValue(`items[${index}].originalPrice`, 0);
    if (value === 'service') {
      setValue(`items[${index}].quantity`, 1);
    }
  };

  const handleSelectItem = useCallback(
    (index, selectedName, type) => {
      if (type === 'service') {
        const service = services.find(s => s.name === selectedName);
        if (service) {
          setValue(`items[${index}].price`, service.price || 0);
          setValue(
            `items[${index}].total`,
            (values.items[index]?.quantity || 1) * (service.price || 0)
          );
          setValue(`items[${index}].service_id`, service.id);
          setValue(`items[${index}].item`, service.name);
          // Auto-fill description with service name if not already set
          const currentDesc = values.items[index]?.description;
          if (!currentDesc) {
            setValue(`items[${index}].description`, service.sub_description || service.description || service.name);
          }
          // For services, costPrice is not used.
          setValue(`items[${index}].costPrice`, undefined);
          setValue(`items[${index}].originalPrice`, service.price || 0);
        }
      } else if (type === 'product') {
        const product = products.find(p => p.name === selectedName);
        if (product) {
          setValue(`items[${index}].price`, product.price || 0);
          setValue(`items[${index}].total`, (values.items[index]?.quantity || 1) * (product.price || 0));
          setValue(`items[${index}].product_id`, product.id);
          setValue(`items[${index}].item`, product.name);
          // Save costPrice for validation. If product.costPrice is unavailable, use product.price.
          setValue(`items[${index}].costPrice`, product.costPrice || product.price || 0);
          // Also store the original product price for reversion.
          setValue(`items[${index}].originalPrice`, product.price || 0);
        }
      }
    },
    [setValue, values.items, products, services]
  );


  const handleChangeQuantity = useCallback(
    (event, index) => {
      const enteredQuantity = Number(event.target.value);
      const type =
        itemTypes[index] ||
        (values.items[index]?.product_id ? 'product' : values.items[index]?.service_id ? 'service' : 'none');
      const price = values.items[index]?.price || 0;
      if (type === 'service') {
        event.target.value = 1;
        setValue(`items[${index}].quantity`, 1);
        setValue(`items[${index}].total`, 1 * price);
        return;
      }
      if (type === 'product') {
        const selectedProductName = values.items[index]?.item;
        if (selectedProductName) {
          const selectedProduct = products.find(prod => prod.name === selectedProductName);
          if (selectedProduct) {
            if (enteredQuantity > selectedProduct.quantity) {
              toast.error(`Quantity cannot exceed available stock of ${selectedProduct.quantity}.`);
              event.target.value = selectedProduct.quantity;
              setValue(`items[${index}].quantity`, selectedProduct.quantity);
              setValue(`items[${index}].total`, selectedProduct.quantity * price);
              return;
            }
          }
        }
      }
      setValue(`items[${index}].quantity`, enteredQuantity);
      setValue(`items[${index}].total`, enteredQuantity * price);
    },
    [itemTypes, setValue, values.items, products]
  );

  // const handleChangePrice = useCallback(
  //   (event, index) => {
  //     const price = Number(event.target.value);
  //     setValue(`items[${index}].price`, price);
  //     setValue(`items[${index}].total`, price * (values.items[index]?.quantity || 1));
  //   },
  //   [setValue, values.items]
  // );

  const handleChangePrice = useCallback(
    (event, index) => {
      const enteredPrice = Number(event.target.value);
      const currentType =
        itemTypes[index] ||
        (values.items[index]?.product_id ? 'product' : values.items[index]?.service_id ? 'service' : 'none');

      if (currentType === 'product') {
        const selectedProductName = values.items[index]?.item;
        const product = selectedProductName ? products.find((p) => p.name === selectedProductName) : null;
        const costPrice = Number(values.items[index]?.costPrice) || 0;
        const originalPrice = Number(values.items[index]?.originalPrice) || 0;

        // Enforce variable pricing rules when enabled on the product
        if (product && product.allow_variable_price) {
          const min = product.variable_price_min ?? null;
          const max = product.variable_price_max ?? null;
          if (min != null && enteredPrice < min) {
            toast.error(`Price for ${product.name} cannot be less than ${currencySymbol}${min}.`);
            setValue(`items[${index}].price`, originalPrice);
            setValue(`items[${index}].total`, originalPrice * (values.items[index]?.quantity || 1));
            return;
          }
          if (max != null && enteredPrice > max) {
            toast.error(`Price for ${product.name} cannot be greater than ${currencySymbol}${max}.`);
            setValue(`items[${index}].price`, originalPrice);
            setValue(`items[${index}].total`, originalPrice * (values.items[index]?.quantity || 1));
            return;
          }
        } else if (product) {
          // Variable pricing not allowed: revert to original price if user tries to override
          if (enteredPrice !== originalPrice) {
            toast.error(`Variable pricing is not enabled for ${product.name}. Using default price ${currencySymbol}${originalPrice}.`);
            setValue(`items[${index}].price`, originalPrice);
            setValue(`items[${index}].total`, originalPrice * (values.items[index]?.quantity || 1));
            return;
          }
        }

        // Cost price floor still applies
        if (costPrice > 0 && enteredPrice < costPrice) {
          toast.error(`Price cannot be lower than cost price (${currencySymbol}${costPrice}). Reverting to product price (${currencySymbol}${originalPrice}).`);
          setValue(`items[${index}].price`, originalPrice);
          setValue(`items[${index}].total`, originalPrice * (values.items[index]?.quantity || 1));
          return;
        }
      }

      setValue(`items[${index}].price`, enteredPrice);
      setValue(`items[${index}].total`, enteredPrice * (values.items[index]?.quantity || 1));
    },
    [setValue, values.items, itemTypes, products, currencySymbol]
  );

  const renderTotal = (
    <Stack
      spacing={2}
      alignItems="flex-end"
      sx={{ mt: 3, textAlign: 'right', typography: 'body2' }}
    >
      <Stack direction="row">
        <Box sx={{ color: 'text.secondary' }}>{t('subtotal')}</Box>
        <Box sx={{ width: 160, typography: 'subtitle2' }}>{fCurrency(subtotal) || '-'}</Box>
      </Stack>

      <Stack direction="row">
        <Box sx={{ color: 'text.secondary' }}>{t('shipping')}</Box>
        <Box sx={{ width: 160, ...(values.shipping && { color: 'error.main' }) }}>
          {values.shipping ? `- ${fCurrency(values.shipping)}` : '-'}
        </Box>
      </Stack>

      <Stack direction="row">
        <Box sx={{ color: 'text.secondary' }}>{t('discount')}</Box>
        <Box sx={{ width: 160, ...(values.discount && { color: 'error.main' }) }}>
          {values.discount ? `- ${fCurrency(values.discount)}` : '-'}
        </Box>
      </Stack>

      <Stack direction="row">
        <Box sx={{ color: 'text.secondary' }}>{t('taxes')}</Box>
        <Box sx={{ width: 160 }}>{values.taxes ? fCurrency(values.taxes) : '-'}</Box>
      </Stack>

      <Stack direction="row" sx={{ typography: 'subtitle1' }}>
        <div>{t('total')}</div>
        <Box sx={{ width: 160 }}>{fCurrency(total_amount) || '-'}</Box>
      </Stack>
    </Stack>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Details:
      </Typography>

      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
        {fields.map((item, index) => {
          const currentType =
            itemTypes[index] ||
            (values.items[index]?.product_id
              ? 'product'
              : values.items[index]?.service_id
                ? 'service'
                : 'none');
          let optionsList = [];
          if (currentType === 'service' || currentType === 'product') {
            const allOptions = currentType === 'service' ? services : products;
            const selectedItems = values.items
              .filter((itm, i) => i !== index && itm.item)
              .map((itm) => itm.item);
            optionsList = allOptions
              .filter((option) => {
                if (values.items[index]?.item === option.name) return true;
                return !selectedItems.includes(option.name);
              })
              .sort((a, b) => a.name.localeCompare(b.name));
          }
          const selectedItemName = values.items[index]?.item;
          const selectedProduct =
            currentType === 'product' && selectedItemName
              ? products.find((p) => p.name === selectedItemName)
              : null;
          return (
            <Stack key={item.id} alignItems="flex-end" spacing={1.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
                <Field.Select
                  name={`items[${index}].dummyType`}
                  size="small"
                  label="Type"
                  value={currentType}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                  disabled={!storeId}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="service">{t('service')}</MenuItem>
                  <MenuItem value="product">{t('product')}</MenuItem>
                </Field.Select>
                <Field.Select
                  name={`items[${index}].item`}
                  size="small"
                  label={
                    currentType === 'none'
                      ? 'Select Type'
                      : currentType === 'service'
                        ? t('service')
                        : t('product')
                  }
                  value={values.items[index]?.item || ''}
                  onChange={(e) => {
                    const selectedItem = (currentType === 'service' ? services : products).find(
                      (option) => option.name === e.target.value
                    );
                    setValue(`items[${index}].item`, selectedItem?.name || '');
                    handleSelectItem(index, selectedItem?.name, currentType);
                  }}
                  disabled={
                    !storeId ||
                    currentType === 'none' ||
                    (currentType === 'service' ? servicesLoading : productsLoading)
                  }
                >
                  <MenuItem value="">{!storeId ? 'No active store' : 'Select Type'}</MenuItem>
                  <Divider sx={{ borderStyle: 'dashed' }} />
                  {(currentType === 'service' || currentType === 'product') &&
                    optionsList.map((option) => (
                      <MenuItem key={option.id} value={option.name}>
                        {option.name}
                      </MenuItem>
                    ))}
                </Field.Select>
                <Field.Text
                  size="small"
                  name={`items[${index}].description`}
                  label={t('description')}
                  InputLabelProps={{ shrink: true }}
                />
                <Field.Text
                  size="small"
                  type="number"
                  name={`items[${index}].quantity`}
                  label={t('quantity')}
                  placeholder="0"
                  onInput={(event) => handleChangeQuantity(event, index)}
                  disabled={currentType === 'service'}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 0.01 }}
                  sx={{ maxWidth: { md: 96 } }}
                />
                <Field.Text
                  size="small"
                  type="number"
                  name={`items[${index}].price`}
                  label={
                    selectedProduct?.allow_variable_price
                      ? `${t('price')} (variable)`
                      : t('price')
                  }
                  placeholder="0.00"
                  onChange={(event) => {
                    const enteredPrice = Number(event.target.value);
                    setValue(`items[${index}].price`, enteredPrice);
                    setValue(
                      `items[${index}].total`,
                      enteredPrice * (values.items[index]?.quantity || 1)
                    );
                  }}
                  onBlur={(event) => handleChangePrice(event, index)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>{currencySymbol}</Box>
                      </InputAdornment>
                    ),
                  }}
                  helperText={
                    selectedProduct?.allow_variable_price &&
                    selectedProduct.variable_price_min != null &&
                    selectedProduct.variable_price_max != null
                      ? `Variable range: ${currencySymbol}${selectedProduct.variable_price_min}–${currencySymbol}${selectedProduct.variable_price_max}`
                      : undefined
                  }
                  sx={{ maxWidth: { md: 96 } }}
                />

                {/* <Field.Text
                  size="small"
                  type="number"
                  name={`items[${index}].price`}
                  label="Price"
                  placeholder="0.00"
                  onChange={(event) => handleChangePrice(event, index)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>{currencySymbol}</Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: { md: 96 } }}
                /> */}
                  <Field.Text
                  disabled
                  size="small"
                  type="number"
                  name={`items[${index}].total`}
                  label={t('total')}
                  placeholder="0.00"
                  value={((Number(values.items[index]?.quantity) || 0) * (Number(values.items[index]?.price) || 0)).toFixed(2)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>{currencySymbol}</Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    maxWidth: { md: 104 },
                    [`& .${inputBaseClasses.input}`]: {
                      textAlign: { md: 'right' },
                    },
                  }}
                />
              </Stack>


              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  color="error"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                  onClick={() => handleRemove(index)}
                  sx={{
                    minWidth: 'auto',
                    px: 1,
                    '&:hover': {
                      bgcolor: 'error.lighter'
                    }
                  }}
                >
                  Remove
                </Button>
                {values.items && values.items.length > 1 && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemove(index)}
                    sx={{
                      bgcolor: 'error.lighter',
                      '&:hover': {
                        bgcolor: 'error.light'
                      }
                    }}
                  >
                    <Iconify icon="eva:trash-2-outline" width={16} />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Stack
        spacing={3}
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-end', md: 'center' }}
      >
        <Button
          size="small"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAdd}
          sx={{ flexShrink: 0 }}
          disabled={!storeId} // disable if no active store
        >
          {t('addItem')}
        </Button>

        <Stack
          spacing={2}
          justifyContent="flex-end"
          direction={{ xs: 'column', md: 'row' }}
          sx={{ width: 1 }}
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
      </Stack>

      {renderTotal}
    </Box>
  );
}
