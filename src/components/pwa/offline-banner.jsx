import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

import { usePathname } from 'src/routes/hooks';
import { useNetworkStatus } from 'src/hooks/use-network-status';

export function OfflineBanner() {
  const pathname = usePathname();
  const { isOnline } = useNetworkStatus();

  if (!pathname.startsWith('/app') || isOnline) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
      }}
    >
      <Alert
        severity="warning"
        variant="filled"
        sx={{ borderRadius: 0, justifyContent: 'center', py: 0.5 }}
      >
        You are offline. POS sales are queued and will sync when you reconnect.
      </Alert>
    </Box>
  );
}
