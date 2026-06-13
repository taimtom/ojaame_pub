import dayjs from 'dayjs';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// ─── Constants ────────────────────────────────────────────────────────────────

export const REPORT_PERIODS = [
  { value: 'today',        label: 'Today' },
  { value: 'this_week',    label: 'This Week' },
  { value: 'this_month',   label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year',    label: 'This Year' },
  { value: 'custom_month', label: 'Custom Month' },
  { value: 'custom_year',  label: 'Custom Year' },
  { value: 'custom_day',   label: 'Custom Day' },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ReportPeriodSelector
 *
 * Props
 * -----
 * period       string   – current period value
 * onChange     fn       – called with { period, month, year, date }
 * label        string   – select label (default "Period")
 * size         string   – 'small' | 'medium' (default 'small')
 * minWidth     number   – min-width of the select (default 160)
 */
export function ReportPeriodSelector({
  period = 'this_month',
  onChange,
  label = 'Period',
  size = 'small',
  minWidth = 160,
}) {
  const [pickerDate, setPickerDate] = useState(dayjs());

  const emit = useCallback(
    (nextPeriod, d) => {
      if (!onChange) return;
      const dj = d || pickerDate || dayjs();
      onChange({
        period: nextPeriod,
        month: dj.month() + 1,
        year: dj.year(),
        date: dj.format('YYYY-MM-DD'),
      });
    },
    [onChange, pickerDate]
  );

  const handlePeriodChange = (e) => {
    emit(e.target.value, pickerDate);
  };

  const handleDateChange = (newDate) => {
    if (!newDate) return;
    setPickerDate(newDate);
    emit(period, newDate);
  };

  const showMonthPicker = period === 'custom_month';
  const showYearPicker = period === 'custom_year';
  const showDayPicker = period === 'custom_day';
  const showPicker = showMonthPicker || showYearPicker || showDayPicker;

  const pickerViews = showYearPicker
    ? ['year']
    : showMonthPicker
    ? ['year', 'month']
    : ['year', 'month', 'day'];

  const pickerLabel = showYearPicker
    ? 'Select year'
    : showMonthPicker
    ? 'Select month'
    : 'Select date';

  const pickerOpenTo = showYearPicker ? 'year' : showMonthPicker ? 'month' : 'day';

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
      <FormControl size={size} sx={{ minWidth }}>
        <InputLabel>{label}</InputLabel>
        <Select value={period} label={label} onChange={handlePeriodChange}>
          {REPORT_PERIODS.map((p) => (
            <MenuItem key={p.value} value={p.value}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showPicker && (
        <Box>
          <DatePicker
            label={pickerLabel}
            views={pickerViews}
            openTo={pickerOpenTo}
            value={pickerDate}
            onChange={handleDateChange}
            slotProps={{ textField: { size, sx: { minWidth: 160 } } }}
          />
        </Box>
      )}
    </Stack>
  );
}
