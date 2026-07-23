import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';
import { resolveReportCompanyId, resolveReportStoreId } from 'src/utils/report-scope';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import { useStoreVatReturn } from 'src/actions/reports';

function Row({ label, value }) {
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell align="right">{fCurrency(value ?? 0)}</TableCell>
    </TableRow>
  );
}

export default function StoreVatReturnPage() {
  const { storeParam } = useParams();
  const storeId = resolveReportStoreId(storeParam);
  const { user } = useAuthContext();
  const companyId = resolveReportCompanyId(user?.company_id, storeId);
  const [periodState, setPeriodState] = useState({ period: 'this_month', month: null, year: null, date: null });
  const { period, month, year, date } = periodState;
  const { vatReturn, vatReturnLoading, vatReturnError } = useStoreVatReturn(
    companyId,
    storeId,
    period,
    month,
    year,
    date
  );

  return (
    <>
      <Helmet>
        <title>VAT Return | Ojaa.me</title>
      </Helmet>
      <DashboardContent>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Typography variant="h4">VAT Return Summary</Typography>
            <ReportPeriodSelector period={period} onChange={setPeriodState} />
          </Stack>
          {vatReturnLoading && <LinearProgress />}
          {vatReturnError && <Alert severity="error">Could not load VAT return.</Alert>}
          {vatReturn && (
            <>
              <Alert severity="info">{(vatReturn.disclaimers || []).join(' ')}</Alert>
              {!vatReturn.vat_registered && (
                <Alert severity="warning">Company is not marked VAT-registered. Enable VAT in Account → Finance.</Alert>
              )}
              <Card>
                <Table>
                  <TableBody>
                    <Row label="Taxable supplies (ex-VAT)" value={vatReturn.taxable_supplies} />
                    <Row label="Output VAT" value={vatReturn.output_vat} />
                    <Row label="Input VAT" value={vatReturn.input_vat} />
                    <Row label="Net VAT payable / (refundable)" value={vatReturn.net_vat_payable} />
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </Stack>
      </DashboardContent>
    </>
  );
}
