import { useState } from 'react';

import { usePathname } from 'src/routes/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';
import { usePwaInstall } from 'src/hooks/use-pwa-install';

export function PwaInstallBanner() {
  const pathname = usePathname();
  const { isInstallable, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!pathname.startsWith('/app') || !isInstallable || dismissed) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        width: { xs: 'calc(100% - 32px)', sm: 480 },
      }}
    >
      <Alert
        severity="info"
        icon={false}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              onClick={install}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Install App
            </Button>
            <IconButton size="small" onClick={() => setDismissed(true)} aria-label="close">
              <Iconify icon="mingcute:close-line" width={18} />
            </IconButton>
          </Box>
        }
        sx={{ alignItems: 'center', boxShadow: 6, borderRadius: 2 }}
      >
        Install <strong>Ojaa Me</strong> on your device for the best experience.
      </Alert>
    </Box>
  );
}
