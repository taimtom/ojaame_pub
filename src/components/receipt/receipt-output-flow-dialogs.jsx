import { ReceiptAdjustmentDialog } from './receipt-adjustment-dialog';
import { ReceiptCopyChoiceDialog } from './receipt-copy-choice-dialog';

// ----------------------------------------------------------------------

export function ReceiptOutputFlowDialogs({
  receipt,
  storeId,
  dialogs,
}) {
  if (!dialogs) return null;

  const {
    adjustmentOpen,
    setAdjustmentOpen,
    choiceOpen,
    setChoiceOpen,
    handleChoice,
    handleAdjustmentApplied,
    cancelFlow,
  } = dialogs;

  const handleCloseAdjustment = () => {
    setAdjustmentOpen(false);
    cancelFlow?.();
  };

  const handleCloseChoice = () => {
    setChoiceOpen(false);
    cancelFlow?.();
  };

  return (
    <>
      <ReceiptAdjustmentDialog
        open={adjustmentOpen}
        onClose={handleCloseAdjustment}
        receipt={receipt}
        storeId={storeId}
        onApplied={handleAdjustmentApplied}
      />

      <ReceiptCopyChoiceDialog
        open={choiceOpen}
        onClose={handleCloseChoice}
        receipt={receipt}
        adjustment={receipt?.receipt_display_adjustment}
        onChoose={handleChoice}
      />
    </>
  );
}
