import { useFormContext } from 'react-hook-form';
import React, { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

// import { _addressBooks } from 'src/_mock';
import { useGetCustomers } from 'src/actions/customer';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { AddressNewForm, AddressListDialog } from '../address';

export function InvoiceNewEditAddress() {
  const { watch, setValue, formState: { errors } } = useFormContext();
  const mdUp = useResponsive('up', 'md');
  const values = watch();
  const { invoice_to } = values;

  // Retrieve active store info from localStorage.
  const [activeStore, setActiveStore] = useState(null);
  useEffect(() => {
    const storeData = localStorage.getItem('activeWorkspace');
    if (storeData) {
      const parsedStore = JSON.parse(storeData);
      setActiveStore(parsedStore);
      setValue('invoice_from', `${parsedStore.id} - ${parsedStore.storeName || ''}`);
    }
  }, [setValue]);

  // Use activeStore.id to fetch customers (addresses).
  const storeId = activeStore?.id;
  const { customers, refetch } = useGetCustomers(storeId);

  useEffect(() => {
    if (!invoice_to && customers && customers.length > 0) {
      const walkInCustomer = customers.find((c) =>
        c.name.toLowerCase().includes("walk in")
      );
      if (walkInCustomer) {
        setValue('invoice_to', walkInCustomer.id);
      }
    }
  }, [invoice_to, customers, setValue]);

  const selectedCustomer = typeof invoice_to === 'number'
    ? customers.find((c) => c.id === invoice_to)
    : null;

  // Control the address dialog.
  const addressDialog = useBoolean();
  const [openNewAddressForm, setOpenNewAddressForm] = useState(false);

  const handleNewAddressClose = useCallback(() => {
    setOpenNewAddressForm(false);
  }, []);

  const handleNewAddressCreate = useCallback(
    (newAddress) => {
      setValue('invoice_to', newAddress.id);
      setOpenNewAddressForm(false);
      // Refetch to update the address list.
      if (typeof refetch === 'function') {
        refetch();
      }
      toast.success("New address added successfully.");
    },
    [setValue, refetch]
  );

  return (
    <>
      <Stack
        spacing={{ xs: 3, md: 5 }}
        direction={{ xs: 'column', md: 'row' }}
        divider={
          <Divider
            flexItem
            orientation={mdUp ? 'vertical' : 'horizontal'}
            sx={{ borderStyle: 'dashed' }}
          />
        }
        sx={{ p: 3 }}
      >
        <Stack sx={{ width: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              From:
            </Typography>
            {/* No edit button since active store info is fixed */}
          </Stack>
          <Stack spacing={1}>
            <Typography variant="subtitle2">{activeStore?.storeName || ''}</Typography>
            <Typography variant="body2">{activeStore?.address || ''}</Typography>
            <Typography variant="body2">{activeStore?.phoneNumber || ''}</Typography>
          </Stack>
        </Stack>

        <Stack sx={{ width: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              To:
            </Typography>
            <IconButton onClick={addressDialog.onTrue}>
              <Iconify icon={invoice_to ? 'solar:pen-bold' : 'mingcute:add-line'} />
            </IconButton>
          </Stack>
          {selectedCustomer ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2">{selectedCustomer.name}</Typography>
              <Typography variant="body2">{selectedCustomer.fullAddress}</Typography>
              <Typography variant="body2">{selectedCustomer.phone_number}</Typography>
            </Stack>
          ) : (
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Walk In Customer
            </Typography>
          )}
          {errors.invoice_to && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              {errors.invoice_to.message}
            </Typography>
          )}
        </Stack>
      </Stack>

      {/* Address List Dialog */}
      <AddressListDialog
        title="Customer Address Book"
        open={addressDialog.value}
        onClose={addressDialog.onFalse}
        selected={(selectedId) => selectedCustomer?.id === selectedId}
        onSelect={(customer) => {
          setValue('invoice_to', customer.id);
          toast.success("Address updated successfully.");
          addressDialog.onFalse();
        }}
        list={customers || []}
        action={
          <Button
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" />}
            sx={{ alignSelf: 'flex-end' }}
            onClick={() => setOpenNewAddressForm(true)}
          >
            New
          </Button>
        }
      />

      {/* New Address Form */}
      <AddressNewForm
        open={openNewAddressForm}
        onClose={handleNewAddressClose}
        onCreate={handleNewAddressCreate}
      />
    </>
  );
}
