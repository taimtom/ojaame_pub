import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function AppDashboardHeader({ userName, storeName, dateLabel, sx, ...other }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        ...sx,
      }}
      {...other}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: { xs: '1.125rem', sm: '1.5rem' } }}
          noWrap
        >
          Hi, {userName || 'there'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }} noWrap>
          {storeName ? `${storeName} · ` : ''}
          {dateLabel}
        </Typography>
      </Box>
    </Box>
  );
}
