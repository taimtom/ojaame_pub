import { m } from 'framer-motion';
import { useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';

import {
  useGetNotifications,
  useGetNotificationSummary,
  markAllNotificationsAsRead,
} from 'src/actions/notifications';

import { NotificationItem } from './notification-item';

// ----------------------------------------------------------------------

export function NotificationsDrawer({ sx, ...other }) {
  const drawer = useBoolean();
  const router = useRouter();
  const { user } = useAuthContext();

  const storeId = user?.store_id || null;

  const [currentTab, setCurrentTab] = useState('all');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const { summary } = useGetNotificationSummary(storeId);
  const { notifications, notificationsLoading } = useGetNotifications({
    storeId,
    tab: currentTab,
    limit: 20,
  });

  const TABS = [
    { value: 'all', label: 'All', count: summary.total },
    { value: 'unread', label: 'Unread', count: summary.unread },
    { value: 'archived', label: 'Archived', count: summary.archived },
  ];

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(storeId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewAll = () => {
    drawer.onFalse();
    router.push(paths.dashboard.notifications);
  };

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {!!summary.unread && (
        <Tooltip title="Mark all as read">
          <IconButton color="primary" onClick={handleMarkAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={drawer.onFalse} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>

      <IconButton>
        <Iconify icon="solar:settings-bold-duotone" />
      </IconButton>
    </Stack>
  );

  const renderTabs = (
    <CustomTabs variant="fullWidth" value={currentTab} onChange={handleChangeTab}>
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
  );

  const renderList = (
    <Scrollbar>
      <Box component="ul">
        {notificationsLoading
          ? [...Array(5)].map((_, i) => (
              <Box key={i} component="li" sx={{ display: 'flex', p: 2.5, borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}` }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2, flexShrink: 0 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
              </Box>
            ))
          : notifications.map((notification) => (
              <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
                <NotificationItem notification={notification} />
              </Box>
            ))}

        {!notificationsLoading && notifications.length === 0 && (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <Iconify icon="solar:bell-off-bold-duotone" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              No notifications
            </Typography>
          </Stack>
        )}
      </Box>
    </Scrollbar>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={drawer.onTrue}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={summary.unread || 0} color="error">
          <SvgIcon>
            {/* https://icon-sets.iconify.design/solar/bell-bing-bold-duotone/ */}
            <path
              fill="currentColor"
              d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.794 25.794 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.393 4.393 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
              opacity="0.5"
            />
            <path
              fill="currentColor"
              d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
            />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 1, maxWidth: 420 } }}
      >
        {renderHead}

        {renderTabs}

        {renderList}

        <Box sx={{ p: 1 }}>
          <Button fullWidth size="large" onClick={handleViewAll}>
            View all
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
