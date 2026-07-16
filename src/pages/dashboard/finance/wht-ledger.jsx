import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { toast } from 'src/components/snackbar';

export default function WhtLedgerPage() {
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(endpoints.wht.ledger, {
        params: { company_id: companyId },
      });
      setRows(data || []);
    } catch {
      toast.error('Could not load WHT ledger');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const createRemittance = async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    try {
      const { data } = await axiosInstance.post(endpoints.wht.remittances, {
        company_id: companyId,
        period_start: start,
        period_end: end,
      });
      toast.success(`WHT remittance draft ₦${Number(data.total_amount || 0).toLocaleString()} outstanding`);
    } catch {
      toast.error('Failed to create remittance');
    }
  };

  return (
    <>
      <Helmet>
        <title>Withholding Tax | Ojaa.me</title>
      </Helmet>
      <DashboardContent>
        <Stack spacing={3}>
          <Typography variant="h4">Withholding Tax Ledger</Typography>
          <Alert severity="info">
            WHT applies to supplier/contractor payments (e.g. professional services), not staff salaries.
            Gross expense stays on P&amp;L; WHT is held for remittance.
          </Alert>
          {loading && <LinearProgress />}
          <Button variant="outlined" onClick={createRemittance} sx={{ alignSelf: 'flex-start' }}>
            Create this-month remittance summary
          </Button>
          <Card>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Gross</TableCell>
                  <TableCell align="right">WHT</TableCell>
                  <TableCell align="right">Net to vendor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.expense_id}>
                    <TableCell>{String(row.expense_date).slice(0, 10)}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell align="right">{fCurrency(row.gross_amount)}</TableCell>
                    <TableCell align="right">{fCurrency(row.wht_amount)}</TableCell>
                    <TableCell align="right">{fCurrency(row.net_paid_to_vendor)}</TableCell>
                  </TableRow>
                ))}
                {!rows.length && !loading && (
                  <TableRow>
                    <TableCell colSpan={6}>No WHT expenses yet. Mark WHT on expense forms for professional fees.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </Stack>
      </DashboardContent>
    </>
  );
}
