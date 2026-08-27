'use client';

import { useRouter } from '@/hooks/use-router';
import { useEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/use-employees';
import { useDepartments } from '@/hooks/use-departments';
import { KeycardChip } from './KeycardChip';
import { ArrowLeft, Loader2, Pencil, Trash2, Check, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { EmployeeUpdateInput, EmployeeStatus } from '@/lib/types';

export function EmployeeDetailView({ id, editMode = false }: { id: string; editMode?: boolean }) {
  const { navigate } = useRouter();
  const { employee, loading, error } = useEmployee(id);
  const { update, loading: saving, error: updateError } = useUpdateEmployee();
  const { remove: deleteEmployee, loading: deleting, error: deleteError } = useDeleteEmployee();
  const { departments } = useDepartments();
  const [editing, setEditing] = useState(editMode);
  const [form, setForm] = useState<Partial<EmployeeUpdateInput>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (employee && editing) {
      setForm({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        department_id: employee.department_id,
        hire_date: employee.hire_date,
        status: employee.status,
      });
      setErrors({});
    }
  }, [employee, editing]);

  useEffect(() => {
    if (editMode && employee) setEditing(true);
  }, [editMode, employee]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.first_name?.trim()) newErrors.first_name = 'Required';
    if (!form.last_name?.trim()) newErrors.last_name = 'Required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email';
    }
    if (form.hire_date && new Date(form.hire_date) > new Date()) {
      newErrors.hire_date = 'Cannot be in the future';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const result = await update(id, form);
    if (result) {
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    const success = await deleteEmployee(id);
    if (success) navigate({ page: 'employees' });
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    if (editMode) navigate({ page: 'employees-detail', id });
  };

  if (loading) {
    return (
      <div>
        <button onClick={() => navigate({ page: 'employees' })} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6">
          <ArrowLeft size={16} /> Back to Employees
        </button>
        <div className="bg-surface border border-hairline rounded-lg p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-row h-5 w-full" style={{ maxWidth: `${40 + Math.random() * 40}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div>
        <button onClick={() => navigate({ page: 'employees' })} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6">
          <ArrowLeft size={16} /> Back to Employees
        </button>
        <div className="bg-clay/5 border border-clay/20 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-clay" />
          <span className="text-sm text-clay">{error || 'Employee not found.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate({ page: 'employees' })}
        className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6"
      >
        <ArrowLeft size={16} /> Back to Employees
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">
          {editing ? 'Edit Employee' : 'Employee Detail'}
        </h1>
        {!editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20"
            >
              <Pencil size={15} /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 bg-clay/10 text-clay text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-clay/20 disabled:opacity-60"
            >
              {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Delete
            </button>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-teal/5 border border-teal/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-teal">
          <Check size={16} /> Employee updated successfully.
        </div>
      )}

      {updateError && (
        <div className="bg-clay/5 border border-clay/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-clay">
          <AlertTriangle size={16} /> {updateError}
        </div>
      )}

      {deleteError && (
        <div className="bg-clay/5 border border-clay/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-clay">
          <AlertTriangle size={16} /> {deleteError}
        </div>
      )}

      <div className="bg-surface border border-hairline rounded-lg p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="data-mono text-ink-muted text-sm bg-canvas px-2.5 py-1 rounded">{employee.employee_code}</span>
          <KeycardChip variant={{ type: 'status', value: employee.status }} />
          {employee.current_role && <KeycardChip variant={{ type: 'role', value: employee.current_role.name }} />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editing ? (
            <>
              <EditField label="First Name" value={form.first_name || ''} error={errors.first_name} onChange={v => setForm(p => ({ ...p, first_name: v }))} />
              <EditField label="Last Name" value={form.last_name || ''} error={errors.last_name} onChange={v => setForm(p => ({ ...p, last_name: v }))} />
              <EditField label="Email" type="email" value={form.email || ''} error={errors.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
              <EditField label="Phone" value={form.phone || ''} onChange={v => setForm(p => ({ ...p, phone: v }))} />
              <EditSelect
                label="Department"
                value={form.department_id || ''}
                options={departments.map(d => ({ value: d.id, label: d.name }))}
                onChange={v => setForm(p => ({ ...p, department_id: v || undefined }))}
              />
              <EditField label="Hire Date" type="date" value={form.hire_date || ''} error={errors.hire_date} onChange={v => setForm(p => ({ ...p, hire_date: v }))} />
              <EditSelect
                label="Status"
                value={form.status || ''}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'terminated', label: 'Terminated' },
                ]}
                onChange={v => setForm(p => ({ ...p, status: v as EmployeeStatus }))}
              />
            </>
          ) : (
            <>
              <DetailField label="Name" value={`${employee.first_name} ${employee.last_name}`} />
              <DetailField label="Code" value={employee.employee_code} mono />
              <DetailField label="Email" value={employee.email} />
              <DetailField label="Phone" value={employee.phone || '—'} />
              <DetailField label="Department" value={employee.department?.name || '—'} />
              <DetailField label="Role" value={employee.current_role?.name || '—'} />
              <DetailField label="Status" value={employee.status.charAt(0).toUpperCase() + employee.status.slice(1)} />
              <DetailField label="Hire Date" value={employee.hire_date} mono />
              <DetailField label="Created" value={new Date(employee.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} mono />
              <DetailField label="Last Updated" value={new Date(employee.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} mono />
            </>
          )}
        </div>

        {editing && (
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-hairline">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-ink-muted border border-hairline rounded-md hems-hover hover:text-ink hover:border-ink-muted/30"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20 disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-ink-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm text-ink ${mono ? 'data-mono' : ''}`}>{value}</p>
    </div>
  );
}

function EditField({ label, value, error, type = 'text', onChange }: {
  label: string; value: string; error?: string; type?: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`w-full px-3 py-2 text-sm bg-canvas border rounded-md outline-none transition-colors ${
          error ? 'border-clay' : 'border-hairline focus:border-nuxt'
        }`}
      />
      {error && <p className="mt-1 text-xs text-clay" role="alert">{error}</p>}
    </div>
  );
}

function EditSelect({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-canvas border border-hairline rounded-md outline-none focus:border-nuxt transition-colors"
      >
        <option value="">— None —</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
