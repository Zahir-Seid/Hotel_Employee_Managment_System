'use client';

import { useState } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useCreateDepartment } from '@/hooks/use-departments';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface FieldErrors {
  name?: string;
  description?: string;
}

export function DepartmentNewView() {
  const { navigate } = useRouter();
  const { create, loading, error: apiError } = useCreateDepartment();

  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateField = (name: keyof FieldErrors, value: string) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : 'Name is required';
      case 'description':
        return value.trim() ? '' : 'Description is required';
      default:
        return '';
    }
  };

  const handleBlur = (name: keyof FieldErrors) => {
    setTouched(prev => new Set(prev).add(name));
    const err = validateField(name, form[name] || '');
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

    const fieldNames: (keyof FieldErrors)[] = ['name', 'description'];
    const newErrors: FieldErrors = {};
    const newTouched = new Set(touched);
    for (const name of fieldNames) {
      newTouched.add(name);
      const err = validateField(name, form[name] || '');
      if (err) newErrors[name] = err;
    }
    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const dept = await create(form);
    if (dept) {
      navigate({ page: 'departments' });
    }
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate({ page: 'departments' })}
        className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink hems-hover mb-6"
      >
        <ArrowLeft size={16} />
        Back to Departments
      </button>

      <h1 className="page-title mb-6">New Department</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-surface border border-hairline rounded-lg p-6 space-y-5">
          {apiError && (
            <div className="bg-clay/5 border border-clay/20 rounded-md p-3 text-sm text-clay">
              {apiError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">
              Department Name <span className="text-clay">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Front Desk"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={`w-full px-3 py-2 text-sm bg-canvas border rounded-md outline-none transition-colors ${
                errors.name ? 'border-clay focus:border-clay' : 'border-hairline focus:border-nuxt'
              }`}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-xs text-clay" role="alert">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">
              Description <span className="text-clay">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              rows={3}
              placeholder="Brief description of the department's function..."
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
              className={`w-full px-3 py-2 text-sm bg-canvas border rounded-md outline-none transition-colors resize-none ${
                errors.description ? 'border-clay focus:border-clay' : 'border-hairline focus:border-nuxt'
              }`}
            />
            {errors.description && (
              <p id="description-error" className="mt-1 text-xs text-clay" role="alert">{errors.description}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate({ page: 'departments' })}
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
              {loading ? 'Saving...' : 'Create Department'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
