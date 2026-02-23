import ApexChart from 'react-apexcharts';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

export function Chart({ sx, type, series, height, options, width = '100%', ...other }) {
  return (
    <Box
      dir="ltr"
      sx={{
        width,
        height,
        flexShrink: 0,
        borderRadius: 1.5,
        position: 'relative',
        ...sx,
      }}
      {...other}
    >
      <ApexChart type={type} series={series} options={options} width="100%" height="100%" />
    </Box>
  );
}
