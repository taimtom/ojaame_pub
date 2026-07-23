import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';

// ----------------------------------------------------------------------

export function AppDashboardLauncher({
  header,
  hero,
  activity,
  shortcuts,
  sx,
  ...other
}) {
  const showActivity = activity && !activity.collapseWhenEmpty;

  return (
    <Card
      id="overview-tour-launcher"
      sx={{
        overflow: 'hidden',
        bgcolor: 'background.paper',
        ...sx,
      }}
      {...other}
    >
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>
        <Box id="overview-tour-welcome">{header}</Box>

        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mt: { xs: 2, md: 2.5 } }}>
          <Grid xs={12} lg={showActivity ? 8 : 12}>
            {hero}
          </Grid>

          {showActivity && (
            <Grid xs={12} lg={4} sx={{ display: 'flex', minWidth: 0 }}>
              {activity?.node}
            </Grid>
          )}
        </Grid>

        {shortcuts && (
          <>
            <Divider sx={{ my: { xs: 2, md: 2.5 } }} />
            <Box id="overview-tour-shortcuts">{shortcuts}</Box>
          </>
        )}
      </Box>
    </Card>
  );
}
