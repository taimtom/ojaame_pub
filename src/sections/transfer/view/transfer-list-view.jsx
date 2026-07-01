import { useMemo, useEffect, useCallback, useState } from 'react';

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
import { useGetProducts } from 'src/actions/product';
import { useGetStores } from 'src/actions/store';
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
  updateTransferOrder,
  useGetDrivers,
  useGetTransfer,
  useGetTransfers,
} from 'src/actions/transfer';

import { TransferDetailDrawer } from '../transfer-detail-drawer';
import { TransferDriversDialog } from '../transfer-drivers-dialog';

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
  const { user } = useAuthContext();
  const { userPermissions, hasPermission } = usePermissions();

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [editItems, setEditItems] = useState([{ product_id: '', requested_qty: 1 }]);
  const [editDriverId, setEditDriverId] = useState('');
  const [openDriversDialog, setOpenDriversDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [transferItems, setTransferItems] = useState([{ product_id: '', requested_qty: 1 }]);
  const [sourceStoreId, setSourceStoreId] = useState(storeId);
  const [destinationStoreId, setDestinationStoreId] = useState('');
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [createDriverId, setCreateDriverId] = useState('');
  const [detailTransferId, setDetailTransferId] = useState(null);

  const { stores } = useGetStores();
  const { drivers } = useGetDrivers();
  const { products } = useGetProducts(storeId);
  const { products: sourceProducts } = useGetProducts(sourceStoreId);
  const { products: editSourceProducts } = useGetProducts(editingTransfer?.source_store_id);
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
    () => (stores || []).filter((store) => Number(store.id) !== Number(sourceStoreId)),
    [stores, sourceStoreId]
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
    setSourceStoreId(storeId);
  }, [storeId]);

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

    if (!sourceStoreId || !destinationStoreId || !normalizedRows.length) {
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
      const created = await createTransferOrder({
        source_store_id: Number(sourceStoreId),
        destination_store_id: Number(destinationStoreId),
        priority: 'normal',
        assigned_driver_id: createDriverId ? Number(createDriverId) : null,
        items: itemsPayload,
      });
      toast.success('Transfer order created.');
      setOpenCreate(false);
      setTransferItems([{ product_id: '', requested_qty: 1 }]);
      setSourceStoreId(storeId);
      setDestinationStoreId('');
      setCreateDriverId('');
      await reloadData();
      if (created?.id) {
        setDetailTransferId(created.id);
      }
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
      edit: access.canEdit,
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
      if (action === 'edit') {
        openEditModal(transfer);
        setSubmitting(false);
        return;
      }
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
        await assignTransferDriver(transfer.id, { driver_id: Number(assignedDriverId) });
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

  const handleSourceStoreChange = (newSourceId) => {
    setSourceStoreId(newSourceId);
    setTransferItems([{ product_id: '', requested_qty: 1 }]);
    if (Number(destinationStoreId) === Number(newSourceId)) {
      setDestinationStoreId('');
    }
  };

  const openEditModal = (transfer) => {
    setEditingTransfer(transfer);
    setEditItems(
      (transfer.items || []).length
        ? transfer.items.map((item) => ({
            product_id: item.product_id,
            requested_qty: item.requested_qty,
          }))
        : [{ product_id: '', requested_qty: 1 }]
    );
    setEditDriverId(
      transfer.assigned_driver_id ? String(transfer.assigned_driver_id) : ''
    );
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!editingTransfer) return;

    const normalizedRows = editItems
      .filter((row) => row.product_id)
      .map((row) => ({
        product_id: Number(row.product_id),
        requested_qty: Number(row.requested_qty),
      }))
      .filter((row) => row.product_id && row.requested_qty > 0);

    if (!normalizedRows.length) {
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
      await updateTransferOrder(editingTransfer.id, {
        assigned_driver_id: editDriverId ? Number(editDriverId) : null,
        items: itemsPayload,
      });
      toast.success('Transfer order updated.');
      setOpenEdit(false);
      setEditingTransfer(null);
      await reloadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update transfer order.');
    } finally {
      setSubmitting(false);
    }
  };

  const addEditItemRow = () => {
    setEditItems((prev) => [...prev, { product_id: '', requested_qty: 1 }]);
  };

  const removeEditItemRow = (index) => {
    setEditItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const updateEditItemRow = (index, patch) => {
    setEditItems((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row))
    );
  };

  const openCreateModal = () => {
    setSourceStoreId(storeId);
    setTransferItems([{ product_id: '', requested_qty: 1 }]);
    setDestinationStoreId('');
    setCreateDriverId(assignedDriverId || '');
    setOpenCreate(true);
  };

  const openDriversManager = () => {
    setOpenDriversDialog(true);
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
          <Button variant="contained" onClick={openCreateModal}>
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
          {(drivers || []).map((driver) => (
            <MenuItem key={driver.id} value={driver.id}>
              {driver.name} ({driver.phone})
            </MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" onClick={openDriversManager}>
          Manage drivers
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
                  access.canEdit ||
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
        onManageDrivers={openDriversManager}
      />

      <TransferDriversDialog
        open={openDriversDialog}
        onClose={() => setOpenDriversDialog(false)}
      />

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>New transfer order</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Source store"
              value={sourceStoreId}
              onChange={(e) => handleSourceStoreChange(e.target.value)}
            >
              {(stores || []).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.storeName}
                </MenuItem>
              ))}
            </TextField>
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
            <TextField
              select
              label="Driver (optional)"
              value={createDriverId}
              onChange={(e) => setCreateDriverId(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {(drivers || []).map((driver) => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone})
                </MenuItem>
              ))}
            </TextField>
            <Button variant="text" onClick={openDriversManager} sx={{ alignSelf: 'flex-start' }}>
              Manage drivers
            </Button>
            <Typography variant="subtitle2" color="text.secondary">
              Items (batch transfer)
            </Typography>
            <Stack spacing={1.5}>
              {transferItems.map((row, index) => (
                <Stack key={`transfer-item-${index}`} direction="row" spacing={1.5}>
                  <Autocomplete
                    disablePortal
                    options={sourceProducts || []}
                    value={(sourceProducts || []).find((p) => Number(p.id) === Number(row.product_id)) || null}
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

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit transfer order</DialogTitle>
        <DialogContent>
          {editingTransfer && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Source store"
                value={storeNameById(editingTransfer.source_store_id) || editingTransfer.source_store_id}
                disabled
              />
              <TextField
                label="Destination store"
                value={
                  storeNameById(editingTransfer.destination_store_id) ||
                  editingTransfer.destination_store_id
                }
                disabled
              />
              <TextField
                select
                label="Driver (optional)"
                value={editDriverId}
                onChange={(e) => setEditDriverId(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {(drivers || []).map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.name} ({driver.phone})
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="text" onClick={openDriversManager} sx={{ alignSelf: 'flex-start' }}>
                Manage drivers
              </Button>
              {['packed', 'picked_up'].includes(editingTransfer.status) && (
                <Alert severity="info">
                  Changing items will reset this transfer to &quot;created&quot; and it will need to be packed again.
                </Alert>
              )}
              <Typography variant="subtitle2" color="text.secondary">
                Items (batch transfer)
              </Typography>
              <Stack spacing={1.5}>
                {editItems.map((row, index) => (
                  <Stack key={`edit-item-${index}`} direction="row" spacing={1.5}>
                    <Autocomplete
                      disablePortal
                      options={editSourceProducts || []}
                      value={
                        (editSourceProducts || []).find(
                          (p) => Number(p.id) === Number(row.product_id)
                        ) || null
                      }
                      onChange={(_, value) =>
                        updateEditItemRow(index, { product_id: value ? value.id : '' })
                      }
                      getOptionLabel={(option) =>
                        option?.name
                          ? `${option.name}${option?.sku ? ` (${option.sku})` : ''}`
                          : ''
                      }
                      isOptionEqualToValue={(option, value) =>
                        Number(option.id) === Number(value.id)
                      }
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
                      onChange={(e) =>
                        updateEditItemRow(index, { requested_qty: e.target.value })
                      }
                      inputProps={{ min: 1 }}
                      sx={{ width: 120 }}
                    />
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => removeEditItemRow(index)}
                      disabled={editItems.length <= 1}
                    >
                      Remove
                    </Button>
                  </Stack>
                ))}
                <Box>
                  <Button variant="text" onClick={addEditItemRow}>
                    + Add another item
                  </Button>
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={submitting}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
