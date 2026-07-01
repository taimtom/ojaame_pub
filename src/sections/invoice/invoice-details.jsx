import { useState, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { INVOICE_STATUS_OPTIONS } from 'src/_mock';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import { InvoiceToolbar } from './invoice-toolbar';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  [`& .${tableCellClasses.root}`]: {
    textAlign: 'right',
    borderBottom: 'none',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
}));

/** Prefer persisted line total; supports fractional quantities. */
function lineItemTotal(item) {
  if (item?.total != null && item.total !== '') {
    const t = Number(item.total);
    if (!Number.isNaN(t)) return t;
  }
  const p = Number(item?.price);
  const q = Number(item?.quantity);
  if (!Number.isNaN(p) && !Number.isNaN(q)) return p * q;
  return 0;
}

function resolveInvoiceContactEmail(invoice) {
  if (!invoice) return 'N/A';

  const candidates = [
    invoice.store_email,
    invoice.storeEmail,
    invoice.store_email_address,
    invoice.store_email_contact,
    invoice.store?.email,
    invoice.store?.storeEmail,
    invoice.company_email,
    invoice.companyEmail,
    invoice.company?.email,
    invoice.company?.companyEmail,
    invoice.owner_email,
    invoice.ownerEmail,
    invoice.owner?.email,
    invoice.owner?.ownerEmail,
    invoice.user_email,
    invoice.userEmail,
  ];

  const found = candidates.find((value) => typeof value === 'string' && value.trim() !== '');

  return (
    found ||
    'N/A'
  );
}

export function InvoiceDetails({ invoice, receiptFormat = 'a4', pdfFlavor = 'invoice' }) {
  const contactEmail = resolveInvoiceContactEmail(invoice);

  const computedSubtotal = useMemo(
    () => invoice?.items?.reduce((acc, item) => acc + lineItemTotal(item), 0) || 0,
    [invoice?.items]
  );

  // Use local state for status (fallback to invoice.status if available)
  const [currentStatus, setCurrentStatus] = useState(invoice?.status || '');

  const handleChangeStatus = useCallback((event) => {
    setCurrentStatus(event.target.value);
  }, []);

  const renderTotal = (
    <>
      <StyledTableRow>
        <TableCell colSpan={3} />
        <TableCell sx={{ color: 'text.secondary' }}>
          <Box sx={{ mt: 2 }} />
          Subtotal
        </TableCell>
        <TableCell width={120} sx={{ typography: 'subtitle2' }}>
          <Box sx={{ mt: 2 }} />
          {fCurrency(computedSubtotal)}
        </TableCell>
      </StyledTableRow>

      <StyledTableRow>
        <TableCell colSpan={3} />
        <TableCell sx={{ color: 'text.secondary' }}>Shipping</TableCell>
        <TableCell width={120} sx={{ color: 'error.main', typography: 'body2' }}>
          - {fCurrency(invoice?.shipping)}
        </TableCell>
      </StyledTableRow>

      <StyledTableRow>
        <TableCell colSpan={3} />
        <TableCell sx={{ color: 'text.secondary' }}>Discount</TableCell>
        <TableCell width={120} sx={{ color: 'error.main', typography: 'body2' }}>
          - {fCurrency(invoice?.discount)}
        </TableCell>
      </StyledTableRow>

      <StyledTableRow>
        <TableCell colSpan={3} />
        <TableCell sx={{ color: 'text.secondary' }}>Taxes</TableCell>
        <TableCell width={120}>{fCurrency(invoice?.taxes)}</TableCell>
      </StyledTableRow>

      <StyledTableRow>
        <TableCell colSpan={3} />
        <TableCell sx={{ typography: 'subtitle1' }}>Total</TableCell>
        <TableCell width={140} sx={{ typography: 'subtitle1' }}>
          {fCurrency(invoice?.total_amount)}
        </TableCell>
      </StyledTableRow>
    </>
  );

  const renderFooter = (
    <Box gap={2} display="flex" alignItems="center" flexWrap="wrap" sx={{ py: 3 }}>
      <div>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          NOTES
        </Typography>
        <Typography variant="body2">
          We appreciate your business. Should you need us to add VAT or extra notes let us know!
        </Typography>
      </div>

      <Box flexGrow={{ md: 1 }} sx={{ textAlign: { md: 'right' } }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          Have a question?
        </Typography>
        <Typography variant="body2">{contactEmail}</Typography>
      </Box>
    </Box>
  );

  const renderMobileList = (
    <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 5 }}>
      <Stack spacing={2}>
        {invoice?.items?.map((row, index) => {
          const itemName =
            (row.product_id && row.product_name) ||
            (row.service_id && row.service_name) ||
            row.description ||
            '';
          const showDescription =
            ((row.product_id && row.product_name) || (row.service_id && row.service_name)) &&
            row.description &&
            row.description.trim() !== '';

          return (
            <Box
              key={index}
              sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}
            >
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
                    {index + 1}. {itemName}
                  </Typography>
                  {showDescription && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
                      {row.description}
                    </Typography>
                  )}
                </Box>
                <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>
                  {fCurrency(lineItemTotal(row))}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 1, color: 'text.secondary', typography: 'body2' }}
              >
                <span>Qty: {row.quantity}</span>
                <span>Unit price: {fCurrency(row.price)}</span>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Stack spacing={1} sx={{ mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ typography: 'body2' }}>
          <Box component="span" sx={{ color: 'text.secondary' }}>Subtotal</Box>
          <Box component="span" sx={{ typography: 'subtitle2' }}>{fCurrency(computedSubtotal)}</Box>
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ typography: 'body2' }}>
          <Box component="span" sx={{ color: 'text.secondary' }}>Shipping</Box>
          <Box component="span" sx={{ color: 'error.main' }}>- {fCurrency(invoice?.shipping)}</Box>
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ typography: 'body2' }}>
          <Box component="span" sx={{ color: 'text.secondary' }}>Discount</Box>
          <Box component="span" sx={{ color: 'error.main' }}>- {fCurrency(invoice?.discount)}</Box>
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ typography: 'body2' }}>
          <Box component="span" sx={{ color: 'text.secondary' }}>Taxes</Box>
          <Box component="span">{fCurrency(invoice?.taxes)}</Box>
        </Stack>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <Stack direction="row" justifyContent="space-between" sx={{ typography: 'subtitle1' }}>
          <Box component="span">Total</Box>
          <Box component="span">{fCurrency(invoice?.total_amount)}</Box>
        </Stack>
      </Stack>
    </Box>
  );

  const renderList = (
    <Scrollbar sx={{ mt: 5, display: { xs: 'none', md: 'block' } }}>
      <Table sx={{ minWidth: 960 }}>
        <TableHead>
          <TableRow>
            <TableCell width={40}>#</TableCell>
            <TableCell sx={{ typography: 'subtitle2' }}>Description</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell align="right">Unit price</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {invoice?.items?.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Box sx={{ maxWidth: 560 }}>
                  {/* Display product/service name, then description on new line if provided */}
                  {(row.product_id && row.product_name) || (row.service_id && row.service_name) ? (
                    <>
                      <Typography variant="subtitle2">
                        {row.product_id ? row.product_name : row.service_name}
                      </Typography>
                      {row.description && row.description.trim() !== '' && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {row.description}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="subtitle2">
                      {row.description || ''}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell align="right">{fCurrency(row.price)}</TableCell>
              <TableCell align="right">{fCurrency(lineItemTotal(row))}</TableCell>
            </TableRow>
          ))}

          {renderTotal}
        </TableBody>
      </Table>
    </Scrollbar>
  );

  return (
    <>
      <InvoiceToolbar
        invoice={invoice}
        currentStatus={currentStatus || ''}
        onChangeStatus={handleChangeStatus}
        statusOptions={INVOICE_STATUS_OPTIONS}
        receiptFormat={receiptFormat}
        pdfFlavor={pdfFlavor}
      />

      <Card sx={{ pt: { xs: 3, md: 5 }, px: { xs: 2, md: 5 }, pb: { xs: 1, md: 0 } }}>
        <Box
          rowGap={5}
          display="grid"
          alignItems="center"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
        >
          <Box
            component="img"
            alt="logo"
            src="/logo/logo-single.svg"
            sx={{ width: 48, height: 48 }}
          />

          <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <Label
              variant="soft"
              color={
                (currentStatus === 'paid' && 'success') ||
                (currentStatus === 'pending' && 'warning') ||
                (currentStatus === 'overdue' && 'error') ||
                'default'
              }
            >
              {currentStatus}
            </Label>
            <Typography variant="h6">{invoice?.invoice_number}</Typography>
          </Stack>

          {/* Invoice from (company / store details) */}
          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Invoice from
            </Typography>
            <Typography variant="body2">
              {invoice?.company_name || invoice?.store_name || 'N/A'}
            </Typography>
            {invoice?.store_name && invoice?.company_name ? (
              <Typography variant="body2">
                Store: {invoice.store_name}
              </Typography>
            ) : null}
            <Typography variant="body2">
              {invoice?.store_address}, {invoice?.store_state}, {invoice?.store_country}
            </Typography>
            <Typography variant="body2">
              Phone: {invoice?.store_phone}
            </Typography>
          </Stack>

          {/* Invoice to (customer details) */}
          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Invoice to
            </Typography>
            <Typography variant="body2">
              {invoice?.customer_name || 'N/A'}
            </Typography>
            <Typography variant="body2">
              {invoice?.customer_address}, {invoice?.customer_state}, {invoice?.customer_country}
            </Typography>
            <Typography variant="body2">
              Phone: {invoice?.customer_phone}
            </Typography>
          </Stack>

          {/* Date details */}
          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Date create
            </Typography>
            {fDate(invoice?.fullcreate_date)}
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Due date
            </Typography>
            {fDate(invoice?.fulldue_date)}
          </Stack>

          {/* Receipt Served by */}
          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Receipt Served by
            </Typography>
            <Typography variant="body2">
              {invoice?.user_fullname || 'N/A'}
            </Typography>
          </Stack>
        </Box>

        {renderMobileList}

        {renderList}

        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} />

        {renderFooter}
      </Card>
    </>
  );
}
