import { useCallback } from 'react';
import { toast } from 'src/components/snackbar';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { useGetSubscriptionInvoices, initiatePayment } from 'src/actions/subscription';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  paid: 'success',
  unpaid: 'warning',
  overdue: 'error',
};

// ----------------------------------------------------------------------

export function AccountBillingHistory() {
  const showMore = useBoolean();
  const paying = useBoolean();
  const { invoices, invoicesLoading, invoicesError } = useGetSubscriptionInvoices();

  const handlePay = useCallback(async (invoiceId) => {
    paying.onTrue();
    try {
      const data = await initiatePayment({
        invoice_id: invoiceId,
        callback_url: window.location.href,
      });
      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (err) {
      toast.error(err?.detail || err?.message || 'Could not initiate payment.');
    } finally {
      paying.onFalse();
    }
  }, [paying]);

  if (invoicesLoading) {
    return (
      <Card>
        <CardHeader title="Invoice history" />
        <Stack spacing={1.5} sx={{ px: 3, pt: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={48} />
          ))}
        </Stack>
      </Card>
    );
  }

  if (invoicesError) {
    return (
      <Card>
        <CardHeader title="Invoice history" />
        <Stack alignItems="center" sx={{ p: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Could not load invoices.
          </Typography>
        </Stack>
      </Card>
    );
  }

  const visible = showMore.value ? invoices : invoices.slice(0, 8);

  return (
    <Card>
      <CardHeader title="Invoice history" />

      {invoices.length === 0 ? (
        <Stack alignItems="center" sx={{ p: 4 }}>
          <Iconify icon="solar:bill-list-bold" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No invoices yet.
          </Typography>
        </Stack>
      ) : (
        <>
          <Stack spacing={0} sx={{ px: 3, pt: 2 }}>
            {visible.map((invoice, index) => (
              <Stack key={invoice.id}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.25 }}>
                  <ListItemText
                    primary={invoice.invoice_number}
                    secondary={fDate(invoice.period_start)}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.disabled' }}
                    sx={{ flex: 1, minWidth: 0 }}
                  />

                  <Chip
                    label={invoice.status}
                    size="small"
                    color={STATUS_COLOR[invoice.status] || 'default'}
                    variant="soft"
                    sx={{ textTransform: 'capitalize', minWidth: 64 }}
                  />

                  <Typography
                    variant="subtitle2"
                    sx={{ minWidth: 72, textAlign: 'right' }}
                  >
                    {fCurrency(invoice.total)}
                  </Typography>

                  {invoice.status !== 'paid' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      disabled={paying.value}
                      onClick={() => handlePay(invoice.id)}
                      sx={{ minWidth: 56, px: 1 }}
                    >
                      {paying.value ? <CircularProgress size={14} /> : 'Pay'}
                    </Button>
                  )}

                  {invoice.status === 'paid' && (
                    <Iconify
                      icon="solar:check-circle-bold"
                      width={20}
                      sx={{ color: 'success.main', flexShrink: 0 }}
                    />
                  )}
                </Stack>

                {index < visible.length - 1 && <Divider sx={{ borderStyle: 'dashed' }} />}
              </Stack>
            ))}
          </Stack>

          <Divider sx={{ borderStyle: 'dashed', mx: 3 }} />

          <Stack alignItems="flex-start" sx={{ p: 2 }}>
            <Button size="small" color="inherit" onClick={showMore.onToggle}>
              Show {showMore.value ? 'less' : 'more'}
            </Button>
          </Stack>
        </>
      )}
    </Card>
  );
}
