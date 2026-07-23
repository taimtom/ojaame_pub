import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { toast } from 'src/components/snackbar';

export default function LoansPage() {
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    lender_name: '',
    principal: '',
    interest_rate: '0',
    start_date: new Date().toISOString().slice(0, 10),
  });
  const [payment, setPayment] = useState({
    loan_id: '',
    payment_date: new Date().toISOString().slice(0, 10),
    principal_amount: '',
    interest_amount: '',
  });

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(endpoints.loans.list, { params: { company_id: companyId } });
      setLoans(data || []);
    } catch {
      toast.error('Could not load loans');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const createLoan = async () => {
    try {
      await axiosInstance.post(endpoints.loans.list, {
        company_id: companyId,
        lender_name: form.lender_name,
        principal: Number(form.principal),
        interest_rate: Number(form.interest_rate) / 100,
        start_date: form.start_date,
      });
      toast.success('Loan created');
      setForm({ ...form, lender_name: '', principal: '' });
      load();
    } catch {
      toast.error('Failed to create loan');
    }
  };

  const recordPayment = async () => {
    try {
      await axiosInstance.post(endpoints.loans.payments(payment.loan_id), {
        payment_date: payment.payment_date,
        principal_amount: Number(payment.principal_amount || 0),
        interest_amount: Number(payment.interest_amount || 0),
      });
      toast.success('Payment recorded (interest hits P&L; principal hits cash only)');
      load();
    } catch {
      toast.error('Failed to record payment');
    }
  };

  return (
    <>
      <Helmet>
        <title>Loans | Ojaa.me</title>
      </Helmet>
      <DashboardContent>
        <Stack spacing={3}>
          <Typography variant="h4">Loans</Typography>
          <Alert severity="info">
            Interest reduces profit. Principal repayment reduces cash and loan balance — not profit.
          </Alert>
          {loading && <LinearProgress />}

          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>New loan</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Lender" value={form.lender_name} onChange={(e) => setForm({ ...form, lender_name: e.target.value })} />
              <TextField label="Principal" type="number" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} />
              <TextField label="Interest % / year" type="number" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
              <TextField label="Start date" type="date" InputLabelProps={{ shrink: true }} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              <Button variant="contained" onClick={createLoan}>Create</Button>
            </Stack>
          </Card>

          <Card>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Lender</TableCell>
                  <TableCell align="right">Principal</TableCell>
                  <TableCell align="right">Outstanding</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>{loan.id}</TableCell>
                    <TableCell>{loan.lender_name}</TableCell>
                    <TableCell align="right">{fCurrency(loan.principal)}</TableCell>
                    <TableCell align="right">{fCurrency(loan.outstanding_balance)}</TableCell>
                    <TableCell>{loan.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Record payment</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField label="Loan ID" value={payment.loan_id} onChange={(e) => setPayment({ ...payment, loan_id: e.target.value })} />
              <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} value={payment.payment_date} onChange={(e) => setPayment({ ...payment, payment_date: e.target.value })} />
              <TextField label="Principal" type="number" value={payment.principal_amount} onChange={(e) => setPayment({ ...payment, principal_amount: e.target.value })} />
              <TextField label="Interest" type="number" value={payment.interest_amount} onChange={(e) => setPayment({ ...payment, interest_amount: e.target.value })} />
              <Button variant="contained" onClick={recordPayment}>Record</Button>
            </Stack>
          </Card>
        </Stack>
      </DashboardContent>
    </>
  );
}
