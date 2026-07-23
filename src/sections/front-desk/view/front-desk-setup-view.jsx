import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useCurrencyFormat } from 'src/hooks/use-currency-format';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  createRoom,
  fetchRooms,
  updateRoom,
  createRoomType,
  fetchRoomTypes,
  updateRoomType,
} from 'src/actions/rooms';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { FrontDeskNav } from '../front-desk-nav';

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

export function FrontDeskSetupView() {
  const storeId = getStoreIdFromStorage();
  const { currencySymbol } = useCurrencyFormat();

  const [types, setTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [typeOpen, setTypeOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);

  const [typeName, setTypeName] = useState('');
  const [typePrice, setTypePrice] = useState('');
  const [typeCapacity, setTypeCapacity] = useState('');
  const [typeActive, setTypeActive] = useState(true);
  const [typeDesc, setTypeDesc] = useState('');

  const [roomCode, setRoomCode] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomFloor, setRoomFloor] = useState('');
  const [roomStatus, setRoomStatus] = useState('available');
  const [roomNotes, setRoomNotes] = useState('');

  const load = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [t, r] = await Promise.all([fetchRoomTypes(storeId), fetchRooms(storeId)]);
      setTypes(t || []);
      setRooms(r || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load rooms setup.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNewType = () => {
    setEditingType(null);
    setTypeName('');
    setTypePrice('');
    setTypeCapacity('');
    setTypeActive(true);
    setTypeDesc('');
    setTypeOpen(true);
  };

  const openEditType = (row) => {
    setEditingType(row);
    setTypeName(row.name);
    setTypePrice(String(row.base_price_per_night ?? ''));
    setTypeCapacity(row.capacity != null ? String(row.capacity) : '');
    setTypeActive(Boolean(row.is_active));
    setTypeDesc(row.description || '');
    setTypeOpen(true);
  };

  const saveType = async () => {
    if (!typeName.trim()) {
      toast.error('Name is required.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        store_id: storeId,
        name: typeName.trim(),
        base_price_per_night: Number(typePrice) || 0,
        capacity: typeCapacity ? Number(typeCapacity) : null,
        description: typeDesc || null,
        is_active: typeActive,
      };
      if (editingType) {
        await updateRoomType(editingType.id, payload);
        toast.success('Room type updated.');
      } else {
        await createRoomType(payload);
        toast.success('Room type created.');
      }
      setTypeOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message || 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const openNewRoom = () => {
    setEditingRoom(null);
    setRoomCode('');
    setRoomTypeId(types[0] ? String(types[0].id) : '');
    setRoomFloor('');
    setRoomStatus('available');
    setRoomNotes('');
    setRoomOpen(true);
  };

  const openEditRoom = (row) => {
    setEditingRoom(row);
    setRoomCode(row.code);
    setRoomTypeId(String(row.room_type_id));
    setRoomFloor(row.floor || '');
    setRoomStatus(row.status || 'available');
    setRoomNotes(row.notes || '');
    setRoomOpen(true);
  };

  const saveRoom = async () => {
    if (!roomCode.trim() || !roomTypeId) {
      toast.error('Code and room type are required.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        store_id: storeId,
        room_type_id: Number(roomTypeId),
        code: roomCode.trim(),
        floor: roomFloor || null,
        status: roomStatus,
        notes: roomNotes || null,
      };
      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        toast.success('Room updated.');
      } else {
        await createRoom(payload);
        toast.success('Room created.');
      }
      setRoomOpen(false);
      await load();
    } catch (err) {
      toast.error(err.message || 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!storeId) {
    return (
      <DashboardContent>
        <Typography>Select a store first.</Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4">Rooms setup</Typography>
          <Typography variant="body2" color="text.secondary">
            Room types (rates) and physical rooms
          </Typography>
        </Box>
      </Stack>

      <FrontDeskNav />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Room types</Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={openNewType}
                >
                  Add type
                </Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Price / night</TableCell>
                      <TableCell>Capacity</TableCell>
                      <TableCell>Active</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {types.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{fCurrency(row.base_price_per_night)}</TableCell>
                        <TableCell>{row.capacity ?? '—'}</TableCell>
                        <TableCell>{row.is_active ? 'Yes' : 'No'}</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => openEditType(row)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!types.length && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography variant="body2" color="text.secondary">
                            No room types yet. Add Deluxe, Standard, Suite, etc.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Rooms</Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={openNewRoom}
                  disabled={!types.length}
                >
                  Add room
                </Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Floor</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rooms.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.code}</TableCell>
                        <TableCell>{row.room_type_name}</TableCell>
                        <TableCell>{row.floor || '—'}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{row.status}</TableCell>
                        <TableCell align="right">
                          {currencySymbol}
                          {Number(row.base_price_per_night || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => openEditRoom(row)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rooms.length && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography variant="body2" color="text.secondary">
                            No rooms yet. Create a type first, then add room 101, 102, …
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>
      )}

      <Dialog open={typeOpen} onClose={() => setTypeOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingType ? 'Edit room type' : 'New room type'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={typeName} onChange={(e) => setTypeName(e.target.value)} />
            <TextField
              type="number"
              label={`Base price / night (${currencySymbol})`}
              value={typePrice}
              onChange={(e) => setTypePrice(e.target.value)}
            />
            <TextField
              type="number"
              label="Capacity (guests)"
              value={typeCapacity}
              onChange={(e) => setTypeCapacity(e.target.value)}
            />
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={typeDesc}
              onChange={(e) => setTypeDesc(e.target.value)}
            />
            <FormControlLabel
              control={<Switch checked={typeActive} onChange={(e) => setTypeActive(e.target.checked)} />}
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveType} disabled={busy}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roomOpen} onClose={() => setRoomOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingRoom ? 'Edit room' : 'New room'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Room code" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="101" />
            <TextField
              select
              label="Room type"
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
            >
              {types.map((t) => (
                <MenuItem key={t.id} value={String(t.id)}>
                  {t.name} · {fCurrency(t.base_price_per_night)}/night
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Floor" value={roomFloor} onChange={(e) => setRoomFloor(e.target.value)} />
            <TextField
              select
              label="Status"
              value={roomStatus}
              onChange={(e) => setRoomStatus(e.target.value)}
            >
              {['available', 'booked', 'occupied', 'dirty', 'blocked'].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Notes"
              multiline
              minRows={2}
              value={roomNotes}
              onChange={(e) => setRoomNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveRoom} disabled={busy}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
