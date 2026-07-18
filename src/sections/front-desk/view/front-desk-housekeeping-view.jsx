import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { applyRoomHousekeeping, fetchHousekeepingBoard } from 'src/actions/rooms';

import { toast } from 'src/components/snackbar';

import { FrontDeskNav } from '../front-desk-nav';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  dirty: 'error',
  occupied: 'warning',
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

// ----------------------------------------------------------------------

export function FrontDeskHousekeepingView() {
  const storeId = getStoreIdFromStorage();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notesByRoom, setNotesByRoom] = useState({});

  const load = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchHousekeepingBoard(storeId);
      setRooms(data.rooms || []);
      const notes = {};
      (data.rooms || []).forEach((r) => {
        notes[r.id] = r.notes || '';
      });
      setNotesByRoom(notes);
    } catch (err) {
      toast.error(err.message || 'Failed to load housekeeping board.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (room, action) => {
    setBusyId(room.id);
    try {
      await applyRoomHousekeeping(room.id, {
        store_id: storeId,
        action,
        notes: notesByRoom[room.id] ?? room.notes ?? null,
      });
      toast.success(
        action === 'clean'
          ? `Room ${room.code} marked clean.`
          : action === 'dirty'
            ? `Room ${room.code} marked dirty.`
            : `Room ${room.code} blocked.`
      );
      await load();
    } catch (err) {
      toast.error(err.message || 'Housekeeping action failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (!storeId) {
    return (
      <DashboardContent>
        <Alert severity="warning">Select a store to use Housekeeping.</Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Housekeeping
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Dirty, occupied, and blocked rooms
      </Typography>
      <FrontDeskNav />

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !rooms.length ? (
        <Alert severity="success">No rooms need housekeeping attention right now.</Alert>
      ) : (
        <Stack spacing={2}>
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ sm: 'center' }}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6">{room.code}</Typography>
                      <Chip
                        size="small"
                        color={STATUS_COLOR[room.status] || 'default'}
                        label={room.status}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {room.room_type_name || 'Room'}
                      {room.floor ? ` · Floor ${room.floor}` : ''}
                      {room.guest_name ? ` · Guest ${room.guest_name}` : ''}
                      {room.check_out_date ? ` · out ${room.check_out_date}` : ''}
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    label="Notes"
                    value={notesByRoom[room.id] ?? ''}
                    onChange={(e) =>
                      setNotesByRoom((prev) => ({ ...prev, [room.id]: e.target.value }))
                    }
                    sx={{ minWidth: { sm: 220 }, flex: 1, maxWidth: 360 }}
                  />
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {room.status !== 'occupied' && (
                      <Button
                        size="small"
                        variant="soft"
                        color="success"
                        disabled={busyId === room.id}
                        onClick={() => runAction(room, 'clean')}
                      >
                        Mark clean
                      </Button>
                    )}
                    {room.status !== 'dirty' && room.status !== 'occupied' && (
                      <Button
                        size="small"
                        variant="soft"
                        color="error"
                        disabled={busyId === room.id}
                        onClick={() => runAction(room, 'dirty')}
                      >
                        Mark dirty
                      </Button>
                    )}
                    {room.status !== 'blocked' && room.status !== 'occupied' && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={busyId === room.id}
                        onClick={() => runAction(room, 'block')}
                      >
                        Block
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </DashboardContent>
  );
}
