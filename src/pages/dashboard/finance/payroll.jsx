import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';
import { resolveReportStoreId } from 'src/utils/report-scope';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { toast } from 'src/components/snackbar';

export default function PayrollPage() {
  const { storeParam } = useParams();
  const storeId = resolveReportStoreId(storeParam);
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const [employees, setEmployees] = useState([]);
  const [run, setRun] = useState(null);
  const [form, setForm] = useState({
    name: '',
    monthly_gross: '',
    is_owner: false,
  });

  const loadEmployees = useCallback(async () => {
    if (!companyId) return;
    const { data } = await axiosInstance.get(endpoints.payroll.employees, {
      params: { company_id: companyId },
    });
    setEmployees(data || []);
  }, [companyId]);

  useEffect(() => {
    loadEmployees().catch(() => toast.error('Could not load employees'));
  }, [loadEmployees]);

  const addEmployee = async () => {
    try {
      await axiosInstance.post(endpoints.payroll.employees, {
        company_id: companyId,
        name: form.name,
        monthly_gross: Number(form.monthly_gross),
        is_owner: form.is_owner,
      });
      toast.success('Employee added');
      setForm({ name: '', monthly_gross: '', is_owner: false });
      loadEmployees();
    } catch {
      toast.error('Failed to add employee');
    }
  };

  const createRun = async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    try {
      const { data } = await axiosInstance.post(endpoints.payroll.runs, {
        company_id: companyId,
        period_start: start,
        period_end: end,
      });
      setRun(data);
      toast.success('Payroll draft created');
    } catch {
      toast.error('Failed to create payroll run');
    }
  };

  const approveRun = async () => {
    if (!run || !storeId) {
      toast.error('Select a store workspace to post payroll expense');
      return;
    }
    try {
      const { data } = await axiosInstance.post(
        `${endpoints.payroll.approve(run.id)}?store_id=${storeId}`
      );
      setRun(data);
      toast.success('Payroll approved and staff gross posted as expense');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Approve failed');
    }
  };

  return (
    <>
      <Helmet>
        <title>Payroll / PAYE | Ojaa.me</title>
      </Helmet>
      <DashboardContent>
        <Stack spacing={3}>
          <Typography variant="h4">Payroll / PAYE</Typography>
          <Alert severity="info">
            PAYE is estimated from salary bands and reliefs. Low salaries often show ₦0 PAYE.
            Owner drawings on a sole proprietorship are excluded from staff PAYE and deductible payroll expense.
            Withholding Tax is a separate module — never deduct WHT from staff salaries.
          </Alert>

          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Add employee</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Monthly gross" type="number" value={form.monthly_gross} onChange={(e) => setForm({ ...form, monthly_gross: e.target.value })} />
              <FormControlLabel
                control={<Switch checked={form.is_owner} onChange={(e) => setForm({ ...form, is_owner: e.target.checked })} />}
                label="Owner / drawings"
              />
              <Button variant="contained" onClick={addEmployee}>Add</Button>
            </Stack>
          </Card>

          <Card>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Monthly gross</TableCell>
                  <TableCell>Owner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell align="right">{fCurrency(emp.monthly_gross)}</TableCell>
                    <TableCell>{emp.is_owner ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={createRun}>Create this-month draft</Button>
            <Button variant="contained" disabled={!run || run.status !== 'draft'} onClick={approveRun}>
              Approve draft
            </Button>
          </Stack>

          {run && (
            <Card>
              <Typography variant="subtitle1" sx={{ p: 2 }}>
                Run #{run.id} · {run.status} · PAYE due {fCurrency(run.paye_due)}
              </Typography>
              <Alert severity="warning" sx={{ mx: 2, mb: 1 }}>{run.disclaimer}</Alert>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">Gross</TableCell>
                    <TableCell align="right">PAYE est.</TableCell>
                    <TableCell align="right">Net</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(run.lines || []).map((line) => (
                    <TableRow key={line.id || `${line.employee_id}-${line.gross}`}>
                      <TableCell>{line.employee_name}{line.is_owner ? ' (owner)' : ''}</TableCell>
                      <TableCell align="right">{fCurrency(line.gross)}</TableCell>
                      <TableCell align="right">{fCurrency(line.paye_estimate)}</TableCell>
                      <TableCell align="right">{fCurrency(line.net)}</TableCell>
                      <TableCell>{line.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </Stack>
      </DashboardContent>
    </>
  );
}
