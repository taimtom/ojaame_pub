import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Portal from '@mui/material/Portal';
import Backdrop from '@mui/material/Backdrop';
import TextField from '@mui/material/TextField';
// import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
// import Autocomplete from '@mui/material/Autocomplete';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

// import { varAlpha } from 'src/theme/styles';

import { Editor } from 'src/components/editor';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const POSITION = 20;

const EMAIL_TEMPLATES = [
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    subject: 'Order Confirmation - #{order_number}',
    template: `
Dear {customer_name},

Thank you for your order! We're pleased to confirm that your order #{order_number} has been successfully placed.

Order Details:
- Order Date: {order_date}
- Total Amount: {total_amount}
- Payment Method: {payment_method}

Your order will be processed and shipped within 1-2 business days.

Best regards,
{store_name}
    `.trim(),
  },
  {
    id: 'receipt',
    name: 'Receipt',
    subject: 'Receipt for your purchase - #{transaction_id}',
    template: `
Dear {customer_name},

Thank you for your purchase! Please find your receipt below.

Transaction Details:
- Transaction ID: {transaction_id}
- Date: {transaction_date}
- Amount: {total_amount}
- Items: {items_list}

For any questions about your purchase, please contact us.

Best regards,
{store_name}
    `.trim(),
  },
];

// ----------------------------------------------------------------------

export function GmailCompose({ onCloseCompose, integration, prefilledData = {} }) {
  const smUp = useResponsive('up', 'sm');

  const fullScreen = useBoolean();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    to: prefilledData.to || '',
    cc: prefilledData.cc || '',
    bcc: prefilledData.bcc || '',
    subject: prefilledData.subject || '',
    message: prefilledData.message || '',
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleFormChange = useCallback((field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  }, []);

  const handleMessageChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      message: value
    }));
  }, []);

  const handleUseTemplate = useCallback((template) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      message: template.template
    }));
    setSelectedTemplate(template);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" applied`);
  }, []);

  const handleSendEmail = useCallback(async () => {
    if (!formData.to.trim()) {
      toast.error('Please enter recipient email');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Please enter email subject');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Please enter email message');
      return;
    }

    try {
      setLoading(true);

      // Here you would call your Gmail API integration
      const emailData = {
        to: formData.to,
        cc: formData.cc,
        bcc: formData.bcc,
        subject: formData.subject,
        message: formData.message,
        integration_id: integration?.id,
      };

      // TODO: Replace with actual API call
      console.log('Sending email via Gmail integration:', emailData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Email sent successfully via Gmail!');
      onCloseCompose();

    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, integration, onCloseCompose]);

  const renderTemplateSelector = (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="subtitle2">Email Templates:</Typography>
        {EMAIL_TEMPLATES.map((template) => (
          <Chip
            key={template.id}
            label={template.name}
            size="small"
            onClick={() => handleUseTemplate(template)}
            color={selectedTemplate?.id === template.id ? 'primary' : 'default'}
            variant={selectedTemplate?.id === template.id ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>
    </Box>
  );

  return (
    <Portal>
      {(fullScreen.value || !smUp) && (
        <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal - 1 }} />
      )}

      <Paper
        sx={{
          maxWidth: 720,
          right: POSITION,
          borderRadius: 2,
          display: 'flex',
          bottom: POSITION,
          position: 'fixed',
          overflow: 'hidden',
          flexDirection: 'column',
          zIndex: (theme) => theme.zIndex.modal,
          width: `calc(100% - ${POSITION * 2}px)`,
          boxShadow: (theme) => theme.customShadows.dropdown,
          ...(fullScreen.value && {
            maxWidth: 1,
            height: `calc(100% - ${POSITION * 2}px)`,
          }),
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{ bgcolor: 'background.neutral', p: (theme) => theme.spacing(1.5, 1, 1.5, 2) }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
            <Iconify icon="logos:google-gmail" width={20} />
            <Typography variant="h6">
              Send via Gmail
            </Typography>
            {integration && (
              <Chip
                size="small"
                label="Connected"
                color="success"
                variant="outlined"
              />
            )}
          </Stack>

          <IconButton size="small" onClick={() => setShowTemplates(!showTemplates)}>
            <Iconify icon="eva:file-text-outline" />
          </IconButton>

          <IconButton onClick={fullScreen.onToggle}>
            <Iconify icon={fullScreen.value ? 'eva:collapse-fill' : 'eva:expand-fill'} />
          </IconButton>

          <IconButton onClick={onCloseCompose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>

        {showTemplates && renderTemplateSelector}

        <Stack spacing={0}>
          <TextField
            placeholder="To"
            value={formData.to}
            onChange={handleFormChange('to')}
            variant="outlined"
            size="small"
            InputProps={{
              sx: { borderRadius: 0, '& fieldset': { border: 'none', borderBottom: 1, borderColor: 'divider' } }
            }}
          />

          <Stack direction="row" spacing={0}>
            <TextField
              placeholder="CC"
              value={formData.cc}
              onChange={handleFormChange('cc')}
              variant="outlined"
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                sx: { borderRadius: 0, '& fieldset': { border: 'none', borderBottom: 1, borderColor: 'divider' } }
              }}
            />
            <TextField
              placeholder="BCC"
              value={formData.bcc}
              onChange={handleFormChange('bcc')}
              variant="outlined"
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                sx: { borderRadius: 0, '& fieldset': { border: 'none', borderBottom: 1, borderColor: 'divider' } }
              }}
            />
          </Stack>

          <TextField
            placeholder="Subject"
            value={formData.subject}
            onChange={handleFormChange('subject')}
            variant="outlined"
            size="small"
            InputProps={{
              sx: { borderRadius: 0, '& fieldset': { border: 'none', borderBottom: 1, borderColor: 'divider' } }
            }}
          />
        </Stack>

        <Stack
          spacing={2}
          flexGrow={1}
          sx={{
            p: 2,
            flex: '1 1 auto',
            overflow: 'hidden',
          }}
        >
          <Editor
            value={formData.message}
            onChange={handleMessageChange}
            placeholder="Type your message..."
            slotProps={{
              wrap: {
                ...(fullScreen.value && { minHeight: 0, flex: '1 1 auto' }),
              },
            }}
            sx={{
              maxHeight: 400,
              ...(fullScreen.value && { maxHeight: 1, flex: '1 1 auto' }),
            }}
          />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center">
              <IconButton>
                <Iconify icon="solar:gallery-add-bold" />
              </IconButton>

              <IconButton>
                <Iconify icon="eva:attach-2-fill" />
              </IconButton>

              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                {integration?.account_email && `Sending from: ${integration.account_email}`}
              </Typography>
            </Stack>

            <Button
              variant="contained"
              color="primary"
              loading={loading}
              disabled={loading || !integration?.is_active}
              onClick={handleSendEmail}
              endIcon={<Iconify icon="iconamoon:send-fill" />}
            >
              {loading ? 'Sending...' : 'Send via Gmail'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Portal>
  );
}

