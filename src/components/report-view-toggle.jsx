import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';

/**
 * <ReportViewToggle value="list" onChange={setMode} />
 * value: 'list' | 'chart'
 */
export function ReportViewToggle({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, newVal) => { if (newVal) onChange(newVal); }}
      size="small"
      sx={{ ml: 1 }}
    >
      <ToggleButton value="list" sx={{ px: 1.25 }}>
        <Tooltip title="Table view">
          <Iconify icon="solar:list-bold" width={18} />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="chart" sx={{ px: 1.25 }}>
        <Tooltip title="Chart view">
          <Iconify icon="solar:chart-2-bold" width={18} />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
