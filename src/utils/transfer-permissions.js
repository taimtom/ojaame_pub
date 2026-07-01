import { hasPermission, hasAnyPermission } from './permissions';

/**
 * Transfer workflow action permissions.
 * Uses inventory.* permissions; inventory.manage bypasses store-role checks.
 */
export function getTransferActionAccess({
  userPermissions,
  currentUserId,
  currentStoreId,
  transfer,
}) {
  const canManage = hasPermission(userPermissions, 'inventory.manage');
  const canCreate = canManage || hasPermission(userPermissions, 'inventory.create');
  const canUpdate = canManage || hasPermission(userPermissions, 'inventory.update');
  const canRead = canManage || hasAnyPermission(userPermissions, ['inventory.read', 'stores.read']);

  const sourceId = Number(transfer?.source_store_id);
  const destId = Number(transfer?.destination_store_id);
  const storeId = Number(currentStoreId);
  const isSourceStore = storeId === sourceId;
  const isDestStore = storeId === destId;

  const status = transfer?.status;

  return {
    canRead,
    canCreate,
    canPack:
      canUpdate &&
      (canManage || isSourceStore) &&
      status === 'created',
    canAssignDriver:
      canUpdate &&
      (canManage || isSourceStore) &&
      ['created', 'packed'].includes(status),
    canEdit:
      canUpdate &&
      (canManage || isSourceStore) &&
      ['created', 'packed', 'picked_up'].includes(status),
    canPickup:
      canUpdate &&
      (canManage || isSourceStore) &&
      status === 'packed',
    canInTransit:
      canUpdate &&
      (canManage || isSourceStore) &&
      status === 'picked_up',
    canDeliver:
      canUpdate &&
      (canManage || isSourceStore) &&
      ['picked_up', 'in_transit'].includes(status),
    canReceive:
      canUpdate &&
      (canManage || isDestStore) &&
      ['delivered', 'in_transit', 'picked_up'].includes(status),
    canClose:
      canUpdate &&
      (canManage || isDestStore || isSourceStore) &&
      ['received', 'reconciled_with_exception'].includes(status),
  };
}

export const TRANSFER_ACTION_LABELS = {
  pack: 'Pack',
  assign: 'Assign driver',
  edit: 'Edit transfer',
  pickup: 'Confirm pickup',
  transit: 'Mark in transit',
  deliver: 'Mark delivered',
  receive: 'Receive & reconcile',
  close: 'Close transfer',
};
