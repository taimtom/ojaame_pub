import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';
import { resolveReportCompanyId, resolveReportStoreId } from 'src/utils/report-scope';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import { useStoreTaxEstimate } from 'src/actions/reports';

function MetricCard({ title, value, subtitle, color }) {
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ mt: 1, color: color || 'text.primary' }}>
        {value}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Card>
  );
}

const vatStatusLabel = {
  not_required: 'VAT not required (under threshold)',
  should_review: 'Review VAT registration',
  registered: 'VAT registered',
};

export default function StoreTaxEstimatesPage() {
  const { storeParam } = useParams();
  const storeId = resolveReportStoreId(storeParam);
  const { user } = useAuthContext();
  const companyId = resolveReportCompanyId(user?.company_id, storeId);
  const [periodState, setPeriodState] = useState({ period: 'this_month', month: null, year: null, date: null });
  const { period, month, year, date } = periodState;

  const { taxEstimate, taxEstimateLoading, taxEstimateError } = useStoreTaxEstimate(
    companyId,
    storeId,
    period,
    month,
    year,
    date
  );

  const taxTypeLabel =
    taxEstimate?.income_tax_type === 'cit'
      ? taxEstimate?.cit_exempt
        ? 'CIT (small-company exempt)'
        : 'Estimated CIT'
      : 'Estimated PIT';

  return (
    <>
      <Helmet>
        <title>Tax Estimates | Ojaa.me</title>
      </Helmet>
      <DashboardContent>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">Tax Estimates</Typography>
              <Typography variant="body2" color="text.secondary">
                Planning figures from your books — not filing advice.
              </Typography>
            </Box>
            <ReportPeriodSelector period={period} onChange={setPeriodState} />
          </Stack>

          {taxEstimateLoading && <LinearProgress />}
          {taxEstimateError && (
            <Alert severity="error">Could not load tax estimate. {taxEstimateError?.message || ''}</Alert>
          )}

          {taxEstimate && (
            <>
              <Alert severity="info">
                {(taxEstimate.disclaimers || []).join(' ')}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard
                    title="Revenue"
                    value={fCurrency(taxEstimate.revenue)}
                    subtitle={
                      taxEstimate.vat_registered
                        ? `Ex-VAT ${fCurrency(taxEstimate.revenue_ex_vat)}`
                        : `YTD turnover ${fCurrency(taxEstimate.ytd_turnover)}`
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard title="Gross profit" value={fCurrency(taxEstimate.gross_profit)} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard
                    title="Profit before tax"
                    value={fCurrency(taxEstimate.profit_before_tax)}
                    color={taxEstimate.profit_before_tax >= 0 ? 'success.main' : 'error.main'}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard
                    title="VAT status"
                    value={vatStatusLabel[taxEstimate.vat_status] || taxEstimate.vat_status}
                    subtitle={
                      taxEstimate.vat_registered
                        ? `Payable ${fCurrency(taxEstimate.net_vat_payable)}`
                        : `Threshold review at ₦25m YTD`
                    }
                    color={taxEstimate.vat_status === 'should_review' ? 'warning.main' : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard
                    title={taxTypeLabel}
                    value={fCurrency(taxEstimate.estimated_income_tax)}
                    subtitle={
                      taxEstimate.estimated_development_levy
                        ? `+ Development levy ${fCurrency(taxEstimate.estimated_development_levy)}`
                        : undefined
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <MetricCard
                    title="Cash to set aside"
                    value={fCurrency(taxEstimate.cash_to_set_aside)}
                    subtitle={`After tax profit ${fCurrency(taxEstimate.profit_after_estimated_tax)}`}
                    color="primary.main"
                  />
                </Grid>
              </Grid>
            </>
          )}
        </Stack>
      </DashboardContent>
    </>
  );
}
