import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fCurrency, fPercent } from 'src/utils/format-number';

import { varAlpha, bgGradient } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function AppHeroMetric({
  title,
  total,
  percent,
  secondaryLabel,
  secondaryValue,
  actionHint,
  href,
  loading = false,
  chart,
  sx,
  ...other
}) {
  const theme = useTheme();

  const chartColors = chart?.colors ?? ['rgba(255,255,255,0.9)'];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true }, animations: { enabled: false } },
    colors: chartColors,
    stroke: { width: 2, curve: 'smooth' },
    fill: {
      type: 'gradient',
      gradient: {
        colorStops: [
          { offset: 0, color: 'rgba(255,255,255,0.35)', opacity: 1 },
          { offset: 100, color: 'rgba(255,255,255,0)', opacity: 1 },
        ],
      },
    },
    xaxis: { categories: chart?.categories ?? [] },
    tooltip: { enabled: false },
    grid: { show: false },
    ...chart?.options,
  });

  const hasDebt = (secondaryValue ?? 0) > 0;
  const trendColor = percent < 0 ? 'error' : 'success';

  const content = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 1 }}>
        <Typography variant="subtitle2" sx={{ opacity: 0.92 }}>
          {title}
        </Typography>
        {!loading && percent != null && (
          <Label
            color={trendColor}
            variant="filled"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'common.white',
            }}
          >
            {percent > 0 && '+'}
            {fPercent(percent)}
          </Label>
        )}
      </Box>

      {loading ? (
        <>
          <Skeleton variant="text" width="55%" height={48} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Skeleton variant="text" width="35%" sx={{ bgcolor: 'rgba(255,255,255,0.16)' }} />
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                {fCurrency(total ?? 0)}
              </Typography>
              {href && <Iconify icon="eva:arrow-ios-forward-fill" width={20} sx={{ opacity: 0.72, flexShrink: 0 }} />}
            </Box>

            {chart?.series?.length > 0 && (
              <Chart
                type="area"
                series={[{ data: chart.series }]}
                options={chartOptions}
                width={88}
                height={48}
              />
            )}
          </Box>

          {secondaryLabel && (
            hasDebt ? (
              <Chip
                size="small"
                label={`${secondaryLabel}: ${fCurrency(secondaryValue ?? 0)}`}
                sx={{
                  mt: 1.5,
                  height: 24,
                  fontSize: 12,
                  fontWeight: 600,
                  bgcolor: 'warning.lighter',
                  color: 'warning.darker',
                }}
              />
            ) : (
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                {secondaryLabel}: {fCurrency(secondaryValue ?? 0)}
              </Typography>
            )
          )}

          {actionHint && (
            <Typography variant="caption" sx={{ mt: 1.5, display: 'block', opacity: 0.72 }}>
              {actionHint}
            </Typography>
          )}
        </>
      )}
    </>
  );

  const cardSx = {
    p: 3,
    width: 1,
    minWidth: 0,
    display: 'block',
    color: 'common.white',
    textDecoration: 'none',
    borderRadius: 2,
    ...bgGradient({
      color: `135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%`,
    }),
    boxShadow: `0 12px 24px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.24)}`,
    transition: (t) =>
      t.transitions.create(['transform', 'box-shadow'], {
        duration: t.transitions.duration.shorter,
      }),
    ...(href && {
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 16px 32px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.28)}`,
      },
      '&:active': {
        transform: 'scale(0.99)',
      },
    }),
    ...sx,
  };

  if (href) {
    return (
      <Card component={RouterLink} href={href} sx={cardSx} {...other}>
        {content}
      </Card>
    );
  }

  return (
    <Card sx={cardSx} {...other}>
      {content}
    </Card>
  );
}
