'use client';

import { useState } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useCreateEmployee } from '@/hooks/use-employees';
import { useDepartments } from '@/hooks/use-departments';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { EmployeeCreateInput } from '@/lib/types';

interface FieldErrors {
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  department_id?: string;
  hire_date?: string;
}

export function EmployeeNewView() {
  const { navigate } = useRouter();
  const { create, loading, error: apiError } = useCreateEmployee();
  const { departments } = useDepartments();

  const [form, setForm] = useState<EmployeeCreateInput>({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    department_id: '',
    hire_date: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateField = (name: keyof FieldErrors, value: string) => {
    switch (name) {
      case 'employee_code':
        return value.trim() ? '' : 'Employee code is required';
      case 'first_name':
        return value.trim() ? '' : 'First name is required';
      case 'last_name':
        return value.trim() ? '' : 'Last name is required';
      case 'email':
        if (!value.trim()) return 'Email is required';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Invalid email format';
      case 'department_id':
        return value ? '' : 'Department is required';
      case 'hire_date':
        return value ? '' : 'Hire date is required';
      default:
        return '';
    }
  };

  const handleBlur = (name: keyof FieldErrors) => {
    setTouched(prev => new Set(prev).add(name));
    const err = validateField(name, (form as any)[name] || '');
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched.has(name)) {
      const err = validateField(name as keyof FieldErrors, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fieldNames: (keyof FieldErrors)[] = ['employee_code', 'first_name', 'last_name', 'email', 'department_id', 'hire_date'];
    const newErrors: FieldErrors = {};
    const newTouched = new Set(touched);
    for (const name of fieldNames) {
      newTouched.add(name);
      const err = validateField(name, (form as any)[name] || '');
      if (err) newErrors[name] = err;
    }
    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const result = await create(form);
    if (result) {
      navigate({ page: 'employees' });
    }
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate({ page: 'employees' })}
        className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6"
      >
        <ArrowLeft size={16} />
        Back to Employees
      </button>

      <h1 className="page-title mb-6">New Employee</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-surface border border-hairline rounded-lg p-6 space-y-5">
          {apiError && (
            <div className="bg-clay/5 border border-clay/20 rounded-md p-3 text-sm text-clay">
              {apiError}
            </div>
          )}

          {/* Employee Code */}
          <FormField
            label="Employee Code"
            name="employee_code"
            value={form.employee_code}
            error={touched.has('employee_code') ? errors.employee_code : undefined}
            onChange={v => handleChange('employee_code', v)}
            onBlur={() => handleBlur('employee_code')}
            required
          />

          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="First Name"
              name="first_name"
              value={form.first_name}
              error={touched.has('first_name') ? errors.first_name : undefined}
              onChange={v => handleChange('first_name', v)}
              onBlur={() => handleBlur('first_name')}
              required
            />
            <FormField
              label="Last Name"
              name="last_name"
              value={form.last_name}
              error={touched.has('last_name') ? errors.last_name : undefined}
              onChange={v => handleChange('last_name', v)}
              onBlur={() => handleBlur('last_name')}
              required
            />
          </div>

          {/* Email */}
          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            error={touched.has('email') ? errors.email : undefined}
            onChange={v => handleChange('email', v)}
            onBlur={() => handleBlur('email')}
            required
          />

          {/* Department & Hire Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Department"
              name="department_id"
              value={form.department_id || ''}
              options={departments.map(d => ({ value: d.id, label: d.name }))}
              error={touched.has('department_id') ? errors.department_id : undefined}
              onChange={v => handleChange('department_id', v)}
              onBlur={() => handleBlur('department_id')}
              required
            />
            <FormField
              label="Hire Date"
              name="hire_date"
              type="date"
              value={form.hire_date}
              error={touched.has('hire_date') ? errors.hire_date : undefined}
              onChange={v => handleChange('hire_date', v)}
              onBlur={() => handleBlur('hire_date')}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate({ page: 'employees' })}
              className="px-4 py-2 text-sm text-ink-muted border border-hairline rounded-md hems-hover hover:text-ink hover:border-ink-muted/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Saving...' : 'Create Employee'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  name,
  type = 'text',
  value,
  error,
  onChange,
  onBlur,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink mb-1.5">
        {label} {required && <span className="text-clay">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full px-3 py-2 text-sm bg-canvas border rounded-md outline-none transition-colors ${
          error ? 'border-clay focus:border-clay' : 'border-hairline focus:border-nuxt'
        }`}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-clay" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
  error,
  onChange,
  onBlur,
  required,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink mb-1.5">
        {label} {required && <span className="text-clay">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full px-3 py-2 text-sm bg-canvas border rounded-md outline-none transition-colors ${
          error ? 'border-clay focus:border-clay' : 'border-hairline focus:border-nuxt'
        }`}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-clay" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
