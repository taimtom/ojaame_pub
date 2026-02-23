import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewCategorySchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  description: schemaHelper.editor({ message: { required_error: 'Description is required!' } }),
});

// ----------------------------------------------------------------------

export function CategoryNewEditForm() {
  const router = useRouter();

  const methods = useForm({
    resolver: zodResolver(NewCategorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting }, // Track loading state
  } = methods;

  // Handle form submission
  const onSubmit = handleSubmit(async (data) => {
    try {
      // Simulate API call or data processing
      await new Promise((resolve) => setTimeout(resolve, 500)); // Mock 1-second delay

      toast.success('Create success!');
      reset(); // Reset form after submission

      // Navigate to the category root page
      router.push(paths.dashboard.category.root);
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

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {/* Render details section */}
        <Card>
          <CardHeader title="Details" subheader="Title, short description" sx={{ mb: 3 }} />
          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Field.Text name="name" label="Category name" />
            <Field.Text name="description" label="Description" multiline rows={4} />
          </Stack>
        </Card>

        {/* Render actions section */}
        <Stack spacing={3} direction="row" alignItems="center" flexWrap="wrap">
          <FormControlLabel
            control={<Switch defaultChecked inputProps={{ id: 'publish-switch' }} />}
            label="Publish"
            sx={{ pl: 3, flexGrow: 1 }}
          />
          <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
            Create Category
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
