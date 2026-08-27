'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { AuditLog } from '@/lib/types';

export function useAuditLogs(params?: { entity_type?: string; limit?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params?.entity_type) qs.set('entity_type', params.entity_type);
      if (params?.limit) qs.set('limit', String(params.limit));
      const query = qs.toString();
      const data = await apiFetch<AuditLog[]>(`/audit-logs${query ? `?${query}` : ''}`);
      setLogs(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [params?.entity_type, params?.limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}
