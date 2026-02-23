import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';

import { getIndustries, getSubIndustries, getExactBusinesses } from 'src/data/industries';

import { uploadFile } from 'src/actions/upload';
import { useCompany, createCompany, updateCompany } from 'src/actions/company';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------
// Define the validation schema.
export const UpdateCompanySchema = zod.object({
  companyName: zod.string().min(1, { message: 'Name is required!' }),
  companyLogo: schemaHelper.file1({ message: { required_error: 'Company logo is required!' } }),
  companyLocation: zod.string().min(1, { message: 'Address is required!' }),
  primaryIndustry: zod.string().min(1, { message: 'Industry is required!' }),
  subIndustry: zod.string().min(1, { message: 'Sub Industry is required!' }),
  exactBusiness: zod.string().min(1, { message: 'Exact Business is required!' }),
});

export function AccountCompany() {
  const router = useRouter();
  const { user } = useAuthContext();
  // Skip fetching if user has no company_id
  const skipFetch = user?.company_id == null;

  const {
    company,
    companyLoading,
    companyError,
    mutateCompany,
  } = useCompany({ skip: skipFetch });

  const [companyLogoUrlInput, setCompanyLogoUrlInput] = useState('');
  const isInitialLoad = useRef(true);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(UpdateCompanySchema),
    defaultValues: {
      companyName: '',
      companyLogo: null,
      companyLocation: '',
      primaryIndustry: '',
      subIndustry: '',
      exactBusiness: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    reset,
    watch,
  } = methods;

  const values = watch();
  const industry = watch('primaryIndustry');
  const subIndustry = watch('subIndustry');

  // Prefill form when company data arrives
  useEffect(() => {
    if (company) {
      isInitialLoad.current = true;
      const logoValue = company.companyLogo || null;
      reset({
        companyName: company.companyName || '',
        companyLogo: logoValue,
        companyLocation: company.companyLocation || '',
        primaryIndustry: company.primaryIndustry || '',
        subIndustry: company.subIndustry || '',
        exactBusiness: company.exactBusiness || '',
      });
      // Populate logo URL input if logo is a string URL
      if (typeof logoValue === 'string' && logoValue.trim() !== '') {
        setCompanyLogoUrlInput(logoValue);
      } else {
        setCompanyLogoUrlInput('');
      }
      // Mark initial load as complete after a short delay to allow form to settle
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 100);
    }
  }, [company, reset]);

  // Reset sub-industry and exact-business when industry changes
  useEffect(() => {
    // Skip during initial load
    if (isInitialLoad.current) return;
    
    if (!industry) {
      setValue('subIndustry', '');
      setValue('exactBusiness', '');
    } else if (subIndustry && !getSubIndustries(industry).find(si => si.value === subIndustry)) {
      setValue('subIndustry', '');
      setValue('exactBusiness', '');
    }
  }, [industry, subIndustry, setValue]);

  // Reset exact-business when sub-industry changes
  useEffect(() => {
    // Skip during initial load
    if (isInitialLoad.current) return;
    
    if (!subIndustry || !industry) {
      setValue('exactBusiness', '');
    } else {
      const exactBusinesses = getExactBusinesses(industry, subIndustry);
      const currentExactBusiness = values.exactBusiness;
      if (currentExactBusiness && !exactBusinesses.find(eb => eb.value === currentExactBusiness)) {
        setValue('exactBusiness', '');
      }
    }
  }, [subIndustry, industry, setValue, values.exactBusiness]);

  if (companyLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (companyError && companyError.detail !== "No company associated with this user.") {
    return <Typography color="error">Error loading company details.</Typography>;
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Handle file upload
      if (data.companyLogo) {
        if (data.companyLogo instanceof File) {
          data.companyLogo = await uploadFile(data.companyLogo, data.companyName);
        } else if (Array.isArray(data.companyLogo) && data.companyLogo[0] instanceof File) {
          data.companyLogo = await uploadFile(data.companyLogo[0], data.companyName);
        }
      }

      const formData = new FormData();
      formData.append('companyName', data.companyName);
      formData.append('companyLocation', data.companyLocation);
      formData.append('primaryIndustry', data.primaryIndustry);
      formData.append('subIndustry', data.subIndustry);
      formData.append('exactBusiness', data.exactBusiness);
      if (data.companyLogo) {
        formData.append('companyLogo', data.companyLogo);
      }

      if (company && company.id) {
        // Update flow
        const companyId = Number(company.id);
        const updated = await updateCompany(companyId, formData);
        // Update SWR cache without revalidation
        mutateCompany(updated, false);
        toast.success('Company updated successfully!');
      } else {
        // Create flow
        await createCompany(formData);
        toast.success('Company created successfully!');
        setTimeout(() => {
          window.location.href = paths.dashboard.root;
        }, 2000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An error occurred while saving the company data.');
    }
  });

  const industryOptions = getIndustries();
  const subIndustryOptions = industry ? getSubIndustries(industry) : [];
  const exactBusinessOptions = (industry && subIndustry) ? getExactBusinesses(industry, subIndustry) : [];

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3, textAlign: 'center' }}>
            <Field.UploadAvatar
              name="companyLogo"
              maxSize={3145728}
              helperText={
                <Typography variant="caption" sx={{ mt: 3, display: 'block', color: 'text.disabled' }}>
                  Allowed *.jpeg, *.jpg, *.png, *.gif<br />max size of {fData(3145728)}
                </Typography>
              }
            />

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <TextField
                label="Or enter Company Logo URL"
                value={companyLogoUrlInput}
                onChange={(e) => setCompanyLogoUrlInput(e.target.value)}
                fullWidth
                variant="outlined"
                margin="normal"
              />
              <Button
                variant="contained"
                onClick={() => {
                  setValue('companyLogo', companyLogoUrlInput);
                  setCompanyLogoUrlInput('');
                }}>
                Set Company Logo URL
              </Button>
              {typeof values.companyLogo === 'string' && values.companyLogo.startsWith('http') && (
                <Box mt={2}>
                  <img
                    src={values.companyLogo}
                    alt="Company Logo Preview"
                    style={{ maxWidth: '200px' }}
                  />
                </Box>
              )}
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box rowGap={3} columnGap={2} display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}>
              <Field.Text name="companyName" label="Company Name" />
              <Field.Text name="companyLocation" label="Company Location" />
              
              <Field.Select 
                name="primaryIndustry" 
                label="Industry" 
                variant="filled" 
                helperText="Select industry"
              >
                <MenuItem value="">None</MenuItem>
                <Divider sx={{ borderStyle: 'dashed' }} />
                {industryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select 
                name="subIndustry" 
                label="Sub Industry (Business Type)" 
                variant="filled" 
                helperText="Select sub industry"
                disabled={!industry}
              >
                <MenuItem value="">None</MenuItem>
                <Divider sx={{ borderStyle: 'dashed' }} />
                {subIndustryOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select 
                name="exactBusiness" 
                label="Exact Business" 
                variant="filled" 
                helperText="Select exact business"
                disabled={!industry || !subIndustry}
              >
                <MenuItem value="">None</MenuItem>
                <Divider sx={{ borderStyle: 'dashed' }} />
                {exactBusinessOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>

            <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {company && company.id ? 'Update Company' : 'Create Company'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
