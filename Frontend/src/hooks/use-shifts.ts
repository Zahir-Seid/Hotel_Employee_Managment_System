'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { Shift, ShiftCreateInput } from '@/lib/types';

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Shift[]>('/shifts');
      setShifts(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  return { shifts, loading, error, refetch: fetchShifts };
}

export function useCreateShift() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: ShiftCreateInput): Promise<Shift | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch<Shift>('/shifts', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create shift');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useDeleteShift() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch<null>(`/shifts/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete shift');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}
