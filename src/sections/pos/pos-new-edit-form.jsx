import { z as zod } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { useMemo, useState, useEffect} from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { today, fIsAfter } from 'src/utils/format-time';

// import { _addressBooks } from 'src/_mock';
import { addSale, editSale } from 'src/actions/sale';
import { useGetCustomers } from 'src/actions/customer';

import { toast } from 'src/components/snackbar';
import { Form, schemaHelper } from 'src/components/hook-form';

import { InvoiceNewEditDetails } from './pos-new-edit-details';
import { InvoiceNewEditAddress } from './pos-new-edit-address';
import { InvoiceNewEditPayments } from './pos-new-edit-payments';
import { InvoiceNewEditStatusDate } from './pos-new-edit-status-date';

export const NewInvoiceSchema = zod
  .object({

    // invoice_to: zod.number({ required_error: 'Invoice to (Customer ID) is required' }),
    // invoice_from: zod.string().nullable().optional(),
    invoice_to: zod.number().nullable().optional(),
    create_date: schemaHelper.date({ message: { required_error: 'Create date is required!' } }),
    due_date: schemaHelper.date({ message: { required_error: 'Due date is required!' } }),
    items: zod.array(
      zod.object({
        product_id: zod.number().nullable().optional(),
        service_id: zod.number().nullable().optional(),
        // Allow fractional quantities (e.g. 0.5, 1.25)
        quantity: zod.number().min(0.01, { message: 'Quantity must be at least 0.01' }),
        price: zod.number().min(0, { message: 'Price must be at least 0' }),
        costPrice: zod.number().nullable().optional(),
        description: zod.string().nullable().optional(),
      })
    ).min(1, { message: 'At least one sale item is required' }),
    taxes: zod.number().min(0).default(0),
    discount: zod.number().min(0).default(0),
    shipping: zod.number().min(0).default(0),
    status: zod.string(),
    payments: zod
    .array(
      zod.object({
        payment_method_id: zod.union([zod.number(), zod.string()]).nullable().optional(),
        amount:            zod.number().min(0).default(0),
        reference:         zod.string().optional(),
        notes:             zod.string().optional(),
      })
    )
    .optional()
    .default([]),
})
  .refine((data) => !fIsAfter(data.create_date, data.due_date), {
    message: 'Due date cannot be earlier than create date!',
    path: ['due_date'],
  });

  function toDateOnly(datetime) {
    if (!datetime) return today();
    const [date] = datetime.split('T');
    const d = new Date(date);
    // zero time
    d.setHours(0, 0, 0, 0);
    return d;
  }
// ----------------------------------------------------------------------
// InvoiceNewEditForm Component
export function InvoiceNewEditForm({ currentInvoice, storeId, storeSlug }) {
  const router = useRouter();

  const loadingSave = useBoolean();
  const loadingSend = useBoolean();



  // Retrieve active store details from localStorage
  const [activeStore, setActiveStore] = useState(null);
  useEffect(() => {
    const storeData = localStorage.getItem('activeWorkspace');
    if (storeData) {
      const parsedStore = JSON.parse(storeData);
      setActiveStore(parsedStore);
    }
  }, []);

  // Build a storeSlug that contains both the active store name and id
  // const storeSlug = activeStore ? `${activeStore.storeName}-${activeStore.id}` : '';


  const defaultValues = useMemo(
    () => ({
      invoice_number: currentInvoice?.invoice_number || "",
      invoice_to: currentInvoice?.invoice_to || null,
      create_date: toDateOnly(currentInvoice?.create_date),
      due_date: toDateOnly(currentInvoice?.due_date),
      taxes: currentInvoice?.taxes || 0,
      shipping: currentInvoice?.shipping || 0,
      status: currentInvoice?.status || 'draft',
      discount: currentInvoice?.discount || 0,
      // invoice_from: currentInvoice?.invoice_from || null,

      items: currentInvoice?.items || [
        {
          product_id: undefined,
          service_id: undefined,
          quantity: 1,
          costPrice: undefined,
          price: 0,
          description: '',
        },
      ],
      // Edit mode: start empty (existing payments are displayed read-only in the payments component)
      // New mode: start with one blank row (payments component initialises the amount)
      payments: currentInvoice ? [] : [{ payment_method_id: '', amount: 0, reference: '', notes: '' }],
    }),
    [currentInvoice]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewInvoiceSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (currentInvoice) {
      reset(defaultValues);
    }
  }, [currentInvoice, defaultValues, reset]);

  const payments = useWatch({ control: methods.control, name: 'payments' }) || [];
  const items = useWatch({ control: methods.control, name: 'items' }) || [];
  const taxes = useWatch({ control: methods.control, name: 'taxes' }) || 0;
  const shipping = useWatch({ control: methods.control, name: 'shipping' }) || 0;
  const discount = useWatch({ control: methods.control, name: 'discount' }) || 0;

  // Calculate total amount from items, taxes, shipping, and discount
  const itemsTotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  const totalAmount = itemsTotal + taxes + shipping - discount;

  // Update total_amount in form when calculation changes
  useEffect(() => {
    methods.setValue('total_amount', totalAmount);
  }, [totalAmount, methods]);

  // Get customers to check for walk-in customer validation
  const activeStoreId = activeStore?.id;
  const { customers } = useGetCustomers(activeStoreId);

  // Check if selected customer is walk-in
  const invoiceTo = useWatch({ control: methods.control, name: 'invoice_to' });
  const selectedCustomer = typeof invoiceTo === 'number'
    ? customers?.find((c) => c.id === invoiceTo)
    : null;
  const isWalkInCustomer = selectedCustomer?.name?.toLowerCase().includes("walk in") || false;

  // Compute sum of payments
  const paidSum = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const delta   = paidSum - totalAmount; // positive = change due, negative = still owed

  // Track if amounts or items have been modified during editing
  const [isModified, setIsModified] = useState(false);

  // Track original values for comparison
  const [originalValues, setOriginalValues] = useState(null);

  useEffect(() => {
    if (currentInvoice && !originalValues) {
      const originalTotalAmount = currentInvoice.total_amount || 0;
      const originalPaidSum = currentInvoice.payments ?
        currentInvoice.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) : 0;
      setOriginalValues({ totalAmount: originalTotalAmount, paidSum: originalPaidSum });
    }
  }, [currentInvoice, originalValues]);

  // Check if values have been modified
  useEffect(() => {
    if (currentInvoice && originalValues) {
      const hasAmountChanged = Math.abs(totalAmount - originalValues.totalAmount) > 0.01;
      const hasPaymentChanged = Math.abs(paidSum - originalValues.paidSum) > 0.01;
      setIsModified(hasAmountChanged || hasPaymentChanged);
    }
  }, [totalAmount, paidSum, currentInvoice, originalValues]);

  // Handle payment status logic with enhanced edit support
  useEffect(() => {
    const currentStatus = methods.getValues('status');

    if (!currentInvoice) {
      // New invoice logic
      if (delta < 0 && !isWalkInCustomer) {
        // Underpaid, non–walk‑in
        methods.setValue('status', 'credit');
      } else if (delta < 0 && isWalkInCustomer) {
        // Underpaid, walk‑in
        methods.setValue('status', 'draft');
      } else if (delta >= 0 && paidSum >= totalAmount && totalAmount > 0) {
        // Fully paid or overpaid
        methods.setValue('status', 'paid');
      }
    } else if (currentStatus === 'paid' && delta < 0 && !isWalkInCustomer && isModified) {
      // Editing: paid → credit (non–walk‑in) - only if modified
      methods.setValue('status', 'credit');
      if (paidSum > 0) {
        toast.warning(
          `Payment amount is less than total. Status changed to Credit. Remaining: $${Math.abs(delta).toFixed(2)}`
        );
      }
    } else if (currentStatus === 'paid' && delta < 0 && isWalkInCustomer && isModified) {
      // Editing: attempted credit on walk‑in - only if modified
      toast.error(
        'Walk-in customers must pay in full. Please adjust payment amount or select a different customer.'
      );
    } else if (currentStatus === 'credit' && delta >= 0 && paidSum >= totalAmount) {
      // Editing: credit → paid
      methods.setValue('status', 'paid');
      if (delta > 0) {
        toast.success(`Payment complete! Change to give: $${delta.toFixed(2)}`);
      } else {
        toast.success('Payment complete! Status changed to Paid.');
      }
    }
  }, [delta, methods, isWalkInCustomer, paidSum, totalAmount, currentInvoice, isModified]);

  const enrichDataWithStore = (data) => {
    // Strip placeholder rows that have no payment method selected
    const validPayments = (data.payments || []).filter(
      (p) => p.payment_method_id !== '' && p.payment_method_id != null && Number(p.amount) > 0
    );
    return {
      ...data,
      payments: validPayments,
      store_id: activeStore?.id || 0,
      invoice_from: activeStore ? `${activeStore.id} - ${activeStore.storeName}` : '',
    };
  };

  // Validate credit sales for walk-in customers
  const validateCreditSale = (data) => {
    if (data.status === 'credit' && isWalkInCustomer) {
      toast.error("Credit sales are not allowed for walk-in customers. Please select a registered customer.");
      return false;
    }
    return true;
  };

  const onError = (formErrors) => {
    console.error("Validation errors:", formErrors);
    toast.error("Please fill in all required fields correctly.");
  };

  const handleSaveAsDraft = handleSubmit(
    async (data) => {
      loadingSave.onTrue();
      try {
        const enrichedData = enrichDataWithStore(data);
        enrichedData.status = "draft"; // Force status to draft
        let saleResult;
        if (currentInvoice) {
          saleResult = await editSale(currentInvoice.id, enrichedData);
        } else {
          saleResult = await addSale(enrichedData);
        }
        reset();
        loadingSave.onFalse();
        toast.success("Draft saved successfully!");
        // Navigate to receipt page immediately
        const saleId = saleResult?.id || currentInvoice?.id;
        if (saleId) {
          router.push(paths.dashboard.pos.receipt(storeSlug, saleId));
        } else {
          router.push(paths.dashboard.invoice.root(storeSlug));
        }
        console.info('Draft sale data:', JSON.stringify(enrichedData, null, 2));
      } catch (error) {
        console.error("Submission error:", error);
        toast.error("An error occurred while saving the draft sale.");
        loadingSave.onFalse();
      }
    },
    onError
  );

  const handleCreateAndSend = handleSubmit(
    async (data) => {
      // Validate credit sales for walk-in customers
      if (!validateCreditSale(data)) {
        return;
      }

      loadingSend.onTrue();
      try {
        const enrichedData = enrichDataWithStore(data);

        // Automatically change status to 'paid' if fully paid
        if (paidSum >= totalAmount && data.status === 'credit') {
          enrichedData.status = 'paid';
        }

        let saleResult;
        if (currentInvoice) {
          saleResult = await editSale(currentInvoice.id, enrichedData);
        } else {
          saleResult = await addSale(enrichedData);
        }
        reset();
        loadingSend.onFalse();
        toast.success("Sale created and sent successfully!");
        // Navigate to receipt page after 1 second
        setTimeout(() => {
          const saleId = saleResult?.id || currentInvoice?.id;
          if (saleId) {
            router.push(paths.dashboard.pos.receipt(storeSlug, saleId));
          } else {
            router.push(paths.dashboard.invoice.root(storeSlug));
          }
        }, 1000);
        console.info('Sale created & sent data:', JSON.stringify(enrichedData, null, 2));
      } catch (error) {
        console.error("Submission error:", error);
        toast.error("An error occurred while creating & sending the sale.");
        loadingSend.onFalse();
      }
    },
    onError
  );

  return (
    // <Form methods={methods}>
    <Form methods={methods} onSubmit={handleCreateAndSend}>


      <Card>
        <InvoiceNewEditAddress />

        <InvoiceNewEditStatusDate />

        <InvoiceNewEditDetails />

        <InvoiceNewEditPayments storeId={storeId} currentInvoice={currentInvoice} />

      </Card>
      {/* SHOW ALERT - Only show for new invoices or when values are modified in edit mode */}
    {delta > 0 && totalAmount > 0 && (
      <Alert severity="success">
        Change to give back: ${Math.abs(delta).toFixed(2)}
      </Alert>
    )}
    {/* {delta < 0 && !isWalkInCustomer && (!currentInvoice || isModified) && ( */}
    {delta < 0 && !isWalkInCustomer && (!currentInvoice || isModified) && (
      <Alert severity="warning">
        Remaining due: ${Math.abs(delta).toFixed(2)} (status switched to Credit)
      </Alert>
    )}
    {delta < 0 && isWalkInCustomer && (!currentInvoice || isModified) && (
      <Alert severity="error">
        Walk-in customers must pay in full. Remaining due: ${Math.abs(delta).toFixed(2)}
      </Alert>
    )}

      <Stack justifyContent="flex-end" direction="row" spacing={2} sx={{ mt: 3 }}>
        <LoadingButton
          color="inherit"
          size="large"
          variant="outlined"
          loading={loadingSave.value && isSubmitting}
          onClick={handleSaveAsDraft}
        >
          Save as draft
        </LoadingButton>

        <LoadingButton
          size="large"
          variant="contained"
          loading={loadingSend.value && isSubmitting}
          onClick={handleCreateAndSend}
          disabled={delta < 0 && isWalkInCustomer}
        >
          {currentInvoice ? 'Update' : 'Save'} & send
        </LoadingButton>
      </Stack>
    </Form>
  );
}
