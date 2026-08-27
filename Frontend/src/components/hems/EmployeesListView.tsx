'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useEmployees, useDeleteEmployee } from '@/hooks/use-employees';
import { useDepartments } from '@/hooks/use-departments';
import { KeycardChip } from './KeycardChip';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import {
  Plus, Search, X, ChevronDown, AlertTriangle, RefreshCw,
} from 'lucide-react';
import type { Employee } from '@/lib/types';

export function EmployeesListView() {
  const { navigate } = useRouter();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const { departments } = useDepartments();
  const { employees, loading, error, refetch } = useEmployees({
    department_id: departmentFilter || undefined,
    status: statusFilter || undefined,
  });
  const { remove, loading: deleting } = useDeleteEmployee();

  useEffect(() => {
    (window as any).__hemsNavigate = (route: any, opts?: any) => {
      navigate(route);
      if (opts?.search) setSearch(opts.search);
    };
    return () => { delete (window as any).__hemsNavigate; };
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        document.getElementById('employee-search')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const ok = await remove(deleteTarget.id);
    if (ok) {
      setDeleteTarget(null);
      refetch();
    }
  }, [deleteTarget, remove, refetch]);

  const hasFilters = departmentFilter || statusFilter;

  const filteredEmployees = employees.filter(emp => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      emp.first_name?.toLowerCase().includes(q) ||
      emp.last_name?.toLowerCase().includes(q) ||
      emp.employee_code?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="page-title">Employees</h1>
        <button
          onClick={() => navigate({ page: 'employees-new' })}
          className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20"
        >
          <Plus size={16} />
          New Employee
        </button>
      </div>

      <div className="bg-surface border border-hairline rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="employee-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, code, or email..."
              className="w-full pl-10 pr-3 py-2 text-sm bg-canvas border border-hairline rounded-md outline-none focus:border-nuxt transition-colors"
              aria-label="Search employees"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink hems-hover"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hems-hover border border-transparent
                    ${hasFilters ? 'border-nuxt/30 text-nuxt-dark bg-nuxt/5' : 'border-hairline text-ink-muted hover:text-ink'}
                    ${showFilters ? 'bg-nuxt/5 text-nuxt-dark' : ''}`}
          >
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-nuxt" />}
            <ChevronDown size={14} className={`transition-transform duration-150 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-hairline">
            <FilterSelect
              label="Department"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={departments.map(d => ({ value: d.id, label: d.name }))}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-clay/5 border border-clay/20 rounded-lg p-4 flex items-center gap-3 mb-4">
          <AlertTriangle size={18} className="text-clay shrink-0" />
          <span className="text-sm text-clay">Couldn't load employees.</span>
          <button
            onClick={refetch}
            className="ml-auto text-sm text-clay underline hems-hover inline-flex items-center gap-1"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {loading && !error && (
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-3 bg-canvas/50 border-b border-hairline text-xs text-ink-muted uppercase tracking-wide">
            {['Code', 'Name', 'Department', 'Status', 'Hire Date', ''].map((h, i) => (
              <div key={i}>{h}</div>
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-hairline last:border-0">
              <div className="flex gap-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="skeleton-row h-4 flex-1" style={{ maxWidth: `${30 + Math.random() * 40}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filteredEmployees.length === 0 && (
        <div className="bg-surface border border-hairline rounded-lg p-12 text-center">
          <p className="text-ink-muted mb-4">No employees yet. Add your first employee to get started.</p>
          <button
            onClick={() => navigate({ page: 'employees-new' })}
            className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      )}

      {!loading && !error && filteredEmployees.length > 0 && (
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-hairline bg-canvas/50">
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Code</th>
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium hidden sm:table-cell">Hire Date</th>
                  <th className="text-right px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
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
                    <td data-label="Department" className="px-5 py-3 text-sm text-ink-muted hidden md:table-cell">{emp.department?.name || '—'}</td>
                    <td data-label="Status" className="px-5 py-3">
                      <KeycardChip variant={{ type: 'status', value: emp.status }} />
                    </td>
                    <td data-label="Hire Date" className="px-5 py-3 text-sm text-ink-muted hidden sm:table-cell data-mono">{emp.hire_date}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate({ page: 'employees-detail', id: emp.id })}
                          className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded"
                          aria-label={`View ${emp.first_name} ${emp.last_name}`}
                          title="View"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button
                          onClick={() => navigate({ page: 'employees-edit', id: emp.id })}
                          className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded"
                          aria-label={`Edit ${emp.first_name} ${emp.last_name}`}
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="p-1.5 text-ink-muted hover:text-clay hems-hover rounded"
                          aria-label={`Delete ${emp.first_name} ${emp.last_name}`}
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
            <p className="text-xs text-ink-muted">{filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          employeeName={`${deleteTarget.first_name} ${deleteTarget.last_name}`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-ink-muted whitespace-nowrap">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm bg-canvas border border-hairline rounded-md px-3 py-1.5 outline-none focus:border-nuxt transition-colors text-ink"
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        <option value="">All</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
