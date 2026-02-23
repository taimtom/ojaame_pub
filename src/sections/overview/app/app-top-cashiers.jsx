// src/sections/overview/app/app-top-cashiers.jsx
import React, { useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Select from '@mui/material/Select';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import { alpha, useTheme } from '@mui/material/styles';

import { orderBy } from 'src/utils/helper';
import { fCurrency } from 'src/utils/format-number';

import { useStoreTopCashiers } from 'src/actions/dashboard';

import { Iconify } from 'src/components/iconify';

export function AppTopCashiers({ title, subheader, storeId, sx, ...other }) {
  const theme = useTheme();
  const [period, setPeriod] = React.useState('year');
  const [limit, setLimit]   = React.useState(10);

  const {
    topCashiers = [],
    topCashiersLoading,
    refetchTopCashiers,
  } = useStoreTopCashiers(storeId, { period, limit });

  // Re-fetch whenever period or limit change
  useEffect(() => {
    if (refetchTopCashiers) refetchTopCashiers();
  }, [period, limit, refetchTopCashiers]);

  // Sort by performance_rank ASC
  const list = orderBy(topCashiers, ['performance_rank'], ['asc']);

  return (
    <Card sx={sx} {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small">
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={(e) => setPeriod(e.target.value)}
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Limit</InputLabel>
              <Select
                value={limit}
                label="Limit"
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        }
        sx={{ mb: 2 }}
      />

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {list.map((c, idx) => {
          // choose color channel and icon style based on rank
          const isMedal = idx < 3;
          const colorKey = idx === 0 ? 'primary' : idx === 1 ? 'info' : 'error';
          return (
            <Box
              key={c.staff_id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: idx % 2 === 0
                  ? alpha(theme.palette.primary.main, 0.04)
                  : 'transparent',
                p: 1,
                borderRadius: 1,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                }}
              >
                {c.name.charAt(0)}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ typography: 'subtitle2' }}>{c.name}</Box>
                <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
                  {`Rank #${c.performance_rank}`}
                </Box>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Box sx={{ typography: 'body2' }}>{`${c.sales_count} txns`}</Box>
                <Box sx={{ typography: 'body2', fontWeight: 'bold' }}>
                  {fCurrency(c.revenue)}
                </Box>
              </Box>

              {/* Medal / badge for top-3 */}
              {isMedal && (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette[colorKey].main,
                    bgcolor: alpha(theme.palette[colorKey].main, 0.08),
                  }}
                >
                  <Iconify width={24} icon="solar:cup-star-bold" />
                </Box>
              )}
            </Box>
          );
        })}

        {!topCashiersLoading && list.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Iconify icon="eva:person-add-outline" sx={{ fontSize: 48, mb: 1 }} />
            No cashiers to display
          </Box>
        )}
      </Box>
    </Card>
  );
}
