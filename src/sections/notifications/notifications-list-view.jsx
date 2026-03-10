import { useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';

import { CONFIG } from 'src/config-global';
import { fToNow } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomTabs } from 'src/components/custom-tabs';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import {
  useGetNotifications,
  useGetNotificationSummary,
  markAllNotificationsAsRead,
  archiveNotification,
  markNotificationAsRead,
} from 'src/actions/notifications';

// ----------------------------------------------------------------------

const TYPE_CONFIG = {
  new_sale: { icon: 'ic-order', color: 'success', label: 'Sales' },
  low_stock: { icon: 'ic-delivery', color: 'warning', label: 'Inventory' },
  out_of_stock: { icon: 'ic-delivery', color: 'error', label: 'Inventory' },
  overdue_invoice: { icon: 'ic-order', color: 'error', label: 'Finance' },
  expiring_product: { icon: 'ic-mail', color: 'warning', label: 'Inventory' },
  order: { icon: 'ic-order', color: 'default', label: 'Order' },
  chat: { icon: 'ic-chat', color: 'default', label: 'Chat' },
  mail: { icon: 'ic-mail', color: 'default', label: 'Mail' },
  delivery: { icon: 'ic-delivery', color: 'default', label: 'Delivery' },
};

// ----------------------------------------------------------------------

export function NotificationsListView() {
  const { user } = useAuthContext();
  const storeId = user?.store_id || null;

  const [currentTab, setCurrentTab] = useState('all');
  const [skip, setSkip] = useState(0);
  const LIMIT = 30;

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
    setSkip(0);
  }, []);

  const { summary } = useGetNotificationSummary(storeId);
  const { notifications, notificationsLoading } = useGetNotifications({
    storeId,
    tab: currentTab,
    skip,
    limit: LIMIT,
  });

  const TABS = [
    { value: 'all', label: 'All', count: summary.total },
    { value: 'unread', label: 'Unread', count: summary.unread },
    { value: 'archived', label: 'Archived', count: summary.archived },
  ];

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(storeId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveNotification(id);
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Render helpers ----

  const renderSkeletons = [...Array(6)].map((_, i) => (
    <Box
      key={i}
      sx={{
        display: 'flex',
        p: 2.5,
        borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
      }}
    >
      <Skeleton variant="circular" width={44} height={44} sx={{ mr: 2, flexShrink: 0 }} />
      <Box sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="35%" />
        <Skeleton variant="text" width="80%" sx={{ mt: 0.5 }} />
      </Box>
    </Box>
  ));

  const renderEmpty = (
    <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
      <Iconify icon="solar:bell-off-bold-duotone" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
        No notifications
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
        {currentTab === 'unread'
          ? "You're all caught up!"
          : currentTab === 'archived'
          ? 'No archived notifications yet.'
          : 'Nothing here yet.'}
      </Typography>
    </Stack>
  );

  const renderItem = (notification) => {
    const config = TYPE_CONFIG[notification.type] || {
      icon: 'ic-order',
      color: 'default',
      label: notification.category || '',
    };
    const isUnRead = !notification.is_read;

    return (
      <ListItemButton
        key={notification.id}
        disableRipple
        onClick={() => handleMarkRead(notification.id)}
        sx={{
          px: 3,
          py: 2,
          alignItems: 'flex-start',
          borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
          position: 'relative',
          bgcolor: isUnRead ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {/* Unread dot */}
        {isUnRead && (
          <Box
            sx={{
              top: '50%',
              left: 12,
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'info.main',
              position: 'absolute',
              transform: 'translateY(-50%)',
            }}
          />
        )}

        <ListItemAvatar sx={{ minWidth: 52 }}>
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: 'background.neutral',
              ml: isUnRead ? 1.5 : 0,
            }}
          >
            <Box
              component="img"
              src={`${CONFIG.site.basePath}/assets/icons/notification/${config.icon}.svg`}
              sx={{ width: 24, height: 24 }}
            />
          </Stack>
        </ListItemAvatar>

        <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
          <ListItemText
            disableTypography
            primary={
              <Box
                dangerouslySetInnerHTML={{ __html: notification.title }}
                sx={{
                  mb: 0.25,
                  '& p': { typography: 'body2', m: 0 },
                  '& strong': { typography: 'subtitle2' },
                }}
              />
            }
            secondary={
              <Stack
                direction="row"
                alignItems="center"
                sx={{ typography: 'caption', color: 'text.disabled' }}
                divider={
                  <Box
                    sx={{
                      width: 2,
                      height: 2,
                      bgcolor: 'currentColor',
                      mx: 0.5,
                      borderRadius: '50%',
                    }}
                  />
                }
              >
                {fToNow(notification.created_at)}
                <Chip
                  label={notification.category || config.label}
                  size="small"
                  color={config.color}
                  variant="soft"
                  sx={{ height: 18, '& .MuiChip-label': { px: 0.75, typography: 'caption' } }}
                />
              </Stack>
            }
          />

          {notification.body && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.75,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                color: 'text.secondary',
                bgcolor: 'background.neutral',
                display: 'block',
              }}
            >
              {notification.body}
            </Typography>
          )}
        </Stack>

        {/* Action buttons */}
        <Stack direction="row" spacing={0.5} sx={{ ml: 1, flexShrink: 0 }}>
          {isUnRead && (
            <Tooltip title="Mark as read">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkRead(notification.id);
                }}
              >
                <Iconify icon="eva:done-all-fill" width={16} />
              </IconButton>
            </Tooltip>
          )}
          {!notification.is_archived && (
            <Tooltip title="Archive">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchive(notification.id);
                }}
              >
                <Iconify icon="solar:archive-bold" width={16} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </ListItemButton>
    );
  };

  return (
    <Container maxWidth="md">
      <CustomBreadcrumbs
        heading="Notifications"
        links={[{ name: 'Dashboard' }, { name: 'Notifications' }]}
        action={
          summary.unread > 0 && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:done-all-fill" />}
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <CustomTabs
          variant="fullWidth"
          value={currentTab}
          onChange={handleChangeTab}
          sx={{ px: 2, pt: 1 }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
                  color={
                    (tab.value === 'unread' && 'info') ||
                    (tab.value === 'archived' && 'success') ||
                    'default'
                  }
                >
                  {tab.count}
                </Label>
              }
            />
          ))}
        </CustomTabs>

        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {notificationsLoading
            ? renderSkeletons
            : notifications.length === 0
            ? renderEmpty
            : notifications.map((n) => (
                <Box key={n.id} component="li">
                  {renderItem(n)}
                </Box>
              ))}
        </Box>

        {/* Pagination */}
        {!notificationsLoading && notifications.length === LIMIT && (
          <Stack alignItems="center" sx={{ p: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setSkip((prev) => prev + LIMIT)}
            >
              Load more
            </Button>
          </Stack>
        )}
      </Card>
    </Container>
  );
}
