import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';

import { fCurrency } from 'src/utils/format-number';
import { resolveReportCompanyId, resolveReportStoreId } from 'src/utils/report-scope';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { useStoreBalanceSheet } from 'src/actions/reports';

export default function StoreBalanceSheetReportPage() {
  const { storeParam } = useParams();
  const storeId = resolveReportStoreId(storeParam);
  const { user } = useAuthContext();
  const companyId = resolveReportCompanyId(user?.company_id, storeId);
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const { balanceSheet, balanceSheetLoading } = useStoreBalanceSheet(companyId, storeId, asOf);

  const renderSection = (title, rows) => (
    <>
      <TableRow><TableCell colSpan={2} sx={{ fontWeight: 700, bgcolor: 'action.hover' }}>{title}</TableCell></TableRow>
      {(rows || []).map((row) => (
        <TableRow key={`${title}-${row.code}`}>
          <TableCell>{row.code} — {row.name}</TableCell>
          <TableCell align="right">{fCurrency(row.balance)}</TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <>
      <Helmet><title>Balance Sheet | Dashboard</title></Helmet>
      <DashboardContent maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Balance Sheet</Typography>
          <TextField type="date" label="As of" value={asOf} onChange={(e) => setAsOf(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Stack>
        <Card>
          {balanceSheetLoading && <LinearProgress />}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderSection('Assets', balanceSheet?.assets)}
              {renderSection('Liabilities', balanceSheet?.liabilities)}
              {renderSection('Equity', balanceSheet?.equity_accounts)}
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Total assets</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fCurrency(balanceSheet?.total_assets)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Liabilities + equity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fCurrency(balanceSheet?.liabilities_plus_equity)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </DashboardContent>
    </>
  );
}
