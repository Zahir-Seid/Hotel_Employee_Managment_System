'use client';

import { useState, useMemo } from 'react';
import {
  Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, Trash2, Filter, AlertTriangle, Loader2,
} from 'lucide-react';
import { useShifts, useCreateShift } from '@/hooks/use-shifts';
import { useShiftAssignments, useCreateShiftAssignment, useDeleteShiftAssignment } from '@/hooks/use-shift-assignments';
import { useEmployees } from '@/hooks/use-employees';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type Tab = 'schedule' | 'templates' | 'assign';

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const SHIFT_COLORS = [
  { bg: 'bg-nuxt/10', border: 'border-nuxt/30', color: 'text-nuxt' },
  { bg: 'bg-brass/10', border: 'border-brass/30', color: 'text-brass' },
  { bg: 'bg-indigo-400/10', border: 'border-indigo-400/30', color: 'text-indigo-400' },
  { bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', color: 'text-emerald-400' },
  { bg: 'bg-amber-400/10', border: 'border-amber-400/30', color: 'text-amber-400' },
];

export function ShiftsView() {
  const [tab, setTab] = useState<Tab>('schedule');
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));

  // Data via hooks
  const { shifts: shiftTemplates, loading: loadingShifts, error: shiftsError, refetch: refetchShifts } = useShifts();
  const { employees, loading: loadingEmployees } = useEmployees();

  // Date range for current week view
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return fmt(d);
  }, [weekStart]);
  const weekStartStr = useMemo(() => fmt(weekStart), [weekStart]);

  const { assignments, loading: loadingAssignments, error: assignmentsError, refetch: refetchAssignments } = useShiftAssignments({
    from: weekStartStr,
    to: weekEnd,
  });

  const loading = loadingShifts || loadingEmployees || loadingAssignments;
  const error = shiftsError || assignmentsError;

  // Mutations
  const { create: createShift, loading: creatingShift } = useCreateShift();
  const { create: createAssignment, loading: creatingAssignment } = useCreateShiftAssignment();
  const { remove: deleteAssignment, loading: deletingAssignment } = useDeleteShiftAssignment();

  // Week dates
  const weekDates = useMemo(() => {
    return DAYS.map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // Enriched assignments map: work_date -> list of { assignment, employeeName, shiftName }
  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, { id: string; employeeName: string; employeeId: string; shiftName: string; shiftId: string }[]>();
    const empMap = new Map(employees.map(e => [e.id, e]));
    const shiftMap = new Map(shiftTemplates.map(s => [s.id, s]));

    for (const a of assignments) {
      const emp = empMap.get(a.employee_id);
      const shift = shiftMap.get(a.shift_id) || a.shift;
      const entry = {
        id: a.id,
        employeeName: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        employeeId: a.employee_id,
        shiftName: shift?.name || 'Unknown',
        shiftId: a.shift_id,
      };
      const list = map.get(a.work_date) || [];
      list.push(entry);
      map.set(a.work_date, list);
    }
    return map;
  }, [assignments, employees, shiftTemplates]);

  // Coverage counts
  const coverageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of weekDates) {
      const dateStr = fmt(d);
      const dayAssignments = assignmentsByDate.get(dateStr) || [];
      const uniqueEmps = new Set(dayAssignments.map(a => a.employeeId));
      map.set(dateStr, uniqueEmps.size);
    }
    return map;
  }, [assignmentsByDate, weekDates]);

  const totalActiveEmployees = employees.filter(e => e.status === 'active').length;

  // Shift color by index
  const getShiftColor = (shiftId: string) => {
    const idx = shiftTemplates.findIndex(s => s.id === shiftId);
    return SHIFT_COLORS[idx % SHIFT_COLORS.length];
  };

  // Week navigation
  const goToPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goToNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const goToToday = () => {
    setWeekStart(getMonday(new Date()));
  };

  const weekLabel = `${fmtShort(weekDates[0])} – ${fmtShort(weekDates[6])}`;

  // Delete assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    const ok = await deleteAssignment(assignmentId);
    if (ok) refetchAssignments();
  };

  // ── Tab bar ──
  const tabBar = (
    <div className="flex gap-6 border-b border-hairline mb-6">
      <button
        onClick={() => setTab('schedule')}
        className={`pb-2.5 text-sm font-medium transition-colors ${tab === 'schedule' ? 'text-nuxt border-b-2 border-nuxt' : 'text-ink-muted hover:text-ink hems-hover'}`}
      >
        <Calendar size={15} className="inline -mt-0.5 mr-1.5" />
        Weekly Schedule
      </button>
      <button
        onClick={() => setTab('templates')}
        className={`pb-2.5 text-sm font-medium transition-colors ${tab === 'templates' ? 'text-nuxt border-b-2 border-nuxt' : 'text-ink-muted hover:text-ink hems-hover'}`}
      >
        <Clock size={15} className="inline -mt-0.5 mr-1.5" />
        Shift Templates
      </button>
      <button
        onClick={() => setTab('assign')}
        className={`pb-2.5 text-sm font-medium transition-colors ${tab === 'assign' ? 'text-nuxt border-b-2 border-nuxt' : 'text-ink-muted hover:text-ink hems-hover'}`}
      >
        <Plus size={15} className="inline -mt-0.5 mr-1.5" />
        Assign Shift
      </button>
    </div>
  );

  // ── Error banner ──
  const errorBanner = error && (
    <div className="bg-clay/5 border border-clay/20 rounded-lg p-4 flex items-center gap-3 mb-4">
      <AlertTriangle size={18} className="text-clay shrink-0" />
      <span className="text-sm text-clay">{error}</span>
      <button
        onClick={() => { refetchShifts(); refetchAssignments(); }}
        className="ml-auto text-sm text-clay underline hems-hover"
      >
        Retry
      </button>
    </div>
  );

  // ── Skeleton loader ──
  const skeleton = (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface border border-hairline rounded-lg p-5 space-y-3">
          <div className="skeleton-row h-4 w-32" />
          <div className="flex gap-3">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="flex-1 space-y-2">
                <div className="skeleton-row h-3 w-full" />
                <div className="skeleton-row h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Template form state ──
  const [tplName, setTplName] = useState('');
  const [tplStart, setTplStart] = useState('06:00');
  const [tplEnd, setTplEnd] = useState('14:00');
  const [tplError, setTplError] = useState<string | null>(null);
  const [tplSuccess, setTplSuccess] = useState(false);

  const handleCreateTemplate = async () => {
    if (!tplName.trim()) return;
    setTplError(null);
    setTplSuccess(false);
    const result = await createShift({ name: tplName.trim(), start_time: tplStart, end_time: tplEnd });
    if (result) {
      setTplSuccess(true);
      setTplName('');
      setTplStart('06:00');
      setTplEnd('14:00');
      refetchShifts();
    } else {
      setTplError('Failed to create shift template.');
    }
  };

  // ── Assign form state ──
  const [formEmpId, setFormEmpId] = useState('');
  const [formShiftId, setFormShiftId] = useState('');
  const [formDate, setFormDate] = useState(fmt(new Date()));
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const handleAssign = async () => {
    if (!formEmpId || !formShiftId || !formDate) return;
    setAssignError(null);
    setAssignSuccess(false);
    const result = await createAssignment({ employee_id: formEmpId, shift_id: formShiftId, work_date: formDate });
    if (result) {
      setAssignSuccess(true);
      setFormEmpId('');
      setFormShiftId('');
      setFormDate(fmt(new Date()));
      refetchAssignments();
    } else {
      setAssignError('Failed to assign shift. Please try again.');
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="page-title">Shifts</h1>
      </div>

      {tabBar}
      {errorBanner}

      {/* ══════════ TAB: WEEKLY SCHEDULE ══════════ */}
      {tab === 'schedule' && (
        <>
          {/* Week navigation */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={goToPrevWeek}
              className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded border border-hairline"
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToToday}
              className="text-sm font-medium text-ink hems-hover hover:text-nuxt"
            >
              {weekLabel}
            </button>
            <button
              onClick={goToNextWeek}
              className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded border border-hairline"
              aria-label="Next week"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => { refetchAssignments(); }}
              className="ml-auto p-1.5 text-ink-muted hover:text-ink hems-hover rounded border border-hairline"
              title="Refresh"
            >
              <Filter size={15} />
            </button>
          </div>

          {loading && !error && skeleton}

          {!loading && !error && (
            <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
              {/* Shift type headers row */}
              <div className="grid grid-cols-8 divide-x divide-hairline">
                {/* Empty cell for date column */}
                <div className="px-3 py-2 bg-canvas/40 border-b border-hairline" />

                {/* Each shift template gets a column */}
                {shiftTemplates.map((shift, idx) => {
                  const color = SHIFT_COLORS[idx % SHIFT_COLORS.length];
                  return (
                    <div key={shift.id} className={`px-3 py-2 ${color.bg} border-b ${color.border}`}>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className={color.color} />
                        <span className={`text-xs font-semibold ${color.color}`}>{shift.name}</span>
                      </div>
                      <div className="text-[10px] text-ink-muted mt-0.5">
                        {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day rows */}
              {weekDates.map((dayDate, idx) => {
                const dateStr = fmt(dayDate);
                const dayAssignments = assignmentsByDate.get(dateStr) || [];
                const coverage = coverageMap.get(dateStr) || 0;
                const isToday = dateStr === fmt(new Date());

                return (
                  <div key={idx} className="grid grid-cols-8 divide-x divide-hairline border-b border-hairline last:border-b-0">
                    {/* Date label */}
                    <div className={`px-3 py-2 min-h-[72px] ${isToday ? 'bg-nuxt/5' : 'bg-canvas/40'}`}>
                      <span className={`text-xs font-medium ${isToday ? 'text-nuxt' : 'text-ink-muted'}`}>
                        {DAYS[idx]}
                      </span>
                      <div className="text-[10px] text-ink-muted data-mono">{fmtShort(dayDate)}</div>
                      <div className="text-[10px] data-mono text-ink-muted mt-1">
                        {coverage}/{totalActiveEmployees}
                      </div>
                    </div>

                    {/* One cell per shift template */}
                    {shiftTemplates.map((shift) => {
                      const dayShiftAssignments = dayAssignments.filter(a => a.shiftId === shift.id);
                      const color = getShiftColor(shift.id);

                      return (
                        <div key={shift.id} className="min-h-[72px] p-1.5 space-y-1">
                          {dayShiftAssignments.length === 0 ? (
                            <p className="text-[11px] text-ink-muted/50 text-center py-4">–</p>
                          ) : (
                            dayShiftAssignments.map(a => (
                              <div
                                key={a.id}
                                className={`flex items-center gap-1 rounded px-1.5 py-1 text-[11px] group ${color.bg}`}
                              >
                                <span className="flex-1 truncate text-ink">
                                  {a.employeeName}
                                </span>
                                <button
                                  onClick={() => handleDeleteAssignment(a.id)}
                                  disabled={deletingAssignment}
                                  className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-clay transition-opacity shrink-0"
                                  aria-label={`Remove ${a.employeeName}`}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Empty state */}
              {shiftTemplates.length === 0 && (
                <div className="p-8 text-center">
                  <Clock size={32} className="text-ink-muted/30 mx-auto mb-2" />
                  <p className="text-sm text-ink-muted">No shift templates yet. Create one in the "Shift Templates" tab.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════ TAB: SHIFT TEMPLATES ══════════ */}
      {tab === 'templates' && (
        <div className="max-w-xl space-y-4">
          {/* Template list */}
          <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
            {loadingShifts ? (
              <div className="p-6">{skeleton}</div>
            ) : shiftTemplates.length === 0 ? (
              <div className="p-8 text-center">
                <Clock size={32} className="text-ink-muted/30 mx-auto mb-2" />
                <p className="text-sm text-ink-muted">No shift templates yet.</p>
              </div>
            ) : (
              shiftTemplates.map((shift, idx) => {
                const color = SHIFT_COLORS[idx % SHIFT_COLORS.length];
                return (
                  <div key={shift.id} className={`flex items-center gap-4 px-4 py-3 border-b border-hairline last:border-b-0 ${color.bg}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${color.bg} border ${color.border}`}>
                      <Clock size={16} className={color.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-ink">{shift.name}</span>
                      <span className="text-xs text-ink-muted ml-3 data-mono">
                        {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Create template form */}
          <div className="bg-surface border border-hairline rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-ink">Create Shift Template</h2>

            {tplError && (
              <div className="bg-clay/5 border border-clay/20 rounded-md p-3 text-sm text-clay">{tplError}</div>
            )}
            {tplSuccess && (
              <div className="bg-nuxt/10 border border-nuxt/20 rounded-md p-3 text-sm text-nuxt">Template created.</div>
            )}

            <div>
              <label className="block text-xs text-ink-muted uppercase tracking-wide font-medium mb-1.5">Name</label>
              <input
                type="text"
                value={tplName}
                onChange={e => setTplName(e.target.value)}
                placeholder="e.g. Morning Shift"
                className="w-full text-sm bg-canvas border border-hairline rounded-md px-3 py-2 text-ink placeholder:text-ink-muted/40 focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-muted uppercase tracking-wide font-medium mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={tplStart}
                  onChange={e => setTplStart(e.target.value)}
                  className="w-full text-sm bg-canvas border border-hairline rounded-md px-3 py-2 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted uppercase tracking-wide font-medium mb-1.5">End Time</label>
                <input
                  type="time"
                  value={tplEnd}
                  onChange={e => setTplEnd(e.target.value)}
                  className="w-full text-sm bg-canvas border border-hairline rounded-md px-3 py-2 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
                />
              </div>
            </div>

            <button
              onClick={handleCreateTemplate}
              disabled={creatingShift || !tplName.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2.5 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingShift && <Loader2 size={15} className="animate-spin" />}
              {creatingShift ? 'Creating…' : 'Create Template'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ TAB: ASSIGN SHIFT ══════════ */}
      {tab === 'assign' && (
        <div className="max-w-lg">
          <div className="bg-surface border border-hairline rounded-lg p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-ink mb-1">Assign a Shift</h2>
              <p className="text-sm text-ink-muted">Schedule an employee to a shift on a specific date.
                {assignSuccess && <span className="text-nuxt ml-2">Shift assigned successfully.</span>}
              </p>
            </div>

            {assignError && (
              <div className="bg-clay/5 border border-clay/20 rounded-md p-3 text-sm text-clay">{assignError}</div>
            )}

            {/* Employee */}
            <div>
              <label className="block text-xs text-ink-muted uppercase tracking-wide font-medium mb-1.5">
                <Users size={13} className="inline -mt-0.5 mr-1" />
                Employee
              </label>
              <select
                value={formEmpId}
                onChange={e => setFormEmpId(e.target.value)}
                className="w-full text-sm bg-canvas border border-hairline rounded-md px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
              >
                <option value="">Select employee…</option>
                {employees.filter(e => e.status === 'active').map(e => (
                  <option key={e.id} value={e.id}>
                    {e.employee_code} — {e.first_name} {e.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Template */}
            <div>
              <label className="block text-xs text-ink-muted uppercase tracking-wide font-medium mb-1.5">
                <Clock size={13} className="inline -mt-0.5 mr-1" />
                Shift Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {shiftTemplates.map((shift, idx) => {
                  const color = SHIFT_COLORS[idx % SHIFT_COLORS.length];
                  return (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() => setFormShiftId(shift.id)}
                      className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-md border text-sm transition-colors ${
                        formShiftId === shift.id
                          ? `${color.bg} ${color.border} ${color.color} font-medium`
                          : 'border-hairline text-ink-muted hover:border-ink-muted/30 hems-hover'
                      }`}
                    >
                      <span>{shift.name}</span>
                      <span className="text-[10px] opacity-70">{shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}</span>
                    </button>
                  );
                })}
              </div>
              {shiftTemplates.length === 0 && (
                <p className="text-xs text-ink-muted mt-2">No shift templates. Create one in the "Shift Templates" tab first.</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs text-ink-muted uppercase tracking-wide font-medium mb-1.5">
                <Calendar size={13} className="inline -mt-0.5 mr-1" />
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full text-sm bg-canvas border border-hairline rounded-md px-3 py-2 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleAssign}
              disabled={creatingAssignment || !formEmpId || !formShiftId || !formDate}
              className="w-full inline-flex items-center justify-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2.5 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingAssignment && <Loader2 size={15} className="animate-spin" />}
              {creatingAssignment ? 'Assigning…' : 'Assign Shift'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
