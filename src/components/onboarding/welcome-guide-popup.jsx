import { STATUS } from 'react-joyride';
import { useMemo, useEffect, useCallback } from 'react';

import Typography from '@mui/material/Typography';

import { Walktour, useWalktour } from 'src/components/walktour';

// ----------------------------------------------------------------------

const STORAGE_PREFIX = 'welcome_guide_seen_';

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function WelcomeGuidePopup({ userId }) {
  const steps = useMemo(
    () => [
      {
        target: '#overview-tour-welcome',
        title: 'Welcome',
        placement: 'bottom',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This is your store dashboard. The banner shows who you are and links to Quick Sale for fast checkout.
          </Typography>
        ),
      },
      {
        target: '#overview-tour-featured',
        title: 'Featured',
        placement: 'left',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Highlights from your catalog appear here.
          </Typography>
        ),
      },
      {
        target: '#overview-tour-kpi',
        title: 'Sales KPIs',
        placement: 'bottom',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Today, week, and month totals update from your POS activity.
          </Typography>
        ),
      },
      {
        target: '#overview-tour-payment-method',
        title: 'Sales by payment',
        placement: 'bottom',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            See how revenue splits across cash, card, transfer, and other methods.
          </Typography>
        ),
      },
      {
        target: '#overview-tour-expenses',
        title: 'Expenses',
        placement: 'bottom',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Track spending by category for the selected period.
          </Typography>
        ),
      },
      {
        target: '#overview-tour-yearly',
        title: 'Yearly sales',
        placement: 'top',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Compare yearly performance and trends over time.
          </Typography>
        ),
      },
      {
        target: '#overview-tour-performance',
        title: 'Performance',
        placement: 'bottom',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            A normalized view of revenue, transactions, returns, and more.
          </Typography>
        ),
      },
      {
        target: '#overview-tour-cashiers',
        title: 'Top cashiers',
        placement: 'bottom',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            See which staff drive the most sales.
          </Typography>
        ),
      },
      {
        target: '#overview-tour-invoices',
        title: 'Recent invoices',
        placement: 'top',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Latest invoices for this store; filter by status.
          </Typography>
        ),
      },
      {
        target: '#overview-tour-products',
        title: 'Top products',
        placement: 'top',
        content: (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Best-selling products and quantities for the period you select.
          </Typography>
        ),
      },
    ],
    []
  );

  const { run, steps: tourSteps, onCallback: baseOnCallback, setHelpers, setRun } = useWalktour({
    steps,
    defaultRun: false,
  });

  const onCallback = useCallback(
    (data) => {
      baseOnCallback(data);
      const { status } = data;
      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) && userId) {
        try {
          localStorage.setItem(storageKey(userId), '1');
        } catch {
          /* ignore */
        }
      }
    },
    [baseOnCallback, userId]
  );

  useEffect(() => {
    if (!userId) return undefined;
    try {
      if (localStorage.getItem(storageKey(userId))) return undefined;
    } catch {
      return undefined;
    }
    const timer = setTimeout(() => {
      setRun(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [userId, setRun]);

  if (!userId) {
    return null;
  }

  return (
    <Walktour
      run={run}
      steps={tourSteps}
      callback={onCallback}
      getHelpers={setHelpers}
    />
  );
}
