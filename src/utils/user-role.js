const OWNER_ROLE_NAMES = new Set(['merchant', 'owner']);

export function formatUserRole(role) {
  if (!role) return '';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function canAccessCompanyBillingSettings({ role, isOwner = false } = {}) {
  if (isOwner) return true;
  const normalizedRole = (role || '').toLowerCase();
  return OWNER_ROLE_NAMES.has(normalizedRole);
}
