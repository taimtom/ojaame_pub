import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import { fCurrency } from 'src/utils/format-number';
import { resolveReportCompanyId, resolveReportStoreId } from 'src/utils/report-scope';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { useTaxAnnual } from 'src/actions/reports';

function Row({ label, value }) {
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell align="right">{fCurrency(value ?? 0)}</TableCell>
    </TableRow>
  );
}

export default function StoreTaxAnnualPage() {
  const { storeParam } = useParams();
  const storeId = resolveReportStoreId(storeParam);
  const { user } = useAuthContext();
  const companyId = resolveReportCompanyId(user?.company_id, storeId);
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  }, []);
  const [year, setYear] = useState(years[0]);
  const { taxAnnual, taxAnnualLoading, taxAnnualError } = useTaxAnnual(companyId, year, storeId);

  return (
    <>
      <Helmet>
        <title>Annual Tax Summary | Ojaa.me</title>
      </Helmet>
      <DashboardContent>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Typography variant="h4">Annual Tax Summary</Typography>
            <TextField select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ minWidth: 120 }}>
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Stack>
          {taxAnnualLoading && <LinearProgress />}
          {taxAnnualError && <Alert severity="error">Could not load annual summary.</Alert>}
          {taxAnnual && (
            <>
              <Alert severity="info">{(taxAnnual.disclaimers || []).join(' ')}</Alert>
              <Card>
                <Table>
                  <TableBody>
                    <Row label="Revenue" value={taxAnnual.revenue} />
                    <Row label="Gross profit" value={taxAnnual.gross_profit} />
                    <Row label="Profit before tax" value={taxAnnual.profit_before_tax} />
                    <Row label="VAT collected" value={taxAnnual.vat_collected} />
                    <Row label="VAT input" value={taxAnnual.vat_input} />
                    <Row label="Net VAT payable" value={taxAnnual.net_vat_payable} />
                    <Row label={`Est. ${String(taxAnnual.income_tax_type || '').toUpperCase()}`} value={taxAnnual.estimated_income_tax} />
                    <Row label="PAYE remitted" value={taxAnnual.paye_remitted} />
                    <Row label="WHT deducted" value={taxAnnual.wht_deducted} />
                    <Row label="Loan interest paid" value={taxAnnual.loan_interest_paid} />
                    <Row label="Loan principal paid" value={taxAnnual.loan_principal_paid} />
                  </TableBody>
                </Table>
              </Card>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Records checklist</Typography>
                <List dense>
                  {(taxAnnual.records_checklist || []).map((item) => (
                    <ListItem key={item}>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </>
          )}
        </Stack>
      </DashboardContent>
    </>
  );
}
