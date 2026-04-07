import { z as zod } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import MenuItem from '@mui/material/MenuItem';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { uploadFile } from 'src/actions/upload';
import { useGetCategories } from 'src/actions/category';
import { addProduct, editProduct, useGetProducts } from 'src/actions/product';
import {
  _tags,
  PRODUCT_SIZE_OPTIONS,
  PRODUCT_GENDER_OPTIONS,
  PRODUCT_COLOR_NAME_OPTIONS,
} from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useBusinessType } from 'src/hooks/use-business-type';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

// ----------------------------------------------------------------------

export const NewProductSchema = zod
  .object({
    name: zod.string().min(1, { message: 'Name is required!' }),
    description: schemaHelper.editor1().optional(),
    images: schemaHelper.files1().optional(),
    code: zod.string().optional(),
    sku: zod.string().optional(),
    coverUrl: zod.any().optional(),
    quantity: zod.number().min(1, { message: 'Quantity is required!' }),
    colors: zod.string().array().optional(),
    sizes: zod.string().array().optional(),
    tags: zod.string().array().optional(),
    gender: zod.string().array().optional(),
    product_kind: zod.enum(['sellable', 'production_input']).default('sellable'),
    price: zod.number().min(0, { message: 'Invalid price' }),
    category_id: zod.coerce.number().min(1, { message: 'Category is required' }),
    costPrice: zod.number().optional(),
    priceSale: zod.number().optional(),
    subDescription: zod.string().optional(),
    taxes: zod.number().optional(),
    publish: zod.string().optional(),
    // Pack fields
    is_pack: zod.boolean().optional(),
    // Allow null so single items (non‑pack) can submit with these cleared
    quantity_per_pack: zod.number().nullable().optional(),
    cost_price_per_pack: zod.number().nullable().optional(),
    pack_sell_price: zod.number().nullable().optional(),
    // Variable pricing fields
    allow_variable_price: zod.boolean().optional(),
    variable_price_min: zod.number().nullable().optional(),
    variable_price_max: zod.number().nullable().optional(),
    saleLabel: zod
      .object({
        enabled: zod.boolean(),
        content: zod.string(),
      })
      .optional(),
    newLabel: zod
      .object({
        enabled: zod.boolean(),
        content: zod.string(),
      })
      .optional(),
    sub_items: zod
      .array(
        zod.object({
          component_product_id: zod.coerce.number().min(1),
          quantity_per_unit: zod.coerce.number().positive(),
        })
      )
      .optional()
      .default([]),
  })
  .refine((data) => {
    if (data.is_pack) {
      if (!data.quantity_per_pack || data.quantity_per_pack < 1) return false;
    }
    return true;
  }, {
    message: 'Quantity per pack must be at least 1.',
    path: ['quantity_per_pack'],
  })
  .refine((data) => {
    if (data.allow_variable_price) {
      const { variable_price_min: min, variable_price_max: max } = data;
      if (min == null || max == null) return false;
      if (min < 0 || max < 0) return false;
      if (min > max) return false;
    }
    return true;
  }, {
    message: 'When variable pricing is enabled, both min and max must be set and min must not exceed max.',
    path: ['variable_price_max'],
  })
  .refine((data) => {
    if (data.is_pack && (data.cost_price_per_pack === undefined || data.cost_price_per_pack === null)) {
      return false;
    }
    return true;
  }, {
    message: 'Cost price per pack is required for pack products.',
    path: ['cost_price_per_pack'],
  })
  .refine((data) => {
    if (!data.is_pack || data.pack_sell_price == null) return true;
    return data.pack_sell_price >= (data.cost_price_per_pack ?? 0);
  }, {
    message: 'Pack sell price must be at least the cost price per pack.',
    path: ['pack_sell_price'],
  })
  .refine((data) => {
    if (data.product_kind === 'production_input') return true;
    if (data.price < 1) return false;
    return true;
  }, {
    message: 'Regular price must be at least 1 for sellable products.',
    path: ['price'],
  })
  .refine((data) => {
    if (data.product_kind !== 'production_input') return true;
    return data.costPrice !== undefined && data.costPrice >= 0;
  }, {
    message: 'Cost price is required for production input items.',
    path: ['costPrice'],
  })
  .refine((data) => {
    if (data.product_kind === 'production_input') return true;
    if (data.costPrice !== undefined) {
      if (data.costPrice > data.price) return false;
      if (data.priceSale !== undefined && data.costPrice > data.priceSale) return false;
    }
    return true;
  }, {
    message: 'Cost price must not be greater than regular price or sale price.',
    path: ['costPrice'],
  })
  .refine((data) => {
    if (data.product_kind !== 'sellable' || !data.sub_items?.length) return true;
    const ids = data.sub_items.map((r) => r.component_product_id);
    return new Set(ids).size === ids.length;
  }, {
    message: 'Each ingredient can only appear once in sub-items.',
    path: ['sub_items'],
  });


export function ProductNewEditForm({ currentProduct, storeId, storeSlug, mutateProduct }) {
  const router = useRouter();
  const { currencySymbol } = useCurrencyFormat();
  const { t, getLabel, isFieldVisible } = useBusinessType();



  const [includeTaxes, setIncludeTaxes] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [coverUrlInput, setcoverUrlInput] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [productType, setProductType] = useState(
    currentProduct?.is_pack ? 'pack' : 'single'
  );

  const [isPublish, setIsPublish] = useState(
    currentProduct?.publish === 'publish'
  );



  const { categories, categoriesLoading } = useGetCategories(storeId);
  const { products } = useGetProducts(storeId);

  const ingredientOptions = useMemo(
    () =>
      (products || []).filter(
        (p) =>
          p.product_kind === 'production_input' &&
          (!currentProduct || p.id !== currentProduct.id)
      ),
    [products, currentProduct]
  );


  const defaultCategory =
    currentProduct?.category_id ||
    (categories && categories.length > 0 ? categories[0].id : undefined);

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      subDescription: currentProduct?.subDescription || '',
      images: currentProduct?.images || [],
      code: currentProduct?.code || '',
      sku: currentProduct?.sku || '',
      coverUrl: currentProduct?.coverUrl || '',
      price: currentProduct?.price || 0,
      // For pack products the DB stores total units; display as number of packs
      quantity:
        currentProduct
          ? currentProduct.is_pack && currentProduct.quantity_per_pack > 0
            ? Math.round(currentProduct.quantity / currentProduct.quantity_per_pack)
            : currentProduct.quantity ?? 0
          : 1,
      costPrice: currentProduct?.costPrice || 0,
      priceSale: currentProduct?.priceSale || 0,
      tags: currentProduct?.tags || [],
      taxes: currentProduct?.taxes || 0,
      gender: currentProduct?.gender || [],
      category_id: defaultCategory,
      colors: currentProduct?.colors || [],
      sizes: currentProduct?.sizes || [],
      newLabel: currentProduct?.newLabel || { enabled: false, content: '' },
      saleLabel: currentProduct?.saleLabel || { enabled: false, content: '' },
      publish: currentProduct?.publish || 'draft',
      // Pack fields
      is_pack: currentProduct?.is_pack || false,
      quantity_per_pack: currentProduct?.quantity_per_pack || null,
      cost_price_per_pack: currentProduct?.cost_price_per_pack || null,
      pack_sell_price: currentProduct?.pack_sell_price ?? null,
      // Variable pricing fields
      allow_variable_price: currentProduct?.allow_variable_price || false,
      variable_price_min: currentProduct?.variable_price_min ?? null,
      variable_price_max: currentProduct?.variable_price_max ?? null,
      product_kind:
        currentProduct?.product_kind === 'production_input' ? 'production_input' : 'sellable',
      sub_items: (currentProduct?.sub_items || currentProduct?.subItems || []).map((r) => ({
        component_product_id: r.component_product_id,
        quantity_per_unit: r.quantity_per_unit,
      })),
    }),
    [currentProduct, defaultCategory]
  );

  const methods = useForm({
    resolver: zodResolver(NewProductSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'sub_items',
  });

  useEffect(() => {
    if (values.product_kind === 'production_input') {
      setProductType('single');
      setValue('is_pack', false);
      setValue('allow_variable_price', false);
      setValue('variable_price_min', null);
      setValue('variable_price_max', null);
      setValue('priceSale', 0);
      setValue('sub_items', []);
    }
  }, [values.product_kind, setValue]);

  useEffect(() => {
    if (currentProduct) {
      reset(defaultValues);
      setIsPublish(currentProduct.publish === 'publish');
      setProductType(currentProduct.is_pack ? 'pack' : 'single');
    }
  }, [currentProduct, defaultValues, reset]);


  useEffect(() => {
    if (includeTaxes) {
      setValue('taxes', 0);
    } else {
      setValue('taxes', currentProduct?.taxes || 0);
    }
  }, [currentProduct?.taxes, includeTaxes, setValue]);

  const handleProductTypeChange = useCallback(
    (_, newType) => {
      if (!newType) return;
      setProductType(newType);
      const isPack = newType === 'pack';
      setValue('is_pack', isPack);
      if (!isPack) {
        setValue('quantity_per_pack', null);
        setValue('cost_price_per_pack', null);
        setValue('pack_sell_price', null);
      }
    },
    [setValue]
  );

  // Auto-calculated cost per item for pack products (display only)
  const costPricePerPack = values.cost_price_per_pack;
  const quantityPerPack = values.quantity_per_pack;
  const calculatedCostPerItem =
    values.is_pack && costPricePerPack > 0 && quantityPerPack > 0
      ? (costPricePerPack / quantityPerPack).toFixed(4)
      : null;
  
  // Updated removal function compares images by URL.
  const handleRemoveFile = useCallback(
    (inputFile) => {
      const inputUrl =
        typeof inputFile === 'string' ? inputFile : inputFile?.path;
      const filtered =
        values.images &&
        values.images.filter((file) => {
          const fileUrl = typeof file === 'string' ? file : file?.path;
          return fileUrl !== inputUrl;
        });
      setValue('images', filtered);
      // Optionally, call your API to delete the file from local storage.
    },
    [setValue, values.images]
  );


  const onSubmit = handleSubmit(async (data) => {
    try {
      // Process coverUrl: if it's a File, upload it to your local storage.
      if (data.coverUrl && data.coverUrl instanceof File) {
        data.coverUrl = await uploadFile(data.coverUrl, data.name);
      }

      // Process images: if any image is a File, upload it and replace with the file path.
      if (data.images && data.images.length > 0) {
        const processedImages = await Promise.all(
          data.images.map(async (img) => {
            if (typeof img === 'object' && img instanceof File) {
              return uploadFile(img, data.name);
            }
            return img;
          })
        );
        data.images = processedImages;
      }


      // Set publish state.
      data.publish = isPublish ? 'publish' : 'draft';

      if (data.product_kind === 'production_input') {
        const cp = Number(data.costPrice ?? 0);
        data.price = cp > 0 ? cp : 0.01;
        data.priceSale = null;
        data.allow_variable_price = false;
        data.variable_price_min = null;
        data.variable_price_max = null;
        data.is_pack = false;
        data.quantity_per_pack = null;
        data.cost_price_per_pack = null;
        data.pack_sell_price = null;
        data.sub_items = [];
      }

      // For single products, clear pack-specific fields.
      // Pack expansion (quantity × quantity_per_pack, costPrice calculation) is
      // handled exclusively by the backend to avoid double-multiplication.
      if (!data.is_pack) {
        data.quantity_per_pack = null;
        data.cost_price_per_pack = null;
        data.pack_sell_price = null;
      }

      // Call your API to add or edit the product
      let response;
      if (currentProduct) {
        response = await editProduct(currentProduct.id, data);
        if (mutateProduct) {
          await mutateProduct();
        }
      } else {
        const storedId = storeId || localStorage.getItem('store_id');
        if (!storedId) {
          throw new Error('Store ID not found');
        }
        const parsedStoreId = Number(storedId);
        const dataWithStore = { ...data, store_id: parsedStoreId };
        response = await addProduct(dataWithStore);
      }
      toast.success(currentProduct ? 'Update success!' : 'Create success!');
      // router.push(paths.dashboard.product.root);
       // Delay redirection for 5 seconds.
      setTimeout(() => {
        if (currentProduct) {
          // Redirect to product list page after update.
          router.push(paths.dashboard.product.root(storeSlug));
        } else {
          // Redirect to product root after creation.
          router.push(paths.dashboard.product.root(storeSlug));
        }
      }, 2000);
    }  catch (error) {
      console.error('Submission error:', error);
      let message = '';
      if (error && typeof error === 'object') {
        const { response, message: errMsg, detail: topDetail } = error;
        if (response && response.data) {
          const { detail } = response.data;
          if (Array.isArray(detail)) {
            message = detail.join(' ');
          } else if (typeof detail === 'string') {
            message = detail;
          } else {
            message = JSON.stringify(response.data);
          }
        } else if (topDetail) {
          message =
            typeof topDetail === 'string'
              ? topDetail
              : Array.isArray(topDetail)
              ? topDetail.join(' ')
              : JSON.stringify(topDetail);
        } else {
          message = errMsg;
        }
      }
      if (!message) {
        message = 'An unknown error occurred';
      }
      toast.error(message);
    }
  });


  const handleRemoveAllFiles = useCallback(() => {
    setValue('images', [], { shouldValidate: true });
      // TODO: Call your API to delete all relevant files if needed.
  }, [setValue]);

  const handleChangeIncludeTaxes = useCallback((event) => {
    setIncludeTaxes(event.target.checked);
  }, []);

  const handleToggleProperties = () => {
    setPropertiesOpen((prev) => !prev); // Toggle the dropdown
  };

  // Render the "Details" section.
  const renderDetails = (
    <Card>
      <CardHeader title="Details" subheader="Title, short description, image..." sx={{ mb: 3 }} />
      <Divider />
      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="name" label={`${getLabel('product', 'name')} *`} />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Inventory role</Typography>
          <ToggleButtonGroup
            exclusive
            value={values.product_kind || 'sellable'}
            onChange={(_, v) => {
              if (!v) return;
              setValue('product_kind', v);
            }}
            size="small"
          >
            <ToggleButton value="sellable">For sale</ToggleButton>
            <ToggleButton value="production_input">
              {t('productionInput')} (not sold)
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">
            Production inputs are purchased and used in making finished goods; they do not appear in checkout or Quick
            Sale. Use the Usage dashboard to deduct stock.
          </Typography>
        </Stack>

        {/* Pack / Single item toggle */}
        {values.product_kind !== 'production_input' && (
          <Stack spacing={1}>
            <Typography variant="subtitle2">Item Type</Typography>
            <ToggleButtonGroup
              exclusive
              value={productType}
              onChange={handleProductTypeChange}
              size="small"
            >
              <ToggleButton value="single">Single Item</ToggleButton>
              <ToggleButton value="pack">Pack</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}

        {isFieldVisible('product', 'quantity') && (
          <Field.Text
            name="quantity"
            label={values.is_pack ? 'Number of Packs *' : `${getLabel('product', 'quantity')} *`}
            placeholder="0"
            type="number"
            InputLabelProps={{ shrink: true }}
            helperText={
              values.is_pack && values.quantity_per_pack > 0
                ? `Total units in stock: ${(values.quantity || 0) * values.quantity_per_pack}`
                : undefined
            }
          />
        )}

        {/* Pack-specific fields */}
        {values.is_pack && (
          <Stack spacing={2}>
            <Field.Text
              name="quantity_per_pack"
              label="Quantity per Pack *"
              placeholder="e.g. 12"
              type="number"
              InputLabelProps={{ shrink: true }}
              helperText="How many individual units are in one pack"
            />
          </Stack>
        )}

        <Field.Select native name="category_id" label={`${t('category')} *`} InputLabelProps={{ shrink: true }}>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Field.Select>
        {/* Product Code and SKU side by side */}
        {(isFieldVisible('product', 'code') || isFieldVisible('product', 'sku')) && (
          <Stack direction="row" spacing={2}>
            {isFieldVisible('product', 'code') && (
              <Field.Text name="code" label={getLabel('product', 'code')} />
            )}
            {isFieldVisible('product', 'sku') && (
              <Field.Text name="sku" label={getLabel('product', 'sku')} />
            )}
          </Stack>
        )}
        {/* Rest of the details */}
        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('description')}</Typography>
          <Field.Editor name="description" sx={{ maxHeight: 480 }} />
        </Stack>

        {isFieldVisible('product', 'images') && (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('product')} Image</Typography>
          <Field.Upload
            name="coverUrl"
            maxSize={3145728}
            onDelete={() => setValue('coverUrl', null, { shouldValidate: true })}
          />
          <TextField
            label="Or enter Avatar URL"
            value={coverUrlInput}
            onChange={(e) => setcoverUrlInput(e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={() => {
              setValue('coverUrl', coverUrlInput);
              setcoverUrlInput('');
            }}
          >
            Set Avatar URL
          </Button>
          {typeof values.coverUrl === 'string' && values.coverUrl.startsWith('http') && (
            <Box mt={2}>
              <img src={values.coverUrl} alt="Avatar Preview" style={{ maxWidth: '200px' }} />
            </Box>
          )}
        </Stack>
        )}
      </Stack>
    </Card>
  );

  const isProductionInput = values.product_kind === 'production_input';

  const renderPricing = (
    <Card>
      <CardHeader
        title="Pricing"
        subheader={isProductionInput ? 'Cost only (not sold to customers)' : 'Price related inputs'}
        sx={{ mb: 3 }}
      />
      <Divider />
      <Stack spacing={3} sx={{ p: 3 }}>
        {isProductionInput && (
          <Alert severity="info" sx={{ py: 0.75 }}>
            Selling price is not used. Stock is reduced via the <strong>Usage dashboard</strong>, not sales.
          </Alert>
        )}
        {!isProductionInput && values.is_pack ? (
          <Stack spacing={2}>
            <Field.Text
              name="cost_price_per_pack"
              label={`Cost ${t('price')} per Pack *`}
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              helperText="Total purchase cost for one full pack"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" sx={{ color: 'text.disabled' }}>{currencySymbol}</Box>
                  </InputAdornment>
                ),
              }}
            />
            {calculatedCostPerItem !== null && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Cost per item: <strong>{currencySymbol} {calculatedCostPerItem}</strong>
                &nbsp;(auto-calculated from pack cost ÷ quantity per pack)
              </Alert>
            )}
          </Stack>
        ) : isProductionInput ? (
          <Field.Text
            name="costPrice"
            label={`${t('productionInput')} cost *`}
            placeholder="0.00"
            type="number"
            InputLabelProps={{ shrink: true }}
            helperText="Stored as unit cost; not shown as a selling price."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box component="span" sx={{ color: 'text.disabled' }}>{currencySymbol}</Box>
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <Field.Text
            name="costPrice"
            label={`Cost ${t('price')} *`}
            placeholder="0.00"
            type="number"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box component="span" sx={{ color: 'text.disabled' }}>{currencySymbol}</Box>
                </InputAdornment>
              ),
            }}
          />
        )}
        {!isProductionInput && (
          <>
            <Field.Text
              name="price"
              label={values.is_pack ? `Selling ${t('price')} per Item *` : `Regular ${t('price')} *`}
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              helperText={values.is_pack ? 'The price charged to customers per individual item' : undefined}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" sx={{ color: 'text.disabled' }}>{currencySymbol}</Box>
                  </InputAdornment>
                ),
              }}
            />
            {values.is_pack && (
              <Field.Text
                name="pack_sell_price"
                label={`Optional pack ${t('price')} (whole pack)`}
                placeholder="0.00"
                type="number"
                InputLabelProps={{ shrink: true }}
                helperText="Default when selling a full pack on Quick Dashboard; must be at least cost per pack."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" sx={{ color: 'text.disabled' }}>{currencySymbol}</Box>
                    </InputAdornment>
                  ),
                }}
              />
            )}
            <Field.Text
              name="priceSale"
              label={`Sale ${t('price')}`}
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" sx={{ color: 'text.disabled' }}>{currencySymbol}</Box>
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={values.allow_variable_price || false}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setValue('allow_variable_price', enabled);
                    if (!enabled) {
                      setValue('variable_price_min', null);
                      setValue('variable_price_max', null);
                    }
                  }}
                />
              }
              label="Allow variable pricing"
            />
            {values.allow_variable_price && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Field.Text
                  name="variable_price_min"
                  label="Min variable price"
                  placeholder="0.00"
                  type="number"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box component="span" sx={{ color: 'text.disabled' }}>{currencySymbol}</Box>
                      </InputAdornment>
                    ),
                  }}
                />
                <Field.Text
                  name="variable_price_max"
                  label="Max variable price"
                  placeholder="0.00"
                  type="number"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box component="span" sx={{ color: 'text.disabled' }}>{currencySymbol}</Box>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            )}
            <FormControlLabel
              control={
                <Switch
                  id="toggle-taxes"
                  checked={includeTaxes}
                  onChange={handleChangeIncludeTaxes}
                />
              }
              label="Price includes taxes"
            />
            {!includeTaxes && (
              <Field.Text
                name="taxes"
                label="Tax (%)"
                placeholder="0.00"
                type="number"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" sx={{ color: 'text.disabled' }}>%</Box>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </>
        )}
      </Stack>
    </Card>
  );

  const renderSubItems = (
    <Card>
      <CardHeader
        title="Sub-items (ingredients)"
        subheader="Amount of each production-input product used per 1 unit sold"
        sx={{ mb: 3 }}
      />
      <Divider />
      <Stack spacing={2} sx={{ p: 3 }}>
        {!ingredientOptions.length && (
          <Alert severity="info" sx={{ py: 0.75 }}>
            Create <strong>production input</strong> products in this store first, then add them here as
            ingredients.
          </Alert>
        )}
        {fields.map((field, index) => (
          <Stack
            key={field.id}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          >
            <Field.Select
              name={`sub_items.${index}.component_product_id`}
              label="Ingredient"
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 200 }}
            >
              <MenuItem value="">
                <em>Select ingredient</em>
              </MenuItem>
              {ingredientOptions.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Field.Select>
            <Field.Text
              name={`sub_items.${index}.quantity_per_unit`}
              label="Qty per unit sold"
              type="number"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 0.0001, step: 'any' }}
              sx={{ width: { xs: 1, sm: 180 } }}
            />
            <Button color="error" variant="outlined" onClick={() => remove(index)} sx={{ mt: { sm: 1 } }}>
              Remove
            </Button>
          </Stack>
        ))}
        <Button
          variant="outlined"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={() =>
            append({
              component_product_id: ingredientOptions[0]?.id ?? '',
              quantity_per_unit: 1,
            })
          }
          disabled={!ingredientOptions.length}
        >
          Add ingredient
        </Button>
      </Stack>
    </Card>
  );

  const renderProperties = (
    <Card>
      <CardHeader
        title={`Advanced ${t('product')} Properties`}
        subheader="Additional functions and attributes..."
        sx={{ cursor: 'pointer' }}
        onClick={handleToggleProperties}
        action={
          <Box
            component="span"
            sx={{
              transition: '0.3s',
              transform: propertiesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <Iconify
              icon={propertiesOpen ? 'mdi:arrow-down-circle' : 'mdi:arrow-right-circle'}
              width={24}
              height={24}
            />
            <Typography variant="body1" marginLeft={1}>
              {propertiesOpen ? 'Close' : 'View'}
            </Typography>
          </Box>
        }
      />
      <Collapse in={propertiesOpen}>
        <Divider />
        <Stack spacing={3} sx={{ p: 3 }}>
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
          >
            <Field.MultiSelect
              checkbox
              name="colors"
              label="Colors"
              options={PRODUCT_COLOR_NAME_OPTIONS}
            />
            <Field.MultiSelect
              checkbox
              name="sizes"
              label="Sizes"
              options={PRODUCT_SIZE_OPTIONS}
            />
          </Box>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Sub Description</Typography>
            <Field.Editor name="subDescription" sx={{ maxHeight: 480 }} />
          </Stack>
          <Field.Autocomplete
            name="tags"
            label="Tags"
            placeholder="+ Tags"
            multiple
            freeSolo
            disableCloseOnSelect
            options={_tags.map((option) => option)}
            getOptionLabel={(option) => option}
            renderOption={(props, option) => (
              <li {...props} key={option}>
                {option}
              </li>
            )}
            renderTags={(selected, getTagProps) =>
              selected.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                  color="info"
                  variant="soft"
                />
              ))
            }
          />
          {isFieldVisible('product', 'gender') && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Gender</Typography>
              <Field.MultiCheckbox row name="gender" options={PRODUCT_GENDER_OPTIONS} sx={{ gap: 2 }} />
            </Stack>
          )}
          <Divider sx={{ borderStyle: 'dashed' }} />
          <Stack direction="row" alignItems="center" spacing={3}>
            <Field.Switch name="saleLabel.enabled" label={null} sx={{ m: 0 }} />
            <Field.Text
              name="saleLabel.content"
              label="Sale label"
              fullWidth
              disabled={!values.saleLabel.enabled}
            />
          </Stack>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Field.Switch name="newLabel.enabled" label={null} sx={{ m: 0 }} />
            <Field.Text
              name="newLabel.content"
              label="New label"
              fullWidth
              disabled={!values.newLabel.enabled}
            />
          </Stack>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Images</Typography>
            <Field.Upload
              multiple
              thumbnail
              name="images"
              maxSize={3145728}
              onRemove={handleRemoveFile}
              onRemoveAll={handleRemoveAllFiles}
              onUpload={() => console.info('ON UPLOAD')}
            />
            <TextField
              label="Add image via URL"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
            />
            <Button
              variant="contained"
              onClick={() => {
                if (newImageUrl.trim()) {
                  setValue('images', [...(values.images || []), newImageUrl.trim()]);
                  setNewImageUrl('');
                }
              }}
            >
              Add Image URL
            </Button>
            <Box mt={2} display="flex" flexWrap="wrap" gap={2}>
              {/* {values.images &&
                values.images.map((img, index) => {
                  if (typeof img === 'string' && img.startsWith('http')) {
                    return (
                      <Box
                        key={index}
                        component="img"
                        src={img}
                        alt={`Product Image ${index}`}
                        sx={{
                          maxWidth: '100px',
                          border: '1px solid #ccc',
                          borderRadius: 1,
                        }}
                      />
                    );
                  }
                  return null;
                })} */}
            </Box>
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderActions = (
    <Stack spacing={3} direction="row" alignItems="center" flexWrap="wrap">
      <FormControlLabel
        control={
          <Switch
            checked={isPublish}
            onChange={(e) => {
              setIsPublish(e.target.checked);
              setValue('publish', e.target.checked ? 'publish' : 'draft');
            }}
            inputProps={{ id: 'publish-switch' }}
          />
        }
        label="Publish"
        sx={{ pl: 3, flexGrow: 1 }}
      />
      <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
        {!currentProduct ? `Create ${t('product')}` : 'Save changes'}
      </LoadingButton>
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails}
        {renderPricing}
        {values.product_kind === 'sellable' && renderSubItems}
        {renderProperties}
        {renderActions}
      </Stack>
    </Form>
  );
}
