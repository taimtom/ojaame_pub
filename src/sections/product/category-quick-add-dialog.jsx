import { useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { addCategory } from 'src/actions/category';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function CategoryQuickAddDialog({ open, storeId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [publish, setPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setName('');
    setPublish(true);
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    const storedId = storeId || localStorage.getItem('store_id');
    if (!storedId) {
      setError('Store not found. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const newCategory = await addCategory({
        name: name.trim(),
        publish: publish ? 'publish' : 'draft',
        store_id: Number(storedId),
      });
      toast.success(`Category "${newCategory.name}" created.`);
      onCreated(newCategory);
      handleClose();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to create category.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add New Category</DialogTitle>

      <DialogContent sx={{ pt: '16px !important', pb: 1 }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Category name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          error={Boolean(error)}
          helperText={error}
        />

        <FormControlLabel
          sx={{ mt: 1.5 }}
          control={
            <Switch
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              size="small"
            />
          }
          label="Publish immediately"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          startIcon={loading ? <CircularProgress size={14} /> : null}
        >
          {loading ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
