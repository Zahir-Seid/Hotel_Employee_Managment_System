'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { Role, RoleCreateInput } from '@/lib/types';

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Role[]>('/roles');
      setRoles(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  return { roles, loading, error, refetch: fetchRoles };
}

export function useCreateRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: RoleCreateInput): Promise<Role | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch<Role>('/roles', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create role');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useDeleteRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch<null>(`/roles/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete role');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}
