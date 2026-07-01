export const ONBOARDING_QUERY_PARAM = 'onboarding';
export const ONBOARDING_QUERY_VALUE = '1';

export const ONBOARDING_STEPS = [
  { key: 'card', label: 'Payment method' },
  { key: 'store', label: 'Create store' },
  { key: 'staff', label: 'Invite team' },
  { key: 'products', label: 'Add products' },
  { key: 'customers', label: 'Add customers' },
  { key: 'receipt', label: 'Receipt & printer' },
  { key: 'sales', label: 'Record sales' },
  { key: 'report', label: 'Customer report' },
];

export const ONBOARDING_STEP_KEYS = ONBOARDING_STEPS.map((s) => s.key);

/** Steps the owner may skip during guided setup (store creation is required). */
export const SKIPPABLE_STEP_KEYS = ONBOARDING_STEP_KEYS.filter((key) => key !== 'store');
