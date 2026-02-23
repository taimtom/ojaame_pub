import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Switch,
  Divider,
  useTheme,
  TextField,
  Typography,
  useMediaQuery,
  FormControlLabel,
} from '@mui/material';

import { sendEmail, sendMeetingInvite } from 'src/actions/integration';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const EMAIL_TEMPLATES = [
  {
    id: 'invoice',
    name: 'Invoice Email',
    subject: 'Invoice #{invoice_number} - {company_name}',
    body: `Dear {customer_name},

Thank you for your business! Please find your invoice attached.

Invoice Details:
- Invoice Number: {invoice_number}
- Amount: {total_amount}
- Due Date: {due_date}

If you have any questions, please don't hesitate to contact us.

Best regards,
{company_name}`,
  },
  {
    id: 'receipt',
    name: 'Receipt Email',
    subject: 'Receipt for your purchase - {company_name}',
    body: `Dear {customer_name},

Thank you for your purchase! Here's your receipt.

Purchase Details:
- Transaction ID: {transaction_id}
- Amount Paid: {amount_paid}
- Date: {purchase_date}

We appreciate your business!

Best regards,
{company_name}`,
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {company_name}!',
    body: `Dear {customer_name},

Welcome to {company_name}! We're excited to have you as our customer.

Your account has been set up successfully. You can now enjoy:
- Exclusive offers and discounts
- Priority customer support
- Easy online ordering

Thank you for choosing us!

Best regards,
{company_name} Team`,
  },
];

// ----------------------------------------------------------------------

export function EmailComposer({ integration, onRefresh, standalone = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isLoading, setIsLoading] = useState(false);
  const [isMeetingInvite, setIsMeetingInvite] = useState(false);

  const { control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      to: '',
      subject: '',
      body: '',
      // Meeting invite fields
      meetingTitle: '',
      startDateTime: '',
      endDateTime: '',
      location: '',
      description: '',
    },
  });

  const handleTemplateSelect = useCallback((template) => {
    setValue('subject', template.subject);
    setValue('body', template.body);
    toast.success(`Template "${template.name}" applied!`);
  }, [setValue]);

  const handleSendEmail = useCallback(async (data) => {
    setIsLoading(true);
    try {
      let result;

      if (isMeetingInvite) {
        // Send meeting invite
        result = await sendMeetingInvite(
          integration.id,
          data.to,
          data.subject,
          data.body,
          data.meetingTitle,
          new Date(data.startDateTime),
          new Date(data.endDateTime),
          'admin@company.com', // This should come from user context
          data.description,
          data.location
        );
      } else {
        // Send regular email
        result = await sendEmail(
          integration.id,
          data.to,
          data.subject,
          data.body
        );
      }

      if (result.status === 'success') {
        toast.success(isMeetingInvite ? 'Meeting invite sent successfully!' : 'Email sent successfully!');
        reset();
        onRefresh?.();
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  }, [integration?.id, isMeetingInvite, reset, onRefresh]);

  const renderTemplates = (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Email Templates
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        flexWrap="wrap"
        useFlexGap
      >
        {EMAIL_TEMPLATES.map((template) => (
          <Chip
            key={template.id}
            label={template.name}
            variant="outlined"
            clickable
            onClick={() => handleTemplateSelect(template)}
            sx={{ mb: { xs: 1, sm: 0 } }}
          />
        ))}
      </Stack>
    </Card>
  );

  const renderEmailForm = (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {isMeetingInvite ? 'Send Meeting Invite' : 'Compose Email'}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={isMeetingInvite}
                onChange={(e) => setIsMeetingInvite(e.target.checked)}
              />
            }
            label="Meeting Invite"
          />
        </Stack>

        <Controller
          name="to"
          control={control}
          rules={{
            required: 'Email address is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="To"
              placeholder="customer@example.com"
              error={!!error}
              helperText={error?.message}
              fullWidth
              InputProps={{
                startAdornment: <Iconify icon="eva:email-fill" sx={{ mr: 1 }} />,
              }}
            />
          )}
        />

        <Controller
          name="subject"
          control={control}
          rules={{ required: 'Subject is required' }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Subject"
              placeholder="Enter email subject"
              error={!!error}
              helperText={error?.message}
              fullWidth
            />
          )}
        />

        {isMeetingInvite && (
          <>
            <Divider />

            <Typography variant="subtitle2" color="primary">
              Meeting Details
            </Typography>

            <Controller
              name="meetingTitle"
              control={control}
              rules={{ required: 'Meeting title is required' }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Meeting Title"
                  placeholder="Enter meeting title"
                  error={!!error}
                  helperText={error?.message}
                  fullWidth
                />
              )}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="startDateTime"
                control={control}
                rules={{ required: 'Start date/time is required' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="Start Date & Time"
                    type="datetime-local"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />

              <Controller
                name="endDateTime"
                control={control}
                rules={{ required: 'End date/time is required' }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    label="End Date & Time"
                    type="datetime-local"
                    error={!!error}
                    helperText={error?.message}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Stack>

            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Location (Optional)"
                  placeholder="Conference room, Zoom link, etc."
                  fullWidth
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Meeting Description (Optional)"
                  placeholder="Meeting agenda and details"
                  multiline
                  rows={3}
                  fullWidth
                />
              )}
            />

            <Divider />
          </>
        )}

        <Controller
          name="body"
          control={control}
          rules={{ required: 'Email body is required' }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label={isMeetingInvite ? "Email Body" : "Message"}
              placeholder={isMeetingInvite ? "Additional message for the invite" : "Enter your message"}
              multiline
              rows={isMobile ? 6 : 8}
              error={!!error}
              helperText={error?.message}
              fullWidth
            />
          )}
        />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="flex-end"
        >
          <Button
            variant="outlined"
            onClick={() => reset()}
            disabled={isLoading}
            sx={{ minWidth: { xs: '100%', sm: 120 } }}
          >
            Clear
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit(handleSendEmail)}
            loading={isLoading}
            startIcon={<Iconify icon={isMeetingInvite ? "eva:calendar-fill" : "eva:email-fill"} />}
            sx={{ minWidth: { xs: '100%', sm: 150 } }}
          >
            {isLoading ? 'Sending...' : (isMeetingInvite ? 'Send Invite' : 'Send Email')}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );

  if (standalone) {
    return (
      <Stack spacing={3}>
        {renderTemplates}
        {renderEmailForm}
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Email Composer
      </Typography>

      {renderTemplates}
      {renderEmailForm}
    </Box>
  );
}

