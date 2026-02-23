import { useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Typography,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function GoogleDriveUsageView({ integration }) {
  const [loading, setLoading] = useState(false);
  const [files] = useState([]);

  const handleUploadFile = async () => {
    try {
      setLoading(true);
      // Add file upload logic here
      toast.success('File uploaded to Google Drive successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFiles = async () => {
    try {
      setLoading(true);
      // Add file sync logic here
      toast.success('Files synced successfully!');
    } catch (error) {
      console.error('Error syncing files:', error);
      toast.error('Failed to sync files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" gutterBottom>
              Google Drive Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Store and manage files in Google Drive
            </Typography>
          </Box>
          <Chip
            icon={<Iconify icon="logos:google-drive" />}
            label="Active"
            color="success"
            variant="soft"
          />
        </Stack>
      </Card>

      {/* Actions */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          File Management
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            onClick={handleUploadFile}
            disabled={loading}
          >
            Upload File
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:refresh-fill" />}
            onClick={handleSyncFiles}
            disabled={loading}
          >
            Sync Files
          </Button>
        </Stack>
      </Card>

      {/* Files List */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Files
        </Typography>
        {files.length > 0 ? (
          <Stack spacing={2}>
            {files.map((file, index) => (
              <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2">{file.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {file.type} • {file.size}
                </Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            No files found. Upload your first file to get started.
          </Typography>
        )}
      </Card>
    </Stack>
  );
}

