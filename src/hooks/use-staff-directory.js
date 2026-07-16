import { useCallback, useEffect, useMemo, useState } from 'react';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { useGetUsers } from 'src/actions/user';
import { useAuthContext } from 'src/auth/hooks';

/**
 * Unified staff directory: login users + non-login employees (no seat).
 *
 * Options shape:
 *  { key, kind: 'user'|'employee', id, label, secondary, email, hasLogin, employeeId?, userId? }
 */
export function buildStaffDirectoryOptions(users = [], employees = []) {
  const options = [];
  const linkedUserIds = new Set();

  (employees || []).forEach((emp) => {
    if (emp.has_login && emp.user_id) {
      linkedUserIds.add(Number(emp.user_id));
      options.push({
        key: `user:${emp.user_id}`,
        kind: 'user',
        id: Number(emp.user_id),
        userId: Number(emp.user_id),
        employeeId: emp.id,
        label: emp.name || emp.email || `Staff #${emp.user_id}`,
        email: emp.email || '',
        secondary: 'Login staff',
        hasLogin: true,
        onPayroll: true,
        rawEmployee: emp,
      });
    } else {
      options.push({
        key: `employee:${emp.id}`,
        kind: 'employee',
        id: emp.id,
        employeeId: emp.id,
        userId: null,
        label: emp.name || `Staff #${emp.id}`,
        email: emp.email || '',
        secondary: 'No login · no seat',
        hasLogin: false,
        onPayroll: true,
        rawEmployee: emp,
      });
    }
  });

  (users || []).forEach((u) => {
    const uid = Number(u.user_id);
    if (linkedUserIds.has(uid)) return;
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || `User #${uid}`;
    options.push({
      key: `user:${uid}`,
      kind: 'user',
      id: uid,
      userId: uid,
      employeeId: null,
      label: name,
      email: u.email || '',
      secondary: 'Login staff',
      hasLogin: true,
      onPayroll: false,
      rawUser: u,
    });
  });

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export function useStaffDirectory() {
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const { users, usersLoading, usersError } = useGetUsers();
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);

  const reloadEmployees = useCallback(async () => {
    if (!companyId) {
      setEmployees([]);
      return [];
    }
    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      const { data } = await axiosInstance.get(endpoints.payroll.employees, {
        params: { company_id: companyId },
      });
      const rows = data || [];
      setEmployees(rows);
      return rows;
    } catch (err) {
      setEmployees([]);
      setEmployeesError(err);
      return [];
    } finally {
      setEmployeesLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    reloadEmployees();
  }, [reloadEmployees]);

  const options = useMemo(
    () => buildStaffDirectoryOptions(users, employees),
    [users, employees]
  );

  const nonLoginOptions = useMemo(
    () => options.filter((o) => !o.hasLogin),
    [options]
  );

  const loginOptions = useMemo(
    () => options.filter((o) => o.hasLogin),
    [options]
  );

  const linkableLoginUsers = useMemo(
    () => options.filter((o) => o.hasLogin && !o.onPayroll),
    [options]
  );

  return {
    companyId,
    users: users || [],
    employees,
    options,
    nonLoginOptions,
    loginOptions,
    linkableLoginUsers,
    loading: usersLoading || employeesLoading,
    usersError,
    employeesError,
    reloadEmployees,
  };
}
