import { useEffect } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';
import { useSearchParams } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DashboardContent } from 'src/layouts/dashboard';

import { AccountGeneral } from '../account-general';
import { AccountCompany } from '../account-company';
import { AccountBilling } from '../account-billing';
import { AccountChangePassword } from '../account-change-password';
import { AccountThemeSettings } from '../account-theme-settings';
import { AccountFinance } from '../account-finance';
import { AccountPrinterSettings } from '../account-printer-settings';
import { AccountReceiptSettings } from '../account-receipt-settings';
import { OnboardingSetupShell } from 'src/components/onboarding/onboarding-setup-shell';
import { useOnboardingMode } from 'src/hooks/use-onboarding-mode';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'general', label: 'General', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  { value: 'company', label: 'Company', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  { value: 'billing', label: 'Billing', icon: <Iconify icon="solar:bill-list-bold" width={24} /> },
  { value: 'security', label: 'Security', icon: <Iconify icon="ic:round-vpn-key" width={24} /> },
  {
    value: 'theme-settings',
    label: 'Theme settings',
    icon: <Iconify icon="solar:settings-bold-duotone" width={24} />,
  },
  {
    value: 'finance',
    label: 'Finance',
    icon: <Iconify icon="solar:dollar-minimalistic-bold-duotone" width={24} />,
  },
  {
    value: 'printer',
    label: 'Printer',
    icon: <Iconify icon="solar:printer-minimalistic-bold" width={24} />,
  },
  {
    value: 'receipt',
    label: 'Receipts',
    icon: <Iconify icon="mdi:receipt-text-outline" width={24} />,
  },
];

// ----------------------------------------------------------------------

export function AccountView() {
  const tabs = useTabs('general');
  const searchParams = useSearchParams();
  const onboarding = useOnboardingMode();

  // Auto-switch to the tab specified in the URL query param (e.g. ?tab=theme-settings)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some((t) => t.value === tabParam)) {
      tabs.setValue(tabParam);
    }
    // Only run on mount / when query param changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Account"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'User', href: paths.dashboard.user.root },
          { name: 'Account' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
        {TABS.map((tab) => (
          <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
        ))}
      </Tabs>

      {tabs.value === 'general' && <AccountGeneral />}
      {tabs.value === 'company' && <AccountCompany />}

      {tabs.value === 'billing' && (
        <OnboardingSetupShell
          subtitle={
            onboarding
              ? 'Start by adding a payment card to activate your subscription. Trial accounts skip this step automatically.'
              : undefined
          }
        >
          <AccountBilling cards={[]} addressBook={[]} />
        </OnboardingSetupShell>
      )}

      {tabs.value === 'security' && <AccountChangePassword />}

      {tabs.value === 'theme-settings' && <AccountThemeSettings />}

      {tabs.value === 'finance' && <AccountFinance />}

      {tabs.value === 'printer' && <AccountPrinterSettings />}

      {tabs.value === 'receipt' && <AccountReceiptSettings />}
    </DashboardContent>
  );
}
