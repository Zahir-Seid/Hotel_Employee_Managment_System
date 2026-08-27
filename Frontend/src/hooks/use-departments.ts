'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { Department, DepartmentCreateInput } from '@/lib/types';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Department[]>('/departments');
      setDepartments(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  return { departments, loading, error, refetch: fetchDepartments };
}

export function useCreateDepartment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: DepartmentCreateInput): Promise<Department | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch<Department>('/departments', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create department');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useUpdateDepartment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, input: Partial<DepartmentCreateInput>): Promise<Department | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch<Department>(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update department');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

export function useDeleteDepartment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch<null>(`/departments/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete department');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}
