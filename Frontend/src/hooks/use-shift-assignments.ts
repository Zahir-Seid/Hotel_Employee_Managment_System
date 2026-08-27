'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { ShiftAssignment, ShiftAssignmentCreateInput } from '@/lib/types';

export function useShiftAssignments(params?: { employee_id?: string; from?: string; to?: string }) {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params?.employee_id) qs.set('employee_id', params.employee_id);
      if (params?.from) qs.set('from', params.from);
      if (params?.to) qs.set('to', params.to);
      const query = qs.toString();
      const data = await apiFetch<ShiftAssignment[]>(`/shift-assignments${query ? `?${query}` : ''}`);
      setAssignments(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load shift assignments');
    } finally {
      setLoading(false);
    }
  }, [params?.employee_id, params?.from, params?.to]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  return { assignments, loading, error, refetch: fetchAssignments };
}

export function useCreateShiftAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: ShiftAssignmentCreateInput): Promise<ShiftAssignment | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch<ShiftAssignment>('/shift-assignments', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create shift assignment');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useDeleteShiftAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch<null>(`/shift-assignments/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete shift assignment');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}
