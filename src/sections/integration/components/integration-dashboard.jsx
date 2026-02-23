import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
  Box,
  Tab,
  Chip,
  Card,
  Grid,
  Tabs,
  Stack,
  Alert,
  Button,
  // Dialog,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  // IconButton,
  FormControl,
  // DialogTitle,
  // DialogContent,
  // DialogActions,
  LinearProgress,
} from '@mui/material';

import { useGetStores } from 'src/actions/store';
import {
  sendEmail,
  getJumiaData,
  uploadToDrive,
  // updateJumiaData,
  createDriveFolder,
  useListIntegrations,
} from 'src/actions/integration';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function IntegrationDashboard() {
  const { user } = useAuthContext();
  const { stores } = useGetStores();

  const [selectedStore, setSelectedStore] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Get integrations for selected store
  const { integrations } = useListIntegrations({
    storeId: selectedStore,
    companyId: user?.company_id,
  });

  const googleIntegrations = integrations.filter(
    (int) => int.provider === 'google' && int.is_active
  );
  const jumiaIntegrations = integrations.filter(
    (int) => int.provider === 'jumia' && int.is_active
  );

  // Email form
  const emailForm = useForm({
    defaultValues: {
      integrationId: '',
      toEmail: '',
      subject: '',
      bodyHtml: '',
    },
  });

  // Drive form
  const driveForm = useForm({
    defaultValues: {
      integrationId: '',
      folderName: '',
      file: null,
    },
  });

  // Jumia form
  const jumiaForm = useForm({
    defaultValues: {
      integrationId: '',
      action: 'shops',
      shopId: '',
    },
  });

  // Handle email sending
  const handleSendEmail = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await sendEmail(
        data.integrationId,
        data.toEmail,
        data.subject,
        data.bodyHtml
      );
      setResult({ type: 'success', message: 'Email sent successfully', data: response });
      emailForm.reset();
    } catch (error) {
      setResult({ type: 'error', message: 'Failed to send email', error });
    } finally {
      setLoading(false);
    }
  }, [emailForm]);

  // Handle file upload
  const handleFileUpload = useCallback(async (data) => {
    if (!data.file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', data.file);

      const response = await uploadToDrive(data.integrationId, formData);
      setResult({ type: 'success', message: 'File uploaded successfully', data: response });
      driveForm.reset();
    } catch (error) {
      setResult({ type: 'error', message: 'Failed to upload file', error });
    } finally {
      setLoading(false);
    }
  }, [driveForm]);

  // Handle folder creation
  const handleCreateFolder = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await createDriveFolder(data.integrationId, data.folderName);
      setResult({ type: 'success', message: 'Folder created successfully', data: response });
      driveForm.reset();
    } catch (error) {
      setResult({ type: 'error', message: 'Failed to create folder', error });
    } finally {
      setLoading(false);
    }
  }, [driveForm]);

  // Handle Jumia actions
  const handleJumiaAction = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await getJumiaData(data.integrationId, data.action, {
        shopId: data.shopId || null,
      });
      setResult({ type: 'success', message: 'Data retrieved successfully', data: response });
    } catch (error) {
      setResult({ type: 'error', message: 'Failed to retrieve data', error });
    } finally {
      setLoading(false);
    }
  }, []);

  const renderEmailTab = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Send Email via Gmail
      </Typography>

      {googleIntegrations.length === 0 ? (
        <Alert severity="warning">
          No active Google integrations found. Please set up a Google integration first.
        </Alert>
      ) : (
        <Box component="form" onSubmit={emailForm.handleSubmit(handleSendEmail)}>
          <Stack spacing={3}>
            <Controller
              name="integrationId"
              control={emailForm.control}
              rules={{ required: 'Please select an integration' }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel>Google Integration</InputLabel>
                  <Select {...field} label="Google Integration">
                    {googleIntegrations.map((integration) => (
                      <MenuItem key={integration.id} value={integration.id}>
                        {integration.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="toEmail"
              control={emailForm.control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email format'
                }
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="To Email"
                  placeholder="customer@example.com"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="subject"
              control={emailForm.control}
              rules={{ required: 'Subject is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Subject"
                  placeholder="Invoice #12345"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="bodyHtml"
              control={emailForm.control}
              rules={{ required: 'Message body is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Message Body (HTML)"
                  placeholder="<p>Hello, please find your invoice attached.</p>"
                  multiline
                  rows={6}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<Iconify icon="eva:email-outline" />}
            >
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </Stack>
        </Box>
      )}
    </Card>
  );

  const renderDriveTab = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Google Drive Operations
      </Typography>

      {googleIntegrations.length === 0 ? (
        <Alert severity="warning">
          No active Google integrations found. Please set up a Google integration first.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box component="form" onSubmit={driveForm.handleSubmit(handleFileUpload)}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Upload File
              </Typography>
              <Stack spacing={2}>
                <Controller
                  name="integrationId"
                  control={driveForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Google Integration</InputLabel>
                      <Select {...field} label="Google Integration">
                        {googleIntegrations.map((integration) => (
                          <MenuItem key={integration.id} value={integration.id}>
                            {integration.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Button variant="outlined" component="label">
                  Choose File
                  <input
                    type="file"
                    hidden
                    onChange={(e) => driveForm.setValue('file', e.target.files[0])}
                  />
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !driveForm.watch('file')}
                  startIcon={<Iconify icon="eva:cloud-upload-outline" />}
                >
                  Upload File
                </Button>
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box component="form" onSubmit={driveForm.handleSubmit(handleCreateFolder)}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Create Folder
              </Typography>
              <Stack spacing={2}>
                <Controller
                  name="integrationId"
                  control={driveForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Google Integration</InputLabel>
                      <Select {...field} label="Google Integration">
                        {googleIntegrations.map((integration) => (
                          <MenuItem key={integration.id} value={integration.id}>
                            {integration.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="folderName"
                  control={driveForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Folder Name"
                      placeholder="Invoices 2024"
                      fullWidth
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !driveForm.watch('folderName')}
                  startIcon={<Iconify icon="eva:folder-add-outline" />}
                >
                  Create Folder
                </Button>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      )}
    </Card>
  );

  const renderJumiaTab = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Jumia E-commerce Operations
      </Typography>

      {jumiaIntegrations.length === 0 ? (
        <Alert severity="warning">
          No active Jumia integrations found. Please set up a Jumia integration first.
        </Alert>
      ) : (
        <Box component="form" onSubmit={jumiaForm.handleSubmit(handleJumiaAction)}>
          <Stack spacing={3}>
            <Controller
              name="integrationId"
              control={jumiaForm.control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Jumia Integration</InputLabel>
                  <Select {...field} label="Jumia Integration">
                    {jumiaIntegrations.map((integration) => (
                      <MenuItem key={integration.id} value={integration.id}>
                        {integration.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="action"
              control={jumiaForm.control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select {...field} label="Action">
                    <MenuItem value="shops">Get Shops</MenuItem>
                    <MenuItem value="products">Get Products</MenuItem>
                    <MenuItem value="categories">Get Categories</MenuItem>
                    <MenuItem value="brands">Get Brands</MenuItem>
                    <MenuItem value="stock">Get Stock Levels</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="shopId"
              control={jumiaForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Shop ID (Optional)"
                  placeholder="12345"
                  fullWidth
                  helperText="Leave empty to get all shops"
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<Iconify icon="eva:shopping-cart-outline" />}
            >
              {loading ? 'Processing...' : 'Execute Action'}
            </Button>
          </Stack>
        </Box>
      )}
    </Card>
  );

  return (
    <Box>
      {/* Store Selection */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6">Integration Dashboard</Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Store</InputLabel>
            <Select
              value={selectedStore}
              label="Select Store"
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              {stores.map((store) => (
                <MenuItem key={store.id} value={store.id}>
                  {store.storeName || store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {selectedStore && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Active Integrations:{' '}
              <Chip
                label={`Google: ${googleIntegrations.length}`}
                size="small"
                color="primary"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`Jumia: ${jumiaIntegrations.length}`}
                size="small"
                color="secondary"
              />
            </Typography>
          </Box>
        )}
      </Card>

      {/* Loading indicator */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Result display */}
      {result && (
        <Alert
          severity={result.type}
          onClose={() => setResult(null)}
          sx={{ mb: 3 }}
        >
          {result.message}
          {result.data && (
            <Box component="pre" sx={{ mt: 1, fontSize: '0.75rem', overflow: 'auto' }}>
              {JSON.stringify(result.data, null, 2)}
            </Box>
          )}
        </Alert>
      )}

      {/* Tabs */}
      {selectedStore && (
        <Box>
          <Tabs value={tabValue} onChange={(e, value) => setTabValue(value)}>
            <Tab label="Gmail" icon={<Iconify icon="logos:gmail" />} />
            <Tab label="Google Drive" icon={<Iconify icon="logos:google-drive" />} />
            <Tab label="Jumia" icon={<Iconify icon="simple-icons:jumia" />} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {renderEmailTab()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderDriveTab()}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {renderJumiaTab()}
          </TabPanel>
        </Box>
      )}
    </Box>
  );
}

