'use client';

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { Attendance, CheckInInput, CheckOutInput } from '@/lib/types';

export function useAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIn = async (input: CheckInInput): Promise<Attendance | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch<Attendance>('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkOut = async (input: CheckOutInput): Promise<Attendance | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch<Attendance>('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-out failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const listByEmployee = useCallback(async (employeeId: string, from?: string, to?: string): Promise<Attendance[]> => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const query = qs.toString();
    return apiFetch<Attendance[]>(`/employees/${employeeId}/attendance${query ? `?${query}` : ''}`);
  }, []);

  return { checkIn, checkOut, listByEmployee, loading, error };
}
