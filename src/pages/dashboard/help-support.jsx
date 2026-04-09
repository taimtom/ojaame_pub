import { useCallback, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import axiosInstance, { endpoints } from 'src/utils/axios';

export default function HelpSupportPage() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyByTicket, setReplyByTicket] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(endpoints.support.tickets);
      setTickets(res.data || []);
    } catch (e) {
      setError(e?.message || 'Could not load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setError(null);
    try {
      await axiosInstance.post(endpoints.support.tickets, {
        subject,
        body,
        priority,
      });
      setSubject('');
      setBody('');
      setPriority('medium');
      await load();
    } catch (e) {
      setError(e?.message || 'Submit failed');
    }
  };

  const sendReply = async (ticketId) => {
    const text = replyByTicket[ticketId];
    if (!text?.trim()) return;
    setError(null);
    try {
      await axiosInstance.post(endpoints.support.ticketComments(ticketId), { body: text });
      setReplyByTicket((prev) => ({ ...prev, [ticketId]: '' }));
      await load();
    } catch (e) {
      setError(e?.message || 'Reply failed');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Help & Support
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Submit a ticket to the platform team. You will see updates here when we reply.
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              fullWidth
              required
              multiline
              minRows={4}
            />
            <TextField
              select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              sx={{ maxWidth: 240 }}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
            <Button variant="contained" onClick={submit} disabled={!subject.trim() || !body.trim()}>
              Submit ticket
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Your tickets
      </Typography>
      {loading && <Typography>Loading…</Typography>}
      {!loading && tickets.length === 0 && (
        <Typography color="text.secondary">No tickets yet.</Typography>
      )}
      <Stack spacing={2}>
        {tickets.map((t) => (
          <Card key={t.id}>
            <CardContent>
              <Typography variant="subtitle1">
                #{t.id} — {t.subject}{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  ({t.status} · {t.priority})
                </Typography>
              </Typography>
              <Typography variant="body2" sx={{ my: 1, whiteSpace: 'pre-wrap' }}>
                {t.body}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Thread
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {(t.comments || []).map((c) => (
                  <Box key={c.id} sx={{ pl: 1, borderLeft: '3px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      {c.author_type} · {c.created_at}
                    </Typography>
                    <Typography variant="body2">{c.body}</Typography>
                  </Box>
                ))}
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Reply to support…"
                  value={replyByTicket[t.id] || ''}
                  onChange={(e) =>
                    setReplyByTicket((prev) => ({ ...prev, [t.id]: e.target.value }))
                  }
                />
                <Button variant="outlined" onClick={() => sendReply(t.id)}>
                  Send
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
