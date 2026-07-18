import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useCurrencyFormat } from 'src/hooks/use-currency-format';
import { usePermissions } from 'src/hooks/use-permissions';

import axiosInstance from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetPaymentMethods } from 'src/actions/paymentmethod';
import {
  createRoomBooking,
  cancelRoomBooking,
  checkInRoomBooking,
  fetchRoomAvailability,
  fetchRoomBlockedDates,
} from 'src/actions/rooms';

import { toast } from 'src/components/snackbar';

import { FrontDeskNav } from '../front-desk-nav';

// ----------------------------------------------------------------------

const STATUS_BAR = {
  held: 'warning.light',
  confirmed: 'info.main',
  checked_in: 'warning.dark',
};

const DAY_W = 44;
const LABEL_W = 120;

function getStoreIdFromStorage() {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const { id } = JSON.parse(raw);
      return id ? Number(id) : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function nightsBetween(checkIn, checkOut) {
  return Math.max(dayjs(checkOut).diff(dayjs(checkIn), 'day'), 1);
}

function rangeHasBlocked(blockedSet, checkInISO, checkOutISO) {
  let d = dayjs(checkInISO);
  const end = dayjs(checkOutISO);
  while (d.isBefore(end, 'day')) {
    if (blockedSet.has(d.format('YYYY-MM-DD'))) return true;
    d = d.add(1, 'day');
  }
  return false;
}

function firstOpenNight(blockedSet, fromDayjs = dayjs()) {
  let d = fromDayjs.startOf('day');
  for (let i = 0; i < 400; i += 1) {
    const key = d.format('YYYY-MM-DD');
    if (!blockedSet.has(key)) return key;
    d = d.add(1, 'day');
  }
  return fromDayjs.format('YYYY-MM-DD');
}

// ----------------------------------------------------------------------

export function FrontDeskCalendarView() {
  const storeId = getStoreIdFromStorage();
  const { currencySymbol } = useCurrencyFormat();
  const { paymentMethods } = useGetPaymentMethods(storeId);
  const { hasPermission } = usePermissions();
  const canManageBookings = hasPermission('rooms.manage');

  const [fromDate, setFromDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [drag, setDrag] = useState(null); // { roomId, startISO, endISO }
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [blockedSet, setBlockedSet] = useState(() => new Set());

  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [checkIn, setCheckIn] = useState(fromDate);
  const [checkOut, setCheckOut] = useState(dayjs(fromDate).add(1, 'day').format('YYYY-MM-DD'));
  const [rate, setRate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [bookingStatus, setBookingStatus] = useState('confirmed');
  const [paymentMethodId, setPaymentMethodId] = useState('');

  const days = useMemo(() => {
    const start = dayjs(fromDate);
    const end = dayjs(data?.to_date || start.add(13, 'day'));
    const list = [];
    let d = start;
    while (d.isBefore(end, 'day')) {
      list.push(d.format('YYYY-MM-DD'));
      d = d.add(1, 'day');
    }
    return list;
  }, [fromDate, data?.to_date]);

  const load = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const to = dayjs(fromDate).add(14, 'day').format('YYYY-MM-DD');
      const res = await fetchRoomAvailability(storeId, {
        from_date: fromDate,
        to_date: to,
      });
      setData(res);
    } catch (err) {
      toast.error(err.message || 'Failed to load availability.');
    } finally {
      setLoading(false);
    }
  }, [storeId, fromDate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!storeId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/customers/list/', {
          params: { store_id: storeId, limit: 200 },
        });
        if (!cancelled) {
          const raw = res.data;
          setCustomers(raw?.customers || raw?.items || (Array.isArray(raw) ? raw : []));
        }
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  useEffect(() => {
    if (paymentMethods?.length && !paymentMethodId) {
      setPaymentMethodId(String(paymentMethods[0].id));
    }
  }, [paymentMethods, paymentMethodId]);

  const openBook = async (room, startISO, endISO) => {
    setSelectedRoom(room);
    setRate(String(room.base_price_per_night ?? ''));
    setDeposit('');
    setBookingStatus('confirmed');
    setCustomer(null);
    setCustomerName('');
    setBookingOpen(true);
    try {
      const blocked = await fetchRoomBlockedDates(room.id, storeId, {
        from_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        to_date: dayjs().add(180, 'day').format('YYYY-MM-DD'),
      });
      const next = new Set((blocked.blocked_dates || []).map((d) => String(d).slice(0, 10)));
      setBlockedSet(next);
      const start = startISO || firstOpenNight(next, dayjs(fromDate));
      let end = endISO || dayjs(start).add(1, 'day').format('YYYY-MM-DD');
      if (!dayjs(end).isAfter(dayjs(start), 'day')) {
        end = dayjs(start).add(1, 'day').format('YYYY-MM-DD');
      }
      if (rangeHasBlocked(next, start, end)) {
        end = dayjs(start).add(1, 'day').format('YYYY-MM-DD');
      }
      setCheckIn(start);
      setCheckOut(end);
    } catch (err) {
      toast.error(err.message || 'Could not load booked dates.');
      setCheckIn(startISO || fromDate);
      setCheckOut(endISO || dayjs(startISO || fromDate).add(1, 'day').format('YYYY-MM-DD'));
    }
  };

  const handleCellMouseDown = (room, dayISO) => {
    if (room.status === 'blocked') return;
    setDrag({ roomId: room.id, startISO: dayISO, endISO: dayjs(dayISO).add(1, 'day').format('YYYY-MM-DD') });
  };

  const handleCellMouseEnter = (room, dayISO) => {
    if (!drag || drag.roomId !== room.id) return;
    const start = dayjs(drag.startISO);
    const cur = dayjs(dayISO);
    const end = cur.isBefore(start) ? start.add(1, 'day') : cur.add(1, 'day');
    setDrag({ ...drag, endISO: end.format('YYYY-MM-DD') });
  };

  const handleCellMouseUp = (room) => {
    if (!drag || drag.roomId !== room.id) {
      setDrag(null);
      return;
    }
    const { startISO, endISO } = drag;
    setDrag(null);
    openBook(room, startISO, endISO);
  };

  const handleCreateBooking = async () => {
    if (!selectedRoom) return;
    if (!customer && !customerName.trim()) {
      toast.error('Select or enter a guest name.');
      return;
    }
    if (rangeHasBlocked(blockedSet, checkIn, checkOut)) {
      toast.error('Selected dates overlap an existing booking.');
      return;
    }
    const depositNum = Number(deposit) || 0;
    const rateNum = Number(rate) || 0;
    setBusy(true);
    try {
      await createRoomBooking({
        store_id: storeId,
        room_id: selectedRoom.id,
        customer_id: customer?.id || null,
        customer_name: customer ? null : customerName.trim(),
        check_in_date: checkIn,
        check_out_date: checkOut,
        rate_per_night: rateNum,
        deposit_amount: depositNum,
        status: bookingStatus,
        payments:
          depositNum > 0 && paymentMethodId
            ? [{ payment_method_id: Number(paymentMethodId), amount: depositNum }]
            : null,
      });
      toast.success('Booking created.');
      setBookingOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to create booking.');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckIn = async (booking) => {
    setBusy(true);
    try {
      await checkInRoomBooking(booking.id, storeId);
      toast.success('Checked in.');
      await load();
    } catch (err) {
      toast.error(err.message || 'Check-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (booking) => {
    if (!canManageBookings) {
      toast.error('Only a store manager, accountant, or merchant can cancel bookings.');
      return;
    }
    if (booking.status === 'checked_in') return;
    setBusy(true);
    try {
      await cancelRoomBooking(booking.id, { store_id: storeId });
      toast.success('Booking cancelled.');
      await load();
    } catch (err) {
      toast.error(err.message || 'Cancel failed.');
    } finally {
      setBusy(false);
    }
  };

  const barStyle = (booking) => {
    let vs = -1;
    let ve = -1;
    days.forEach((d, i) => {
      const night = dayjs(d);
      if (
        !night.isBefore(dayjs(booking.check_in_date), 'day') &&
        night.isBefore(dayjs(booking.check_out_date), 'day')
      ) {
        if (vs < 0) vs = i;
        ve = i + 1;
      }
    });
    if (vs < 0) return null;
    return {
      left: LABEL_W + vs * DAY_W + 4,
      width: Math.max((ve - vs) * DAY_W - 8, 24),
      bgcolor: STATUS_BAR[booking.status] || 'grey.500',
    };
  };

  const nights = nightsBetween(checkIn, checkOut);
  const stayTotal = (Number(rate) || 0) * nights;
  const depositNum = Number(deposit) || 0;

  if (!storeId) {
    return (
      <DashboardContent>
        <Alert severity="warning">Select a store to use the availability calendar.</Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Availability calendar
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Click or drag across free days to book a room
      </Typography>
      <FrontDeskNav />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
        <DatePicker
          label="From"
          value={dayjs(fromDate)}
          onChange={(v) => v && setFromDate(v.format('YYYY-MM-DD'))}
          slotProps={{ textField: { size: 'small' } }}
        />
        <Button variant="contained" onClick={load} disabled={loading}>
          Refresh
        </Button>
        <Typography variant="caption" color="text.secondary">
          Held / confirmed / in-house shown as bars · drag empty cells to book
        </Typography>
      </Stack>

      {loading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            overflowX: 'auto',
            border: (t) => `1px solid ${t.palette.divider}`,
            borderRadius: 1,
            userSelect: 'none',
          }}
        >
          {/* header */}
          <Box sx={{ display: 'flex', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 2 }}>
            <Box
              sx={{
                width: LABEL_W,
                minWidth: LABEL_W,
                p: 1,
                borderRight: (t) => `1px solid ${t.palette.divider}`,
                fontWeight: 600,
              }}
            >
              Room
            </Box>
            {days.map((d) => (
              <Box
                key={d}
                sx={{
                  width: DAY_W,
                  minWidth: DAY_W,
                  textAlign: 'center',
                  py: 0.75,
                  borderRight: (t) => `1px solid ${t.palette.divider}`,
                  bgcolor: dayjs(d).isSame(dayjs(), 'day') ? 'action.selected' : undefined,
                }}
              >
                <Typography variant="caption" display="block">
                  {dayjs(d).format('ddd')}
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  {dayjs(d).format('D')}
                </Typography>
              </Box>
            ))}
          </Box>

          {(data?.rooms || []).map((room) => (
            <Box
              key={room.id}
              sx={{
                display: 'flex',
                position: 'relative',
                borderTop: (t) => `1px solid ${t.palette.divider}`,
                minHeight: 48,
                opacity: room.status === 'blocked' ? 0.55 : 1,
              }}
            >
              <Box
                sx={{
                  width: LABEL_W,
                  minWidth: LABEL_W,
                  p: 1,
                  borderRight: (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <Typography variant="subtitle2">{room.code}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {room.room_type_name}
                </Typography>
              </Box>
              {days.map((d) => {
                const inDrag =
                  drag &&
                  drag.roomId === room.id &&
                  !dayjs(d).isBefore(dayjs(drag.startISO), 'day') &&
                  dayjs(d).isBefore(dayjs(drag.endISO), 'day');
                return (
                  <Box
                    key={`${room.id}-${d}`}
                    onMouseDown={() => handleCellMouseDown(room, d)}
                    onMouseEnter={() => handleCellMouseEnter(room, d)}
                    onMouseUp={() => handleCellMouseUp(room)}
                    sx={{
                      width: DAY_W,
                      minWidth: DAY_W,
                      borderRight: (t) => `1px solid ${t.palette.divider}`,
                      cursor: room.status === 'blocked' ? 'not-allowed' : 'crosshair',
                      bgcolor: inDrag ? 'primary.lighter' : undefined,
                      '&:hover':
                        room.status === 'blocked'
                          ? undefined
                          : { bgcolor: 'action.hover' },
                    }}
                  />
                );
              })}
              {(room.bookings || []).map((b) => {
                const style = barStyle(b);
                if (!style) return null;
                return (
                  <Tooltip
                    key={b.id}
                    title={`${b.customer_name || 'Guest'} · ${b.status} · ${b.check_in_date} → ${b.check_out_date}`}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        height: 28,
                        borderRadius: 0.75,
                        px: 0.75,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'common.white',
                        fontSize: 11,
                        fontWeight: 600,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        zIndex: 1,
                        cursor: 'pointer',
                        ...style,
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (['held', 'confirmed'].includes(b.status)) {
                          // eslint-disable-next-line no-alert
                          const choice = window.confirm(
                            `${b.customer_name || 'Guest'}\nCheck in now? (Cancel = dismiss, OK = check in)\nUse Cancel booking from Board for cancellations.`
                          );
                          if (choice) handleCheckIn(b);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!canManageBookings) {
                          toast.error('Only a store manager, accountant, or merchant can cancel bookings.');
                          return;
                        }
                        if (['held', 'confirmed'].includes(b.status)) {
                          handleCancel(b);
                        }
                      }}
                    >
                      {b.customer_name || b.booking_number}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Book room {selectedRoom?.code}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={customers}
              getOptionLabel={(o) => o.name || ''}
              value={customer}
              onChange={(_, v) => {
                setCustomer(v);
                if (v) setCustomerName('');
              }}
              renderInput={(params) => <TextField {...params} label="Guest (existing)" />}
            />
            {!customer && (
              <TextField
                label="Or new guest name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DatePicker
                label="Check-in"
                value={dayjs(checkIn)}
                onChange={(v) => v && setCheckIn(v.format('YYYY-MM-DD'))}
                shouldDisableDate={(day) => blockedSet.has(day.format('YYYY-MM-DD'))}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="Check-out"
                value={dayjs(checkOut)}
                onChange={(v) => v && setCheckOut(v.format('YYYY-MM-DD'))}
                shouldDisableDate={(day) => {
                  if (!dayjs(day).isAfter(dayjs(checkIn), 'day')) return true;
                  return rangeHasBlocked(blockedSet, checkIn, day.format('YYYY-MM-DD'));
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                type="number"
                label={`Rate / night (${currencySymbol})`}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
              <TextField
                fullWidth
                type="number"
                label={`Deposit (${currencySymbol})`}
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {nights} night(s) · {fCurrency(stayTotal)}
            </Typography>
            <TextField
              select
              label="Status"
              value={bookingStatus}
              onChange={(e) => setBookingStatus(e.target.value)}
            >
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="held">Held</MenuItem>
            </TextField>
            {depositNum > 0 && (
              <TextField
                select
                label="Deposit payment method"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
              >
                {(paymentMethods || []).map((pm) => (
                  <MenuItem key={pm.id} value={String(pm.id)}>
                    {pm.issuer || pm.method_type || `Method #${pm.id}`}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBooking} disabled={busy}>
            Save booking
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
