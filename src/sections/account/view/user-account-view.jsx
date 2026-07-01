import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

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
import { AccountReceiptOnboardingPanel } from '../account-receipt-onboarding-panel';
import { OnboardingSetupShell } from 'src/components/onboarding/onboarding-setup-shell';
import { useOnboardingMode, useOnboardingActive } from 'src/hooks/use-onboarding-mode';
import { usePlanFeatures } from 'src/hooks/use-plan-features';
import { useGetSubscriptionStatus } from 'src/actions/billing';
import { canAccessCompanyBillingSettings } from 'src/utils/user-role';

import { useAuthContext } from 'src/auth/hooks';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasPlanFeature } = usePlanFeatures();
  const { user } = useAuthContext();
  const { isOwner } = useGetSubscriptionStatus();

  const canAccessCompanyBilling = canAccessCompanyBillingSettings({
    role: user?.role,
    isOwner,
  });

  const tabs = useTabs('general');
  const searchParams = useSearchParams();
  const onboarding = useOnboardingMode();
  const { progress } = useOnboardingActive();
  const isReceiptOnboardingStep = Boolean(
    onboarding && progress?.current_step === 'receipt'
  );

  const visibleTabs = TABS.filter((tab) => {
    if (tab.value === 'finance' && !hasPlanFeature('finance_settings')) {
      return false;
    }
    if ((tab.value === 'company' || tab.value === 'billing') && !canAccessCompanyBilling) {
      return false;
    }
    return true;
  });

  const handleSectionChange = (event) => {
    tabs.setValue(event.target.value);
  };

  // Auto-switch to the tab specified in the URL query param (e.g. ?tab=theme-settings)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'finance' && !hasPlanFeature('finance_settings')) {
      tabs.setValue('general');
      return;
    }
    if (
      (tabParam === 'company' || tabParam === 'billing') &&
      !canAccessCompanyBilling
    ) {
      tabs.setValue('general');
      return;
    }
    if (tabParam && visibleTabs.some((t) => t.value === tabParam)) {
      tabs.setValue(tabParam);
    }
    if (isReceiptOnboardingStep && tabParam !== 'receipt') {
      tabs.setValue('printer');
    }
    // Only run on mount / when query param changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, hasPlanFeature, canAccessCompanyBilling, visibleTabs, isReceiptOnboardingStep]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.value === tabs.value)) {
      tabs.setValue(visibleTabs[0]?.value || 'general');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTabs]);

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

      {isMobile ? (
        <TextField
          select
          fullWidth
          label="Settings section"
          value={tabs.value}
          onChange={handleSectionChange}
          sx={{ mb: { xs: 3, md: 5 } }}
          SelectProps={{
            renderValue: (selected) => visibleTabs.find((tab) => tab.value === selected)?.label,
          }}
        >
          {visibleTabs.map((tab) => (
            <MenuItem key={tab.value} value={tab.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {tab.icon}
                {tab.label}
              </Box>
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
          {visibleTabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
          ))}
        </Tabs>
      )}

      {tabs.value === 'general' && <AccountGeneral />}
      {tabs.value === 'company' && canAccessCompanyBilling && <AccountCompany />}

      {tabs.value === 'billing' && canAccessCompanyBilling && (
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

      {tabs.value === 'finance' && hasPlanFeature('finance_settings') && <AccountFinance />}

      {tabs.value === 'printer' &&
        (isReceiptOnboardingStep ? (
          <OnboardingSetupShell subtitle="Pair a Bluetooth printer and set receipt preferences before your first sale. You can skip this step and configure later from Account settings.">
            <AccountReceiptOnboardingPanel />
          </OnboardingSetupShell>
        ) : (
          <AccountPrinterSettings />
        ))}

      {tabs.value === 'receipt' &&
        (isReceiptOnboardingStep ? (
          <OnboardingSetupShell subtitle="Pair a Bluetooth printer and set receipt preferences before your first sale. You can skip this step and configure later from Account settings.">
            <AccountReceiptOnboardingPanel />
          </OnboardingSetupShell>
        ) : (
          <AccountReceiptSettings />
        ))}
    </DashboardContent>
  );
}
