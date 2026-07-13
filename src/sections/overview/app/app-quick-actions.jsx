import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const GRID_VISIBLE_COUNT = 7;
const GRID_COLUMNS = 4;

const TONE_STYLES = {
  sales: (theme) => ({ bgcolor: alpha(theme.palette.success.main, 0.12), color: 'success.dark' }),
  inventory: (theme) => ({ bgcolor: alpha(theme.palette.info.main, 0.12), color: 'info.dark' }),
  finance: (theme) => ({ bgcolor: alpha(theme.palette.warning.main, 0.12), color: 'warning.dark' }),
  reports: (theme) => ({ bgcolor: alpha(theme.palette.secondary.main, 0.12), color: 'secondary.dark' }),
  default: (theme) => ({ bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }),
};

function ActionIcon({ icon, label, onClick, large = false, tone = 'default' }) {
  const theme = useTheme();
  const toneStyle = (TONE_STYLES[tone] ?? TONE_STYLES.default)(theme);

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      sx={{
        gap: 1,
        py: large ? 1.25 : 0.75,
        px: 0.75,
        width: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        cursor: 'pointer',
        borderRadius: 1.5,
        userSelect: 'none',
        transition: (t) =>
          t.transitions.create('background-color', {
            duration: t.transitions.duration.shorter,
          }),
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box
        sx={{
          width: large ? 64 : 44,
          height: large ? 64 : 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          flexShrink: 0,
          ...toneStyle,
        }}
      >
        <Iconify icon={icon} width={large ? 28 : 22} />
      </Box>
      <Typography
        variant={large ? 'subtitle2' : 'caption'}
        sx={{
          width: 1,
          textAlign: 'center',
          lineHeight: 1.35,
          fontWeight: large ? 600 : 400,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ActionGrid({ items, large = false, columns = GRID_COLUMNS, onNavigate }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: large ? 0.75 : 0.25,
      }}
    >
      {items.map((item) => (
        <ActionIcon
          key={item.id}
          icon={item.icon}
          label={item.label}
          tone={item.tone}
          large={large}
          onClick={() => onNavigate(item)}
        />
      ))}
    </Box>
  );
}

export function AppQuickActions({ primary = [], grid = [], sx, ...other }) {
  const theme = useTheme();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleGrid = useMemo(() => grid.slice(0, GRID_VISIBLE_COUNT), [grid]);
  const overflowGrid = useMemo(() => grid.slice(GRID_VISIBLE_COUNT), [grid]);
  const showMore = overflowGrid.length > 0;

  const navigate = useCallback(
    (path) => {
      if (path) {
        router.push(path);
      }
    },
    [router]
  );

  const closeMore = useCallback(() => setMoreOpen(false), []);

  const openMore = useCallback(() => setMoreOpen(true), []);

  const gridItems = useMemo(
    () =>
      (showMore
        ? [...visibleGrid, { id: 'more', label: 'More', icon: 'solar:widget-5-bold', path: null, tone: 'default' }]
        : visibleGrid),
    [showMore, visibleGrid]
  );

  const primaryItems = useMemo(() => primary.slice(0, 3), [primary]);

  const handleGridNavigate = useCallback(
    (item) => {
      if (item.path) {
        navigate(item.path);
      } else {
        openMore();
      }
    },
    [navigate, openMore]
  );

  if (primary.length === 0 && grid.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={sx} {...other}>
        {primaryItems.length > 0 && (
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', display: 'block', mb: 1, letterSpacing: 1 }}
            >
              Frequent
            </Typography>
            <ActionGrid
              items={primaryItems}
              large
              columns={3}
              onNavigate={(item) => navigate(item.path)}
            />
          </Box>
        )}

        {grid.length > 0 && (
          <Box sx={{ pt: primaryItems.length > 0 ? 2 : 0 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', display: 'block', mb: 1, letterSpacing: 1 }}
            >
              Services
            </Typography>
            <ActionGrid items={gridItems} onNavigate={handleGridNavigate} />
          </Box>
        )}
      </Box>

      <Drawer anchor="bottom" open={moreOpen} onClose={closeMore}>
        <Box sx={{ p: 2.5, pb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">More</Typography>
            <Box onClick={closeMore} sx={{ cursor: 'pointer', p: 0.5 }}>
              <Iconify icon="mingcute:close-line" width={22} />
            </Box>
          </Stack>

          <ActionGrid
            items={overflowGrid}
            onNavigate={(item) => {
              closeMore();
              navigate(item.path);
            }}
          />
        </Box>
      </Drawer>
    </>
  );
}
