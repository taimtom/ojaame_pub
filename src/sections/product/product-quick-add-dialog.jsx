import { useEffect, useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';
import { ProductQuickAddForm } from './product-quick-add-form';

// ----------------------------------------------------------------------

export function ProductQuickAddDialog({
  open,
  onClose,
  storeId,
  defaultQuantity = 0,
  allowZeroQuantity = true,
  onProductCreated,
  title = 'Add new product',
}) {
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open) {
      setFormKey((k) => k + 1);
    }
  }, [open]);

  const handleCreated = (product) => {
    onProductCreated?.(product);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <ProductQuickAddForm
          key={formKey}
          storeId={storeId}
          defaultQuantity={defaultQuantity}
          allowZeroQuantity={allowZeroQuantity}
          embedded
          onCancel={onClose}
          onCreated={handleCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
