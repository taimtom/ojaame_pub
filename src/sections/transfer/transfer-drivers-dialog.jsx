import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import {
  createDriver,
  deleteDriver,
  updateDriver,
  useGetDrivers,
} from 'src/actions/transfer';

const EMPTY_FORM = { name: '', phone: '', email: '' };

export function TransferDriversDialog({ open, onClose }) {
  const { drivers, mutateDrivers } = useGetDrivers();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleEdit = (driver) => {
    setEditingId(driver.id);
    setForm({
      name: driver.name || '',
      phone: driver.phone || '',
      email: driver.email || '',
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await updateDriver(editingId, payload);
        toast.success('Driver updated.');
      } else {
        await createDriver(payload);
        toast.success('Driver created.');
      }
      await mutateDrivers();
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Failed to save driver.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (driverId) => {
    setSubmitting(true);
    try {
      await deleteDriver(driverId);
      toast.success('Driver deleted.');
      if (editingId === driverId) {
        resetForm();
      }
      await mutateDrivers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete driver.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage drivers</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {editingId ? 'Edit driver' : 'Add driver'}
          </Typography>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            required
          />
          <TextField
            label="Email (optional)"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
              {editingId ? 'Save changes' : 'Add driver'}
            </Button>
            {editingId && (
              <Button variant="outlined" onClick={resetForm} disabled={submitting}>
                Cancel edit
              </Button>
            )}
          </Stack>

          <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
            Company drivers
          </Typography>
          {!drivers?.length ? (
            <Typography variant="body2" color="text.disabled">
              No drivers yet. Add one above.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {drivers.map((driver) => (
                <Box
                  key={driver.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.neutral',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">{driver.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {driver.phone}
                      {driver.email ? ` · ${driver.email}` : ''}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => handleEdit(driver)} disabled={submitting}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(driver.id)}
                      disabled={submitting}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

TransferDriversDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
