const AMOUNT_EPS = 0.02;

/** Preview FIFO allocation across outstanding invoices (matches backend). */
export function previewFifoAllocation(outstandingInvoices, targetAmount) {
  let remaining = Number(targetAmount) || 0;
  const preview = [];

  (outstandingInvoices || []).forEach((inv) => {
    if (remaining <= AMOUNT_EPS) return;

    const balanceBefore = Number(inv.balance_due) || 0;
    const amountApplied = Math.min(remaining, balanceBefore);
    if (amountApplied <= AMOUNT_EPS) return;

    const balanceAfter = balanceBefore - amountApplied;
    preview.push({
      sale_id: inv.sale_id,
      invoice_number: inv.invoice_number,
      amount_applied: amountApplied,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      new_status: balanceAfter <= AMOUNT_EPS ? 'paid' : 'credit',
    });
    remaining -= amountApplied;
  });

  return preview;
}

export function totalOutstanding(outstandingInvoices) {
  return (outstandingInvoices || []).reduce(
    (sum, inv) => sum + (Number(inv.balance_due) || 0),
    0
  );
}
