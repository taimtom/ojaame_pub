import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
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
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';
import { resolveReportStoreId } from 'src/utils/report-scope';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { useGetStores } from 'src/actions/store';
import { useGetRoles } from 'src/actions/role';
import { useStaffDirectory } from 'src/hooks/use-staff-directory';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import ListSubheader from '@mui/material/ListSubheader';

const emptyForm = {
  name: '',
  email: '',
  monthly_gross: '',
  is_owner: false,
  basic_salary: '',
  housing_allowance: '',
  transport_allowance: '',
  other_allowances: '',
  user_id: '',
  role_id: '',
  store_ids: [],
};

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function apiErrorMessage(err) {
  const detail = err?.data?.detail ?? err?.response?.data?.detail ?? err?.message;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg || d).join(', ');
  return 'Request failed';
}

export default function PayrollPage() {
  const { storeParam } = useParams();
  const storeId = resolveReportStoreId(storeParam);
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const { stores } = useGetStores();
  const { roles } = useGetRoles();
  const {
    linkableLoginUsers,
    nonLoginOptions,
    reloadEmployees,
  } = useStaffDirectory();

  const [employees, setEmployees] = useState([]);
  const [run, setRun] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staffKind, setStaffKind] = useState('non_user');
  const [form, setForm] = useState(emptyForm);
  const [seatError, setSeatError] = useState(null);

  const [convertTarget, setConvertTarget] = useState(null);
  const [convertForm, setConvertForm] = useState({
    email: '',
    role_id: '',
    store_ids: [],
  });
  const [converting, setConverting] = useState(false);

  const breakdownTotal = useMemo(() => {
    if (!showAdvanced) return 0;
    return (
      num(form.basic_salary) +
      num(form.housing_allowance) +
      num(form.transport_allowance) +
      num(form.other_allowances)
    );
  }, [form, showAdvanced]);

  const effectiveGross = showAdvanced && breakdownTotal > 0 ? breakdownTotal : num(form.monthly_gross);

  const loadEmployees = useCallback(async () => {
    if (!companyId) return;
    const { data } = await axiosInstance.get(endpoints.payroll.employees, {
      params: { company_id: companyId },
    });
    setEmployees(data || []);
    await reloadEmployees();
  }, [companyId, reloadEmployees]);

  useEffect(() => {
    loadEmployees().catch(() => toast.error('Could not load staff'));
  }, [loadEmployees]);

  const salaryPayload = () => ({
    monthly_gross: effectiveGross,
    basic_salary: showAdvanced ? num(form.basic_salary) : 0,
    housing_allowance: showAdvanced ? num(form.housing_allowance) : 0,
    transport_allowance: showAdvanced ? num(form.transport_allowance) : 0,
    other_allowances: showAdvanced ? num(form.other_allowances) : 0,
  });

  const addStaff = async () => {
    setSeatError(null);
    // Non-login attendants can be added with ₦0; login/link staff need a salary for PAYE
    if (staffKind !== 'non_user' && effectiveGross <= 0) {
      toast.error(showAdvanced ? 'Enter at least one salary component' : 'Enter a monthly gross greater than 0');
      return;
    }
    if (staffKind === 'non_user' && effectiveGross < 0) {
      toast.error('Monthly gross cannot be negative');
      return;
    }

    if (staffKind === 'non_user' && !form.name.trim()) {
      toast.error('Enter a staff name');
      return;
    }
    if (staffKind === 'user') {
      if (!form.email.trim()) {
        toast.error('Email is required for user staff');
        return;
      }
      if (!form.store_ids.length) {
        toast.error('Select at least one store (seats are per store)');
        return;
      }
    }
    if (staffKind === 'link_user') {
      if (String(form.user_id).startsWith('nl:')) {
        toast.info('That non-login staff member is already in the staff table below.');
        return;
      }
      if (!form.user_id) {
        toast.error('Select a team user to link');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        company_id: companyId,
        staff_kind: staffKind,
        is_owner: form.is_owner,
        ...salaryPayload(),
      };

      if (staffKind === 'non_user') {
        payload.name = form.name.trim();
        if (form.email.trim()) payload.email = form.email.trim();
      } else if (staffKind === 'user') {
        payload.name = form.name.trim() || undefined;
        payload.email = form.email.trim();
        payload.store_ids = form.store_ids;
        if (form.role_id) payload.role_id = Number(form.role_id);
      } else {
        payload.user_id = Number(form.user_id);
      }

      await axiosInstance.post(endpoints.payroll.employees, payload);
      toast.success('Staff added');
      setForm(emptyForm);
      setShowAdvanced(false);
      loadEmployees();
    } catch (err) {
      if (err?._httpStatus === 402) {
        setSeatError(apiErrorMessage(err));
        return;
      }
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const removeEmployee = async (employeeId) => {
    try {
      await axiosInstance.delete(`${endpoints.payroll.employees}/${employeeId}`);
      toast.success('Staff removed from payroll');
      loadEmployees();
    } catch {
      toast.error('Failed to remove staff');
    }
  };

  const openConvertToUser = (emp) => {
    setSeatError(null);
    setConvertTarget(emp);
    setConvertForm({
      email: emp.email || '',
      role_id: '',
      store_ids: emp.primary_store_id ? [emp.primary_store_id] : storeId ? [Number(storeId)] : [],
    });
  };

  const demoteToNonUser = async (emp) => {
    setSeatError(null);
    try {
      await axiosInstance.post(endpoints.payroll.convertStaff(emp.id), { target: 'non_user' });
      toast.success('Converted to non-user staff — login deactivated and seat released');
      loadEmployees();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const confirmConvertToUser = async () => {
    if (!convertTarget) return;
    if (!convertForm.store_ids.length) {
      toast.error('Select at least one store');
      return;
    }
    if (!convertTarget.user_id && !convertForm.email.trim()) {
      toast.error('Email is required to grant login');
      return;
    }

    try {
      setConverting(true);
      setSeatError(null);
      await axiosInstance.post(endpoints.payroll.convertStaff(convertTarget.id), {
        target: 'user',
        email: convertForm.email.trim() || undefined,
        role_id: convertForm.role_id ? Number(convertForm.role_id) : undefined,
        store_ids: convertForm.store_ids,
      });
      toast.success('Converted to user staff');
      setConvertTarget(null);
      loadEmployees();
    } catch (err) {
      if (err?._httpStatus === 402) {
        setSeatError(apiErrorMessage(err));
        return;
      }
      toast.error(apiErrorMessage(err));
    } finally {
      setConverting(false);
    }
  };

  const createRun = async () => {
    if (!employees.length) {
      toast.error('Add at least one staff member first');
      return;
    }
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
    } catch (err) {
      toast.error(apiErrorMessage(err));
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
      toast.error(apiErrorMessage(err));
    }
  };

  const hasBreakdown = (emp) =>
    num(emp.basic_salary) +
      num(emp.housing_allowance) +
      num(emp.transport_allowance) +
      num(emp.other_allowances) >
    0;

  const billingHref = `${paths.dashboard.user.account}?tab=billing`;

  return (
    <>
      <Helmet>
        <title>Payroll / PAYE | Ojaa.me</title>
      </Helmet>
      <DashboardContent>
        <Stack spacing={3}>
          <Typography variant="h4">Payroll / PAYE</Typography>
          <Alert severity="info">
            Select staff from your directory — login staff use a seat; non-login staff do not.
            Non-login staff appear in the staff table and under Select staff → Non-login.
            Use User List → Add staff without login, or the Non-user tab here.
          </Alert>

          {seatError && (
            <Alert
              severity="warning"
              action={
                <Button
                  component={RouterLink}
                  href={billingHref}
                  size="small"
                  color="warning"
                  variant="contained"
                >
                  Update seats
                </Button>
              }
            >
              {seatError}
            </Alert>
          )}

          <Card sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle1">Add staff</Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={staffKind}
                  onChange={(_, v) => v && setStaffKind(v)}
                >
                  <ToggleButton value="non_user">Non-user (no login)</ToggleButton>
                  <ToggleButton value="link_user">Select staff</ToggleButton>
                  <ToggleButton value="user">Invite user</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={showAdvanced}
                    onChange={(e) => {
                      setShowAdvanced(e.target.checked);
                      if (e.target.checked && form.monthly_gross && !form.basic_salary) {
                        setForm((prev) => ({ ...prev, basic_salary: prev.monthly_gross }));
                      }
                    }}
                  />
                }
                label="Advanced salary breakdown"
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                {staffKind === 'non_user' && (
                  <TextField
                    label="Name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    sx={{ minWidth: 200 }}
                  />
                )}

                {staffKind === 'user' && (
                  <>
                    <TextField
                      label="Name (optional)"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      sx={{ minWidth: 160 }}
                    />
                    <TextField
                      label="Email"
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      sx={{ minWidth: 200 }}
                    />
                    <FormControl sx={{ minWidth: 160 }}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        label="Role"
                        value={form.role_id}
                        onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                      >
                        <MenuItem value="">Default (cashier)</MenuItem>
                        {(roles || []).map((role) => (
                          <MenuItem key={role.id} value={String(role.id)}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Stores</InputLabel>
                      <Select
                        multiple
                        label="Stores"
                        value={form.store_ids}
                        onChange={(e) => setForm({ ...form, store_ids: e.target.value })}
                        input={<OutlinedInput label="Stores" />}
                        renderValue={(selected) =>
                          (stores || [])
                            .filter((s) => selected.includes(s.id))
                            .map((s) => s.storeName)
                            .join(', ')
                        }
                      >
                        {(stores || []).map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.storeName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}

                {staffKind === 'link_user' && (
                  <FormControl sx={{ minWidth: 320 }}>
                    <InputLabel>Staff</InputLabel>
                    <Select
                      label="Staff"
                      value={form.user_id}
                      onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                    >
                      <MenuItem value="" disabled>
                        Select staff
                      </MenuItem>
                      <ListSubheader>Login users (add to payroll)</ListSubheader>
                      {linkableLoginUsers.length === 0 && (
                        <MenuItem disabled value="__no_login_users">
                          No unlinked login users
                        </MenuItem>
                      )}
                      {linkableLoginUsers.map((u) => (
                        <MenuItem key={u.key} value={String(u.userId)}>
                          {u.label}
                          {u.email ? ` · ${u.email}` : ''}
                        </MenuItem>
                      ))}
                      <ListSubheader>Non-login staff (already in table)</ListSubheader>
                      {nonLoginOptions.length === 0 && (
                        <MenuItem disabled value="__no_non_login">
                          No non-login staff yet — use Non-user tab
                        </MenuItem>
                      )}
                      {nonLoginOptions.map((s) => (
                        <MenuItem key={s.key} value={`nl:${s.employeeId}`}>
                          {s.label} · no login / no seat
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {!showAdvanced && (
                  <TextField
                    label="Monthly gross"
                    type="number"
                    required
                    value={form.monthly_gross}
                    onChange={(e) => setForm({ ...form, monthly_gross: e.target.value })}
                    sx={{ minWidth: 160 }}
                  />
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_owner}
                      onChange={(e) => setForm({ ...form, is_owner: e.target.checked })}
                    />
                  }
                  label="Owner / drawings"
                />
                <Button variant="contained" onClick={addStaff} disabled={saving}>
                  Add
                </Button>
              </Stack>

              <Collapse in={showAdvanced}>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Basic salary"
                      type="number"
                      value={form.basic_salary}
                      onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                    />
                    <TextField
                      label="Housing allowance"
                      type="number"
                      value={form.housing_allowance}
                      onChange={(e) => setForm({ ...form, housing_allowance: e.target.value })}
                    />
                    <TextField
                      label="Transport allowance"
                      type="number"
                      value={form.transport_allowance}
                      onChange={(e) => setForm({ ...form, transport_allowance: e.target.value })}
                    />
                    <TextField
                      label="Other allowances"
                      type="number"
                      value={form.other_allowances}
                      onChange={(e) => setForm({ ...form, other_allowances: e.target.value })}
                    />
                  </Stack>
                  <Typography variant="subtitle2">Monthly gross: {fCurrency(effectiveGross)}</Typography>
                </Stack>
              </Collapse>
            </Stack>
          </Card>

          <Card>
              <Typography variant="subtitle1" sx={{ p: 2, pb: 0 }}>
                Staff directory (login + non-login)
              </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Monthly gross</TableCell>
                  <TableCell>Breakdown</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{emp.name || '—'}</Typography>
                        {emp.email && (
                          <Typography variant="caption" color="text.secondary">
                            {emp.email}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={emp.has_login ? 'User staff' : 'Non-user'}
                        color={emp.has_login ? 'primary' : 'default'}
                        variant={emp.has_login ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">{fCurrency(emp.monthly_gross)}</TableCell>
                    <TableCell>
                      {hasBreakdown(emp) ? (
                        <Typography variant="caption" color="text.secondary">
                          Basic {fCurrency(emp.basic_salary)} · Housing {fCurrency(emp.housing_allowance)} ·
                          Transport {fCurrency(emp.transport_allowance)} · Other{' '}
                          {fCurrency(emp.other_allowances)}
                        </Typography>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{emp.is_owner ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {emp.has_login ? (
                          <Button size="small" onClick={() => demoteToNonUser(emp)}>
                            Make non-user
                          </Button>
                        ) : (
                          <Button size="small" onClick={() => openConvertToUser(emp)}>
                            Grant login
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeEmployee(emp.id)}
                          aria-label={`Remove ${emp.name || 'staff'}`}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!employees.length && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary">
                        No staff yet. Add a non-user, link a team user, or invite someone with login.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={createRun} disabled={!employees.length}>
              Create this-month draft
            </Button>
            <Button variant="contained" disabled={!run || run.status !== 'draft'} onClick={approveRun}>
              Approve draft
            </Button>
          </Stack>

          {run && (
            <Card>
              <Typography variant="subtitle1" sx={{ p: 2 }}>
                Run #{run.id} · {run.status} · PAYE due {fCurrency(run.paye_due)}
              </Typography>
              <Alert severity="warning" sx={{ mx: 2, mb: 1 }}>
                {run.disclaimer}
              </Alert>
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
                      <TableCell>
                        {line.employee_name}
                        {line.is_owner ? ' (owner)' : ''}
                      </TableCell>
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

      <Dialog open={Boolean(convertTarget)} onClose={() => setConvertTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Grant login (user staff)</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {convertTarget?.name} will get a login and occupy a seat on the selected store(s).
            </Typography>
            {!convertTarget?.user_id && (
              <TextField
                label="Email"
                required
                type="email"
                value={convertForm.email}
                onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })}
              />
            )}
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={convertForm.role_id}
                onChange={(e) => setConvertForm({ ...convertForm, role_id: e.target.value })}
              >
                <MenuItem value="">Default (cashier)</MenuItem>
                {(roles || []).map((role) => (
                  <MenuItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Stores</InputLabel>
              <Select
                multiple
                label="Stores"
                value={convertForm.store_ids}
                onChange={(e) => setConvertForm({ ...convertForm, store_ids: e.target.value })}
                input={<OutlinedInput label="Stores" />}
                renderValue={(selected) =>
                  (stores || [])
                    .filter((s) => selected.includes(s.id))
                    .map((s) => s.storeName)
                    .join(', ')
                }
              >
                {(stores || []).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.storeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {seatError && (
              <Alert
                severity="warning"
                action={
                  <Button component={RouterLink} href={billingHref} size="small" color="warning" variant="contained">
                    Update seats
                  </Button>
                }
              >
                {seatError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirmConvertToUser} disabled={converting}>
            Grant login
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
