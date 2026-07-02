import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';
import { resolveReportCompanyId, resolveReportStoreId } from 'src/utils/report-scope';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import { useStoreCashFlow } from 'src/actions/reports';

function Row({ label, value, bold }) {
  return (
    <TableRow>
      <TableCell sx={{ fontWeight: bold ? 700 : 400 }}>{label}</TableCell>
      <TableCell align="right" sx={{ fontWeight: bold ? 700 : 400 }}>{fCurrency(value ?? 0)}</TableCell>
    </TableRow>
  );
}

export default function StoreCashFlowReportPage() {
  const { storeParam } = useParams();
  const storeId = resolveReportStoreId(storeParam);
  const { user } = useAuthContext();
  const companyId = resolveReportCompanyId(user?.company_id, storeId);
  const [periodState, setPeriodState] = useState({ period: 'this_month', month: null, year: null, date: null });
  const { period, month, year, date } = periodState;
  const { cashFlow, cashFlowLoading, cashFlowError } = useStoreCashFlow(companyId, storeId, period, month, year, date);

  return (
    <>
      <Helmet><title>Cash Flow | Dashboard</title></Helmet>
      <DashboardContent maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Cash Flow Statement</Typography>
          <ReportPeriodSelector period={period} onChange={setPeriodState} />
        </Stack>
        {cashFlowError && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="error">
              Could not load cash flow report. {cashFlowError?.message || 'Please try again.'}
            </Alert>
          </Box>
        )}
        <Card>
          {cashFlowLoading && <LinearProgress />}
          <Table>
            <TableBody>
              <Row label="Cash from sales" value={cashFlow?.cash_from_sales} />
              <Row label="Cash paid for COGS" value={-(cashFlow?.cash_paid_for_cogs ?? 0)} />
              <Row label="Operating expenses" value={-(cashFlow?.cash_paid_for_operating_expenses ?? 0)} />
              <Row label="Inventory shrinkage" value={-(cashFlow?.cash_paid_for_inventory_shrinkage ?? 0)} />
              <Row label="Inventory purchases" value={-(cashFlow?.cash_paid_for_inventory ?? 0)} />
              <Row label="Net cash from operations" value={cashFlow?.net_cash_from_operations} bold />
              <Row label="Net change in cash" value={cashFlow?.net_change_in_cash} bold />
            </TableBody>
          </Table>
        </Card>
      </DashboardContent>
    </>
  );
}
