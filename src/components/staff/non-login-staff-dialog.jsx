import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

/** Create a non-login staff member (no seat / no invite). */
export function NonLoginStaffDialog({ open, companyId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    if (saving) return;
    setName('');
    onClose?.();
  };

  const handleSubmit = async () => {
    const cleaned = name.trim();
    if (!cleaned) {
      toast.error('Enter a staff name');
      return;
    }
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    try {
      setSaving(true);
      const { data } = await axiosInstance.post(endpoints.payroll.employees, {
        company_id: companyId,
        staff_kind: 'non_user',
        name: cleaned,
        monthly_gross: 0,
      });
      toast.success('Staff added (no login / no seat)');
      onCreated?.(data);
      setName('');
      onClose?.();
    } catch (error) {
      toast.error(error?.data?.detail || error?.message || 'Could not add staff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Add staff without login</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Non-login staff can be selected on Service Log and payroll. They do not get an account
            and do not use a subscription seat.
          </Alert>
          <TextField
            label="Staff name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Add staff'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
