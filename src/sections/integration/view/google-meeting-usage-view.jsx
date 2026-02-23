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

export function GoogleMeetingUsageView({ integration }) {
  const [loading, setLoading] = useState(false);
  const [meetings] = useState([]);

  const handleCreateMeeting = async () => {
    try {
      setLoading(true);
      // Add meeting creation logic here
      toast.success('Meeting created successfully!');
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMeetings = async () => {
    try {
      setLoading(true);
      // Add meeting sync logic here
      toast.success('Meetings synced successfully!');
    } catch (error) {
      console.error('Error syncing meetings:', error);
      toast.error('Failed to sync meetings');
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
              Google Meet Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and manage Google Meet meetings
            </Typography>
          </Box>
          <Chip
            icon={<Iconify icon="logos:google-meet" />}
            label="Active"
            color="success"
            variant="soft"
          />
        </Stack>
      </Card>

      {/* Actions */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Meeting Management
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleCreateMeeting}
            disabled={loading}
          >
            Create Meeting
          </Button>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:refresh-fill" />}
            onClick={handleSyncMeetings}
            disabled={loading}
          >
            Sync Meetings
          </Button>
        </Stack>
      </Card>

      {/* Meetings List */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Meetings
        </Typography>
        {meetings.length > 0 ? (
          <Stack spacing={2}>
            {meetings.map((meeting, index) => (
              <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2">{meeting.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {meeting.startTime} • {meeting.participants} participants
                </Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            No meetings found. Create your first meeting to get started.
          </Typography>
        )}
      </Card>
    </Stack>
  );
}

