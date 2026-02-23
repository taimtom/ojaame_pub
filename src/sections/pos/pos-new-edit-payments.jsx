// src/sections/pos/pos-new-edit-payments.jsx

import { useMemo, useState, useEffect } from 'react';
import { useWatch, useFieldArray, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useGetPaymentMethods } from 'src/actions/paymentmethod';
import {
  // addPaymentToSale,
  updateSalePayment,
  removeSalePayment } from 'src/actions/sale';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';

export function InvoiceNewEditPayments({ storeId, currentInvoice }) {
  const { control, setValue, watch, getValues } = useFormContext();
  const { paymentMethods, paymentMethodsLoading } = useGetPaymentMethods(storeId);

  const { fields, append, remove } = useFieldArray({ control, name: 'payments' });
  const totalAmount = useWatch({ control, name: 'total_amount' }) || 0;
  const invoiceTo = watch('invoice_to');
  const status = watch('status');

  // State for editing existing payments
  const [editingPayment, setEditingPayment] = useState(null);
  const [editPaymentDialog, setEditPaymentDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, paymentIndex: null });
  const [editFormData, setEditFormData] = useState({});

  // State for checking if customer is walk-in
  const [isWalkInCustomer, setIsWalkInCustomer] = useState(false);

  // Separate existing payments from new payments
  const existingPayments = useMemo(() => {
    if (!currentInvoice?.payments) return [];
    return currentInvoice.payments.map(payment => ({
      ...payment,
      isExisting: true
    }));
  }, [currentInvoice]);

  // Calculate total of existing payments
  const existingPaymentsTotal = useMemo(
        () =>
          existingPayments.reduce(
            (sum, payment) => sum + (payment.amount || 0),
            0
          ),
        [existingPayments]
      );

  // Calculate remaining amount for new payments
  const remainingAmount = totalAmount - existingPaymentsTotal;

  // Get payment method details for display
  const getPaymentMethodInfo = (methodId) => {
    const method = paymentMethods?.find(pm => pm.id === methodId);
    if (!method) return 'Unknown Method';
    return `${method.method_type.replace('_', ' ').toUpperCase()}${method.issuer ? ` — ${method.issuer}` : ''}`;
  };

  // Initialize new payment with remaining amount for new invoices
  useEffect(() => {
    if (!currentInvoice && fields.length === 1) {
      setValue(`payments.0.amount`, totalAmount);
    }
  }, [currentInvoice, fields.length, totalAmount, setValue]);

  // Check if customer is walk-in
  useEffect(() => {
    // This would need access to customer data - you may need to pass this as a prop
    // For now, we'll assume it's passed through the form context or as a prop
    const customer = currentInvoice?.customer;
    setIsWalkInCustomer(customer?.name?.toLowerCase().includes('walk in') || false);
  }, [currentInvoice]);

  // Add new payment for credit sales
  const handleAddNewPayment = () => {
    const suggestedAmount = Math.max(0, remainingAmount);
    append({
      payment_method_id: '',
      amount: suggestedAmount,
      reference: '',
      notes: '',
      isNew: true
    });
  };

  // Handle editing existing payment
  const handleEditExistingPayment = (payment, index) => {
    try {
      if (!payment) {
        toast.error('Payment data not found.');
        return;
      }

      // Allow editing if:
      // 1. Status is paid and customer is not walk-in, OR
      // 2. Status is credit (for any customer type)
      const canEdit = (status === 'paid' && !isWalkInCustomer) || status === 'credit';

      if (canEdit) {
        setEditingPayment({ ...payment, index });
        setEditFormData({
          payment_method_id: payment.payment_method_id || '',
          amount: payment.amount || 0,
          reference: payment.reference || '',
          notes: payment.notes || ''
        });
        setEditPaymentDialog(true);
      } else if (isWalkInCustomer && status === 'paid') {
        toast.error('Cannot edit payments for walk-in customers.');
      } else {
        toast.info('Payment editing is only available for paid or credit sales.');
      }
    } catch (error) {
      console.error('Error handling payment edit:', error);
      toast.error('An error occurred while trying to edit the payment.');
    }
  };

  // Handle payment amount change validation
  const handlePaymentAmountChange = (newAmount) => {
    const newTotal = existingPaymentsTotal - (editingPayment?.amount || 0) + newAmount;
    if (newTotal < totalAmount && status === 'paid') {
      toast.warning(
        `Reducing payment will change status to Credit. New balance: $${(totalAmount - newTotal).toFixed(2)}`
      );
    }
    setEditFormData(prev => ({ ...prev, amount: newAmount }));
  };

  // Save edited payment
  const handleSaveEditedPayment = async () => {
    if (!editingPayment || !currentInvoice) return;

    try {
      // Update the existing payment via API
      await updateSalePayment(currentInvoice.id, editingPayment.id, editFormData);

      toast.success('Payment updated successfully!');
      setEditPaymentDialog(false);
      setEditingPayment(null);
      setEditFormData({});

      // Reload the form or invoice data to reflect changes
      window.location.reload(); // Simple approach - you might want to use SWR mutate instead
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment. Please try again.');
    }
  };

  // Handle payment removal confirmation
  const handleRemovePaymentConfirm = (index) => {
    setConfirmDialog({ open: true, paymentIndex: index });
  };

  // Remove payment after confirmation
  const handleConfirmRemovePayment = async () => {
    const { paymentIndex } = confirmDialog;
    if (paymentIndex !== null && existingPayments[paymentIndex] && currentInvoice) {
      try {
        const payment = existingPayments[paymentIndex];
        await removeSalePayment(currentInvoice.id, payment.id);

        toast.success('Payment removed successfully!');

        // Reload the form or invoice data to reflect changes
        window.location.reload(); // Simple approach - you might want to use SWR mutate instead
      } catch (error) {
        console.error('Error removing payment:', error);
        toast.error('Failed to remove payment. Please try again.');
      }
    }
    setConfirmDialog({ open: false, paymentIndex: null });
  };

  return (
    <Stack spacing={2} sx={{ p: 3, bgcolor: 'background.neutral' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Payments</Typography>
      </Stack>

      {/* Show existing payments with edit capability */}
      {existingPayments.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            Existing Payments {((status === 'paid' && !isWalkInCustomer) || status === 'credit') && '(Click to edit)'}
          </Typography>
          {existingPayments.map((payment, idx) => (
            <Box key={`existing-${idx}`} sx={{ mb: 1 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems="center"
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: ((status === 'paid' && !isWalkInCustomer) || status === 'credit') ? 'action.hover' : 'action.disabledBackground',
                  cursor: ((status === 'paid' && !isWalkInCustomer) || status === 'credit') ? 'pointer' : 'default',
                  '&:hover': {
                    bgcolor: ((status === 'paid' && !isWalkInCustomer) || status === 'credit') ? 'action.selected' : 'action.disabledBackground'
                  }
                }}
                onClick={() => handleEditExistingPayment(payment, idx)}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {getPaymentMethodInfo(payment.payment_method_id)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Chip
                    label={`$${payment.amount?.toFixed(2) || '0.00'}`}
                    color="success"
                    size="small"
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {payment.reference || 'No reference'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {payment.notes || 'No notes'}
                  </Typography>
                </Box>
                <Box sx={{ width: 80 }}>
                  <Stack direction="row" spacing={1}>
                    <Chip label="Paid" color="success" size="small" />
                    {((status === 'paid' && !isWalkInCustomer) || status === 'credit') && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditExistingPayment(payment, idx);
                        }}
                        sx={{
                          p: 0.5,
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                        title="Edit payment"
                      >
                        <Iconify icon="eva:edit-fill" width={16} />
                      </IconButton>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          ))}

          {existingPayments.length > 0 && (
            <Divider sx={{ my: 2 }} />
          )}
        </Box>
      )}

      {/* Show credit status and remaining amount */}
      {currentInvoice && status === 'credit' && remainingAmount > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This is a credit sale. Remaining balance: <strong>${remainingAmount.toFixed(2)}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            You can add additional payments below to reduce the outstanding balance.
          </Typography>
        </Alert>
      )}

      {/* New/editable payments section */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {currentInvoice ? 'Add New Payment' : 'Payment Details'}
          </Typography>
          <IconButton onClick={handleAddNewPayment}>
            <Iconify icon="eva:plus-fill" />
          </IconButton>
        </Stack>

        {fields.map((field, idx) => {
          // Skip existing payments in the editable section
          if (field.isExisting) return null;

          return (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              key={field.id}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              {/* Payment Method Select */}
              <Field.Select
                name={`payments.${idx}.payment_method_id`}
                label="Payment Method"
                disabled={paymentMethodsLoading}
                fullWidth
              >
                {!paymentMethodsLoading &&
                  paymentMethods.map((pm) => (
                    <MenuItem key={pm.id} value={pm.id}>
                      {pm.method_type.replace('_', ' ').toUpperCase()}
                      {pm.issuer ? ` — ${pm.issuer}` : ''}
                    </MenuItem>
                  ))}
              </Field.Select>

              {/* Amount */}
              <Field.Text
                name={`payments.${idx}.amount`}
                label="Amount"
                type="number"
                fullWidth
                InputProps={{
                  inputProps: {
                    min: 0,
                    step: 0.01
                  }
                }}
                helperText={
                  currentInvoice && remainingAmount > 0
                    ? `Remaining balance: $${remainingAmount.toFixed(2)}`
                    : status === 'credit'
                      ? 'Credit sales allow partial or no payment'
                      : 'Enter payment amount'
                }
              />

              {/* Reference */}
              <Field.Text
                name={`payments.${idx}.reference`}
                label="Reference"
                fullWidth
                placeholder="Payment reference"
              />

              {/* Notes */}
              <Field.Text
                name={`payments.${idx}.notes`}
                label="Notes"
                fullWidth
                placeholder="Payment notes"
              />

              {/* Remove button */}
              <IconButton color="error" onClick={() => remove(idx)}>
                <Iconify icon="eva:close-circle-outline" />
              </IconButton>
            </Stack>
          );
        })}

        {/* Show payment summary */}
        {(existingPayments.length > 0 || fields.length > 0) && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Total Amount:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ${totalAmount.toFixed(2)}
                </Typography>
              </Stack>
              {existingPayments.length > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="success.main">
                    Previous Payments:
                  </Typography>
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    ${existingPaymentsTotal.toFixed(2)}
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color={remainingAmount > 0 ? 'warning.main' : 'success.main'}>
                  {remainingAmount > 0 ? 'Remaining Balance:' : 'Status:'}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  color={remainingAmount > 0 ? 'warning.main' : 'success.main'}
                >
                  {remainingAmount > 0 ? `$${remainingAmount.toFixed(2)}` : 'Fully Paid'}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        )}
      </Box>

      {/* Edit Payment Dialog */}
      <Dialog
        open={editPaymentDialog}
        onClose={() => setEditPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Payment</DialogTitle>
        <DialogContent>
  <Stack spacing={3} sx={{ mt: 2 }}>
    <FormControl fullWidth>
      <InputLabel>Payment Method</InputLabel>
      <Select
        value={editFormData.payment_method_id}
        label="Payment Method"
        onChange={(e) =>
          setEditFormData(d => ({ ...d, payment_method_id: e.target.value }))
        }
      >
        {paymentMethods.map((pm) => (
          <MenuItem key={pm.id} value={pm.id}>
            {pm.method_type.replace('_', ' ').toUpperCase()}
            {pm.issuer ? ` — ${pm.issuer}` : ''}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <TextField
      type="number"
      label="Amount"
      fullWidth
      value={editFormData.amount}
      onChange={(e) =>
        handlePaymentAmountChange(Number(e.target.value))
      }
      inputProps={{ min: 0, step: 0.01 }}
      helperText={`Current total: $${totalAmount.toFixed(2)}`}
    />

    <TextField
      label="Reference"
      fullWidth
      value={editFormData.reference}
      onChange={(e) =>
        setEditFormData(d => ({ ...d, reference: e.target.value }))
      }
    />

    <TextField
      label="Notes"
      fullWidth
      multiline
      rows={3}
      value={editFormData.notes}
      onChange={(e) =>
        setEditFormData(d => ({ ...d, notes: e.target.value }))
      }
    />
  </Stack>
</DialogContent>

        <DialogActions>
          <Button onClick={() => setEditPaymentDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEditedPayment}
            disabled={!editFormData.payment_method_id || !editFormData.amount}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog for Payment Removal */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, paymentIndex: null })}
        title="Remove Payment"
        content="Are you sure you want to remove this payment? This action cannot be undone."
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRemovePayment}
          >
            Remove
          </Button>
        }
      />
    </Stack>
  );
}
