'use client';

import { useState, useMemo } from 'react';
import { KeycardChip } from './KeycardChip';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Filter, RefreshCw, AlertTriangle, Loader2,
} from 'lucide-react';
import { useShiftAssignments } from '@/hooks/use-shift-assignments';
import { useAttendance } from '@/hooks/use-attendance';
import { useEmployees } from '@/hooks/use-employees';
import { useDepartments } from '@/hooks/use-departments';
import type { AttendanceStatus } from '@/lib/types';

type Tab = 'record' | 'history';

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtWeekday(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function toRFC3339(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toISOString();
}

export function AttendanceView() {
  const [tab, setTab] = useState<Tab>('record');

  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [deptFilter, setDeptFilter] = useState<string>('');

  // History tab
  const [historyEmployeeId, setHistoryEmployeeId] = useState('');
  const [historyFrom, setHistoryFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return fmt(d);
  });
  const [historyTo, setHistoryTo] = useState(fmt(new Date()));
  const [historyData, setHistoryData] = useState<{
    id: string;
    shift_assignment_id: string;
    check_in_time: string;
    check_out_time: string;
    status: AttendanceStatus;
    date: string;
  }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Hooks
  const { departments } = useDepartments();
  const { employees } = useEmployees();
  const { assignments, loading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = useShiftAssignments({ from: selectedDate, to: selectedDate });
  const { checkIn, checkOut, listByEmployee, loading: attendanceLoading, error: attendanceError } = useAttendance();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const empMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
  const deptMap = useMemo(() => new Map(departments.map(d => [d.id, d])), [departments]);

  const filteredAssignments = useMemo(() => {
    if (!deptFilter) return assignments;
    return assignments.filter(a => {
      const emp = a.employee || empMap.get(a.employee_id);
      return emp?.department_id === deptFilter;
    });
  }, [assignments, deptFilter, empMap]);

  const handleCheckIn = async (assignmentId: string) => {
    setActionLoading(assignmentId + '-in');
    setActionError(null);
    setActionSuccess(null);
    const result = await checkIn({
      shift_assignment_id: assignmentId,
      check_in_time: toRFC3339(selectedDate),
    });
    if (result) {
      setActionSuccess(`Check-in recorded for shift assignment.`);
      refetchAssignments();
    } else {
      setActionError(attendanceError || 'Check-in failed.');
    }
    setActionLoading(null);
  };

  const handleCheckOut = async (assignmentId: string) => {
    setActionLoading(assignmentId + '-out');
    setActionError(null);
    setActionSuccess(null);
    const result = await checkOut({
      shift_assignment_id: assignmentId,
      check_out_time: toRFC3339(selectedDate),
    });
    if (result) {
      setActionSuccess(`Check-out recorded for shift assignment.`);
      refetchAssignments();
    } else {
      setActionError(attendanceError || 'Check-out failed.');
    }
    setActionLoading(null);
  };

  const fetchHistory = async () => {
    if (!historyEmployeeId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await listByEmployee(historyEmployeeId, historyFrom, historyTo);
      setHistoryData(data.map(a => ({
        id: a.id,
        shift_assignment_id: a.shift_assignment_id,
        check_in_time: a.check_in_time || '',
        check_out_time: a.check_out_time || '',
        status: a.status,
        date: a.created_at?.split('T')[0] || '',
      })));
    } catch {
      setHistoryError("Couldn't load attendance history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, half_day: 0 };
    for (const a of filteredAssignments) {
      const hasAttendance = a.employee != null || empMap.has(a.employee_id);
      if (hasAttendance) counts.present++;
    }
    return counts;
  }, [filteredAssignments, empMap]);

  const tabBar = (
    <div className="flex gap-6 border-b border-hairline mb-6">
      <button
        onClick={() => setTab('record')}
        className={`pb-2.5 text-sm font-medium transition-colors ${tab === 'record' ? 'text-nuxt border-b-2 border-nuxt' : 'text-ink-muted hover:text-ink hems-hover'}`}
      >
        <Calendar size={15} className="inline -mt-0.5 mr-1.5" />
        Record Attendance
      </button>
      <button
        onClick={() => setTab('history')}
        className={`pb-2.5 text-sm font-medium transition-colors ${tab === 'history' ? 'text-nuxt border-b-2 border-nuxt' : 'text-ink-muted hover:text-ink hems-hover'}`}
      >
        <Clock size={15} className="inline -mt-0.5 mr-1.5" />
        History
      </button>
    </div>
  );

  const errorBanner = (msg: string, onRetry: () => void) => (
    <div className="bg-clay/5 border border-clay/20 rounded-lg p-4 flex items-center gap-3 mb-4">
      <AlertTriangle size={18} className="text-clay shrink-0" />
      <span className="text-sm text-clay">{msg}</span>
      <button
        onClick={onRetry}
        className="ml-auto text-sm text-clay underline hems-hover inline-flex items-center gap-1"
      >
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  const recordSkeleton = (
    <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full responsive-table">
          <thead>
            <tr className="border-b border-hairline bg-canvas/50">
              <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Employee</th>
              <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Shift</th>
              <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Time</th>
              <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Status</th>
              <th className="text-right px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-hairline last:border-0">
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-32" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-20" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-24" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-6 w-20" /></td>
                <td className="px-5 py-3 text-right"><div className="skeleton-row h-6 w-20 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const historySkeleton = (
    <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full responsive-table">
          <thead>
            <tr className="border-b border-hairline bg-canvas/50">
              {['Date', 'Check-In', 'Check-Out', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-hairline last:border-0">
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-24" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-20" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-20" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-6 w-20" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h1 className="page-title">Attendance</h1>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-ink-muted" />
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-sm bg-surface border border-hairline rounded-md px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {tabBar}

      {/* ══════════ TAB: RECORD ATTENDANCE ══════════ */}
      {tab === 'record' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00');
                d.setDate(d.getDate() - 1);
                setSelectedDate(fmt(d));
              }}
              className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded border border-hairline"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm font-medium bg-surface border border-hairline rounded-md px-3 py-1.5 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
            />
            <button
              onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00');
                d.setDate(d.getDate() + 1);
                setSelectedDate(fmt(d));
              }}
              className="p-1.5 text-ink-muted hover:text-ink hems-hover rounded border border-hairline"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => refetchAssignments()}
              className="ml-auto p-1.5 text-ink-muted hover:text-ink hems-hover rounded border border-hairline"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {assignmentsError && errorBanner(assignmentsError, () => refetchAssignments())}

          {actionError && (
            <div className="bg-clay/5 border border-clay/20 rounded-md p-3 text-sm text-clay mb-4">
              {actionError}
            </div>
          )}
          {actionSuccess && (
            <div className="bg-nuxt/5 border border-nuxt/20 rounded-md p-3 text-sm text-nuxt mb-4">
              {actionSuccess}
            </div>
          )}

          {assignmentsLoading && !assignmentsError && recordSkeleton}

          {!assignmentsLoading && !assignmentsError && (
            <>
              {filteredAssignments.length === 0 ? (
                <div className="bg-surface border border-hairline rounded-lg p-12 text-center">
                  <p className="text-ink-muted">No shift assignments found for this date.</p>
                </div>
              ) : (
                <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full responsive-table">
                      <thead>
                        <tr className="border-b border-hairline bg-canvas/50">
                          <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Employee</th>
                          <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Shift</th>
                          <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Time</th>
                          <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Status</th>
                          <th className="text-right px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignments.map(a => {
                          const emp = a.employee || empMap.get(a.employee_id);
                          const shift = a.shift;
                          const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
                          const isLoadingIn = actionLoading === a.id + '-in';
                          const isLoadingOut = actionLoading === a.id + '-out';
                          return (
                            <tr key={a.id} className="border-b border-hairline last:border-0 table-row-hover">
                              <td data-label="Employee" className="px-5 py-3 text-sm text-ink font-medium">
                                {name}
                              </td>
                              <td data-label="Shift" className="px-5 py-3 text-sm text-ink-muted">
                                {shift?.name || '—'}
                              </td>
                              <td data-label="Time" className="px-5 py-3 text-sm data-mono text-ink-muted">
                                {shift ? `${shift.start_time} – ${shift.end_time}` : '—'}
                              </td>
                              <td data-label="Status" className="px-5 py-3">
                                <KeycardChip variant={{ type: 'attendance', value: 'present' }} />
                              </td>
                              <td data-label="Actions" className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleCheckIn(a.id)}
                                    disabled={isLoadingIn || isLoadingOut || attendanceLoading}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-nuxt border border-nuxt/30 rounded-md px-3 py-1.5 hover:bg-nuxt/10 hems-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isLoadingIn ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                                    Check In
                                  </button>
                                  <button
                                    onClick={() => handleCheckOut(a.id)}
                                    disabled={isLoadingIn || isLoadingOut || attendanceLoading}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brass border border-brass/30 rounded-md px-3 py-1.5 hover:bg-brass/10 hems-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isLoadingOut ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                                    Check Out
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3 border-t border-hairline bg-canvas/30 flex items-center justify-between">
                    <p className="text-xs text-ink-muted">
                      {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════ TAB: HISTORY ══════════ */}
      {tab === 'history' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs text-ink-muted mb-1">Employee</label>
              <select
                value={historyEmployeeId}
                onChange={e => setHistoryEmployeeId(e.target.value)}
                className="w-full text-sm bg-surface border border-hairline rounded-md px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
              >
                <option value="">Select employee…</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">From</label>
              <input
                type="date"
                value={historyFrom}
                onChange={e => setHistoryFrom(e.target.value)}
                className="text-sm bg-surface border border-hairline rounded-md px-3 py-1.5 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">To</label>
              <input
                type="date"
                value={historyTo}
                onChange={e => setHistoryTo(e.target.value)}
                className="text-sm bg-surface border border-hairline rounded-md px-3 py-1.5 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40"
              />
            </div>
            <button
              onClick={fetchHistory}
              disabled={!historyEmployeeId || historyLoading}
              className="inline-flex items-center gap-2 bg-nuxt text-ink text-sm font-semibold px-4 py-2 rounded-md hems-hover hover:bg-nuxt-dark shadow-sm shadow-nuxt/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {historyLoading ? <Loader2 size={15} className="animate-spin" /> : <Calendar size={15} />}
              Load History
            </button>
          </div>

          {historyError && errorBanner(historyError, fetchHistory)}

          {historyLoading && !historyError && historySkeleton}

          {!historyLoading && !historyError && historyData.length > 0 && (
            <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full responsive-table">
                  <thead>
                    <tr className="border-b border-hairline bg-canvas/50">
                      {['Date', 'Check-In', 'Check-Out', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map(row => {
                      const d = row.date ? new Date(row.date + 'T00:00:00') : null;
                      const isToday = row.date === fmt(new Date());
                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-hairline last:border-0 table-row-hover ${isToday ? 'bg-nuxt/5' : ''}`}
                        >
                          <td data-label="Date" className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              {d && (
                                <>
                                  <span className={`text-sm font-medium ${isToday ? 'text-nuxt' : 'text-ink'}`}>
                                    {fmtWeekday(d)}
                                  </span>
                                  <span className="text-xs data-mono text-ink-muted">{fmtShort(d)}</span>
                                </>
                              )}
                              {isToday && (
                                <span className="text-[10px] font-medium text-nuxt bg-nuxt/10 px-1.5 py-0.5 rounded">Today</span>
                              )}
                            </div>
                          </td>
                          <td data-label="Check-In" className="px-5 py-3 text-sm data-mono text-ink-muted">
                            {row.check_in_time || '—'}
                          </td>
                          <td data-label="Check-Out" className="px-5 py-3 text-sm data-mono text-ink-muted">
                            {row.check_out_time || '—'}
                          </td>
                          <td data-label="Status" className="px-5 py-3">
                            <KeycardChip variant={{ type: 'attendance', value: row.status }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!historyLoading && !historyError && historyData.length === 0 && historyEmployeeId && (
            <div className="bg-surface border border-hairline rounded-lg p-12 text-center">
              <p className="text-ink-muted">No attendance history found for the selected period.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
