import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { uploadFile } from 'src/actions/upload';
import { addDigitalProduct, editDigitalProduct } from 'src/actions/digital-product';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { DigitalProductPayoutPreview } from './digital-product-payout-preview';

const Schema = zod
  .object({
    name: zod.string().min(1, { message: 'Name is required' }),
    description: schemaHelper.editor1().optional(),
    price: zod.number().min(0, { message: 'Price must be 0 or more' }),
    delivery_type: zod.enum(['file', 'external_link']),
    file_url: zod.string().optional(),
    external_url: zod.string().optional(),
    cover_url: zod.any().optional(),
    publish: zod.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_type === 'file' && !data.file_url) {
      ctx.addIssue({ code: 'custom', message: 'Upload a file', path: ['file_url'] });
    }
    if (data.delivery_type === 'external_link' && !data.external_url) {
      ctx.addIssue({ code: 'custom', message: 'External URL is required', path: ['external_url'] });
    }
  });

export function DigitalProductEditForm({ currentProduct, storeId, storeSlug }) {
  const router = useRouter();
  const { currencySymbol } = useCurrencyFormat();
  const [isPublish, setIsPublish] = useState(currentProduct?.publish === 'publish');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      description: currentProduct?.description || '',
      price: currentProduct?.price ?? 0,
      delivery_type: currentProduct?.delivery_type || 'file',
      file_url: currentProduct?.file_url || '',
      external_url: currentProduct?.external_url || '',
      cover_url: currentProduct?.cover_url || '',
      publish: currentProduct?.publish || 'draft',
    }),
    [currentProduct]
  );

  const methods = useForm({
    resolver: zodResolver(Schema),
    defaultValues,
  });

  const { watch, setValue, handleSubmit, reset, formState: { isSubmitting } } = methods;
  const values = watch();
  const deliveryType = watch('delivery_type');
  const price = watch('price');

  useEffect(() => {
    if (currentProduct) {
      reset(defaultValues);
      setIsPublish(currentProduct.publish === 'publish');
    }
  }, [currentProduct, defaultValues, reset]);

  const handleFileUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadingFile(true);
      try {
        const url = await uploadFile(file, values.name || 'digital-product');
        setValue('file_url', url, { shouldValidate: true });
        toast.success('File uploaded');
      } catch (err) {
        toast.error(err?.message || 'Upload failed');
      } finally {
        setUploadingFile(false);
      }
    },
    [setValue, values.name]
  );

  const onSubmit = handleSubmit(async (data) => {
    if (uploadingCover || uploadingFile) {
      toast.error('Please wait for uploads to finish');
      return;
    }
    try {
      const payload = {
        ...data,
        cover_url: typeof data.cover_url === 'string' ? data.cover_url : null,
        publish: isPublish ? 'publish' : 'draft',
        store_id: Number(storeId),
      };
      if (currentProduct) {
        await editDigitalProduct(currentProduct.id, payload);
        toast.success('Digital product updated');
      } else {
        await addDigitalProduct(payload);
        toast.success('Digital product created');
      }
      router.push(paths.dashboard.digitalProduct.root(storeSlug));
    } catch (error) {
      const detail = error?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Save failed');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        <Card>
          <CardHeader title="Details" />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Storefront image</Typography>
              <Typography variant="caption" color="text.secondary">
                Shown on your public store when customers browse digital products.
              </Typography>
              <Field.Upload
                name="cover_url"
                maxSize={3145728}
                uploadImmediately
                getUploadName={() => `${values.name || 'digital-product'}-cover`}
                onUploadingChange={setUploadingCover}
                onDelete={() => setValue('cover_url', null, { shouldValidate: true })}
              />
              {uploadingCover && (
                <Typography variant="caption" color="text.secondary">
                  Uploading image…
                </Typography>
              )}
            </Stack>

            <Field.Text name="name" label="Product name" />
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Description</Typography>
              <Typography variant="caption" color="text.secondary">
                Use formatting for headings, lists, and emphasis. Long text is shortened on the store with a Read more link.
              </Typography>
              <Field.Editor name="description" sx={{ maxHeight: 320 }} />
            </Stack>
            <Field.Text
              name="price"
              label="List price"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
              }}
            />
            <DigitalProductPayoutPreview price={price} />
          </Stack>
        </Card>

        <Card>
          <CardHeader title="Delivery" subheader="How customers access this product after purchase" />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Field.Select name="delivery_type" label="Delivery type">
              <MenuItem value="file">Downloadable file</MenuItem>
              <MenuItem value="external_link">External link</MenuItem>
            </Field.Select>

            {deliveryType === 'file' && (
              <Stack spacing={1}>
                <Button variant="outlined" component="label" disabled={uploadingFile}>
                  {uploadingFile ? 'Uploading…' : 'Upload digital file'}
                  <input type="file" hidden onChange={handleFileUpload} />
                </Button>
                {uploadingFile && (
                  <Typography variant="caption" color="text.secondary">
                    Uploading file…
                  </Typography>
                )}
                {!uploadingFile && values.file_url && (
                  <Typography variant="caption" color="success.main">
                    File uploaded — ready to save
                  </Typography>
                )}
              </Stack>
            )}

            {deliveryType === 'external_link' && (
              <Field.Text name="external_url" label="External URL" placeholder="https://..." />
            )}
          </Stack>
        </Card>

        <Card>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3 }}>
            <Box>
              <Typography variant="subtitle1">Publish on store website</Typography>
              <Typography variant="body2" color="text.secondary">
                Published products appear on your public store.
              </Typography>
            </Box>
            <Button
              variant={isPublish ? 'contained' : 'outlined'}
              onClick={() => setIsPublish((v) => !v)}
            >
              {isPublish ? 'Published' : 'Draft'}
            </Button>
          </Stack>
        </Card>

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={uploadingCover || uploadingFile}
          >
            {currentProduct ? 'Save changes' : 'Create product'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
