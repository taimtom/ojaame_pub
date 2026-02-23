import { useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  Dialog,
  Divider,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { googleOAuthConfig } from 'src/utils/google-oauth-config';

import {
  sendEmail,
  uploadToDrive,
  createDriveFolder,
  useListDriveFiles,
  sendMeetingInvite,
} from 'src/actions/integration';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function GoogleIntegration({ integration, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [openDriveDialog, setOpenDriveDialog] = useState(false);
  const [openMeetingDialog, setOpenMeetingDialog] = useState(false);

  // Gmail sending state
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    body: '',
  });

  // Meeting invite state
  const [meetingData, setMeetingData] = useState({
    to: '',
    subject: '',
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    location: '',
  });

  // Drive files hook
  const {
    driveFiles,
    driveFilesLoading,
    driveFilesError,
  } = useListDriveFiles(integration?.id);

  // Google OAuth login for additional scopes (if needed)
  const googleLogin = useGoogleLogin({
    onSuccess: (response) => {
      console.log('Google OAuth Success:', response);
      toast.success('Google OAuth successful!');
    },
    onError: (error) => {
      console.error('Google OAuth Error:', error);
      toast.error('Google OAuth failed');
    },
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.file',
  });

  // Send email function
  const handleSendEmail = useCallback(async () => {
    if (!emailData.to || !emailData.subject) {
      toast.error('Please fill in recipient and subject');
      return;
    }

    setLoading(true);
    try {
      await sendEmail(
        integration.id,
        emailData.to,
        emailData.subject,
        emailData.body
      );
      toast.success('Email sent successfully!');
      setOpenEmailDialog(false);
      setEmailData({ to: '', subject: '', body: '' });
    } catch (error) {
      console.error('Email send error:', error);
      toast.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  }, [emailData, integration?.id]);

  // Send meeting invite function
  const handleSendMeetingInvite = useCallback(async () => {
    if (!meetingData.to || !meetingData.title || !meetingData.startDate) {
      toast.error('Please fill in required meeting details');
      return;
    }

    setLoading(true);
    try {
      await sendMeetingInvite(
        integration.id,
        meetingData.to,
        meetingData.subject,
        `<p>You are invited to: ${meetingData.title}</p><p>${meetingData.description}</p>`,
        meetingData.title,
        meetingData.startDate,
        meetingData.endDate,
        'your-email@example.com', // Replace with actual organizer email
        meetingData.description,
        meetingData.location
      );
      toast.success('Meeting invite sent successfully!');
      setOpenMeetingDialog(false);
      setMeetingData({
        to: '',
        subject: '',
        title: '',
        startDate: '',
        endDate: '',
        description: '',
        location: '',
      });
    } catch (error) {
      console.error('Meeting invite error:', error);
      toast.error('Failed to send meeting invite');
    } finally {
      setLoading(false);
    }
  }, [meetingData, integration?.id]);

  // Create drive folder function
  const handleCreateFolder = useCallback(async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    setLoading(true);
    try {
      await createDriveFolder(integration.id, folderName);
      toast.success('Folder created successfully!');
      onRefresh?.();
    } catch (error) {
      console.error('Create folder error:', error);
      toast.error('Failed to create folder');
    } finally {
      setLoading(false);
    }
  }, [integration?.id, onRefresh]);

  // File upload handler
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      await uploadToDrive(integration.id, formData);
      toast.success('File uploaded successfully!');
      onRefresh?.();
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setLoading(false);
    }
  }, [integration?.id, onRefresh]);

  if (!integration || integration.provider !== 'google') {
    return null;
  }

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="logos:google" width={32} height={32} />
          <Box>
            <Typography variant="h6">Google Integration</Typography>
            <Typography variant="body2" color="text.secondary">
              {integration.integration_type === 'email' ? 'Gmail' : 'Google Drive'} - {integration.name}
            </Typography>
          </Box>
        </Stack>

        {/* OAuth Configuration Status */}
        {googleOAuthConfig.isConfigured() ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>OAuth Configuration:</strong> Google OAuth is properly configured with
              Client ID ending in ...{googleOAuthConfig.getClientId().slice(-12)}.
              All Google services are ready to use.
            </Typography>
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>OAuth Configuration Missing:</strong> Google Client ID and Secret are not configured.
              Please check your environment variables or contact your administrator.
            </Typography>
          </Alert>
        )}

        <Divider />

        {integration.integration_type === 'email' && (
          <Stack spacing={2}>
            <Typography variant="subtitle1">Gmail Features</Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:email-outline" />}
                onClick={() => setOpenEmailDialog(true)}
                disabled={loading}
              >
                Send Email
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:calendar-outline" />}
                onClick={() => setOpenMeetingDialog(true)}
                disabled={loading}
              >
                Send Meeting Invite
              </Button>
            </Stack>
          </Stack>
        )}

        {integration.integration_type === 'drive' && (
          <Stack spacing={2}>
            <Typography variant="subtitle1">Google Drive Features</Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:folder-add-outline" />}
                onClick={handleCreateFolder}
                disabled={loading}
              >
                Create Folder
              </Button>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Iconify icon="eva:cloud-upload-outline" />}
                disabled={loading}
              >
                Upload File
                <input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
            </Stack>

            {/* Drive Files List */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Recent Files
              </Typography>
              {driveFilesLoading ? (
                <CircularProgress size={24} />
              ) : driveFilesError ? (
                <Typography color="error" variant="body2">
                  Error loading files
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {driveFiles.slice(0, 5).map((file) => (
                    <Stack
                      key={file.id}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
                    >
                      <Iconify icon="eva:file-outline" width={16} />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(file.modifiedTime).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  ))}
                  {driveFiles.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No files found
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
        )}

        {loading && (
          <Box display="flex" justifyContent="center">
            <CircularProgress size={24} />
          </Box>
        )}
      </Stack>

      {/* Email Dialog */}
      <Dialog
        open={openEmailDialog}
        onClose={() => setOpenEmailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Email</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <input
              type="email"
              placeholder="To: recipient@example.com"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <input
              type="text"
              placeholder="Subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <textarea
              placeholder="Email body"
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical',
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmailDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Meeting Dialog */}
      <Dialog
        open={openMeetingDialog}
        onClose={() => setOpenMeetingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Meeting Invite</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <input
              type="email"
              placeholder="To: attendee@example.com"
              value={meetingData.to}
              onChange={(e) => setMeetingData({ ...meetingData, to: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <input
              type="text"
              placeholder="Meeting Title"
              value={meetingData.title}
              onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <Stack direction="row" spacing={2}>
              <input
                type="datetime-local"
                placeholder="Start Date"
                value={meetingData.startDate}
                onChange={(e) => setMeetingData({ ...meetingData, startDate: e.target.value })}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <input
                type="datetime-local"
                placeholder="End Date"
                value={meetingData.endDate}
                onChange={(e) => setMeetingData({ ...meetingData, endDate: e.target.value })}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </Stack>
            <input
              type="text"
              placeholder="Location (optional)"
              value={meetingData.location}
              onChange={(e) => setMeetingData({ ...meetingData, location: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <textarea
              placeholder="Description (optional)"
              value={meetingData.description}
              onChange={(e) => setMeetingData({ ...meetingData, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical',
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMeetingDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendMeetingInvite}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

