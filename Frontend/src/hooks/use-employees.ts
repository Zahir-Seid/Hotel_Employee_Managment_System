'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { Employee, EmployeeCreateInput, EmployeeUpdateInput } from '@/lib/types';

export function useEmployees(params?: { department_id?: string; status?: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params?.department_id) qs.set('department_id', params.department_id);
      if (params?.status) qs.set('status', params.status);
      const query = qs.toString();
      const data = await apiFetch<Employee[]>(`/employees${query ? `?${query}` : ''}`);
      setEmployees(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [params?.department_id, params?.status]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  return { employees, loading, error, refetch: fetchEmployees };
}

export function useEmployee(id: string | null) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(() => !!id);
  const [error, setError] = useState<string | null>(null);

  const loadEmployee = useCallback(async (empId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Employee>(`/employees/${empId}`);
      setEmployee(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employee');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    loadEmployee(id);
  }, [id, loadEmployee]);

  return { employee, loading, error, refetch: () => id && loadEmployee(id) };
}

export function useCreateEmployee() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: EmployeeCreateInput): Promise<Employee | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Employee>('/employees', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create employee');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useUpdateEmployee() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, input: EmployeeUpdateInput): Promise<Employee | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Employee>(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update employee');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

export function useDeleteEmployee() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch<null>(`/employees/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete employee');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}
