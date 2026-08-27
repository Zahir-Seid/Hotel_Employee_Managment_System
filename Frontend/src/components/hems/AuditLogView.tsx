'use client';

import { useState, useMemo } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import type { AuditLog } from '@/lib/types';
import {
  RefreshCw, AlertTriangle, Search, Filter, Clock, Activity,
} from 'lucide-react';

// ── Types ──

type EntityFilter = 'All' | 'employee' | 'department' | 'role' | 'shift' | 'attendance' | 'user' | 'audit_log';

const ENTITY_OPTIONS: EntityFilter[] = ['All', 'employee', 'department', 'role', 'shift', 'attendance', 'user', 'audit_log'];

// ── Helpers ──

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ENTITY_CHIP_STYLES: Record<string, { bg: string; text: string }> = {
  employee: { bg: 'bg-nuxt/10 border-nuxt/30', text: 'text-nuxt' },
  department: { bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-500' },
  role: { bg: 'bg-brass/10 border-brass/30', text: 'text-brass' },
  shift: { bg: 'bg-sky-500/10 border-sky-500/30', text: 'text-sky-500' },
  attendance: { bg: 'bg-teal/10 border-teal/30', text: 'text-teal' },
  user: { bg: 'bg-violet-500/10 border-violet-500/30', text: 'text-violet-500' },
  audit_log: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-500' },
};

// ── Component ──

export function AuditLogView() {
  const { navigate } = useRouter();

  // Filters
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('All');
  const [search, setSearch] = useState('');

  const { logs: data, loading, error, refetch: fetchData } = useAuditLogs({
    entity_type: entityFilter === 'All' ? undefined : entityFilter,
    limit: 100,
  });

  // ── Client-side filtering (search only, entity is server-side) ──
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase().trim();
    return data.filter(
      e =>
        (e.actor_user_id && `User #${e.actor_user_id}`.toLowerCase().includes(q)) ||
        e.action.toLowerCase().includes(q),
    );
  }, [data, search]);

  // ── Helpers ──
  const errorBanner = (
    <div className="bg-clay/5 border border-clay/20 rounded-lg p-4 flex items-center gap-3 mb-4">
      <AlertTriangle size={18} className="text-clay shrink-0" />
      <span className="text-sm text-clay">{error || "Couldn't load audit log."}</span>
      <button
        onClick={fetchData}
        className="ml-auto text-sm text-clay underline hems-hover inline-flex items-center gap-1"
      >
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  const skeleton = (
    <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-canvas/50">
              {['Actor', 'Action', 'Entity', 'Entity ID', 'Time'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-hairline last:border-0">
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-28" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-36" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-6 w-20" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-24" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Render ──
  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="text-sm text-ink-muted mt-1">Full trail of system changes and actions</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Entity dropdown */}
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value as EntityFilter)}
            className="appearance-none pl-8 pr-8 py-2 text-sm border border-hairline rounded-lg bg-surface text-ink focus:outline-none focus:border-nuxt/40 focus:ring-1 focus:ring-nuxt/20 transition-colors hems-hover cursor-pointer"
          >
            {ENTITY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt === 'All' ? 'All Entities' : opt}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actor or action..."
            className="w-full pl-8 pr-4 py-2 text-sm border border-hairline rounded-lg bg-surface text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-nuxt/40 focus:ring-1 focus:ring-nuxt/20 transition-colors"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted border border-hairline rounded-lg px-3 py-2 hems-hover hover:text-ink hover:border-ink-muted/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>

        {/* Count badge */}
        {!loading && !error && (
          <span className="text-xs text-ink-muted data-mono">
            {filtered.length}{filtered.length !== data.length && <span className="text-ink-muted/50"> / {data.length}</span>} entries
          </span>
        )}
      </div>

      {/* Error */}
      {error && errorBanner}

      {/* Loading */}
      {loading && skeleton}

      {/* Data */}
      {!loading && !error && (
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
              <Activity size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No audit entries found.</p>
              {(search.trim() || entityFilter !== 'All') && (
                <button
                  onClick={() => { setSearch(''); setEntityFilter('All'); }}
                  className="text-xs text-nuxt underline mt-2 hems-hover"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-canvas/50">
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Actor</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Action</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Entity</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium hidden sm:table-cell">Entity ID</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(entry => {
                    const chipStyle = ENTITY_CHIP_STYLES[entry.entity_type] || { bg: 'bg-canvas border-hairline', text: 'text-ink-muted' };
                    return (
                      <tr key={entry.id} className="border-b border-hairline last:border-0 table-row-hover">
                        <td className="px-5 py-3 text-sm font-medium text-ink whitespace-nowrap">
                          {entry.actor_user_id ? `User #${entry.actor_user_id}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-sm text-ink-muted">{entry.action}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${chipStyle.bg} ${chipStyle.text}`}>
                            {entry.entity_type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm data-mono text-ink-muted hidden sm:table-cell">{entry.entity_id ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted data-mono">
                            <Clock size={12} className="opacity-50" />
                            {timeAgo(entry.created_at)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
