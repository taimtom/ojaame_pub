import { useCallback, useRef, useState } from 'react';

import {
  buildDisplayReceipt,
  buildDisplayReceiptFromSummary,
} from 'src/utils/receipt-display-adjustment';
import { useReceiptAdjustmentSetting } from 'src/hooks/use-receipt-adjustment-setting';

// ----------------------------------------------------------------------

/**
 * Orchestrates receipt adjustment dialogs before print/share output.
 */
export function useReceiptOutputFlow({ storeId }) {
  const { featureAvailable } = useReceiptAdjustmentSetting(storeId);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);

  const pendingActionRef = useRef(null);
  const pendingCancelRef = useRef(null);
  const activeReceiptRef = useRef(null);

  const cancelFlow = useCallback(() => {
    if (pendingCancelRef.current) {
      pendingCancelRef.current();
    }
    pendingActionRef.current = null;
    pendingCancelRef.current = null;
    activeReceiptRef.current = null;
    setActiveReceipt(null);
    setAdjustmentOpen(false);
    setChoiceOpen(false);
  }, []);

  const completeFlow = useCallback((outputReceipt) => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    pendingCancelRef.current = null;
    activeReceiptRef.current = null;
    setActiveReceipt(null);
    setAdjustmentOpen(false);
    setChoiceOpen(false);
    if (action) {
      action(outputReceipt);
    }
  }, []);

  const resolveOutputReceipt = useCallback((sourceReceipt, choice) => {
    if (choice === 'original') return sourceReceipt;
    if (choice === 'adjusted') {
      return buildDisplayReceiptFromSummary(sourceReceipt);
    }
    return sourceReceipt;
  }, []);

  const runWithReceiptOutput = useCallback(
    (receipt, action, onCancel) => {
      if (!receipt) return;

      activeReceiptRef.current = receipt;
      setActiveReceipt(receipt);
      pendingCancelRef.current = onCancel || null;
      pendingActionRef.current = action;

      const existing = receipt.receipt_display_adjustment;

      if (existing) {
        setChoiceOpen(true);
        return;
      }

      if (featureAvailable) {
        setAdjustmentOpen(true);
        return;
      }

      pendingCancelRef.current = null;
      pendingActionRef.current = null;
      activeReceiptRef.current = null;
      setActiveReceipt(null);
      action(receipt);
    },
    [featureAvailable]
  );

  const handleChoice = useCallback(
    (choice) => {
      const source = activeReceiptRef.current;
      if (!pendingActionRef.current || !source) return;
      completeFlow(resolveOutputReceipt(source, choice));
    },
    [completeFlow, resolveOutputReceipt]
  );

  const handleAdjustmentApplied = useCallback(
    ({ useOriginal, receipt: nextReceipt, adjustment }) => {
      if (!pendingActionRef.current) return;
      const source = activeReceiptRef.current;
      const outputReceipt = useOriginal
        ? source
        : buildDisplayReceipt(nextReceipt, adjustment);
      completeFlow(outputReceipt);
    },
    [completeFlow]
  );

  const dialogs = {
    adjustmentOpen,
    setAdjustmentOpen,
    choiceOpen,
    setChoiceOpen,
    handleChoice,
    handleAdjustmentApplied,
    cancelFlow,
    featureAvailable,
  };

  return {
    activeReceipt,
    runWithReceiptOutput,
    dialogs,
  };
}
