import { useMemo, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { paths } from 'src/routes/paths';
import { toast } from 'src/components/snackbar';
import { useGetProducts } from 'src/actions/product';
import { usePermissions } from 'src/hooks/use-permissions';
import {
  createConsignment,
  createConsignmentPartner,
  getConsignmentKpis,
  receiveConsignment,
  returnConsignment,
  useGetConsignment,
  useGetConsignmentPartners,
  useGetConsignments,
} from 'src/actions/consignment';

import { ConsignmentDetailDrawer } from '../consignment-detail-drawer';
import {
  CONSIGNMENT_STATUS_COLORS,
  formatItemProgress,
  getConsignmentStatusLabel,
  isActiveConsignment,
  isDoneConsignment,
} from 'src/utils/consignment-permissions';

function summarizeItems(row) {
  const direction = row.direction || 'borrowing';
  const names = (row.items || []).map((item) => {
    const progress = formatItemProgress(item, direction);
    return `${item.product_name} · ${progress}`;
  });
  return names.join(' · ') || `${(row.items || []).length} item(s)`;
}

export function ConsignmentListView({ storeId, storeParam }) {
  const navigate = useNavigate();
  const { userPermissions, hasPermission } = usePermissions();

  const [tab, setTab] = useState('borrowed');
  const [listFilter, setListFilter] = useState('active');
  const [openCreate, setOpenCreate] = useState(false);
  const [openPartner, setOpenPartner] = useState(false);
  const [goodsAlreadyHere, setGoodsAlreadyHere] = useState(false);
  const [showInlinePartner, setShowInlinePartner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [partnerId, setPartnerId] = useState('');
  const [returnDays, setReturnDays] = useState(7);
  const [items, setItems] = useState([
    {
      source_product_id: '',
      product_name: '',
      qty_sent: 1,
      sell_price: '',
      settlement_type: 'fixed_cost',
      agreed_cost: '',
      commission_percent: '',
    },
  ]);
  const [partnerForm, setPartnerForm] = useState({ name: '', phone: '', email: '' });

  const directionFilter = tab === 'borrowed' ? 'borrowing' : 'lending';
  const { consignments, consignmentsLoading, mutateConsignments } = useGetConsignments(
    storeId ? { store_id: Number(storeId), direction_filter: directionFilter, limit: 50 } : {}
  );
  const { consignment: detailConsignment, mutateConsignment } = useGetConsignment(detailId);
  const { partners, mutatePartners } = useGetConsignmentPartners();
  const { products } = useGetProducts(storeId);

  const canCreate =
    hasPermission('inventory.manage') || hasPermission('inventory.create');

  const drawerConsignment =
    detailConsignment || consignments.find((c) => c.id === detailId);

  const filteredConsignments = useMemo(() => {
    if (listFilter === 'active') {
      return consignments.filter(isActiveConsignment);
    }
    if (listFilter === 'done') {
      return consignments.filter(isDoneConsignment);
    }
    return consignments;
  }, [consignments, listFilter]);

  const refreshKpis = useCallback(async () => {
    try {
      const data = await getConsignmentKpis();
      setKpis(data);
    } catch {
      setKpis(null);
    }
  }, []);

  useEffect(() => {
    refreshKpis();
  }, [refreshKpis]);

  const reload = async () => {
    await mutateConsignments();
    if (detailId) await mutateConsignment();
    await refreshKpis();
  };

  const handleCreate = async () => {
    const isBorrowed = tab === 'borrowed';
    const normalized = items
      .map((row) => {
        const product = (products || []).find((p) => Number(p.id) === Number(row.source_product_id));
        const productName = row.product_name?.trim() || product?.name || '';
        return {
          source_product_id: isBorrowed ? null : row.source_product_id ? Number(row.source_product_id) : null,
          product_name: productName,
          qty_sent: Number(row.qty_sent),
          settlement_type: row.settlement_type || 'fixed_cost',
          agreed_cost:
            row.settlement_type !== 'percent'
              ? Number(row.agreed_cost || product?.costPrice || 0)
              : null,
          commission_percent:
            row.settlement_type === 'percent' ? Number(row.commission_percent || 0) : null,
          sell_price: Number(
            row.sell_price || (isBorrowed ? '' : product?.price) || 0
          ),
        };
      })
      .filter((row) => row.product_name && row.qty_sent > 0)
      .filter((row) => (isBorrowed ? row.sell_price > 0 : row.source_product_id));

    if (!partnerId || !storeId || !normalized.length) {
      toast.error(
        isBorrowed
          ? 'Select a partner, item name, sell price, and quantity.'
          : 'Select a partner and at least one product from your store.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await createConsignment({
        partner_id: Number(partnerId),
        holder_store_id: Number(storeId),
        owner_store_id: tab === 'lent' ? Number(storeId) : undefined,
        direction: tab === 'borrowed' ? 'borrowing' : 'lending',
        return_days: Number(returnDays),
        items: normalized,
      });

      if (goodsAlreadyHere && (tab === 'borrowed' || tab === 'lent')) {
        await receiveConsignment(created.id, {
          received_items: (created.items || []).map((item) => ({
            item_id: item.id,
            received_qty: item.qty_sent,
            damaged_qty: 0,
          })),
        });
        toast.success(
          tab === 'borrowed' ? 'Consignment received — ready to sell' : 'Items marked as sent'
        );
      } else {
        toast.success('Consignment created');
      }

      setOpenCreate(false);
      setGoodsAlreadyHere(false);
      await reload();
    } catch (err) {
      toast.error(err?.message || 'Failed to create consignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInlinePartnerSave = async () => {
    if (!partnerForm.name || !partnerForm.phone) {
      toast.error('Partner name and phone are required.');
      return;
    }
    setSubmitting(true);
    try {
      const saved = await createConsignmentPartner(partnerForm);
      toast.success('Partner added');
      setPartnerId(String(saved.id));
      setPartnerForm({ name: '', phone: '', email: '' });
      setShowInlinePartner(false);
      await mutatePartners();
    } catch (err) {
      toast.error(err?.message || 'Failed to save partner');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePartnerSave = async () => {
    if (!partnerForm.name || !partnerForm.phone) {
      toast.error('Partner name and phone are required.');
      return;
    }
    setSubmitting(true);
    try {
      await createConsignmentPartner(partnerForm);
      toast.success('Partner saved');
      setOpenPartner(false);
      setPartnerForm({ name: '', phone: '', email: '' });
      await mutatePartners();
    } catch (err) {
      toast.error(err?.message || 'Failed to save partner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrawerAction = async (action, row) => {
    setSubmitting(true);
    try {
      if (action === 'receive') {
        await receiveConsignment(row.id, {
          received_items: (row.items || []).map((item) => ({
            item_id: item.id,
            received_qty: Math.max(0, item.qty_sent - item.qty_received),
            damaged_qty: 0,
          })),
        });
        toast.success(row.direction === 'lending' ? 'Marked as sent' : 'Marked as received');
      } else if (action === 'return') {
        await returnConsignment(row.id, {
          returned_items: (row.items || [])
            .map((item) => ({
              item_id: item.id,
              return_qty: Math.max(0, item.qty_received - item.qty_sold - item.qty_returned),
              damaged_qty: 0,
            }))
            .filter((i) => i.return_qty > 0),
        });
        toast.success('Return recorded');
      }
      await reload();
    } catch (err) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const kpiCards = useMemo(
    () => [
      { label: 'Open', value: kpis?.open_consignments ?? '—' },
      { label: 'Overdue returns', value: kpis?.overdue_returns ?? '—' },
      { label: 'Owe partners', value: kpis?.unsettled_items ?? '—' },
      { label: 'Borrowed open', value: kpis?.borrowed_open ?? '—' },
      { label: 'Lent open', value: kpis?.lent_open ?? '—' },
    ],
    [kpis]
  );

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Consignment</Typography>
        <Stack direction="row" spacing={1}>
          {canCreate && (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  if (storeParam) {
                    navigate(paths.dashboard.reports.partners(storeParam));
                  } else {
                    setOpenPartner(true);
                  }
                }}
              >
                Partners
              </Button>
              <Button variant="contained" onClick={() => setOpenCreate(true)}>
                New consignment
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        {kpiCards.map((card) => (
          <Card key={card.label} sx={{ minWidth: 140 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="h6">{card.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
        <Tab value="borrowed" label="Borrowed from others" />
        <Tab value="lent" label="Lent to others" />
      </Tabs>

      <Tabs
        value={listFilter}
        onChange={(_, v) => setListFilter(v)}
        sx={{ mb: 2 }}
        textColor="inherit"
        indicatorColor="primary"
      >
        <Tab value="active" label="Active" />
        <Tab value="done" label="Done" />
      </Tabs>

      {consignmentsLoading && <Alert severity="info">Loading…</Alert>}

      <Stack spacing={1}>
        {filteredConsignments.map((row) => (
          <Card
            key={row.id}
            sx={{ cursor: 'pointer' }}
            onClick={() => setDetailId(row.id)}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <Typography variant="subtitle1">{row.consignment_number}</Typography>
                <Chip
                  size="small"
                  label={getConsignmentStatusLabel(row.status, row.direction)}
                  color={CONSIGNMENT_STATUS_COLORS[row.status] || 'default'}
                />
                {row.partner_name && (
                  <Chip size="small" variant="outlined" label={row.partner_name} />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {summarizeItems(row)}
              </Typography>
              {row.return_due_date && isActiveConsignment(row) && (
                <Typography variant="caption" color="text.secondary">
                  Return by {new Date(row.return_due_date).toLocaleDateString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
        {!consignmentsLoading && !filteredConsignments.length && (
          <Alert severity="info">
            {listFilter === 'active' ? 'No active consignments.' : 'No completed consignments yet.'}
          </Alert>
        )}
      </Stack>

      <ConsignmentDetailDrawer
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        consignment={drawerConsignment}
        storeId={storeId}
        submitting={submitting}
        onAction={handleDrawerAction}
        userPermissions={userPermissions}
      />

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {tab === 'lent' ? 'Record items lent to partner' : 'Request items from partner'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                select
                label="Partner"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                fullWidth
                helperText={
                  tab === 'lent'
                    ? 'Who borrowed these items from you'
                    : 'Who you are borrowing from'
                }
              >
                {(partners || []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button size="small" variant="outlined" onClick={() => setShowInlinePartner((v) => !v)}>
                {showInlinePartner ? 'Cancel' : 'New'}
              </Button>
            </Stack>
            <Collapse in={showInlinePartner}>
              <Stack spacing={1.5} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <TextField
                  label="Business name"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Phone"
                  value={partnerForm.phone}
                  onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  fullWidth
                  size="small"
                />
                <Button size="small" variant="contained" disabled={submitting} onClick={handleInlinePartnerSave}>
                  Save & use partner
                </Button>
              </Stack>
            </Collapse>
            {(tab === 'borrowed' || tab === 'lent') && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={goodsAlreadyHere}
                    onChange={(e) => setGoodsAlreadyHere(e.target.checked)}
                  />
                }
                label={
                  tab === 'borrowed'
                    ? 'Goods already here — receive immediately'
                    : 'Already sent — mark as sent now'
                }
              />
            )}
            <TextField
              label="Return days"
              type="number"
              value={returnDays}
              onChange={(e) => setReturnDays(e.target.value)}
              fullWidth
              helperText="Unsold items should be returned within this many days"
            />
            {items.map((row, idx) => (
              <Stack key={idx} spacing={1} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" spacing={1}>
                  {tab === 'borrowed' ? (
                    <Autocomplete
                      sx={{ flex: 2 }}
                      freeSolo
                      options={products || []}
                      getOptionLabel={(o) => (typeof o === 'string' ? o : o.name || '')}
                      inputValue={row.product_name}
                      onInputChange={(_, value) => {
                        const next = [...items];
                        next[idx] = { ...next[idx], product_name: value, source_product_id: '' };
                        setItems(next);
                      }}
                      onChange={(_, v) => {
                        const next = [...items];
                        if (v && typeof v === 'object') {
                          next[idx] = {
                            ...next[idx],
                            product_name: v.name || '',
                            sell_price: v.price != null ? String(v.price) : next[idx].sell_price,
                            agreed_cost:
                              v.costPrice != null ? String(v.costPrice) : next[idx].agreed_cost,
                            source_product_id: '',
                          };
                        }
                        setItems(next);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Item name"
                          helperText="Type any item — it does not need to be in your catalog"
                        />
                      )}
                    />
                  ) : (
                    <Autocomplete
                      sx={{ flex: 2 }}
                      options={products || []}
                      getOptionLabel={(o) => o.name || ''}
                      value={(products || []).find((p) => Number(p.id) === Number(row.source_product_id)) || null}
                      onChange={(_, v) => {
                        const next = [...items];
                        next[idx] = {
                          ...next[idx],
                          source_product_id: v?.id || '',
                          product_name: v?.name || '',
                          agreed_cost: v?.costPrice != null ? String(v.costPrice) : next[idx].agreed_cost,
                        };
                        setItems(next);
                      }}
                      renderInput={(params) => <TextField {...params} label="Product from your store" />}
                    />
                  )}
                  <TextField
                    label="Qty"
                    type="number"
                    value={row.qty_sent}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], qty_sent: e.target.value };
                      setItems(next);
                    }}
                    sx={{ width: 90 }}
                  />
                </Stack>
                <Stack direction="row" spacing={1}>
                  {tab === 'borrowed' && (
                    <TextField
                      label="Sell price"
                      type="number"
                      value={row.sell_price}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx] = { ...next[idx], sell_price: e.target.value };
                        setItems(next);
                      }}
                      sx={{ flex: 1 }}
                      helperText="Price when selling to your customer"
                    />
                  )}
                  <TextField
                    select
                    label="Settlement"
                    value={row.settlement_type || 'fixed_cost'}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], settlement_type: e.target.value };
                      setItems(next);
                    }}
                    sx={{ flex: 1 }}
                  >
                    <MenuItem value="fixed_cost">Fixed cost to owner</MenuItem>
                    <MenuItem value="percent">Seller commission %</MenuItem>
                  </TextField>
                  {row.settlement_type === 'percent' ? (
                    <TextField
                      label="Commission %"
                      type="number"
                      value={row.commission_percent}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx] = { ...next[idx], commission_percent: e.target.value };
                        setItems(next);
                      }}
                      sx={{ flex: 1 }}
                    />
                  ) : (
                    <TextField
                      label="Cost per unit (owed to owner)"
                      type="number"
                      value={row.agreed_cost}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx] = { ...next[idx], agreed_cost: e.target.value };
                        setItems(next);
                      }}
                      sx={{ flex: 1 }}
                    />
                  )}
                </Stack>
              </Stack>
            ))}
            <Button
              size="small"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    source_product_id: '',
                    product_name: '',
                    qty_sent: 1,
                    sell_price: '',
                    settlement_type: 'fixed_cost',
                    agreed_cost: '',
                    commission_percent: '',
                  },
                ])
              }
            >
              Add line
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" disabled={submitting} onClick={handleCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPartner} onClose={() => setOpenPartner(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add partner</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Business name"
              value={partnerForm.name}
              onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={partnerForm.phone}
              onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={partnerForm.email}
              onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPartner(false)}>Cancel</Button>
          <Button variant="contained" disabled={submitting} onClick={handlePartnerSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
