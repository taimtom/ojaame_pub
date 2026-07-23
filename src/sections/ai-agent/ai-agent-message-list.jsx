import { useRef, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { AiAgentMarkdown } from './ai-agent-markdown';

// ----------------------------------------------------------------------

const SUGGESTIONS = [
  'What sold today?',
  'Search for rice',
  'Sell 2 milo for cash',
  'Restock Coca-Cola by 20',
];

function MessageBubble({ message, compact }) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';
  const meta = message.metadata || {};
  const {source} = meta;
  const content = (message.content || '').trim();

  if (isTool) {
    // Hide read-tool noise; only surface errors to the user
    try {
      const parsed = JSON.parse(message.content || '{}');
      if (!parsed?.error) return null;
      return (
        <Stack direction="row" justifyContent="center" sx={{ px: 2, py: 0.5 }}>
          <Typography variant="caption" color="error.main" sx={{ fontStyle: 'italic' }}>
            {typeof parsed.error === 'string' ? parsed.error : 'Lookup failed'}
          </Typography>
        </Stack>
      );
    } catch {
      return null;
    }
  }

  if (message.role !== 'user' && message.role !== 'assistant') return null;

  // Skip empty assistant shells that only carried tool_calls
  if (!isUser && !content && !message.pending_action_id) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={compact ? 1 : 1.5}
      justifyContent={isUser ? 'flex-end' : 'flex-start'}
      sx={{ px: compact ? 1.5 : 2, py: compact ? 0.75 : 1 }}
    >
      {!isUser && (
        <Avatar
          sx={{
            width: compact ? 28 : 32,
            height: compact ? 28 : 32,
            bgcolor: 'primary.main',
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          <Iconify icon="solar:stars-bold" width={compact ? 14 : 18} />
        </Avatar>
      )}
      <Box
        sx={{
          maxWidth: compact ? '82%' : '75%',
          px: compact ? 1.5 : 2,
          py: compact ? 1 : 1.25,
          borderRadius: compact ? 2.5 : 2,
          borderBottomRightRadius: isUser ? 0.75 : undefined,
          borderBottomLeftRadius: !isUser ? 0.75 : undefined,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          boxShadow: !isUser
            ? (theme) => theme.customShadows?.z1 || '0 1px 2px rgba(0,0,0,0.06)'
            : 'none',
          border: !isUser ? 1 : 0,
          borderColor: 'divider',
        }}
      >
        {content ? (
          isUser ? (
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}
            >
              {message.content}
            </Typography>
          ) : (
            <AiAgentMarkdown>{message.content}</AiAgentMarkdown>
          )
        ) : null}
        {isUser && source === 'voice' && (
          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
            via voice
          </Typography>
        )}
      </Box>
      {isUser && !compact && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.400', flexShrink: 0, mt: 0.25 }}>
          <Iconify icon="solar:user-bold" width={18} />
        </Avatar>
      )}
    </Stack>
  );
}

export function AiAgentMessageList({ messages, loading, compact = false }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const visible = (messages || []).filter(
    (m) => m.role === 'user' || m.role === 'assistant' || m.role === 'tool'
  );

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        py: compact ? 1.5 : 2,
        minHeight: 0,
        WebkitOverflowScrolling: 'touch',
        bgcolor: compact ? 'background.default' : 'transparent',
      }}
    >
      {visible.length === 0 && !loading && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            minHeight: '100%',
            px: compact ? 2.5 : 3,
            py: compact ? 3 : 2,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: compact ? 56 : 64,
              height: compact ? 56 : 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              mb: 2,
            }}
          >
            <Iconify icon="solar:chat-round-dots-bold" width={compact ? 28 : 32} />
          </Box>
          <Typography variant={compact ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700 }}>
            How can I help?
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, maxWidth: 360, lineHeight: 1.5 }}
          >
            Ask in text or voice about sales, stock, customers, and more.
          </Typography>

          <Stack
            direction="row"
            flexWrap="wrap"
            justifyContent="center"
            gap={1}
            sx={{ mt: 2.5, maxWidth: 420 }}
          >
            {SUGGESTIONS.map((label) => (
              <Box
                key={label}
                component="span"
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 2,
                  typography: 'caption',
                  color: 'text.secondary',
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  fontWeight: 500,
                }}
              >
                {label}
              </Box>
            ))}
          </Stack>

          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ mt: 2.5, maxWidth: 360, lineHeight: 1.5 }}
          >
            Sales, restocks, and new products need your confirmation before they are saved.
          </Typography>
        </Stack>
      )}

      {visible.map((msg) => (
        <MessageBubble key={msg.id} message={msg} compact={compact} />
      ))}

      {loading && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ px: compact ? 1.5 : 2, py: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Thinking…
          </Typography>
        </Stack>
      )}

      <div ref={bottomRef} />
    </Box>
  );
}
