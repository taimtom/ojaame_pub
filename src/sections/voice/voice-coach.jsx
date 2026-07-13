import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  hasSeenVoiceCoach,
  markVoiceCoachSeen,
  voiceCoachExamples,
  getStickyVoiceLanguage,
} from './voice-storage';

// ----------------------------------------------------------------------

export function VoiceCoach({ intentHint = 'sale' }) {
  const [open, setOpen] = useState(() => !hasSeenVoiceCoach());

  if (!open) return null;

  const examples = voiceCoachExamples(getStickyVoiceLanguage()).filter((ex) => {
    if (intentHint === 'sale') return /sell|ta |sayi|ree/i.test(ex) || ex.toLowerCase().includes('sell');
    if (intentHint === 'restock') return /restock/i.test(ex) || true;
    return /add product/i.test(ex) || true;
  }).slice(0, 3);

  return (
    <Alert
      severity="info"
      sx={{ mb: 1.5 }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={() => {
            markVoiceCoachSeen();
            setOpen(false);
          }}
        >
          Got it
        </Button>
      }
    >
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Hold the mic and say what you need
      </Typography>
      <Stack component="ul" sx={{ m: 0, pl: 2 }}>
        {examples.map((ex) => (
          <Typography component="li" key={ex} variant="caption">
            “{ex}”
          </Typography>
        ))}
      </Stack>
    </Alert>
  );
}
