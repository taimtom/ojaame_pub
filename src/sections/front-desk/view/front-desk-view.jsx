import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useCurrencyFormat } from 'src/hooks/use-currency-format';

import axiosInstance from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetPaymentMethods } from 'src/actions/paymentmethod';
import {
  fetchRoomBoard,
  moveRoomBooking,
  cancelRoomBooking,
  createRoomBooking,
  markRoomAvailable,
  checkInRoomBooking,
  checkOutRoomBooking,
  fetchRoomBlockedDates,
  addRoomBookingDeposit,
  earlyCheckoutRoomBooking,
} from 'src/actions/rooms';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  available: 'success',
  booked: 'info',
  occupied: 'warning',
  dirty: 'error',
  blocked: 'default',
};

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

function toISODate(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return dayjs(value).format('YYYY-MM-DD');
}

function nightsBetween(checkIn, checkOut) {
  const a = dayjs(checkIn);
  const b = dayjs(checkOut);
  const days = b.diff(a, 'day');
  return Math.max(days, 1);
}

function bookingBalance(booking) {
  if (!booking) return 0;
  return Math.max(0, Number(booking.total_amount || 0) - Number(booking.deposit_amount || 0));
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

function rangeHasBlocked(blockedSet, checkInISO, checkOutISO) {
  let d = dayjs(checkInISO);
  const end = dayjs(checkOutISO);
  while (d.isBefore(end, 'day')) {
    if (blockedSet.has(d.format('YYYY-MM-DD'))) return true;
    d = d.add(1, 'day');
  }
  return false;
}

function StatChip({ label, value, color }) {
  return (
    <Chip
      color={color || 'default'}
      variant="soft"
      label={`${label}: ${value}`}
      sx={{ fontWeight: 600 }}
    />
  );
}

// ----------------------------------------------------------------------

export function FrontDeskView() {
  const storeId = getStoreIdFromStorage();
  const { currencySymbol } = useCurrencyFormat();
  const { paymentMethods } = useGetPaymentMethods(storeId);

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [earlyOpen, setEarlyOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [checkIn, setCheckIn] = useState(toISODate(dayjs()));
  const [checkOut, setCheckOut] = useState(toISODate(dayjs().add(1, 'day')));
  const [rate, setRate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [bookingStatus, setBookingStatus] = useState('confirmed');
  const [notes, setNotes] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [moveToRoomId, setMoveToRoomId] = useState('');
  const [blockedSet, setBlockedSet] = useState(() => new Set());
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [earlyOutDate, setEarlyOutDate] = useState(toISODate(dayjs()));
  const [refundAmount, setRefundAmount] = useState('');
  const [depositTargetBooking, setDepositTargetBooking] = useState(null);

  const loadBoard = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchRoomBoard(storeId);
      setBoard(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load front desk board.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

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
          const list = raw?.customers || raw?.items || (Array.isArray(raw) ? raw : []);
          setCustomers(list);
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

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const rateNum = Number(rate) || 0;
  const stayTotal = rateNum * nights;
  const depositNum = Number(deposit) || 0;

  const earlyNights = useMemo(() => {
    const booking = selectedRoom?.current_booking;
    if (!booking || !earlyOutDate) return 1;
    return nightsBetween(booking.check_in_date, earlyOutDate);
  }, [selectedRoom, earlyOutDate]);

  const earlyStayTotal = useMemo(() => {
    const booking = selectedRoom?.current_booking;
    if (!booking) return 0;
    return Number(booking.rate_per_night || 0) * earlyNights;
  }, [selectedRoom, earlyNights]);

  const earlyBalance = useMemo(() => {
    const booking = selectedRoom?.current_booking;
    if (!booking) return 0;
    return Math.max(0, earlyStayTotal - Number(booking.deposit_amount || 0));
  }, [selectedRoom, earlyStayTotal]);

  const earlyExcess = useMemo(() => {
    const booking = selectedRoom?.current_booking;
    if (!booking) return 0;
    return Math.max(0, Number(booking.deposit_amount || 0) - earlyStayTotal);
  }, [selectedRoom, earlyStayTotal]);

  const refundNum = Number(refundAmount) || 0;

  const loadBlockedDates = async (room) => {
    if (!room || !storeId) {
      setBlockedSet(new Set());
      return new Set();
    }
    setBlockedLoading(true);
    try {
      const data = await fetchRoomBlockedDates(room.id, storeId, {
        from_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        to_date: dayjs().add(180, 'day').format('YYYY-MM-DD'),
      });
      const next = new Set(
        (data.blocked_dates || []).map((d) => (typeof d === 'string' ? d.slice(0, 10) : toISODate(d)))
      );
      setBlockedSet(next);
      return next;
    } catch (err) {
      toast.error(err.message || 'Could not load booked dates.');
      setBlockedSet(new Set());
      return new Set();
    } finally {
      setBlockedLoading(false);
    }
  };

  const openBookingForRoom = async (room) => {
    setSelectedRoom(room);
    setRate(String(room.base_price_per_night ?? ''));
    setDeposit('');
    setBookingStatus('confirmed');
    setNotes('');
    setCustomer(null);
    setCustomerName('');
    setBookingOpen(true);

    const blocked = await loadBlockedDates(room);
    const start = firstOpenNight(blocked, dayjs());
    let end = dayjs(start).add(1, 'day').format('YYYY-MM-DD');
    // Find a free checkout night (range [start, end) free)
    for (let i = 0; i < 30 && rangeHasBlocked(blocked, start, end); i += 1) {
      end = dayjs(end).add(1, 'day').format('YYYY-MM-DD');
    }
    // If still blocked, just set checkout to next day after first free night
    if (rangeHasBlocked(blocked, start, end)) {
      end = dayjs(start).add(1, 'day').format('YYYY-MM-DD');
    }
    setCheckIn(start);
    setCheckOut(end);
  };

  const shouldDisableCheckIn = (day) => {
    if (!day) return false;
    return blockedSet.has(day.format('YYYY-MM-DD'));
  };

  const shouldDisableCheckOut = (day) => {
    if (!day || !checkIn) return false;
    const iso = day.format('YYYY-MM-DD');
    if (!dayjs(iso).isAfter(dayjs(checkIn), 'day')) return true;
    return rangeHasBlocked(blockedSet, checkIn, iso);
  };

  const handleCheckInChange = (value) => {
    if (!value) return;
    const nextIn = value.format('YYYY-MM-DD');
    setCheckIn(nextIn);
    if (!dayjs(checkOut).isAfter(dayjs(nextIn), 'day') || rangeHasBlocked(blockedSet, nextIn, checkOut)) {
      let end = dayjs(nextIn).add(1, 'day');
      for (let i = 0; i < 60; i += 1) {
        const endISO = end.format('YYYY-MM-DD');
        if (!rangeHasBlocked(blockedSet, nextIn, endISO)) {
          setCheckOut(endISO);
          return;
        }
        end = end.add(1, 'day');
      }
      setCheckOut(dayjs(nextIn).add(1, 'day').format('YYYY-MM-DD'));
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedRoom) return;
    if (!customer && !customerName.trim()) {
      toast.error('Select or enter a guest name.');
      return;
    }
    if (rangeHasBlocked(blockedSet, checkIn, checkOut)) {
      toast.error('Selected dates overlap an existing booking. Pick free nights.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        store_id: storeId,
        room_id: selectedRoom.id,
        customer_id: customer?.id || null,
        customer_name: customer ? null : customerName.trim(),
        check_in_date: checkIn,
        check_out_date: checkOut,
        rate_per_night: rateNum,
        deposit_amount: depositNum,
        status: bookingStatus,
        notes: notes || null,
        payments:
          depositNum > 0 && paymentMethodId
            ? [{ payment_method_id: Number(paymentMethodId), amount: depositNum }]
            : null,
      };
      await createRoomBooking(payload);
      toast.success('Booking created.');
      setBookingOpen(false);
      await loadBoard();
    } catch (err) {
      toast.error(err.message || 'Failed to create booking.');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckIn = async (room) => {
    const booking = room.current_booking || room.next_booking;
    if (!booking) {
      toast.error('No booking to check in.');
      return;
    }
    setBusy(true);
    try {
      await checkInRoomBooking(booking.id, storeId);
      toast.success(`Checked in to room ${room.code}.`);
      await loadBoard();
    } catch (err) {
      toast.error(err.message || 'Check-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const openCheckout = (room) => {
    setSelectedRoom(room);
    setPaymentMethodId(paymentMethods?.[0] ? String(paymentMethods[0].id) : '');
    setCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    const booking = selectedRoom?.current_booking;
    if (!booking) return;
    setBusy(true);
    try {
      const balance = bookingBalance(booking);
      await checkOutRoomBooking(booking.id, {
        store_id: storeId,
        status: 'paid',
        mark_room_dirty: true,
        payments:
          balance > 0.01 && paymentMethodId
            ? [{ payment_method_id: Number(paymentMethodId), amount: balance }]
            : [],
      });
      toast.success('Guest checked out.');
      setCheckoutOpen(false);
      await loadBoard();
    } catch (err) {
      toast.error(err.message || 'Check-out failed.');
    } finally {
      setBusy(false);
    }
  };

  const openMove = (room) => {
    setSelectedRoom(room);
    setMoveToRoomId('');
    setMoveOpen(true);
  };

  const handleMove = async () => {
    const booking = selectedRoom?.current_booking;
    if (!booking || !moveToRoomId) return;
    setBusy(true);
    try {
      await moveRoomBooking(booking.id, {
        store_id: storeId,
        to_room_id: Number(moveToRoomId),
      });
      toast.success('Guest moved.');
      setMoveOpen(false);
      await loadBoard();
    } catch (err) {
      toast.error(err.message || 'Move failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (room) => {
    const booking = room.next_booking || room.current_booking;
    if (!booking || booking.status === 'checked_in') {
      toast.error('Cancel is only for held/confirmed bookings. Use End stay early for in-house guests.');
      return;
    }
    setBusy(true);
    try {
      await cancelRoomBooking(booking.id, { store_id: storeId });
      toast.success('Booking cancelled.');
      await loadBoard();
    } catch (err) {
      toast.error(err.message || 'Cancel failed.');
    } finally {
      setBusy(false);
    }
  };

  const openDepositTopUp = (room, booking) => {
    setSelectedRoom(room);
    setDepositTargetBooking(booking);
    const bal = bookingBalance(booking);
    setTopUpAmount(bal > 0 ? String(bal) : '');
    setPaymentMethodId(paymentMethods?.[0] ? String(paymentMethods[0].id) : '');
    setDepositOpen(true);
  };

  const handleDepositTopUp = async () => {
    const booking = depositTargetBooking;
    if (!booking) return;
    const amount = Number(topUpAmount) || 0;
    if (amount <= 0) {
      toast.error('Enter a top-up amount.');
      return;
    }
    const maxBal = bookingBalance(booking);
    if (amount > maxBal + 0.01) {
      toast.error(`Top-up cannot exceed remaining balance (${fCurrency(maxBal)}).`);
      return;
    }
    if (!paymentMethodId) {
      toast.error('Select a payment method.');
      return;
    }
    setBusy(true);
    try {
      await addRoomBookingDeposit(booking.id, {
        store_id: storeId,
        amount,
        payments: [{ payment_method_id: Number(paymentMethodId), amount }],
      });
      toast.success('Deposit updated.');
      setDepositOpen(false);
      await loadBoard();
    } catch (err) {
      toast.error(err.message || 'Deposit top-up failed.');
    } finally {
      setBusy(false);
    }
  };

  const openEarlyCheckout = (room) => {
    setSelectedRoom(room);
    const today = dayjs();
    const minOut = dayjs(room.current_booking?.check_in_date).add(1, 'day');
    const planned = dayjs(room.current_booking?.check_out_date);
    let leave = today.isAfter(minOut, 'day') || today.isSame(minOut, 'day') ? today : minOut;
    if (leave.isAfter(planned, 'day')) leave = planned;
    setEarlyOutDate(leave.format('YYYY-MM-DD'));
    setRefundAmount('');
    setPaymentMethodId(paymentMethods?.[0] ? String(paymentMethods[0].id) : '');
    setEarlyOpen(true);
  };

  const handleEarlyCheckout = async () => {
    const booking = selectedRoom?.current_booking;
    if (!booking) return;
    if (refundNum > earlyExcess + 0.01) {
      toast.error(`Refund cannot exceed excess deposit (${fCurrency(earlyExcess)}).`);
      return;
    }
    if (refundNum < 0) {
      toast.error('Refund amount cannot be negative.');
      return;
    }
    setBusy(true);
    try {
      await earlyCheckoutRoomBooking(booking.id, {
        store_id: storeId,
        actual_check_out_date: earlyOutDate,
        status: 'paid',
        mark_room_dirty: true,
        refund_amount: refundNum > 0.01 ? refundNum : null,
        payments:
          earlyBalance > 0.01 && paymentMethodId
            ? [{ payment_method_id: Number(paymentMethodId), amount: earlyBalance }]
            : [],
      });
      toast.success(
        refundNum > 0.01
          ? `Stay ended early. Refund ${fCurrency(refundNum)} recorded as expense.`
          : 'Stay ended early. Room marked dirty.'
      );
      setEarlyOpen(false);
      await loadBoard();
    } catch (err) {
      toast.error(err.message || 'Early checkout failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleMarkAvailable = async (room) => {
    setBusy(true);
    try {
      await markRoomAvailable(room.id, storeId);
      toast.success(`Room ${room.code} marked available.`);
      await loadBoard();
    } catch (err) {
      toast.error(err.message || 'Could not mark available.');
    } finally {
      setBusy(false);
    }
  };

  const canBookRoom = (room) => {
    const status = room.display_status || room.status;
    return status !== 'blocked';
  };

  const activeBookingForDeposit = (room) => {
    const current = room.current_booking;
    if (current && bookingBalance(current) > 0.01) return current;
    const next = room.next_booking;
    if (next && ['held', 'confirmed'].includes(next.status) && bookingBalance(next) > 0.01) {
      return next;
    }
    return null;
  };

  const moveTargets = (board?.rooms || []).filter(
    (r) =>
      r.id !== selectedRoom?.id &&
      ['available', 'booked', 'dirty'].includes(r.display_status) &&
      r.display_status !== 'occupied' &&
      r.status !== 'blocked' &&
      r.status !== 'occupied'
  );

  if (!storeId) {
    return (
      <DashboardContent>
        <Alert severity="warning">Select a store to use Front Desk.</Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4">Front Desk</Typography>
          <Typography variant="body2" color="text.secondary">
            Room board — occupied, booked, available, and dirty rooms
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            component={RouterLink}
            href={paths.dashboard.frontDeskSetup}
            variant="outlined"
            startIcon={<Iconify icon="solar:settings-bold-duotone" />}
          >
            Rooms setup
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:refresh-bold" />}
            onClick={loadBoard}
            disabled={loading || busy}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {loading && !board ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
            <StatChip label="In house" value={board?.in_house ?? 0} color="warning" />
            <StatChip label="Arrivals today" value={board?.arrivals_today ?? 0} color="info" />
            <StatChip label="Departures today" value={board?.departures_today ?? 0} color="secondary" />
            <StatChip label="Available" value={board?.available ?? 0} color="success" />
            <StatChip label="Dirty" value={board?.dirty ?? 0} color="error" />
          </Stack>

          {!board?.rooms?.length ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No rooms yet.{' '}
              <Button component={RouterLink} href={paths.dashboard.frontDeskSetup} size="small">
                Add room types & rooms
              </Button>
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {board.rooms.map((room) => {
                const booking = room.current_booking || room.next_booking;
                const status = room.display_status || room.status;
                const depositBooking = activeBookingForDeposit(room);
                return (
                  <Grid key={room.id} xs={12} sm={6} md={4} lg={3}>
                    <Card
                      sx={{
                        height: 1,
                        borderTop: (theme) =>
                          `4px solid ${theme.palette[STATUS_COLOR[status] || 'grey'].main}`,
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="h5">{room.code}</Typography>
                          <Chip
                            size="small"
                            color={STATUS_COLOR[status] || 'default'}
                            label={status}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {room.room_type_name || 'Room'}
                          {room.floor ? ` · Floor ${room.floor}` : ''}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" display="block">
                          {currencySymbol}
                          {Number(room.base_price_per_night || 0).toLocaleString()}/night
                        </Typography>

                        {booking && (
                          <Box sx={{ mt: 1.5, p: 1.25, bgcolor: 'background.neutral', borderRadius: 1 }}>
                            <Typography variant="subtitle2" noWrap>
                              {booking.customer_name || 'Guest'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {booking.check_in_date} → {booking.check_out_date} ({booking.nights}n)
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {fCurrency(booking.total_amount)}
                              {booking.deposit_amount > 0
                                ? ` · deposit ${fCurrency(booking.deposit_amount)}`
                                : ''}
                              {bookingBalance(booking) > 0.01
                                ? ` · due ${fCurrency(bookingBalance(booking))}`
                                : ''}
                            </Typography>
                          </Box>
                        )}

                        <Stack spacing={1} sx={{ mt: 2 }}>
                          {canBookRoom(room) && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => openBookingForRoom(room)}
                              disabled={busy}
                            >
                              {status === 'occupied' || status === 'booked'
                                ? 'Book other dates'
                                : 'Book / hold'}
                            </Button>
                          )}

                          {room.next_booking &&
                            ['held', 'confirmed'].includes(room.next_booking.status) &&
                            !room.current_booking && (
                              <Button
                                size="small"
                                variant="soft"
                                color="warning"
                                onClick={() => handleCheckIn(room)}
                                disabled={busy}
                              >
                                Check in
                              </Button>
                            )}

                          {room.current_booking?.status === 'checked_in' && (
                            <>
                              <Button
                                size="small"
                                variant="soft"
                                color="warning"
                                onClick={() => openCheckout(room)}
                                disabled={busy}
                              >
                                Check out
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => openEarlyCheckout(room)}
                                disabled={busy}
                              >
                                End stay early
                              </Button>
                              <Button size="small" variant="outlined" onClick={() => openMove(room)} disabled={busy}>
                                Move room
                              </Button>
                            </>
                          )}

                          {depositBooking && (
                            <Button
                              size="small"
                              variant="soft"
                              color="info"
                              onClick={() => openDepositTopUp(room, depositBooking)}
                              disabled={busy}
                            >
                              Balance deposit
                            </Button>
                          )}

                          {status === 'dirty' && (
                            <Button
                              size="small"
                              variant="soft"
                              color="success"
                              onClick={() => handleMarkAvailable(room)}
                              disabled={busy}
                            >
                              Mark available
                            </Button>
                          )}

                          {room.next_booking &&
                            ['held', 'confirmed'].includes(room.next_booking.status) && (
                              <Button size="small" color="inherit" onClick={() => handleCancel(room)} disabled={busy}>
                                Cancel booking
                              </Button>
                            )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}

      {/* New booking */}
      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Book room {selectedRoom?.code}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {blockedLoading && (
              <Alert severity="info">Loading booked nights for this room…</Alert>
            )}
            {!blockedLoading && blockedSet.size > 0 && (
              <Alert severity="info">
                Greyed-out dates are already booked. You can still book free nights around them.
              </Alert>
            )}
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
                value={checkIn ? dayjs(checkIn) : null}
                onChange={handleCheckInChange}
                shouldDisableDate={shouldDisableCheckIn}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="Check-out"
                value={checkOut ? dayjs(checkOut) : null}
                onChange={(v) => v && setCheckOut(v.format('YYYY-MM-DD'))}
                shouldDisableDate={shouldDisableCheckOut}
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
              {nights} night(s) · Stay total {fCurrency(stayTotal)}
            </Typography>
            <TextField
              select
              label="Booking status"
              value={bookingStatus}
              onChange={(e) => setBookingStatus(e.target.value)}
            >
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="held">Held (book-down)</MenuItem>
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
            <TextField
              label="Notes"
              multiline
              minRows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateBooking} disabled={busy || blockedLoading}>
            {busy ? <CircularProgress size={18} /> : 'Save booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checkout */}
      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Check out · Room {selectedRoom?.code}</DialogTitle>
        <DialogContent>
          {selectedRoom?.current_booking && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                Guest: <strong>{selectedRoom.current_booking.customer_name}</strong>
              </Typography>
              <Typography variant="body2">
                Stay total: {fCurrency(selectedRoom.current_booking.total_amount)}
              </Typography>
              <Typography variant="body2">
                Deposit paid: {fCurrency(selectedRoom.current_booking.deposit_amount || 0)}
              </Typography>
              <Typography variant="subtitle2">
                Balance due: {fCurrency(bookingBalance(selectedRoom.current_booking))}
              </Typography>
              {bookingBalance(selectedRoom.current_booking) > 0.01 && (
                <TextField
                  select
                  label="Payment method"
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
              <Alert severity="info">Room will be marked dirty after checkout.</Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleCheckout} disabled={busy}>
            Confirm checkout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Balance deposit */}
      <Dialog open={depositOpen} onClose={() => setDepositOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Balance deposit · Room {selectedRoom?.code}</DialogTitle>
        <DialogContent>
          {depositTargetBooking && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                Guest: <strong>{depositTargetBooking.customer_name}</strong>
              </Typography>
              <Typography variant="body2">
                Stay total: {fCurrency(depositTargetBooking.total_amount)}
              </Typography>
              <Typography variant="body2">
                Deposit so far: {fCurrency(depositTargetBooking.deposit_amount || 0)}
              </Typography>
              <Typography variant="subtitle2">
                Remaining: {fCurrency(bookingBalance(depositTargetBooking))}
              </Typography>
              <TextField
                type="number"
                label={`Top-up amount (${currencySymbol})`}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                helperText="Can be a partial payment toward the remaining balance."
              />
              <TextField
                select
                label="Payment method"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
              >
                {(paymentMethods || []).map((pm) => (
                  <MenuItem key={pm.id} value={String(pm.id)}>
                    {pm.issuer || pm.method_type || `Method #${pm.id}`}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepositOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDepositTopUp} disabled={busy}>
            {busy ? <CircularProgress size={18} /> : 'Collect top-up'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Early end stay */}
      <Dialog open={earlyOpen} onClose={() => setEarlyOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>End stay early · Room {selectedRoom?.code}</DialogTitle>
        <DialogContent>
          {selectedRoom?.current_booking && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="warning">
                Shortens the stay to nights already used, recalculates the bill from deposit, then
                checks the guest out.
              </Alert>
              <Typography variant="body2">
                Guest: <strong>{selectedRoom.current_booking.customer_name}</strong>
              </Typography>
              <Typography variant="body2">
                Original: {selectedRoom.current_booking.check_in_date} →{' '}
                {selectedRoom.current_booking.check_out_date} (
                {selectedRoom.current_booking.nights}n ·{' '}
                {fCurrency(selectedRoom.current_booking.total_amount)})
              </Typography>
              <DatePicker
                label="Leaving on"
                value={earlyOutDate ? dayjs(earlyOutDate) : null}
                onChange={(v) => v && setEarlyOutDate(v.format('YYYY-MM-DD'))}
                minDate={dayjs(selectedRoom.current_booking.check_in_date).add(1, 'day')}
                maxDate={dayjs(selectedRoom.current_booking.check_out_date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <Typography variant="body2">
                Billed nights: {earlyNights} · New total {fCurrency(earlyStayTotal)}
              </Typography>
              <Typography variant="body2">
                Deposit paid: {fCurrency(selectedRoom.current_booking.deposit_amount || 0)}
              </Typography>
              <Typography variant="subtitle2">Balance due: {fCurrency(earlyBalance)}</Typography>
              {earlyBalance > 0.01 && (
                <TextField
                  select
                  label="Payment method"
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
              {earlyExcess > 0.01 && (
                <>
                  <Alert severity="info">
                    Excess deposit: {fCurrency(earlyExcess)}. Leave blank for no refund, or enter up
                    to that amount — it is recorded as a room deposit refund expense.
                  </Alert>
                  <TextField
                    type="number"
                    label={`Refund amount (${currencySymbol}) — optional`}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    inputProps={{ min: 0, max: earlyExcess, step: '0.01' }}
                    helperText={`Max ${fCurrency(earlyExcess)}`}
                    error={refundNum > earlyExcess + 0.01}
                  />
                  <Button
                    size="small"
                    onClick={() => setRefundAmount(String(earlyExcess))}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Refund full excess
                  </Button>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEarlyOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleEarlyCheckout} disabled={busy}>
            {busy ? <CircularProgress size={18} /> : 'End stay & check out'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move */}
      <Dialog open={moveOpen} onClose={() => setMoveOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Move guest from {selectedRoom?.code}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Move to room"
            value={moveToRoomId}
            onChange={(e) => setMoveToRoomId(e.target.value)}
            sx={{ mt: 1 }}
          >
            {moveTargets.map((r) => (
              <MenuItem key={r.id} value={String(r.id)}>
                {r.code} · {r.room_type_name} ({r.display_status})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleMove} disabled={busy || !moveToRoomId}>
            Move
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
