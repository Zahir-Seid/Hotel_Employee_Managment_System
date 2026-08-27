'use client';

import { useRouter } from '@/hooks/use-router';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Search, X, Menu, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { HemsRoute } from '@/lib/types';

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  'employees-new': 'New Employee',
  'employees-detail': 'Employee Detail',
  'employees-edit': 'Edit Employee',
  departments: 'Departments',
  'departments-new': 'New Department',
  'departments-detail': 'Department Detail',
  roles: 'Roles',
  'roles-new': 'New Role',
  'roles-detail': 'Role Detail',
  shifts: 'Shifts',
  'shifts-assign': 'Assign Shift',
  attendance: 'Attendance',
  'attendance-record': 'Record Attendance',
  reports: 'Reports',
  'audit-log': 'Audit Log',
};

// Pages that are sub-pages of a parent section
const PARENT_MAP: Record<string, string> = {
  'employees-new': 'employees',
  'employees-detail': 'employees',
  'employees-edit': 'employees',
  'departments-new': 'departments',
  'departments-detail': 'departments',
  'roles-new': 'roles',
  'roles-detail': 'roles',
  'shifts-assign': 'shifts',
  'attendance-record': 'attendance',
};

export function Topbar() {
  const { route, navigate } = useRouter();
  const { toggle } = useMobileSidebar();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const breadcrumbs: { label: string; page?: HemsRoute }[] = [{ label: 'HEMS' }];

  const parentPage = PARENT_MAP[route.page];
  if (parentPage) {
    breadcrumbs.push({ label: BREADCRUMB_MAP[parentPage], page: { page: parentPage } as HemsRoute });
    breadcrumbs.push({ label: BREADCRUMB_MAP[route.page] });
  } else {
    breadcrumbs.push({ label: BREADCRUMB_MAP[route.page] || '' });
  }

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  const displayName = user?.username || 'Unknown';

  return (
    <header className="sticky top-0 z-20 h-14 bg-surface flex items-center px-4 md:px-6 gap-3 border-b border-hairline"
      style={{ borderBottomColor: 'transparent', boxShadow: '0 1px 0 0 var(--hairline), 0 2px 0 0 var(--nuxt)' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggle}
        className="md:hidden text-ink-muted hover:text-ink hems-hover p-1 -ml-1"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 truncate">
            {i > 0 && <span className="text-hairline">/</span>}
            {crumb.page ? (
              <button
                onClick={() => navigate(crumb.page!)}
                className="text-ink-muted hover:text-ink hems-hover truncate"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-ink-muted/60 truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <div className="flex items-center gap-2 bg-canvas rounded-md border border-hairline px-3 py-1.5">
            <Search size={15} className="text-ink-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate({ page: 'employees' });
                  setSearchOpen(false);
                  setSearchQuery('');
                }
                if (e.key === 'Escape') {
                  setSearchOpen(false);
                  setSearchQuery('');
                }
              }}
              placeholder="Search employees..."
              className="bg-transparent text-sm outline-none w-48 text-ink placeholder:text-ink-muted/50"
              aria-label="Search employees"
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="text-ink-muted hover:text-ink hems-hover"
              aria-label="Close search"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 text-ink-muted hover:text-ink hems-hover text-sm"
            aria-label="Open search"
          >
            <Search size={16} />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-[10px] text-ink-muted/50 bg-canvas border border-hairline rounded px-1.5 py-0.5 font-mono">/</kbd>
          </button>
        )}
      </div>

      {/* User info + Logout */}
      <div className="flex items-center gap-2 ml-2">
        <div className="w-8 h-8 rounded-full bg-nuxt/15 border-2 border-nuxt/30 flex items-center justify-center">
          <span className="text-nuxt-dark text-xs font-bold">{userInitials}</span>
        </div>
        <span className="hidden md:block text-sm text-ink-muted font-medium">{displayName}</span>
        <span className="hidden md:block text-[10px] text-ink-muted/50 bg-canvas border border-hairline rounded px-1.5 py-0.5 font-mono uppercase">
          {user?.role ?? '—'}
        </span>
        <button
          onClick={logout}
          className="text-ink-muted hover:text-clay hems-hover p-1.5 rounded-md"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
