import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { addCustomer } from 'src/actions/customer';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function CustomerQuickAddDialog({ open, storeId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    if (saving) return;
    setName('');
    setPhone('');
    onClose?.();
  };

  const handleSubmit = async () => {
    const cleanedName = name.trim();
    const cleanedPhone = phone.trim();
    if (!cleanedName || !cleanedPhone) {
      toast.error('Enter both customer name and phone number.');
      return;
    }
    if (!storeId) {
      toast.error('Select a store first.');
      return;
    }

    try {
      setSaving(true);
      const created = await addCustomer({
        name: cleanedName,
        phone_number: cleanedPhone,
        address: 'N/A',
        city: 'N/A',
        state: 'N/A',
        country: 'Nigeria',
        zip_code: '000000',
        primary: 1,
        address_type: 'Home',
        store_id: Number(storeId),
      });
      const option = {
        id: created.id,
        name: created.name || cleanedName,
        phone_number: created.phone_number || cleanedPhone,
      };
      toast.success('Customer added');
      onCreated?.(option);
      setName('');
      setPhone('');
      onClose?.();
    } catch (error) {
      toast.error(error?.data?.detail || error?.message || 'Could not add customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Add customer</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Customer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            autoFocus
          />
          <TextField
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Add customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
