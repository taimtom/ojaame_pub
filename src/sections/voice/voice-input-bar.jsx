import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';

import { VoiceMicButton } from './voice-mic-button';
import { VoiceDraftPreview } from './voice-draft-preview';
import { VoiceCoach } from './voice-coach';

// ----------------------------------------------------------------------

/**
 * Shared voice entry for sale / restock / add_product.
 * onConfirm receives a resolved draft — parent mutates cart/form only.
 */
export function VoiceInputBar({
  storeId,
  intentHint = 'sale',
  offline = false,
  disabled = false,
  showCoach = false,
  onConfirm,
  sx,
}) {
  const [result, setResult] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleDraft = useCallback((payload) => {
    setResult(payload);
    setPreviewOpen(true);
  }, []);

  const closePreview = () => {
    setPreviewOpen(false);
    setResult(null);
  };

  return (
    <Box sx={sx}>
      {showCoach ? <VoiceCoach intentHint={intentHint} /> : null}
      <VoiceMicButton
        storeId={storeId}
        intentHint={intentHint}
        offline={offline}
        disabled={disabled}
        onDraft={handleDraft}
      />
      <VoiceDraftPreview
        open={previewOpen}
        result={result}
        storeId={storeId}
        intentHint={intentHint}
        onClose={closePreview}
        onSpeakAgain={closePreview}
        onConfirm={(draft) => {
          onConfirm?.(draft);
          closePreview();
        }}
      />
    </Box>
  );
}
