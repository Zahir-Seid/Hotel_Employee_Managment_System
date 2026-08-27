'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useRoles, useDeleteRole } from '@/hooks/use-roles';
import { KeycardChip } from './KeycardChip';
import {
  Plus, AlertTriangle, RefreshCw, ArrowLeft, Loader2,
} from 'lucide-react';
import type { Employee } from '@/lib/types';
import { apiFetch } from '@/lib/api';

// ── Main Component ──

export function RolesView() {
  const { navigate } = useRouter();
  const { roles, loading, error, refetch } = useRoles();
  const { remove: deleteRole, loading: deleting, error: deleteApiError } = useDeleteRole();

  // Detail state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roleDetail, setRoleDetail] = useState<{ id: string; name: string; description: string; created_at: string; updated_at: string } | null>(null);
  const [roleEmployees, setRoleEmployees] = useState<Employee[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Employee count per role — backend tracks role via employee_roles table
  // For now, show 0 since we don't have a direct count endpoint
  const employeeCounts: Record<string, number> = {};

  // ── Fetch detail ──
  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const [role, emps] = await Promise.all([
        apiFetch<{ id: string; name: string; description: string; created_at: string; updated_at: string }>(`/roles/${id}`),
        apiFetch<Employee[]>('/employees'),
      ]);
      setRoleDetail(role);
      setRoleEmployees((emps ?? []).filter(e => e.current_role?.id === id));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load role detail.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Handle row click → show inline detail ──
  const handleRowClick = (id: string) => {
    setSelectedId(id);
    fetchDetail(id);
  };

  // ── Handle delete ──
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    const ok = await deleteRole(deleteTarget.id);
    if (!ok) {
      if (deleteApiError?.includes('assigned')) {
        setDeleteError('Cannot delete: this role is assigned to employees.');
      } else {
        setDeleteError(deleteApiError || 'Something went wrong. Please try again.');
      }
      return;
    }
    setDeleteTarget(null);
    if (selectedId === deleteTarget.id) setSelectedId(null);
    refetch();
  }, [deleteTarget, selectedId, deleteRole, deleteApiError, refetch]);

  // ── Detail view ──
  if (selectedId) {
    if (detailLoading) {
      return (
        <div>
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6"
          >
            <ArrowLeft size={16} /> Back to Roles
          </button>
          <div className="bg-surface border border-hairline rounded-lg p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-row h-5 w-full" style={{ maxWidth: `${40 + Math.random() * 40}%` }} />
            ))}
          </div>
        </div>
      );
    }

    if (detailError || !roleDetail) {
      return (
        <div>
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6"
          >
            <ArrowLeft size={16} /> Back to Roles
          </button>
          <div className="bg-clay/5 border border-clay/20 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle size={18} className="text-clay" />
            <span className="text-sm text-clay">{detailError || 'Role not found.'}</span>
            <button
              onClick={() => fetchDetail(selectedId)}
              className="ml-auto text-sm text-clay underline hems-hover inline-flex items-center gap-1"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl">
        <button
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6"
        >
          <ArrowLeft size={16} /> Back to Roles
        </button>

        <h1 className="page-title mb-6">{roleDetail.name}</h1>

        {/* Role info card */}
        <div className="bg-surface border border-hairline rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">Name</p>
              <p className="text-sm text-ink data-mono">{roleDetail.name}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-ink-muted">{roleDetail.description || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">Created</p>
              <p className="text-sm text-ink-muted">{roleDetail.created_at ? new Date(roleDetail.created_at).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>

        {/* Employees table */}
        <h2 className="text-sm font-semibold text-ink mb-3">
          Employees with this role ({roleEmployees.length})
        </h2>
        {roleEmployees.length === 0 ? (
          <div className="bg-surface border border-hairline rounded-lg p-8 text-center">
            <p className="text-sm text-ink-muted">No employees assigned to this role.</p>
          </div>
        ) : (
          <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full responsive-table">
                <thead>
                  <tr className="border-b border-hairline bg-canvas/50">
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Code</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Name</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Status</th>
                    <th className="text-right px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roleEmployees.map(emp => (
                    <tr key={emp.id} className="border-b border-hairline last:border-0 table-row-hover">
                      <td data-label="Code" className="px-5 py-3 data-mono text-ink-muted text-xs">{emp.employee_code}</td>
                      <td data-label="Name" className="px-5 py-3">
                        <button
                          onClick={() => navigate({ page: 'employees-detail', id: emp.id })}
                          className="text-sm font-medium text-ink hover:text-brass hems-hover text-left"
                        >
                          {emp.first_name} {emp.last_name}
                        </button>
                      </td>
                      <td data-label="Status" className="px-5 py-3">
                        <KeycardChip variant={{ type: 'status', value: emp.status }} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => navigate({ page: 'employees-detail', id: emp.id })}
                          className="text-xs text-ink-muted hover:text-ink hems-hover"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List view ──
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="page-title">Roles</h1>
        <button
          onClick={() => navigate({ page: 'roles-new' })}
          className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20"
        >
          <Plus size={16} />
          New Role
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-clay/5 border border-clay/20 rounded-lg p-4 flex items-center gap-3 mb-4">
          <AlertTriangle size={18} className="text-clay shrink-0" />
          <span className="text-sm text-clay">{error}</span>
          <button
            onClick={refetch}
            className="ml-auto text-sm text-clay underline hems-hover inline-flex items-center gap-1"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 bg-canvas/50 border-b border-hairline text-xs text-ink-muted uppercase tracking-wide">
            {['Name', 'Description', 'Employees', ''].map((h, i) => (
              <div key={i}>{h}</div>
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-hairline last:border-0">
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="skeleton-row h-4 flex-1" style={{ maxWidth: `${30 + Math.random() * 40}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && roles.length === 0 && (
        <div className="bg-surface border border-hairline rounded-lg p-12 text-center">
          <p className="text-ink-muted mb-4">No roles yet. Create your first role to get started.</p>
          <button
            onClick={() => navigate({ page: 'roles-new' })}
            className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20"
          >
            <Plus size={16} />
            Add Role
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && roles.length > 0 && (
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-hairline bg-canvas/50">
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium hidden md:table-cell">Description</th>
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Employees</th>
                  <th className="text-right px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role.id} className="border-b border-hairline last:border-0 table-row-hover">
                    <td data-label="Name" className="px-5 py-3">
                      <button
                        onClick={() => handleRowClick(role.id)}
                        className="text-sm font-medium text-ink hover:text-brass hems-hover text-left"
                      >
                        {role.name}
                      </button>
                    </td>
                    <td data-label="Description" className="px-5 py-3 text-sm text-ink-muted hidden md:table-cell">
                      <span className="line-clamp-1 max-w-[200px] inline-block">{role.description || '—'}</span>
                    </td>
                    <td data-label="Employees" className="px-5 py-3 data-mono text-sm text-ink">{employeeCounts[role.id] || 0}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRowClick(role.id)}
                          className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded"
                          aria-label={`View ${role.name}`}
                          title="View"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button
                          onClick={() => navigate({ page: 'roles-detail', id: role.id })}
                          className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded"
                          aria-label={`Edit ${role.name}`}
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={() => { setDeleteTarget({ id: role.id, name: role.name }); setDeleteError(null); }}
                          className="p-1.5 text-ink-muted hover:text-clay hems-hover rounded"
                          aria-label={`Delete ${role.name}`}
                          title="Delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-hairline bg-canvas/30">
            <p className="text-xs text-ink-muted">
              {roles.length} role{roles.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-role-title">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface border border-hairline rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-clay/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-clay" />
              </div>
              <div>
                <h2 id="delete-role-title" className="text-base font-semibold text-ink">
                  Delete {deleteTarget.name}?
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  Roles that are assigned to employees cannot be removed.
                </p>
              </div>
            </div>
            {deleteError && (
              <div className="bg-clay/5 border border-clay/20 rounded-md p-3 text-sm text-clay mb-4">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-ink-muted border border-hairline rounded-md hems-hover hover:text-ink hover:border-ink-muted/30 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 bg-clay text-white text-sm font-medium px-4 py-2 rounded-md hems-hover hover:bg-clay-light disabled:opacity-60"
              >
                {deleting && <Loader2 size={15} className="animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
