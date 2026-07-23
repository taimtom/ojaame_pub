import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function statusColor(status) {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  return 'default';
}

export function AppRecentActivity({
  title = 'Recent activity',
  items = [],
  loading = false,
  viewAllHref,
  emptyMessage = 'No recent activity yet',
  collapseWhenEmpty = false,
  sx,
  ...other
}) {
  if (!loading && collapseWhenEmpty && items.length === 0) {
    return null;
  }

  return (
    <Card sx={{ p: 2.5, width: 1, ...sx }} {...other}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: items.length > 0 || loading ? 2 : 0 }}>
        <Typography variant="subtitle1">{title}</Typography>
        {viewAllHref && (
          <Typography
            component={RouterLink}
            href={viewAllHref}
            variant="body2"
            sx={{ color: 'primary.main', textDecoration: 'none' }}
          >
            View all
          </Typography>
        )}
      </Box>

      {loading ? (
        <Stack spacing={1.5}>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} variant="rounded" height={52} />
          ))}
        </Stack>
      ) : items.length === 0 ? (
        <Box
          sx={{
            py: 1,
            px: 1.5,
            gap: 1,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 1.5,
            bgcolor: 'background.neutral',
            color: 'text.secondary',
          }}
        >
          <Iconify icon="solar:history-bold-duotone" width={20} sx={{ opacity: 0.48, flexShrink: 0 }} />
          <Typography variant="body2">{emptyMessage}</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Box
              key={item.id}
              component={item.href ? RouterLink : 'div'}
              href={item.href || undefined}
              sx={{
                p: 1.5,
                gap: 1.5,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 1.5,
                textDecoration: 'none',
                bgcolor: 'background.neutral',
                ...(item.href && {
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }),
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                }}
              >
                <Iconify icon="solar:bill-list-bold" width={20} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {item.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                  {item.timeAgo ? `${item.timeAgo} · ` : ''}
                  {item.subtitle}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography variant="subtitle2">{fCurrency(item.amount ?? 0)}</Typography>
                {item.status && (
                  <Label color={statusColor(item.status)} variant="soft" sx={{ mt: 0.5 }}>
                    {item.status}
                  </Label>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
}
