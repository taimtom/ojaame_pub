import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

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

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { uploadFile } from 'src/actions/upload';
import { useGetCategories } from 'src/actions/category';
import { addProduct, editProduct } from 'src/actions/product';
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
    price: zod.number().min(1, { message: 'Price should not be 0.00' }),
    category_id: zod.coerce.number().min(1, { message: 'Category is required' }),
    costPrice: zod.number().optional(),
    priceSale: zod.number().optional(),
    subDescription: zod.string().optional(),
    taxes: zod.number().optional(),
    publish: zod.string().optional(),
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
  })
  .refine((data) => {
    // If costPrice is provided, it must not be greater than price.
    // And if a sale price is provided, costPrice must not exceed it either.
    if (data.costPrice !== undefined) {
      if (data.costPrice > data.price) return false;
      if (data.priceSale !== undefined && data.costPrice > data.priceSale) return false;
    }
    return true;
  }, {
    message: "Cost price must not be greater than regular price or sale price.",
    path: ["costPrice"],
  });


export function ProductNewEditForm({ currentProduct, storeId, storeSlug  }) {
  const router = useRouter();
  const { currencySymbol } = useCurrencyFormat();
  const { t, getLabel, isFieldVisible } = useBusinessType();



  const [includeTaxes, setIncludeTaxes] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
   const [coverUrlInput, setcoverUrlInput] = useState('');
   const [newImageUrl, setNewImageUrl] = useState('');

   const [isPublish, setIsPublish] = useState(
    currentProduct?.publish === 'publish'
  );



  const { categories, categoriesLoading } = useGetCategories(storeId);


  const defaultCategory =
    currentProduct?.category_id ||
    (categories && categories.length > 0 ? categories[0].id : undefined);

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      subDescription: currentProduct?.subDescription || '',
      images: currentProduct?.images || [],
      //
      code: currentProduct?.code || '',
      sku: currentProduct?.sku || '',
      coverUrl: currentProduct?.coverUrl || '',
      price: currentProduct?.price || 0,
      quantity: currentProduct?.quantity || 0,
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

  useEffect(() => {
    if (currentProduct) {
      reset(defaultValues);
      setIsPublish(currentProduct.publish === 'publish');
    }
  }, [currentProduct, defaultValues, reset]);


  useEffect(() => {
    if (includeTaxes) {
      setValue('taxes', 0);
    } else {
      setValue('taxes', currentProduct?.taxes || 0);
    }
  }, [currentProduct?.taxes, includeTaxes, setValue]);

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

      // Call your API to add or edit the product
      let response;
      if (currentProduct) {
        response = await editProduct(currentProduct.id, data);
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
        {/* Mark important fields with an asterisk */}
        <Field.Text name="name" label={`${getLabel('product', 'name')} *`} />
        {isFieldVisible('product', 'quantity') && (
          <Field.Text
            name="quantity"
            label={`${getLabel('product', 'quantity')} *`}
            placeholder="0"
            type="number"
            InputLabelProps={{ shrink: true }}
          />
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

  const renderPricing = (
    <Card>
      <CardHeader title="Pricing" subheader="Price related inputs" sx={{ mb: 3 }} />
      <Divider />
      <Stack spacing={3} sx={{ p: 3 }}>
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
         <Field.Text
          name="price"
          label={`Regular ${t('price')} *`}
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
        {renderProperties}
        {renderActions}
      </Stack>
    </Form>
  );
}
