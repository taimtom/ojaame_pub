import { useMemo, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { paths } from 'src/routes/paths';
import { useGetProducts } from 'src/actions/product';
import { useGetStores } from 'src/actions/store';
import { useGetUsers } from 'src/actions/user';
import { usePermissions } from 'src/hooks/use-permissions';
import { useAuthContext } from 'src/auth/hooks';
import { getTransferActionAccess } from 'src/utils/transfer-permissions';
import {
  assignTransferDriver,
  closeTransferOrder,
  createTransferOrder,
  deliverTransferOrder,
  getTransferKpis,
  markTransferInTransit,
  packTransferOrder,
  pickupTransferOrder,
  receiveTransferOrder,
  useGetTransfer,
  useGetTransfers,
} from 'src/actions/transfer';

import { TransferDetailDrawer } from '../transfer-detail-drawer';

const STATUS_COLORS = {
  created: 'default',
  packed: 'info',
  picked_up: 'warning',
  in_transit: 'warning',
  delivered: 'success',
  received: 'success',
  reconciled_with_exception: 'error',
  closed: 'primary',
};

export function TransferListView({ storeId }) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { userPermissions, hasPermission } = usePermissions();

  const [openCreate, setOpenCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [transferItems, setTransferItems] = useState([{ product_id: '', requested_qty: 1 }]);
  const [destinationStoreId, setDestinationStoreId] = useState('');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [detailTransferId, setDetailTransferId] = useState(null);

  const { stores } = useGetStores();
  const { users } = useGetUsers();
  const { products } = useGetProducts(storeId);
  const { transfers, transfersLoading, mutateTransfers } = useGetTransfers(
    storeId ? { store_id: Number(storeId), limit: 50 } : {}
  );
  const { transfer: detailTransfer, mutateTransfer } = useGetTransfer(detailTransferId);

  const storeNameById = useCallback(
    (id) => (stores || []).find((s) => Number(s.id) === Number(id))?.storeName,
    [stores]
  );

  const productNameById = useCallback(
    (id) => (products || []).find((p) => Number(p.id) === Number(id))?.name,
    [products]
  );

  const destinationOptions = useMemo(
    () => (stores || []).filter((store) => Number(store.id) !== Number(storeId)),
    [stores, storeId]
  );

  const canCreateTransfer =
    hasPermission('inventory.manage') || hasPermission('inventory.create');

  const drawerTransfer = detailTransfer || transfers.find((t) => t.id === detailTransferId);

  const refreshKpis = useCallback(async () => {
    try {
      const data = await getTransferKpis();
      setKpis(data);
    } catch {
      setKpis(null);
    }
  }, []);

  useEffect(() => {
    refreshKpis();
  }, [refreshKpis]);

  const reloadData = async () => {
    await mutateTransfers();
    if (detailTransferId) {
      await mutateTransfer();
    }
    await refreshKpis();
  };

  const handleCreate = async () => {
    const normalizedRows = transferItems
      .filter((row) => row.product_id)
      .map((row) => ({
        product_id: Number(row.product_id),
        requested_qty: Number(row.requested_qty),
      }))
      .filter((row) => row.product_id && row.requested_qty > 0);

    if (!storeId || !destinationStoreId || !normalizedRows.length) {
      toast.error('Add at least one valid item with quantity.');
      return;
    }

    const combinedByProduct = normalizedRows.reduce((acc, row) => {
      const key = String(row.product_id);
      if (!acc[key]) {
        acc[key] = { ...row };
      } else {
        acc[key].requested_qty += row.requested_qty;
      }
      return acc;
    }, {});
    const itemsPayload = Object.values(combinedByProduct);

    setSubmitting(true);
    try {
      await createTransferOrder({
        source_store_id: Number(storeId),
        destination_store_id: Number(destinationStoreId),
        priority: 'normal',
        items: itemsPayload,
      });
      toast.success('Transfer order created.');
      setOpenCreate(false);
      setTransferItems([{ product_id: '', requested_qty: 1 }]);
      setDestinationStoreId('');
      await reloadData();
    } catch (error) {
      toast.error(error.message || 'Failed to create transfer order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (transfer, action) => {
    const access = getTransferActionAccess({
      userPermissions,
      currentUserId: user?.user_id,
      currentStoreId: storeId,
      transfer,
    });

    const permissionMap = {
      pack: access.canPack,
      assign: access.canAssignDriver,
      pickup: access.canPickup,
      transit: access.canInTransit,
      deliver: access.canDeliver,
      receive: access.canReceive,
      close: access.canClose,
    };

    if (!permissionMap[action]) {
      toast.error('You do not have permission for this action at this store.');
      return;
    }

    setSubmitting(true);
    try {
      if (action === 'pack') {
        await packTransferOrder(transfer.id, {
          packed_items: transfer.items.map((item) => ({
            product_id: item.product_id,
            requested_qty: item.requested_qty,
          })),
          packages: [{ package_code: `PKG-${Date.now()}` }],
        });
      } else if (action === 'assign') {
        if (!assignedDriverId) {
          toast.error('Select a driver first.');
          return;
        }
        await assignTransferDriver(transfer.id, { driver_user_id: Number(assignedDriverId) });
      } else if (action === 'pickup') {
        await pickupTransferOrder(transfer.id, {});
      } else if (action === 'transit') {
        await markTransferInTransit(transfer.id, {});
      } else if (action === 'deliver') {
        await deliverTransferOrder(transfer.id, {});
      } else if (action === 'receive') {
        await receiveTransferOrder(transfer.id, {
          received_items: transfer.items.map((item) => ({
            product_id: item.product_id,
            received_qty: item.packed_qty || item.requested_qty,
            damaged_qty: 0,
          })),
        });
      } else if (action === 'close') {
        await closeTransferOrder(transfer.id, {});
      }
      await reloadData();
      toast.success('Transfer updated.');
    } catch (error) {
      toast.error(error.message || 'Failed to update transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (transfer) => {
    setDetailTransferId(transfer.id);
  };

  const addItemRow = () => {
    setTransferItems((prev) => [...prev, { product_id: '', requested_qty: 1 }]);
  };

  const removeItemRow = (index) => {
    setTransferItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const updateItemRow = (index, patch) => {
    setTransferItems((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row))
    );
  };

  const handleCreateDriver = () => {
    navigate(paths.dashboard.user.invite);
  };

  if (!storeId) {
    return (
      <DashboardContent maxWidth="xl">
        <Alert severity="warning">Select a store first to manage transfers.</Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Store Transfers</Typography>
        {canCreateTransfer && (
          <Button variant="contained" onClick={() => setOpenCreate(true)}>
            New transfer
          </Button>
        )}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label="Default driver (for assign)"
          value={assignedDriverId}
          onChange={(e) => setAssignedDriverId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">None</MenuItem>
          {(users || []).map((u) => (
            <MenuItem key={u.user_id} value={u.user_id}>
              {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" onClick={handleCreateDriver}>
          + Create driver
        </Button>
      </Stack>

      {kpis && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2">Total transfers</Typography>
              <Typography variant="h4">{kpis.total_transfers}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2">Open transfers</Typography>
              <Typography variant="h4">{kpis.open_transfers}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2">Discrepancy rate</Typography>
              <Typography variant="h4">{(kpis.discrepancy_rate * 100).toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Stack>
      )}

      <Card>
        <CardContent>
          {transfersLoading ? (
            <Typography>Loading transfers...</Typography>
          ) : !transfers.length ? (
            <Typography color="text.secondary">No transfers found for this store.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {transfers.map((transfer) => {
                const access = getTransferActionAccess({
                  userPermissions,
                  currentUserId: user?.user_id,
                  currentStoreId: storeId,
                  transfer,
                });
                const hasAnyAction =
                  access.canPack ||
                  access.canAssignDriver ||
                  access.canPickup ||
                  access.canInTransit ||
                  access.canDeliver ||
                  access.canReceive ||
                  access.canClose;

                return (
                  <Box
                    key={transfer.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => openDetail(transfer)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">{transfer.transfer_number}</Typography>
                      <Chip
                        size="small"
                        label={transfer.status}
                        color={STATUS_COLORS[transfer.status] || 'default'}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {storeNameById(transfer.source_store_id) || `#${transfer.source_store_id}`}{' '}
                      →{' '}
                      {storeNameById(transfer.destination_store_id) ||
                        `#${transfer.destination_store_id}`}{' '}
                      · {transfer.items?.length || 0} item(s)
                    </Typography>
                    {!hasAnyAction && transfer.status !== 'closed' && (
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                        Open for details — actions depend on your role and store.
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      <TransferDetailDrawer
        open={Boolean(detailTransferId)}
        onClose={() => setDetailTransferId(null)}
        transfer={drawerTransfer}
        storeId={storeId}
        storeNameById={storeNameById}
        productNameById={productNameById}
        userPermissions={userPermissions}
        currentUserId={user?.user_id}
        submitting={submitting}
        onAction={handleTransition}
        assignedDriverId={assignedDriverId}
        onCreateDriver={handleCreateDriver}
      />

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>New transfer order</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Source store"
              value={storeNameById(Number(storeId)) || storeId}
              disabled
            />
            <TextField
              select
              label="Destination store"
              value={destinationStoreId}
              onChange={(e) => setDestinationStoreId(e.target.value)}
            >
              {destinationOptions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.storeName}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="subtitle2" color="text.secondary">
              Items (batch transfer)
            </Typography>
            <Stack spacing={1.5}>
              {transferItems.map((row, index) => (
                <Stack key={`transfer-item-${index}`} direction="row" spacing={1.5}>
                  <Autocomplete
                    disablePortal
                    options={products || []}
                    value={(products || []).find((p) => Number(p.id) === Number(row.product_id)) || null}
                    onChange={(_, value) =>
                      updateItemRow(index, { product_id: value ? value.id : '' })
                    }
                    getOptionLabel={(option) =>
                      option?.name
                        ? `${option.name}${option?.sku ? ` (${option.sku})` : ''}`
                        : ''
                    }
                    isOptionEqualToValue={(option, value) => Number(option.id) === Number(value.id)}
                    filterOptions={(options, state) => {
                      const q = state.inputValue.trim().toLowerCase();
                      if (!q) return options;
                      return options.filter((opt) => {
                        const name = String(opt?.name || '').toLowerCase();
                        const sku = String(opt?.sku || '').toLowerCase();
                        const code = String(opt?.code || '').toLowerCase();
                        return name.includes(q) || sku.includes(q) || code.includes(q);
                      });
                    }}
                    sx={{ flex: 1 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={`Product ${index + 1}`}
                        placeholder="Search product name, SKU, or code"
                      />
                    )}
                  />
                  <TextField
                    label="Qty"
                    type="number"
                    value={row.requested_qty}
                    onChange={(e) => updateItemRow(index, { requested_qty: e.target.value })}
                    inputProps={{ min: 1 }}
                    sx={{ width: 120 }}
                  />
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => removeItemRow(index)}
                    disabled={transferItems.length <= 1}
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
              <Box>
                <Button variant="text" onClick={addItemRow}>
                  + Add another item
                </Button>
              </Box>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={submitting}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
