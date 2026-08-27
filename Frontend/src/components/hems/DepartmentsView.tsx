'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useDepartments, useDeleteDepartment } from '@/hooks/use-departments';
import { KeycardChip } from './KeycardChip';
import {
  Plus, AlertTriangle, RefreshCw, ArrowLeft, Loader2,
} from 'lucide-react';
import type { Employee } from '@/lib/types';

// ── Main Component ──

export function DepartmentsView() {
  const { navigate } = useRouter();
  const { departments, loading, error, refetch } = useDepartments();
  const { remove: removeDepartment, loading: deleting, error: deleteError } = useDeleteDepartment();

  // Detail state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deptEmployees, setDeptEmployees] = useState<Employee[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Fetch detail employees ──
  const fetchDetailEmployees = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetch(`/api/employees?department_id=${id}`);
      if (!res.ok) throw new Error('Failed to load employees');
      const emps: Employee[] = await res.json();
      setDeptEmployees(emps);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load employees.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Handle row click → show inline detail ──
  const handleRowClick = (id: string) => {
    setSelectedId(id);
    fetchDetailEmployees(id);
  };

  // ── Handle delete ──
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const ok = await removeDepartment(deleteTarget.id);
    if (ok) {
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
      refetch();
    }
  }, [deleteTarget, selectedId, removeDepartment, refetch]);

  // ── Detail view ──
  if (selectedId) {
    const dept = departments.find(d => d.id === selectedId);

    if (detailLoading || loading) {
      return (
        <div>
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6"
          >
            <ArrowLeft size={16} /> Back to Departments
          </button>
          <div className="bg-surface border border-hairline rounded-lg p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-row h-5 w-full" style={{ maxWidth: `${40 + Math.random() * 40}%` }} />
            ))}
          </div>
        </div>
      );
    }

    if (detailError || !dept) {
      return (
        <div>
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6"
          >
            <ArrowLeft size={16} /> Back to Departments
          </button>
          <div className="bg-clay/5 border border-clay/20 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle size={18} className="text-clay" />
            <span className="text-sm text-clay">{detailError || 'Department not found.'}</span>
            <button
              onClick={() => fetchDetailEmployees(selectedId)}
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
          <ArrowLeft size={16} /> Back to Departments
        </button>

        <h1 className="page-title mb-6">{dept.name}</h1>

        {/* Department info card */}
        <div className="bg-surface border border-hairline rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-ink">{dept.description || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">Created</p>
              <p className="text-sm text-ink data-mono">{dept.created_at}</p>
            </div>
          </div>
        </div>

        {/* Employees table */}
        <h2 className="text-sm font-semibold text-ink mb-3">
          Employees ({deptEmployees.length})
        </h2>
        {deptEmployees.length === 0 ? (
          <div className="bg-surface border border-hairline rounded-lg p-8 text-center">
            <p className="text-sm text-ink-muted">No employees assigned to this department.</p>
          </div>
        ) : (
          <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full responsive-table">
                <thead>
                  <tr className="border-b border-hairline bg-canvas/50">
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Code</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Name</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium hidden md:table-cell">Position</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Status</th>
                    <th className="text-right px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deptEmployees.map(emp => (
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
                      <td data-label="Position" className="px-5 py-3 text-sm text-ink-muted hidden md:table-cell">{emp.current_role?.name || '—'}</td>
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
        <h1 className="page-title">Departments</h1>
        <button
          onClick={() => navigate({ page: 'departments-new' })}
          className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20"
        >
          <Plus size={16} />
          New Department
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
            {['Name', 'Description', 'Created', ''].map((h, i) => (
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
      {!loading && !error && departments.length === 0 && (
        <div className="bg-surface border border-hairline rounded-lg p-12 text-center">
          <p className="text-ink-muted mb-4">No departments yet. Create your first department to get started.</p>
          <button
            onClick={() => navigate({ page: 'departments-new' })}
            className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20"
          >
            <Plus size={16} />
            Add Department
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && departments.length > 0 && (
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-hairline bg-canvas/50">
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium hidden md:table-cell">Description</th>
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium hidden sm:table-cell">Created</th>
                  <th className="text-right px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept.id} className="border-b border-hairline last:border-0 table-row-hover">
                    <td data-label="Name" className="px-5 py-3">
                      <button
                        onClick={() => handleRowClick(dept.id)}
                        className="text-sm font-medium text-ink hover:text-brass hems-hover text-left"
                      >
                        {dept.name}
                      </button>
                    </td>
                    <td data-label="Description" className="px-5 py-3 text-sm text-ink-muted hidden md:table-cell">
                      <span className="line-clamp-1 max-w-[200px] inline-block">{dept.description || '—'}</span>
                    </td>
                    <td data-label="Created" className="px-5 py-3 text-sm text-ink-muted data-mono hidden sm:table-cell">
                      {dept.created_at}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRowClick(dept.id)}
                          className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded"
                          aria-label={`View ${dept.name}`}
                          title="View"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button
                          onClick={() => navigate({ page: 'departments-detail', id: dept.id })}
                          className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded"
                          aria-label={`Edit ${dept.name}`}
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: dept.id, name: dept.name })}
                          className="p-1.5 text-ink-muted hover:text-clay hems-hover rounded"
                          aria-label={`Delete ${dept.name}`}
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
              {departments.length} department{departments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-dept-title">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface border border-hairline rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-clay/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-clay" />
              </div>
              <div>
                <h2 id="delete-dept-title" className="text-base font-semibold text-ink">
                  Delete {deleteTarget.name}?
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  Departments with assigned employees cannot be removed.
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
                {deleting ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
