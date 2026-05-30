import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';

import { fCurrency, fNumber, fPercent } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function AppWidgetSummary({
  title,
  percent,
  total,
  chart,
  periodLabel = 'last 7 days',
  secondaryLabel,
  secondaryValue,
  formatAsCurrency = false,
  loading = false,
  sx,
  ...other
}) {
  const theme = useTheme();

  const chartColors = chart.colors ?? [theme.palette.primary.main];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    stroke: { width: 0 },
    xaxis: { categories: chart.categories },
    tooltip: {
      y: { formatter: (value) => fNumber(value), title: { formatter: () => '' } },
    },
    plotOptions: { bar: { borderRadius: 1.5, columnWidth: '64%' } },
    ...chart.options,
  });

  const formatValue = formatAsCurrency ? fCurrency : fNumber;

  const renderTrending = (
    <Box sx={{ gap: 0.5, display: 'flex', alignItems: 'center' }}>
      <Iconify
        width={24}
        icon={
          percent < 0
            ? 'solar:double-alt-arrow-down-bold-duotone'
            : 'solar:double-alt-arrow-up-bold-duotone'
        }
        sx={{ flexShrink: 0, color: 'success.main', ...(percent < 0 && { color: 'error.main' }) }}
      />

      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {percent > 0 && '+'}
        {fPercent(percent)}
      </Box>
      <Box component="span" sx={{ typography: 'body2', color: 'text.secondary' }}>
        {periodLabel}
      </Box>
    </Box>
  );

  return (
    <Card
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 3,
        ...sx,
      }}
      {...other}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ typography: 'subtitle2' }}>{title}</Box>

        {loading ? (
          <>
            <Skeleton variant="text" width="70%" height={48} sx={{ mt: 1.5, mb: 1 }} />
            {secondaryLabel && <Skeleton variant="text" width="55%" height={24} sx={{ mb: 1 }} />}
            <Skeleton variant="text" width="45%" height={24} />
          </>
        ) : (
          <>
            <Box sx={{ mt: 1.5, mb: secondaryLabel ? 0.75 : 1, typography: 'h3' }}>
              {formatValue(total)}
            </Box>
            {secondaryLabel && (
              <Box sx={{ mb: 1, typography: 'body2', color: 'text.secondary' }}>
                {secondaryLabel}:{' '}
                <Box component="span" sx={{ color: 'warning.main', fontWeight: 600 }}>
                  {formatValue(secondaryValue)}
                </Box>
              </Box>
            )}
            {renderTrending}
          </>
        )}
      </Box>

      {!loading && (
        <Chart
          type="bar"
          series={[{ data: chart.series }]}
          options={chartOptions}
          width={60}
          height={40}
        />
      )}
    </Card>
  );
}
