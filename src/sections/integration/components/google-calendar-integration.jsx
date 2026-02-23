import { useState, useCallback } from 'react';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  Box,
  Card,
  Chip,
  Alert,
  Stack,
  Button,
  Dialog,
  Switch,
  // Divider,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const QUICK_EVENT_TEMPLATES = [
  {
    id: 'team-meeting',
    title: 'Team Meeting',
    duration: 60, // minutes
    description: 'Weekly team sync meeting',
  },
  {
    id: 'client-call',
    title: 'Client Call',
    duration: 30,
    description: 'Client consultation call',
  },
  {
    id: 'inventory-review',
    title: 'Inventory Review',
    duration: 45,
    description: 'Monthly inventory review meeting',
  },
  {
    id: 'sales-presentation',
    title: 'Sales Presentation',
    duration: 90,
    description: 'Product demonstration for potential client',
  },
];

// ----------------------------------------------------------------------

export function GoogleCalendarIntegration({ integration, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const openEventDialog = useBoolean();

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    allDay: false,
    attendees: '',
    location: '',
    reminder: true,
  });

  const handleFormChange = useCallback((field) => (event) => {
    setEventForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  }, []);

  const handleDateChange = useCallback((field) => (date) => {
    setEventForm(prev => ({
      ...prev,
      [field]: date
    }));
  }, []);

  const handleSwitchChange = useCallback((field) => (event) => {
    setEventForm(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  }, []);

  const handleQuickEvent = useCallback((template) => {
    const now = new Date();
    const endDate = new Date(now.getTime() + template.duration * 60 * 1000);

    setEventForm({
      title: template.title,
      description: template.description,
      startDate: now,
      endDate,
      allDay: false,
      attendees: '',
      location: '',
      reminder: true,
    });

    openEventDialog.onTrue();
  }, [openEventDialog]);

  const handleCreateEvent = useCallback(async () => {
    if (!eventForm.title.trim()) {
      toast.error('Please enter event title');
      return;
    }

    try {
      setLoading(true);

      // Prepare event data for Google Calendar API
      const eventData = {
        summary: eventForm.title,
        description: eventForm.description,
        start: {
          dateTime: eventForm.startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: eventForm.endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: eventForm.location,
        attendees: eventForm.attendees
          .split(',')
          .map(email => ({ email: email.trim() }))
          .filter(attendee => attendee.email),
        reminders: eventForm.reminder
          ? {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 30 },
                { method: 'popup', minutes: 10 },
              ],
            }
          : undefined,
        integration_id: integration?.id,
      };

      // TODO: Replace with actual Google Calendar API call
      console.log('Creating Google Calendar event:', eventData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Event created successfully in Google Calendar!');
      openEventDialog.onFalse();

      // Reset form
      setEventForm({
        title: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 60 * 1000),
        allDay: false,
        attendees: '',
        location: '',
        reminder: true,
      });

      if (onRefresh) {
        onRefresh();
      }

    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast.error('Failed to create calendar event. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [eventForm, integration, openEventDialog, onRefresh]);

  const handleSyncCalendar = useCallback(async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual calendar sync API call
      console.log('Syncing Google Calendar...');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Calendar synced successfully!');

      if (onRefresh) {
        onRefresh();
      }

    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  const isConnected = integration?.is_active || false;

  return (
    <>
      <Stack spacing={3}>
        {/* Integration Status */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" gutterBottom>
                Google Calendar Integration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create and sync calendar events with Google Calendar
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={<Iconify icon={isConnected ? 'eva:checkmark-circle-2-fill' : 'eva:close-circle-fill'} />}
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
                variant="filled"
              />
              {isConnected && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="eva:refresh-fill" />}
                  onClick={handleSyncCalendar}
                  disabled={loading}
                >
                  Sync
                </Button>
              )}
            </Stack>
          </Stack>
        </Card>

        {!isConnected && (
          <Alert severity="warning">
            Google Calendar integration is not connected. Please set up the integration to create and sync calendar events.
          </Alert>
        )}

        {/* Quick Actions */}
        {isConnected && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={openEventDialog.onTrue}
                disabled={loading}
              >
                Create Event
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:refresh-fill" />}
                onClick={handleSyncCalendar}
                disabled={loading}
              >
                Sync Calendar
              </Button>
            </Stack>
          </Card>
        )}

        {/* Quick Event Templates */}
        {isConnected && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Event Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create common business events with pre-filled templates
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {QUICK_EVENT_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickEvent(template)}
                  disabled={loading}
                  sx={{ mb: 1 }}
                >
                  {template.title} ({template.duration}min)
                </Button>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>

      {/* Create Event Dialog */}
      <Dialog
        open={openEventDialog.value}
        onClose={openEventDialog.onFalse}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Iconify icon="logos:google-calendar" width={24} />
            <Typography variant="h6">Create Google Calendar Event</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Event Title"
              value={eventForm.title}
              onChange={handleFormChange('title')}
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={eventForm.description}
              onChange={handleFormChange('description')}
              multiline
              rows={3}
            />

            <Stack direction="row" spacing={2}>
              <DateTimePicker
                label="Start Date"
                value={eventForm.startDate}
                onChange={handleDateChange('startDate')}
                slotProps={{ textField: { fullWidth: true } }}
              />

              <DateTimePicker
                label="End Date"
                value={eventForm.endDate}
                onChange={handleDateChange('endDate')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>

            <TextField
              fullWidth
              label="Location"
              value={eventForm.location}
              onChange={handleFormChange('location')}
            />

            <TextField
              fullWidth
              label="Attendees (comma-separated emails)"
              value={eventForm.attendees}
              onChange={handleFormChange('attendees')}
              placeholder="john@example.com, jane@example.com"
            />

            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={eventForm.allDay}
                    onChange={handleSwitchChange('allDay')}
                  />
                }
                label="All Day Event"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={eventForm.reminder}
                    onChange={handleSwitchChange('reminder')}
                  />
                }
                label="Set Reminders"
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={openEventDialog.onFalse}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateEvent}
            disabled={loading || !eventForm.title.trim()}
            loading={loading}
          >
            Create Event
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

