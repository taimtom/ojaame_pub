import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function formatSessionTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AiAgentSessionSidebar({
  sessions = [],
  activeSessionId,
  loading,
  onSelect,
  onNewChat,
  disabled,
  fillHeight = false,
}) {
  return (
    <Box
      sx={{
        width: { xs: '100%', md: 280 },
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: { xs: 0, md: 1 },
        borderColor: 'divider',
        bgcolor: 'background.paper',
        minHeight: 0,
        height: fillHeight ? '100%' : undefined,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ px: 2, py: 1.75, flexShrink: 0 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          History
        </Typography>
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:pen-new-square-bold" width={16} />}
          onClick={onNewChat}
          disabled={disabled}
          sx={{ flexShrink: 0, borderRadius: 1.5, px: 1.5 }}
        >
          New
        </Button>
      </Stack>

      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={22} />
          </Stack>
        ) : sessions.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ px: 3, py: 5, textAlign: 'center' }}>
            <Iconify icon="solar:chat-round-line-bold" width={36} sx={{ color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              No chats yet. Send a message to start.
            </Typography>
          </Stack>
        ) : (
          <List disablePadding>
            {sessions.map((session) => {
              const selected = session.id === activeSessionId;
              const primary = session.title || session.preview || `Chat #${session.id}`;
              const secondary =
                session.preview && session.title !== session.preview
                  ? session.preview
                  : formatSessionTime(session.updated_at || session.created_at);

              return (
                <ListItemButton
                  key={session.id}
                  selected={selected}
                  disabled={disabled}
                  onClick={() => onSelect(session.id)}
                  sx={{
                    alignItems: 'flex-start',
                    px: 2,
                    py: 1.5,
                    minHeight: 56,
                    borderRadius: 0,
                    borderLeft: 3,
                    borderColor: selected ? 'primary.main' : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: 'primary.lighter',
                      '&:hover': { bgcolor: 'primary.lighter' },
                    },
                  }}
                >
                  <ListItemText
                    primary={primary}
                    secondary={secondary}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: selected ? 700 : 500,
                      noWrap: true,
                      sx: { lineHeight: 1.4 },
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      noWrap: true,
                      sx: { mt: 0.25, color: 'text.disabled' },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
