import { useMemo, useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { fShortenNumber } from 'src/utils/format-number';

import { useStoreYearlySales } from 'src/actions/dashboard';

import { Chart, useChart, ChartSelect, ChartLegends } from 'src/components/chart';

export function AppYearlySales({ title, subheader, storeId, ...other }) {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  // const yearOptions = [2025, 2024, 2023, 2022, 2021];
  const yearOptions = useMemo(
    () => Array.from({ length: 50 }, (_, i) => currentYear - i),
    [currentYear]
  );
  const [year, setYear] = useState(currentYear);

  const { data, loading } = useStoreYearlySales(storeId, year);

  const monthly = data?.monthly_data || [];
  const categories = monthly.map((m) => m.month);

  const series = [
    {
      name: 'Income',
      data: monthly.map((m) => m.income || 0),
    },
    {
      name: 'Expenses',
      data: monthly.map((m) => m.expenses || 0),
    },
  ];

  const chartColors = [theme.palette.primary.main, theme.palette.error.main];
  const chartOptions = useChart({
    colors: chartColors,
    xaxis: { categories },
  });

  const handleChangeYear = useCallback((value) => {
    setYear(Number(value));
  }, []);

  return (
    <Card {...other} sx={{ opacity: loading ? 0.5 : 1 }}>
      <CardHeader
        title={title}
        subheader={`${subheader} (${year})`}
        action={
          <ChartSelect
            options={yearOptions.map(String)}
            value={String(year)}
            onChange={handleChangeYear}
          />
        }
        sx={{ mb: 3 }}
      />

      <ChartLegends
        colors={chartColors}
        labels={['Income', 'Expenses']}
        values={[
          fShortenNumber(data?.total_income || 0),
          fShortenNumber(data?.total_expenses || 0),
        ]}
        sx={{ px: 3, gap: 3 }}
      />

      <Chart
        type="area"
        series={series}
        options={chartOptions}
        height={320}
        sx={{ py: 2.5, pl: 1, pr: 2.5 }}
      />
    </Card>
  );
}
