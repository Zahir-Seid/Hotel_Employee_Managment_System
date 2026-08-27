'use client';

import { useRouter } from '@/hooks/use-router';
import { useDashboard } from '@/hooks/use-dashboard';
import {
  Users, UserCheck, AlertTriangle, CalendarX,
  ArrowRight, Activity,
  CalendarCheck, ScrollText, Building2, Shield,
  Clock, BarChart3, TrendingUp, ChevronRight,
} from 'lucide-react';

const KPI_CARDS = [
  {
    key: 'totalActive' as const,
    label: 'Total Active',
    icon: Users,
    accent: '#00DC82',
    bgLight: '#E6FFF2',
    borderClr: 'border-l-nuxt',
  },
  {
    key: 'presentToday' as const,
    label: 'Present Today',
    icon: UserCheck,
    accent: '#1F5E56',
    bgLight: '#E8F5F3',
    borderClr: 'border-l-teal',
  },
  {
    key: 'lateToday' as const,
    label: 'Late Today',
    icon: AlertTriangle,
    accent: '#B8863B',
    bgLight: '#FDF6E9',
    borderClr: 'border-l-brass',
  },
  {
    key: 'openShiftGaps' as const,
    label: 'Open Shift Gaps',
    icon: CalendarX,
    accent: '#A6432D',
    bgLight: '#FDEEEB',
    borderClr: 'border-l-clay',
    href: true,
  },
];

const QUICK_NAV = [
  {
    label: 'Employees',
    desc: 'Manage staff records, roles & departments',
    icon: Users,
    page: 'employees' as const,
    color: '#00DC82',
    bg: 'bg-nuxt/8',
    iconColor: 'text-nuxt-dark',
  },
  {
    label: 'Attendance',
    desc: 'Track daily check-ins, absences & leave',
    icon: CalendarCheck,
    page: 'attendance' as const,
    color: '#1F5E56',
    bg: 'bg-teal/8',
    iconColor: 'text-teal',
  },
  {
    label: 'Audit Log',
    desc: 'Review all system changes & actions',
    icon: ScrollText,
    page: 'audit-log' as const,
    color: '#B8863B',
    bg: 'bg-brass/8',
    iconColor: 'text-brass-dark',
  },
  {
    label: 'Departments',
    desc: 'Organizational structure & headcounts',
    icon: Building2,
    page: 'departments' as const,
    color: '#6366F1',
    bg: 'bg-indigo-500/8',
    iconColor: 'text-indigo-500',
  },
  {
    label: 'Shifts',
    desc: 'Scheduling, shift assignments & gaps',
    icon: Clock,
    page: 'shifts' as const,
    color: '#0EA5E9',
    bg: 'bg-sky-500/8',
    iconColor: 'text-sky-500',
  },
  {
    label: 'Reports',
    desc: 'Analytics, staffing & coverage reports',
    icon: BarChart3,
    page: 'reports' as const,
    color: '#8B5CF6',
    bg: 'bg-violet-500/8',
    iconColor: 'text-violet-500',
  },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const kpiMap = {
  totalActive: (d: NonNullable<ReturnType<typeof useDashboard>['data']>) => d.total_active,
  presentToday: (d: NonNullable<ReturnType<typeof useDashboard>['data']>) => d.present_today,
  lateToday: (d: NonNullable<ReturnType<typeof useDashboard>['data']>) => d.late_today,
  openShiftGaps: (d: NonNullable<ReturnType<typeof useDashboard>['data']>) => d.open_shift_gaps,
} as const;

export function DashboardView() {
  const { navigate } = useRouter();
  const { data, loading, error, refetch } = useDashboard();

  if (loading) {
    return (
      <div>
        <h1 className="page-title mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-hairline rounded-lg p-5">
              <div className="skeleton-row h-4 w-24 mb-3" />
              <div className="skeleton-row h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface border border-hairline rounded-lg p-5">
              <div className="skeleton-row h-4 w-20 mb-3" />
              <div className="skeleton-row h-3 w-40" />
            </div>
          ))}
        </div>
        <div className="mt-6 bg-surface border border-hairline rounded-lg p-5">
          <div className="skeleton-row h-5 w-40 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-row h-12 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h1 className="page-title mb-6">Dashboard</h1>
        <div className="bg-clay/5 border border-clay/20 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-clay shrink-0" />
          <span className="text-sm text-clay">{error || "Couldn't load dashboard data."}</span>
          <button
            onClick={() => refetch()}
            className="ml-auto text-sm text-clay underline hems-hover"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with accent bar */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-ink-muted mt-1">Hotel operations at a glance</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-nuxt-dark bg-nuxt-soft border border-nuxt/20 rounded-full px-3 py-1.5 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nuxt opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-nuxt" />
          </span>
          Live
        </div>
      </div>

      {/* KPI Cards — colorful left-border style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPI_CARDS.map(card => {
          const Icon = card.icon;
          const value = kpiMap[card.key](data);
          return (
            <div
              key={card.key}
              className={`bg-surface border border-hairline border-l-4 ${card.borderClr} rounded-lg p-5 ${card.href ? 'cursor-pointer hems-hover hover:shadow-md' : ''}`}
              onClick={() => card.href && navigate({ page: 'employees' })}
              role={card.href ? 'link' : undefined}
              tabIndex={card.href ? 0 : undefined}
              onKeyDown={e => card.href && e.key === 'Enter' && navigate({ page: 'employees' })}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ backgroundColor: card.bgLight }}
                >
                  <Icon size={20} style={{ color: card.accent }} />
                </div>
                {card.href && (
                  <ChevronRight size={16} className="text-ink-muted/40" />
                )}
              </div>
              <p className="text-2xl font-bold text-ink leading-none mb-1">{value}</p>
              <p className="text-xs text-ink-muted">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Navigation — section cards */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-ink">Quick Access</h2>
          <div className="flex-1 h-px bg-hairline" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_NAV.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => navigate({ page: item.page } as any)}
                className={`
                  group relative bg-surface border border-hairline rounded-lg p-4 text-left hems-hover
                  hover:border-nuxt/30 hover:shadow-sm cursor-pointer
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}
                  >
                    <Icon size={20} className={item.iconColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{item.label}</span>

                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-ink-muted/30 group-hover:text-nuxt hems-hover mt-1" />
                </div>
                {/* Color accent bar at bottom */}
                <div
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-60 group-hover:opacity-100 hems-hover"
                  style={{ backgroundColor: item.color }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Department Staffing — with colored bars */}
        <div className="lg:col-span-3 bg-surface border border-hairline rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Building2 size={15} className="text-ink-muted" />
              Department Staffing
            </h2>
            <span className="text-[10px] text-nuxt-dark bg-nuxt-soft border border-nuxt/15 rounded-full px-2 py-0.5 font-medium uppercase tracking-wide">
              Live
            </span>
          </div>
          <div className="space-y-3">
            {data.staffing.map(dept => {
              const maxHc = Math.max(...data.staffing.map(d => d.headcount), 1);
              const pct = (dept.headcount / maxHc) * 100;
              const barColor = pct >= 80 ? '#00DC82' : pct >= 50 ? '#B8863B' : '#A6432D';
              const barBg = pct >= 80 ? '#E6FFF2' : pct >= 50 ? '#FDF6E9' : '#FDEEEB';
              return (
                <div key={dept.department}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-ink font-medium">{dept.department}</span>
                    <span className="data-mono text-xs text-ink-muted">
                      {dept.headcount}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: barBg }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity — with colored avatars */}
        <div className="lg:col-span-2 bg-surface border border-hairline rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Activity size={15} className="text-ink-muted" />
              Recent Activity
            </h2>
            <span className="text-xs text-ink-muted data-mono">last 8</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data.recent_audit.map((entry, idx) => {
              const colors = ['#00DC82', '#1F5E56', '#B8863B', '#A6432D', '#6366F1', '#0EA5E9', '#8B5CF6', '#EC4899'];
              const c = colors[idx % colors.length];
              return (
                <div key={entry.id} className="flex items-start gap-3 pb-3 border-b border-hairline/60 last:border-0 last:pb-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold"
                    style={{ backgroundColor: c }}
                  >
                    {entry.actor_user_id ? `User #${entry.actor_user_id}` : 'System'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink leading-snug">
                      <span className="font-medium">{entry.actor_user_id ? `User #${entry.actor_user_id}` : 'System'}</span>{' '}
                      <span className="text-ink-muted">{entry.action.toLowerCase()}</span>
                    </p>
                    <p className="text-[11px] text-ink-muted/50 mt-0.5 data-mono">
                      {timeAgo(entry.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
