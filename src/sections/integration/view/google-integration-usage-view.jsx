/**
 * Google Integration Usage View
 *
 * Comprehensive dashboard for viewing Google integration usage data
 * including email logs, drive files, and usage statistics
 */

import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import {
  Tab,
  Box,
  Tabs,
  Card,
  Grid,
  Chip,
  Stack,
  // Paper,
  Alert,
  Table,
  Button,
  Avatar,
  Tooltip,
  Divider,
  TableRow,
  TableBody,
  TableHead,
  TableCell,
  Typography,
  TableContainer,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

import { fDateTime } from 'src/utils/format-time';
import { fData, fShortenNumber } from 'src/utils/format-number';

import {
  useGetEmailLogs,
  useGetDriveFiles,
  getIntegrationDetails,
  getIntegrationUsageStats,

} from 'src/actions/integration';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';


// ----------------------------------------------------------------------

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`usage-tabpanel-${index}`}
      aria-labelledby={`usage-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// ----------------------------------------------------------------------

export function GoogleIntegrationUsageView() {
  const { integrationId } = useParams();

  const [tabValue, setTabValue] = useState(0);
  const [integration, setIntegration] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Get store ID from integration details
  const storeId = integration?.store_id;

  // Fetch email logs and drive files
  const {
    emailLogs,
    emailLogsTotal,
    emailLogsLoading,
    emailLogsError,
  } = useGetEmailLogs(storeId, { limit: 100 });

  const {
    driveFiles,
    driveFilesTotal,
    driveFilesLoading,
    driveFilesError,
  } = useGetDriveFiles(storeId, { limit: 100 });

  // Load integration details and usage stats
  // useEffect(() => {
  //   if (integrationId) {
  //     loadIntegrationData();
  //   }
  // }, [integrationId]);

  // const loadIntegrationData = async () => {
  //   try {
  //     setStatsLoading(true);

  //     // Get integration details
  //     const integrationDetails = await getIntegrationDetails(integrationId);
  //     setIntegration(integrationDetails);

  //     // Get usage statistics
  //     if (integrationDetails.store_id) {
  //       const stats = await getIntegrationUsageStats(integrationId, integrationDetails.store_id);
  //       setUsageStats(stats);
  //     }
  //   } catch (error) {
  //     console.error('Error loading integration data:', error);
  //     toast.error('Failed to load integration usage data');
  //   } finally {
  //     setStatsLoading(false);
  //   }
  // };

  const loadIntegrationData = useCallback(async () => {
    try {
      setStatsLoading(true);
      const integrationDetails = await getIntegrationDetails(integrationId);
      setIntegration(integrationDetails);

      if (integrationDetails.store_id) {
        const stats = await getIntegrationUsageStats(
          integrationId,
          integrationDetails.store_id
        );
        setUsageStats(stats);
      }
    } catch (error) {
      console.error('Error loading integration data:', error);
      toast.error('Failed to load integration usage data');
    } finally {
      setStatsLoading(false);
    }
  }, [integrationId]);

  // call it once when integrationId changes
  useEffect(() => {
    if (integrationId) {
      loadIntegrationData();
    }
  }, [integrationId, loadIntegrationData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderEmailStatusChip = (status) => {
    const colorMap = {
      sent: 'success',
      pending: 'warning',
      failed: 'error',
    };
    return <Label color={colorMap[status] || 'default'}>{status}</Label>;
  };

  const renderFileIcon = (mimeType) => {
    if (mimeType?.includes('image')) return 'eva:image-outline';
    if (mimeType?.includes('pdf')) return 'eva:file-text-outline';
    if (mimeType?.includes('video')) return 'eva:video-outline';
    if (mimeType?.includes('audio')) return 'eva:music-outline';
    if (mimeType?.includes('zip') || mimeType?.includes('archive')) return 'eva:archive-outline';
    return 'eva:file-outline';
  };

  const renderUsageOverview = () => (
    <Grid container spacing={3}>
      {/* Email Usage Stats */}
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Iconify icon="logos:gmail" width={24} />
            </Avatar>
            <Box>
              <Typography variant="h6">Email Usage</Typography>
              <Typography variant="body2" color="text.secondary">
                Gmail integration statistics
              </Typography>
            </Box>
          </Stack>

          {statsLoading ? (
            <CircularProgress size={24} />
          ) : usageStats?.email ? (
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Emails</Typography>
                  <Typography variant="h6">{fShortenNumber(usageStats.email.totalEmails)}</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((usageStats.email.totalEmails / 1000) * 100, 100)}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Sent Successfully</Typography>
                  <Typography variant="h6" color="success.main">
                    {fShortenNumber(usageStats.email.sentEmails)}
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Failed</Typography>
                  <Typography variant="h6" color="error.main">
                    {fShortenNumber(usageStats.email.failedEmails)}
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Meeting Invites</Typography>
                  <Typography variant="h6" color="info.main">
                    {fShortenNumber(usageStats.email.meetingInvites)}
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">Last 7 days: {usageStats.email.emailsLast7Days}</Typography>
                <Typography variant="caption">Last 30 days: {usageStats.email.emailsLast30Days}</Typography>
              </Stack>
            </Stack>
          ) : (
            <Typography color="text.secondary">No email data available</Typography>
          )}
        </Card>
      </Grid>

      {/* Drive Usage Stats */}
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar sx={{ bgcolor: 'warning.main' }}>
              <Iconify icon="logos:google-drive" width={24} />
            </Avatar>
            <Box>
              <Typography variant="h6">Drive Usage</Typography>
              <Typography variant="body2" color="text.secondary">
                Google Drive integration statistics
              </Typography>
            </Box>
          </Stack>

          {statsLoading ? (
            <CircularProgress size={24} />
          ) : usageStats?.drive ? (
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Files</Typography>
                  <Typography variant="h6">{fShortenNumber(usageStats.drive.totalFiles)}</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((usageStats.drive.totalFiles / 500) * 100, 100)}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Active Files</Typography>
                  <Typography variant="h6" color="success.main">
                    {fShortenNumber(usageStats.drive.activeFiles)}
                  </Typography>
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Total Size</Typography>
                  <Typography variant="h6" color="info.main">
                    {fData(usageStats.drive.totalSize)}
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">Last 7 days: {usageStats.drive.filesLast7Days}</Typography>
                <Typography variant="caption">Last 30 days: {usageStats.drive.filesLast30Days}</Typography>
              </Stack>

              {/* File Types */}
              {Object.keys(usageStats.drive.fileTypes).length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    File Types:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.entries(usageStats.drive.fileTypes).map(([type, count]) => (
                      <Chip key={type} label={`${type}: ${count}`} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : (
            <Typography color="text.secondary">No drive data available</Typography>
          )}
        </Card>
      </Grid>
    </Grid>
  );

  const renderEmailLogs = () => (
    <Card>
      <Box sx={{ p: 3, pb: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Email Logs</Typography>
          <Chip label={`${emailLogsTotal} total`} size="small" />
        </Stack>
      </Box>

      {emailLogsLoading ? (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : emailLogsError ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Failed to load email logs: {emailLogsError.message}
          </Alert>
        </Box>
      ) : emailLogs.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            No email logs found. Start sending emails to see them here.
          </Alert>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>To</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Sent At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {emailLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {log.to_email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Tooltip title={log.subject}>
                      <Typography variant="body2" noWrap>
                        {log.subject}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {renderEmailStatusChip(log.status)}
                  </TableCell>
                  <TableCell>
                    {log.has_ics_attachment ? (
                      <Chip
                        label="Meeting Invite"
                        size="small"
                        color="info"
                        icon={<Iconify icon="eva:calendar-outline" width={16} />}
                      />
                    ) : (
                      <Chip label="Email" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {fDateTime(log.sent_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View details">
                      <Button size="small" color="inherit">
                        <Iconify icon="eva:eye-outline" width={16} />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );

  const renderDriveFiles = () => (
    <Card>
      <Box sx={{ p: 3, pb: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Drive Files</Typography>
          <Chip label={`${driveFilesTotal} total`} size="small" />
        </Stack>
      </Box>

      {driveFilesLoading ? (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : driveFilesError ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            Failed to load drive files: {driveFilesError.message}
          </Alert>
        </Box>
      ) : driveFiles.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            No drive files found. Start uploading files to see them here.
          </Alert>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {driveFiles.map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Iconify icon={renderFileIcon(file.mime_type)} width={24} />
                      <Box>
                        <Typography variant="body2" noWrap>
                          {file.original_filename}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {file.google_file_name}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={file.file_type || 'Unknown'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {file.file_size ? fData(file.file_size) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {fDateTime(file.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Label color={file.is_active ? 'success' : 'default'}>
                      {file.is_active ? 'Active' : 'Inactive'}
                    </Label>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {file.web_view_link && (
                        <Tooltip title="View in Google Drive">
                          <Button
                            size="small"
                            color="inherit"
                            onClick={() => window.open(file.web_view_link, '_blank')}
                          >
                            <Iconify icon="eva:external-link-outline" width={16} />
                          </Button>
                        </Tooltip>
                      )}
                      <Tooltip title="File details">
                        <Button size="small" color="inherit">
                          <Iconify icon="eva:info-outline" width={16} />
                        </Button>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );

  if (!integration && !statsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Integration not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <CustomBreadcrumbs
        heading="Google Integration Usage"
        links={[
          { name: 'Dashboard', href: '/' },
          { name: 'Integrations', href: '/dashboard/integration/list' },
          { name: integration?.name || 'Google Integration' },
        ]}
        sx={{ mb: 3 }}
      />

      {/* Integration Info */}
      {integration && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Iconify icon="logos:google" width={24} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">{integration.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {integration.integration_type} • {integration.provider} •
                {integration.is_active ? ' Active' : ' Inactive'}
              </Typography>
            </Box>
            <Label color={integration.is_active ? 'success' : 'default'}>
              {integration.is_active ? 'Active' : 'Inactive'}
            </Label>
          </Stack>
        </Card>
      )}

      {/* Usage Overview */}
      {renderUsageOverview()}

      {/* Detailed Usage Tabs */}
      <Card sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Email Logs" icon={<Iconify icon="eva:email-outline" />} />
          <Tab label="Drive Files" icon={<Iconify icon="eva:folder-outline" />} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderEmailLogs()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderDriveFiles()}
        </TabPanel>
      </Card>
    </Box>
  );
}

export default GoogleIntegrationUsageView;

