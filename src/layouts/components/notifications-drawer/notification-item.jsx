import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

import { fToNow } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

import { archiveNotification, markNotificationAsRead } from 'src/actions/notifications';

// ----------------------------------------------------------------------

const TYPE_CONFIG = {
  new_sale: {
    icon: 'ic-order',
    color: 'success',
    label: 'Sales',
  },
  low_stock: {
    icon: 'ic-delivery',
    color: 'warning',
    label: 'Inventory',
  },
  out_of_stock: {
    icon: 'ic-delivery',
    color: 'error',
    label: 'Inventory',
  },
  overdue_invoice: {
    icon: 'ic-order',
    color: 'error',
    label: 'Finance',
  },
  expiring_product: {
    icon: 'ic-mail',
    color: 'warning',
    label: 'Inventory',
  },
  // Legacy mock types — kept for backward compatibility
  order: { icon: 'ic-order', color: 'default', label: 'Order' },
  chat: { icon: 'ic-chat', color: 'default', label: 'Chat' },
  mail: { icon: 'ic-mail', color: 'default', label: 'Mail' },
  delivery: { icon: 'ic-delivery', color: 'default', label: 'Delivery' },
};

// ----------------------------------------------------------------------

export function NotificationItem({ notification }) {
  const config = TYPE_CONFIG[notification.type] || { icon: 'ic-order', color: 'default', label: notification.category || '' };

  const isUnRead = notification.isUnRead ?? !notification.is_read;
  const createdAt = notification.createdAt ?? notification.created_at;

  const handleMarkRead = async (e) => {
    e.stopPropagation();
    if (!notification.id || isUnRead === false) return;
    try {
      await markNotificationAsRead(notification.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (e) => {
    e.stopPropagation();
    if (!notification.id) return;
    try {
      await archiveNotification(notification.id);
    } catch (err) {
      console.error(err);
    }
  };

  const renderAvatar = (
    <ListItemAvatar>
      {notification.avatarUrl ? (
        <Avatar src={notification.avatarUrl} sx={{ bgcolor: 'background.neutral' }} />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'background.neutral' }}
        >
          <Box
            component="img"
            src={`${CONFIG.site.basePath}/assets/icons/notification/${config.icon}.svg`}
            sx={{ width: 24, height: 24 }}
          />
        </Stack>
      )}
    </ListItemAvatar>
  );

  const title = notification.title ?? '';

  const renderText = (
    <ListItemText
      disableTypography
      primary={reader(title)}
      secondary={
        <Stack
          direction="row"
          alignItems="center"
          sx={{ typography: 'caption', color: 'text.disabled' }}
          divider={
            <Box
              sx={{ width: 2, height: 2, bgcolor: 'currentColor', mx: 0.5, borderRadius: '50%' }}
            />
          }
        >
          {fToNow(createdAt)}
          {notification.category || config.label}
        </Stack>
      }
    />
  );

  const renderUnReadBadge = isUnRead && (
    <Box
      sx={{
        top: 26,
        width: 8,
        height: 8,
        right: 20,
        borderRadius: '50%',
        bgcolor: 'info.main',
        position: 'absolute',
      }}
    />
  );

  const renderBody = notification.body && (
    <Box
      sx={{
        p: 1.5,
        my: 1,
        borderRadius: 1.5,
        color: 'text.secondary',
        bgcolor: 'background.neutral',
        typography: 'caption',
      }}
    >
      {notification.body}
    </Box>
  );

  const renderActions = !notification.is_archived && (
    <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
      {isUnRead && (
        <Tooltip title="Mark as read">
          <IconButton size="small" onClick={handleMarkRead} color="primary">
            <Iconify icon="eva:done-all-fill" width={16} />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Archive">
        <IconButton size="small" onClick={handleArchive} color="default">
          <Iconify icon="solar:archive-bold" width={16} />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  return (
    <ListItemButton
      disableRipple
      onClick={handleMarkRead}
      sx={{
        p: 2.5,
        alignItems: 'flex-start',
        borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
      }}
    >
      {renderUnReadBadge}

      {renderAvatar}

      <Stack sx={{ flexGrow: 1 }}>
        {renderText}
        {renderBody}
        {renderActions}
      </Stack>
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

function reader(data) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: data }}
      sx={{
        mb: 0.5,
        '& p': { typography: 'body2', m: 0 },
        '& a': { color: 'inherit', textDecoration: 'none' },
        '& strong': { typography: 'subtitle2' },
      }}
    />
  );
}
