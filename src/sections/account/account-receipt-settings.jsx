import { useCallback, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance from 'src/utils/axios';
import { useReceiptAdjustmentSetting } from 'src/hooks/use-receipt-adjustment-setting';

import { toast } from 'src/components/snackbar';

function getActiveStoreId() {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

export function AccountReceiptSettings() {
  const [storeId, setStoreId] = useState(() => getActiveStoreId());
  const { enabled, loading, canManageSetting, refresh } = useReceiptAdjustmentSetting(storeId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sync = () => setStoreId(getActiveStoreId());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleToggle = useCallback(
    async (event) => {
      if (!storeId || !canManageSetting) return;
      const next = event.target.checked;
      setSaving(true);
      try {
        await axiosInstance.patch(`/api/stores/${storeId}/settings/receipt-adjustment`, {
          enabled: next,
        });
        await refresh();
        toast.success(
          next
            ? 'Receipt display adjustment enabled for this store.'
            : 'Receipt display adjustment disabled.'
        );
      } catch (error) {
        const detail = error?.response?.data?.detail;
        toast.error(
          typeof detail === 'string' ? detail : 'Could not update receipt settings.'
        );
      } finally {
        setSaving(false);
      }
    },
    [storeId, canManageSetting, refresh]
  );

  if (!canManageSetting) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            You do not have permission to manage store receipt settings.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Receipt display adjustment</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Allow staff to print or share a receipt copy with a higher display total. The real
              sale amount, inventory, and reports are never changed.
            </Typography>
          </Box>

          {!storeId ? (
            <Alert severity="warning">Select an active store to manage receipt settings.</Alert>
          ) : loading ? (
            <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={handleToggle}
                  disabled={saving}
                />
              }
              label="Allow receipt display adjustment"
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
