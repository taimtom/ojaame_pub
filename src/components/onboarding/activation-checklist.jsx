import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

export function ActivationChecklist({ progress }) {
  const checklist = progress?.activation_checklist || [];
  const percent = progress?.activation_percent || 0;

  if (!checklist.length) return null;

  return (
    <Card sx={{ p: { xs: 2, md: 3 }, mb: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">Setup momentum</Typography>
          <Typography variant="subtitle2" color="primary.main">
            {percent}%
          </Typography>
        </Stack>

        <LinearProgress variant="determinate" value={percent} />

        <Stack direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" useFlexGap gap={1}>
          {checklist.map((item) => (
            <Stack
              key={item.key}
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                px: 1.25,
                py: 0.75,
                borderRadius: 1,
                bgcolor: item.done ? 'success.lighter' : 'background.neutral',
                color: item.done ? 'success.darker' : 'text.secondary',
              }}
            >
              <Iconify icon={item.done ? 'eva:checkmark-circle-2-fill' : 'eva:radio-button-off-fill'} width={16} />
              <Box>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                  {item.label}
                </Typography>
                {item.key === 'preview' && item.done && (
                  <Typography variant="caption" color="text.disabled">
                    Done on ojaa.me
                  </Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
