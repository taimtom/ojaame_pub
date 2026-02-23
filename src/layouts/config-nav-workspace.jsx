import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

export const _workspaces = [
  {
    id: 'team-1',
    storeName: 'Store 1',
    avatarUrl: `${CONFIG.site.basePath}/assets/icons/workspaces/logo-1.webp`,
    plan: 'Free',
  },
  {
    id: 'team-2',
    storeName: 'Store 2',
    avatarUrl: `${CONFIG.site.basePath}/assets/icons/workspaces/logo-2.webp`,
    plan: 'Premium',
  },
  {
    id: 'team-3',
    storeName: 'Store 3',
    avatarUrl: `${CONFIG.site.basePath}/assets/icons/workspaces/logo-3.webp`,
    plan: 'Premium',
  },
];

// Assuming _mock utility functions exist as placeholders for generating mock data
export const _storeList = [
  ..._workspaces.map((workspace, index) => ({
    id: workspace.id,
    storeEmail: `store${index + 1}@example.com`,
    address: `Address for ${workspace.storeName}`,
    storeName: workspace.storeName,
    isVerified: workspace.plan === 'Premium', // Assuming Premium plans are verified
    avatarUrl: workspace.avatarUrl, // Use the logo as the avatar
    phoneNumber: `+123456789${index}`,
    status: 'active', // Default status for workspaces
  })),
  ...[...Array(17)].map((_, index) => ({
    id: `store-${index + 4}`, // Ensure unique IDs after workspace entries
    storeEmail: `randomstore${index + 1}@example.com`,
    address: `908 Jack Locks`,
    storeName: `Random Store ${index + 1}`,
    isVerified: index % 2 === 0,
    avatarUrl: `https://source.unsplash.com/random/100x100?sig=${index}`,
    phoneNumber: `+123456789${index + 10}`,
    status:
      (index % 2 && 'pending') || (index % 3 && 'banned') || (index % 4 && 'rejected') || 'active',
  })),
];
