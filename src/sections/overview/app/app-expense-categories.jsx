import {useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { fCurrency } from 'src/utils/format-number';

import { Chart, useChart, ChartSelect, ChartLegends } from 'src/components/chart';

export function AppExpenseCategories({
  title,
  subheader,
  chart,
  period,
  periodOptions = ['day', 'month', 'year'],
  onPeriodChange,
  ...other
}) {
  const theme = useTheme();

  // Local handler wraps string -> ChartSelect signature
  const handlePeriodChange = useCallback(
    (newValue) => onPeriodChange && onPeriodChange(newValue),
    [onPeriodChange]
  );

  const chartColors = chart.colors ?? [
    theme.palette.secondary.dark,
    theme.palette.error.main,
    theme.palette.primary.main,
    theme.palette.warning.main,
    theme.palette.info.dark,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.dark,
  ];

  const seriesValues = chart.series.map((item) => item.value);
  const labels       = chart.series.map((item) => item.label);

  const chartOptions = useChart({
    chart: { offsetY: 12 },
    colors: chartColors,
    labels,
    stroke: { width: 1, colors: [theme.palette.background.paper] },
    fill: { opacity: 0.88 },
    tooltip: { y: { formatter: (value) => fCurrency(value) } },
    plotOptions: { pie: { donut: { labels: { show: false } } } },
    ...chart.options,
  });

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={`${subheader} (${period})`}
        action={
          <ChartSelect
            options={periodOptions}
            value={period}
            onChange={handlePeriodChange}
            sx={{ minWidth: 80 }}
          />
        }
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          pt: 4,
          pb: 3,
          rowGap: 3,
          columnGap: 5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Chart
          type="polarArea"
          series={seriesValues}
          options={chartOptions}
          width={{ xs: 240, md: 280 }}
          height={{ xs: 240, md: 280 }}
        />

        <ChartLegends
          colors={chartOptions.colors}
          labels={chartOptions.labels}
          icons={chart.icons}
          sublabels={seriesValues.map((v) => fCurrency(v))}
          sx={{ gap: 2.5, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}
        />
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box
        display="grid"
        gridTemplateColumns="repeat(2, 1fr)"
        sx={{ textAlign: 'center', typography: 'h4' }}
      >
        <Box sx={{ py: 2, borderRight: `dashed 1px ${theme.vars.palette.divider}` }}>
          <Box sx={{ mb: 1, typography: 'body2', color: 'text.secondary' }}>Categories</Box>
          {labels.length}
        </Box>

        <Box sx={{ py: 2 }}>
          <Box sx={{ mb: 1, typography: 'body2', color: 'text.secondary' }}>Total</Box>
          {fCurrency(seriesValues.reduce((sum, v) => sum + v, 0))}
        </Box>
      </Box>
    </Card>
  );
}
