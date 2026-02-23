import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { addService, editService } from 'src/actions/service';

import { useBusinessType } from 'src/hooks/use-business-type';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewServiceSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  description: schemaHelper.editor1().optional(), // Make description optional
  price: zod.number().min(1, { message: 'Price should not be $0.00' }),
  price_sale: zod.number().optional(),
  // sub_description: zod.string().optional(),
  taxes: zod.number().optional(),
  publish: zod.string().optional(),

  // saleLabel: zod
  //   .object({
  //     enabled: zod.boolean(),
  //     content: zod.string(),
  //   })
  //   .optional(),
  // newLabel: zod
  //   .object({
  //     enabled: zod.boolean(),
  //     content: zod.string(),
  //   })
  //   .optional(),
});

// ----------------------------------------------------------------------

export function ServiceEditForm({ currentService, storeId, storeSlug  }) {
  const { currencySymbol } = useCurrencyFormat();
  const router = useRouter();
  const { t, getLabel, isFieldVisible } = useBusinessType();

  const [isPublish, setIsPublish] = useState(
    currentService?.publish === 'publish'
  );

  const [includeTaxes, setIncludeTaxes] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);

  const defaultValues = useMemo(
    () => ({
      name: currentService?.name || '',
      description: currentService?.description || '',
      // subDescription: currentService?.sub_description || '',
      price: currentService?.price || 0,
      priceSale: currentService?.price_sale || 0,
      taxes: currentService?.taxes || 0,
      publish: currentService?.publish || 'draft',
      // newLabel: currentService?.newLabel || { enabled: false, content: '' },
      // saleLabel: currentService?.saleLabel || { enabled: false, content: '' },
    }),
    [currentService]
  );

  const methods = useForm({
    resolver: zodResolver(NewServiceSchema),
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
    if (currentService) {
      reset(defaultValues);
      setIsPublish(currentService.publish === 'publish');
    }
  }, [currentService, defaultValues, reset]);

  useEffect(() => {
    if (includeTaxes) {
      setValue('taxes', 0);
    } else {
      setValue('taxes', currentService?.taxes || 0);
    }
  }, [currentService?.taxes, includeTaxes, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      data.publish = isPublish ? 'publish' : 'draft';
        let response;
            if (currentService) {
              response = await editService(currentService.id, data);
            } else {
              const storedId = storeId || localStorage.getItem('store_id');
              if (!storedId) {
                throw new Error('Store ID not found');
              }
              const parsedStoreId = Number(storedId);
              const dataWithStore = { ...data, store_id: parsedStoreId };
              response = await addService(dataWithStore);
            }
            toast.success(currentService ? 'Update success!' : 'Create success!');

             // Delay redirection for 5 seconds.
             setTimeout(() => {
              if (currentService) {

                router.push(paths.dashboard.service.root(storeSlug));
              } else {

                router.push(paths.dashboard.service.root(storeSlug));
              }
            }, 5000);
          } catch (error) {
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
                // If error is a plain object with a top-level `detail` property
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

  // const handleRemoveFile = useCallback(
  //   (inputFile) => {
  //     const filtered = values.images && values.images?.filter((file) => file !== inputFile);
  //     setValue('images', filtered);
  //   },
  //   [setValue, values.images]
  // );

  // const handleRemoveAllFiles = useCallback(() => {
  //   setValue('images', [], { shouldValidate: true });
  // }, [setValue]);

  const handleChangeIncludeTaxes = useCallback((event) => {
    setIncludeTaxes(event.target.checked);
  }, []);

  // const handleToggleProperties = () => {
  //   setPropertiesOpen((prev) => !prev); // Toggle the dropdown
  // };

  const renderDetails = (
    <Card>
      <CardHeader title="Details" subheader="Title, Edit Service..." sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="name" label={`${t('service')} name`} />

        <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('service')} Content</Typography>
            <Field.Editor name="description" sx={{ maxHeight: 480 }} />
          </Stack>


        {/* <Field.Text name="sub_description" label="description" multiline rows={4} /> */}
      </Stack>
    </Card>
  );

  const renderPricing = (
    <Card>
      <CardHeader title="Pricing" subheader="Price related inputs" sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text
          name="price"
          label={`Regular ${t('price')}`}
          placeholder="0.00"
          type="number"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  {currencySymbol}
                </Box>
              </InputAdornment>
            ),
          }}
        />
        {isFieldVisible('service', 'duration') && (
          <Field.Text
            name="duration"
            label={getLabel('service', 'duration')}
            placeholder="0"
            type="number"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box component="span" sx={{ color: 'text.disabled' }}>
                    min
                  </Box>
                </InputAdornment>
              ),
            }}
          />
        )}

        {/* <Field.Text
          name="price_sale"
          label="Sale price"
          placeholder="0.00"
          type="number"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  {currencySymbol}
                </Box>
              </InputAdornment>
            ),
          }}
        /> */}

        <FormControlLabel
          control={
            <Switch id="toggle-taxes" checked={includeTaxes} onChange={handleChangeIncludeTaxes} />
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
                  <Box component="span" sx={{ color: 'text.disabled' }}>
                    %
                  </Box>
                </InputAdornment>
              ),
            }}
          />
        )}
      </Stack>
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
        {!currentService ? `Create ${t('service')}` : 'Save changes'}
      </LoadingButton>
    </Stack>
  );


  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails}

        {renderPricing}

        {renderActions}
      </Stack>
    </Form>
  );
}
