import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import { useStoreTrialBalance } from 'src/actions/reports';

export default function StoreTrialBalanceReportPage() {
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const [periodState, setPeriodState] = useState({ period: 'this_month', month: null, year: null, date: null });
  const { period, month, year, date } = periodState;
  const { trialBalance, trialBalanceLoading } = useStoreTrialBalance(companyId, period, month, year, date);

  return (
    <>
      <Helmet><title>Trial Balance | Dashboard</title></Helmet>
      <DashboardContent maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Trial Balance</Typography>
          <ReportPeriodSelector period={period} onChange={setPeriodState} />
        </Stack>
        <Card>
          {trialBalanceLoading && <LinearProgress />}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Account</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(trialBalance?.accounts || []).map((row) => (
                <TableRow key={row.code}>
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{fCurrency(row.debit)}</TableCell>
                  <TableCell align="right">{fCurrency(row.credit)}</TableCell>
                  <TableCell align="right">{fCurrency(row.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </DashboardContent>
    </>
  );
}
