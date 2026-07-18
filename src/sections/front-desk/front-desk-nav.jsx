import { useMemo } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname } from 'src/routes/hooks';

import { usePermissions } from 'src/hooks/use-permissions';

// ----------------------------------------------------------------------

const ALL_TABS = [
  { value: 'board', label: 'Board', href: paths.dashboard.frontDesk },
  { value: 'calendar', label: 'Calendar', href: paths.dashboard.frontDeskCalendar },
  { value: 'housekeeping', label: 'Housekeeping', href: paths.dashboard.frontDeskHousekeeping },
  {
    value: 'setup',
    label: 'Setup',
    href: paths.dashboard.frontDeskSetup,
    // Room types / physical rooms — manager+ only
    requireManage: true,
  },
];

function resolveTab(pathname) {
  if (!pathname) return 'board';
  if (pathname.includes('/front-desk/calendar')) return 'calendar';
  if (pathname.includes('/front-desk/housekeeping')) return 'housekeeping';
  if (pathname.includes('/front-desk/setup')) return 'setup';
  return 'board';
}

export function FrontDeskNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const canManageRooms = hasPermission('rooms.manage');

  const tabs = useMemo(
    () => ALL_TABS.filter((tab) => !tab.requireManage || canManageRooms),
    [canManageRooms]
  );

  const current = resolveTab(pathname);
  const tabValue = tabs.some((t) => t.value === current) ? current : 'board';

  return (
    <Stack sx={{ mb: 3 }}>
      <Tabs
        value={tabValue}
        onChange={(_, v) => {
          const tab = tabs.find((t) => t.value === v);
          if (tab) router.push(tab.href);
        }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>
    </Stack>
  );
}
