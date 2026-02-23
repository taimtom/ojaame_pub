import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

// import Box from '@mui/material/Box';
// import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import LoadingButton from '@mui/lab/LoadingButton';
// import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { addCategory, editCategory } from 'src/actions/category';

// import {} from // _tags,
// // PRODUCT_SIZE_OPTIONS,
// // PRODUCT_GENDER_OPTIONS,
// // PRODUCT_COLOR_NAME_OPTIONS,
// // PRODUCT_CATEGORY_OPTIONS,
// 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewCategorySchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  publish: zod.string().optional(),
  description: schemaHelper.editor({ message: { required_error: 'Description is required!' } }),
});

// ----------------------------------------------------------------------

export function CategoryNewEditForm({ currentCategory, storeId, storeSlug  }) {
  const router = useRouter();

  const [isPublish, setIsPublish] = useState(
    currentCategory?.publish === 'publish'
  );

  const defaultValues = useMemo(
    () => ({
      name: currentCategory?.name || '',
      publish: currentCategory?.publish || 'draft',
      description: currentCategory?.description || '',
    }),
    [currentCategory]
  );

  const methods = useForm({
    resolver: zodResolver(NewCategorySchema),
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
    if (currentCategory) {
      reset(defaultValues);
      setIsPublish(currentCategory.publish === 'publish');
    }
  }, [currentCategory, defaultValues, reset]);


  const onSubmit = handleSubmit(async (data) => {
    try {
      data.publish = isPublish ? 'publish' : 'draft';
      let response;

      if (currentCategory) {
        response = await editCategory(currentCategory.id, data);
      } else {
        // Try to retrieve storeId from props, then localStorage
        const storedId = storeId || localStorage.getItem('store_id');

        // Log the values to debug
        console.log('storeId prop:', storeId);
        console.log('store_id from localStorage:', localStorage.getItem('store_id'));

        if (!storedId) {
          throw new Error('Store ID not found. Ensure that storeId is passed or stored in localStorage.');
        }

        const parsedStoreId = Number(storedId);
        const dataWithStore = { ...data, store_id: parsedStoreId };

        // Use dataWithStore which now includes store_id
        response = await addCategory(dataWithStore);
      }

      toast.success(currentCategory ? 'Update success!' : 'Create success!');
      // Redirect after a short delay
      setTimeout(() => {
        router.push(paths.dashboard.category.root(storeSlug));
      }, 5000);
    } catch (error) {
      console.error('Submission error:', error);
      const message =
        error.response?.data?.detail ||
        error.message ||
        'Operation failed. Please try again.';
      toast.error(message);
    }
  });



  const renderDetails = (
    <Card>
      <CardHeader title="Details" subheader="Title, short description" sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="name" label="Category name" />

        <Field.Text name="description" label="Sub description" multiline rows={4} />
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
        {!currentCategory ? 'Create Category' : 'Save changes'}
      </LoadingButton>
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails}

        {renderActions}
      </Stack>
    </Form>
  );
}
