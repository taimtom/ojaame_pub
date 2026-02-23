import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Table,
  Stack,
  Alert,
  Button,
  Divider,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  TextField,
  Typography,
  CardHeader,
  IconButton,
  InputAdornment,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { fDateTime } from 'src/utils/format-time';

import { useGetEmailLogs } from 'src/actions/integration';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function EmailLogs({ storeId, integration }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthContext();

  // Use store ID from props or user's current store
  const currentStoreId = storeId || integration?.store_id || user?.stores?.[0]?.id;

  // Fetch real email logs from backend
  const {
    emailLogs,
    emailLogsTotal,
    emailLogsLoading,
    emailLogsError,
  } = useGetEmailLogs(currentStoreId, { limit: 100 });

  const handleSearch = useCallback((event) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleRefresh = useCallback(() => {
    // Force refresh by reloading the page or triggering SWR revalidation
    window.location.reload();
  }, []);

  // Filter logs based on search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return emailLogs;

    return emailLogs.filter((log) =>
      log.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.to_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [emailLogs, searchQuery]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'success.main';
      case 'failed':
        return 'error.main';
      case 'pending':
        return 'warning.main';
      case 'read':
        return 'info.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <Card>
      <CardHeader
        title="Email Activity Logs"
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:refresh-fill" />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        }
      />

      <Divider />

      <Stack spacing={2} sx={{ p: 3 }}>
        <TextField
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search logs by subject, recipient, or status..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {emailLogsError && (
        <Alert severity="error" sx={{ m: 3 }}>
          Failed to load email logs: {emailLogsError.message}
        </Alert>
      )}

      {emailLogsLoading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading email logs...
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Scrollbar>
              <Table sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell width={40} />
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {log.created_at ? fDateTime(log.created_at) : 'N/A'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                          {log.subject || 'No Subject'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {log.to_email || 'N/A'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {log.from_email || 'N/A'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Label
                          variant="soft"
                          color={
                            (log.status === 'sent' && 'success') ||
                            (log.status === 'failed' && 'error') ||
                            (log.status === 'pending' && 'warning') ||
                            'default'
                          }
                        >
                          {log.status || 'Unknown'}
                        </Label>
                      </TableCell>

                      <TableCell align="right">
                        <IconButton size="small">
                          <Iconify icon="eva:more-vertical-fill" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          {!emailLogsLoading && filteredLogs.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Iconify icon="eva:email-outline" sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                No email logs found
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Email activity will appear here once emails are sent or received'
                }
              </Typography>
            </Box>
          )}
        </>
      )}
    </Card>
  );
}

