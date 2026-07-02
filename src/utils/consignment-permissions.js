const EDITABLE = new Set(['requested']);

const ACTIVE_STATUSES = new Set(['requested', 'received', 'return_overdue']);
const DONE_STATUSES = new Set(['sold_out', 'returned', 'completed', 'settled', 'closed']);

export const CONSIGNMENT_ACTION_LABELS = {
  receive: 'Mark received',
  return: 'Return unsold',
  partner_sale: 'Record partner sale',
};

export const LENDING_ACTION_LABELS = {
  receive: 'Mark sent',
  return: 'Return unsold',
  partner_sale: 'Record partner sale',
};

export const CONSIGNMENT_STATUS_COLORS = {
  requested: 'warning',
  received: 'success',
  sold_out: 'success',
  returned: 'default',
  completed: 'success',
  return_overdue: 'error',
  settled: 'primary',
  closed: 'default',
  partial_sold: 'warning',
};

export const CONSIGNMENT_STATUS_LABELS = {
  requested: 'Requested',
  received: 'In stock',
  sold_out: 'Sold',
  returned: 'Returned',
  completed: 'Done',
  return_overdue: 'Return overdue',
  settled: 'Settled',
  closed: 'Closed',
  partial_sold: 'Partially sold',
};

export const LENDING_STATUS_LABELS = {
  requested: 'Recorded',
  received: 'Sent',
  sold_out: 'Sold',
  returned: 'Returned',
  completed: 'Done',
  return_overdue: 'Return overdue',
  settled: 'Settled',
  closed: 'Closed',
  partial_sold: 'Partially sold',
};

export const LENDING_EVENT_LABELS = {
  requested: 'Recorded by',
  recorded: 'Recorded by',
  received: 'Sent',
  sent: 'Sent',
  sold: 'Sold',
  returned: 'Returned',
  partner_sale_recorded: 'Partner sale recorded',
  settled: 'Settled',
  closed: 'Closed',
  return_overdue: 'Return overdue',
  updated: 'Updated',
};

export const BORROWING_EVENT_LABELS = {
  requested: 'Requested',
  received: 'Received',
  sold: 'Sold',
  returned: 'Returned',
  partner_sale_recorded: 'Partner sale recorded',
  settled: 'Settled',
  closed: 'Closed',
  return_overdue: 'Return overdue',
  updated: 'Updated',
};

export function getConsignmentStatusLabel(status, direction = 'borrowing') {
  if (!status) return '—';
  const map = direction === 'lending' ? LENDING_STATUS_LABELS : CONSIGNMENT_STATUS_LABELS;
  return map[status] || status.replace(/_/g, ' ');
}

export function getConsignmentEventLabel(eventType, direction = 'borrowing') {
  if (!eventType) return '—';
  const map = direction === 'lending' ? LENDING_EVENT_LABELS : BORROWING_EVENT_LABELS;
  return map[eventType] || eventType.replace(/_/g, ' ');
}

export function getConsignmentActionLabel(actionKey, direction = 'borrowing') {
  const map = direction === 'lending' ? LENDING_ACTION_LABELS : CONSIGNMENT_ACTION_LABELS;
  return map[actionKey] || actionKey;
}

export function formatItemProgress(item, direction = 'borrowing') {
  const sold = Number(item?.qty_sold || 0);
  const left = item.qty_on_hand != null ? Number(item.qty_on_hand) : itemOnHand(item);
  if (sold > 0 && left === 0) {
    return `${sold} sold`;
  }
  if (sold > 0 && left > 0) {
    return direction === 'lending'
      ? `${sold} sold · ${left} with partner`
      : `${sold} sold · ${left} left`;
  }
  if (left > 0) {
    return direction === 'lending' ? `${left} with partner` : `${left} left`;
  }
  const returned = Number(item?.qty_returned || 0);
  if (returned > 0) {
    return `${returned} returned`;
  }
  return direction === 'lending' ? 'Not sent yet' : 'Pending';
}

export function getItemQuantityDetails(item) {
  const qtySent = Number(item?.qty_sent || 0);
  const qtyReceived = Number(item?.qty_received || 0);
  const qtySold = Number(item?.qty_sold || 0);
  const qtyReturned = Number(item?.qty_returned || 0);
  const qtyDamaged = Number(item?.qty_damaged || 0);
  const onHand = item?.qty_on_hand != null ? Number(item.qty_on_hand) : itemOnHand(item);

  const rows = [
    { label: 'Originally sent', value: qtySent },
    { label: 'Received', value: qtyReceived },
    { label: 'Sold', value: qtySold },
  ];

  if (qtyReturned > 0) {
    rows.push({ label: 'Returned', value: qtyReturned });
  }
  if (qtyDamaged > 0) {
    rows.push({ label: 'Damaged', value: qtyDamaged });
  }
  if (onHand > 0) {
    rows.push({ label: 'Still on hand', value: onHand });
  }

  return rows;
}

export function itemOnHand(item) {
  return Math.max(
    0,
    Number(item?.qty_received || 0) - Number(item?.qty_sold || 0) - Number(item?.qty_returned || 0)
  );
}

export function getSettlementLabel(direction = 'borrowing') {
  return direction === 'lending' ? 'Owed to you when sold' : 'Cost to owner';
}

export function consignmentHasOnHand(consignment) {
  return (consignment?.items || []).some((i) => itemOnHand(i) > 0);
}

export function isActiveConsignment(consignment) {
  return ACTIVE_STATUSES.has(consignment?.status || '');
}

export function isDoneConsignment(consignment) {
  return DONE_STATUSES.has(consignment?.status || '');
}

export function getConsignmentActionAccess({ userPermissions, currentStoreId, consignment }) {
  const perms = userPermissions || [];
  const canUpdate =
    perms.includes('inventory.manage') ||
    perms.includes('inventory.update') ||
    perms.includes('stores.read');

  const isHolder = Number(consignment?.holder_store_id) === Number(currentStoreId);
  const isOwner = Number(consignment?.owner_store_id) === Number(currentStoreId);
  const status = consignment?.status || '';
  const isBorrowing = consignment?.direction === 'borrowing';
  const isLending = consignment?.direction === 'lending';

  const hasUnreturned = consignmentHasOnHand(consignment);

  return {
    canEdit: canUpdate && EDITABLE.has(status),
    canReceive:
      canUpdate &&
      status === 'requested' &&
      ((isBorrowing && isHolder) || (isLending && isOwner)),
    canRecordPartnerSale:
      canUpdate &&
      isLending &&
      isOwner &&
      ['received', 'return_overdue'].includes(status) &&
      hasUnreturned,
    canReturn:
      canUpdate &&
      (status === 'received' || status === 'return_overdue') &&
      hasUnreturned,
  };
}
