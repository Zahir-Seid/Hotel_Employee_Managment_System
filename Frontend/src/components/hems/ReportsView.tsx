'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from '@/hooks/use-router';
import {
  BarChart3, Calendar, Shield, Download, AlertTriangle, RefreshCw, Loader2,
} from 'lucide-react';
import { useReports } from '@/hooks/use-reports';
import type { MonthlyAttendanceSummary, DepartmentStaffingReport, ShiftCoverageGap } from '@/lib/types';

type ReportTab = 'staffing' | 'attendance' | 'coverage';

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateShort(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function ReportsView() {
  const { navigate } = useRouter();
  const [tab, setTab] = useState<ReportTab>('staffing');
  const { getAttendanceSummary, getDepartmentStaffing, getShiftCoverageGaps } = useReports();

  // Staffing
  const [staffingData, setStaffingData] = useState<DepartmentStaffingReport[]>([]);
  const [staffingLoading, setStaffingLoading] = useState(true);
  const [staffingError, setStaffingError] = useState<string | null>(null);

  // Attendance
  const [attendanceData, setAttendanceData] = useState<MonthlyAttendanceSummary[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  // Coverage
  const [coverageData, setCoverageData] = useState<ShiftCoverageGap[]>([]);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [coverageError, setCoverageError] = useState<string | null>(null);

  // Date range
  const [attFrom, setAttFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return fmt(d);
  });
  const [attTo, setAttTo] = useState(fmt(new Date()));

  const fetchStaffing = useCallback(async () => {
    setStaffingLoading(true);
    setStaffingError(null);
    try {
      const data = await getDepartmentStaffing();
      setStaffingData(data);
    } catch (e) {
      setStaffingError(e instanceof Error ? e.message : 'Failed to load staffing report');
    } finally {
      setStaffingLoading(false);
    }
  }, [getDepartmentStaffing]);

  const fetchAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const data = await getAttendanceSummary(attFrom, attTo);
      setAttendanceData(data);
    } catch (e) {
      setAttendanceError(e instanceof Error ? e.message : 'Failed to load attendance report');
    } finally {
      setAttendanceLoading(false);
    }
  }, [getAttendanceSummary, attFrom, attTo]);

  const fetchCoverage = useCallback(async () => {
    setCoverageLoading(true);
    setCoverageError(null);
    try {
      const data = await getShiftCoverageGaps(attFrom, attTo);
      setCoverageData(data);
    } catch (e) {
      setCoverageError(e instanceof Error ? e.message : 'Failed to load coverage report');
    } finally {
      setCoverageLoading(false);
    }
  }, [getShiftCoverageGaps, attFrom, attTo]);

  useEffect(() => { fetchStaffing(); }, [fetchStaffing]);
  useEffect(() => { if (tab === 'attendance' && attendanceData.length === 0 && !attendanceLoading) fetchAttendance(); }, [tab, attendanceData.length, attendanceLoading, fetchAttendance]);
  useEffect(() => { if (tab === 'coverage' && coverageData.length === 0 && !coverageLoading) fetchCoverage(); }, [tab, coverageData.length, coverageLoading, fetchCoverage]);

  const staffingSummary = useMemo(() => {
    const grouped: Record<string, { headcount: number }> = {};
    for (const r of staffingData) {
      if (!grouped[r.department]) grouped[r.department] = { headcount: 0 };
      grouped[r.department].headcount += r.headcount;
    }
    const totalHeadcount = staffingData.reduce((s, r) => s + r.headcount, 0);
    return { departments: Object.entries(grouped).map(([department, v]) => ({ department, ...v })), totalHeadcount };
  }, [staffingData]);

  const attendanceSummary = useMemo(() => {
    const totals = { present: 0, late: 0, absent: 0, half_day: 0, total: 0, avgRate: 0 };
    if (attendanceData.length === 0) return totals;
    for (const r of attendanceData) {
      totals.present += r.present_count;
      totals.late += r.late_count;
      totals.absent += r.absent_count;
      totals.half_day += r.half_day_count;
    }
    totals.total = totals.present + totals.late + totals.absent + totals.half_day;
    const sumRate = attendanceData.reduce((s, r) => s + r.attendance_rate_pct, 0);
    totals.avgRate = Math.round(sumRate / attendanceData.length);
    return totals;
  }, [attendanceData]);

  const coverageSummary = useMemo(() => {
    const grouped: Record<string, { assigned: number; attended: number }> = {};
    for (const r of coverageData) {
      if (!grouped[r.shift_name]) grouped[r.shift_name] = { assigned: 0, attended: 0 };
      grouped[r.shift_name].assigned += r.assigned_count;
      grouped[r.shift_name].attended += r.attended_count;
    }
    const totalAssigned = coverageData.reduce((s, r) => s + r.assigned_count, 0);
    const totalAttended = coverageData.reduce((s, r) => s + r.attended_count, 0);
    const coveragePct = totalAssigned > 0 ? Math.round((totalAttended / totalAssigned) * 100) : 0;
    return { shifts: Object.entries(grouped).map(([shift_name, v]) => ({ shift_name, ...v })), totalAssigned, totalAttended, coveragePct };
  }, [coverageData]);

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

  const tabBar = (
    <div className="flex gap-6 border-b border-hairline mb-6">
      <button
        onClick={() => setTab('staffing')}
        className={`pb-2.5 text-sm font-medium transition-colors ${
          tab === 'staffing'
            ? 'text-nuxt border-b-2 border-nuxt'
            : 'text-ink-muted hover:text-ink hems-hover'
        }`}
      >
        <BarChart3 size={15} className="inline -mt-0.5 mr-1.5" />
        Staffing by Department
      </button>
      <button
        onClick={() => setTab('attendance')}
        className={`pb-2.5 text-sm font-medium transition-colors ${
          tab === 'attendance'
            ? 'text-nuxt border-b-2 border-nuxt'
            : 'text-ink-muted hover:text-ink hems-hover'
        }`}
      >
        <Calendar size={15} className="inline -mt-0.5 mr-1.5" />
        Attendance Summary
      </button>
      <button
        onClick={() => setTab('coverage')}
        className={`pb-2.5 text-sm font-medium transition-colors ${
          tab === 'coverage'
            ? 'text-nuxt border-b-2 border-nuxt'
            : 'text-ink-muted hover:text-ink hems-hover'
        }`}
      >
        <Shield size={15} className="inline -mt-0.5 mr-1.5" />
        Shift Coverage
      </button>
    </div>
  );

  function UtilizationBar({ pct }: { pct: number }) {
    const color = pct >= 90 ? '#A6432D' : pct >= 70 ? '#B8863B' : '#00DC82';
    const bg = pct >= 90 ? '#FDEEEB' : pct >= 70 ? '#FDF6E9' : '#E6FFF2';
    const textColor = pct >= 90 ? 'text-clay' : pct >= 70 ? 'text-brass' : 'text-nuxt';
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: bg }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
          />
        </div>
        <span className={`data-mono text-xs font-medium ${textColor} w-10 text-right`}>{pct}%</span>
      </div>
    );
  }

  // ── Tab 1: Staffing ──

  const staffingChart = useMemo(() => {
    if (staffingSummary.departments.length === 0) return null;
    const maxTotal = Math.max(...staffingSummary.departments.map(d => d.headcount), 1);
    return (
      <div className="flex items-end gap-2 h-[100px]">
        {staffingSummary.departments.map(row => {
          const height = Math.max((row.headcount / maxTotal) * 100, 4);
          return (
            <div key={row.department} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                <div
                  className="w-full rounded-t-sm transition-all duration-300"
                  style={{ height: `${height}px`, backgroundColor: '#00DC82' }}
                />
              </div>
              <span className="text-[9px] text-ink-muted truncate max-w-full text-center leading-tight">
                {row.department.length > 8 ? row.department.slice(0, 7) + '…' : row.department}
              </span>
            </div>
          );
        })}
      </div>
    );
  }, [staffingSummary]);

  const staffingSkeleton = (
    <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-canvas/50">
              {['Department', 'Role', 'Headcount'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-hairline last:border-0">
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-28" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-24" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-10" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const staffingContent = (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Staffing by Department</h3>
          <p className="text-xs text-ink-muted mt-0.5">Headcount distribution across departments and roles</p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted border border-hairline rounded-lg px-3 py-1.5 hems-hover hover:text-ink hover:border-ink-muted/30"
          onClick={() => {/* visual only */}}
        >
          <Download size={13} />
          Export
        </button>
      </div>

      {staffingError && errorBanner(staffingError, fetchStaffing)}

      {staffingLoading ? (
        <>{staffingSkeleton}</>
      ) : (
        <>
          {staffingChart && (
            <div className="bg-surface border border-hairline rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-ink-muted font-medium uppercase tracking-wide">Department Headcount</span>
              </div>
              {staffingChart}
            </div>
          )}

          <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-hairline bg-canvas/50">
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Department</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Role</th>
                    <th className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">Headcount</th>
                  </tr>
                </thead>
                <tbody>
                  {staffingData.map((row, i) => (
                    <tr key={`${row.department}-${row.role}-${i}`} className="border-b border-hairline last:border-0 table-row-hover">
                      <td className="px-5 py-3 text-sm font-medium text-ink">{row.department}</td>
                      <td className="px-5 py-3 text-sm text-ink-muted">{row.role}</td>
                      <td className="px-5 py-3 text-sm data-mono text-nuxt font-medium">{row.headcount}</td>
                    </tr>
                  ))}
                  <tr className="bg-canvas/40 border-t-2 border-hairline">
                    <td className="px-5 py-3 text-sm font-semibold text-ink">Total</td>
                    <td className="px-5 py-3" />
                    <td className="px-5 py-3 text-sm data-mono font-semibold text-nuxt">{staffingSummary.totalHeadcount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── Tab 2: Attendance ──

  const attendanceSkeleton = (
    <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-canvas/50">
              {['Employee', 'Department', 'Present', 'Late', 'Absent', 'Half Day', 'Rate %'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-hairline last:border-0">
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-32" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-24" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-10" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-10" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-10" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-10" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const attendanceContent = (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Attendance Summary</h3>
          <p className="text-xs text-ink-muted mt-0.5">Per-employee attendance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={attFrom} onChange={e => { setAttFrom(e.target.value); setAttendanceData([]); }}
            className="text-xs bg-surface border border-hairline rounded-md px-2 py-1 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40" />
          <span className="text-xs text-ink-muted">to</span>
          <input type="date" value={attTo} onChange={e => { setAttTo(e.target.value); setAttendanceData([]); }}
            className="text-xs bg-surface border border-hairline rounded-md px-2 py-1 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40" />
          <button
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted border border-hairline rounded-lg px-3 py-1.5 hems-hover hover:text-ink hover:border-ink-muted/30"
            onClick={() => {/* visual only */}}
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {attendanceError && errorBanner(attendanceError, fetchAttendance)}

      {attendanceLoading ? (
        <>{attendanceSkeleton}</>
      ) : (
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-canvas/50">
                  {['Employee', 'Department', 'Present', 'Late', 'Absent', 'Half Day', 'Rate %'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceData.map(row => (
                  <tr key={row.employee_id} className="border-b border-hairline last:border-0 table-row-hover">
                    <td className="px-5 py-3 text-sm font-medium text-ink">{row.first_name} {row.last_name}</td>
                    <td className="px-5 py-3 text-sm text-ink-muted">{row.department}</td>
                    <td className="px-5 py-3 text-sm data-mono text-nuxt font-medium">{row.present_count}</td>
                    <td className="px-5 py-3 text-sm data-mono text-brass">{row.late_count}</td>
                    <td className="px-5 py-3 text-sm data-mono text-clay">{row.absent_count}</td>
                    <td className="px-5 py-3 text-sm data-mono text-ink-muted">{row.half_day_count}</td>
                    <td className="px-5 py-3">
                      <UtilizationBar pct={Math.round(row.attendance_rate_pct)} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-canvas/40 border-t-2 border-hairline">
                  <td className="px-5 py-3 text-sm font-semibold text-ink">Average Rate</td>
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3 text-sm data-mono font-semibold text-nuxt">{attendanceSummary.present}</td>
                  <td className="px-5 py-3 text-sm data-mono font-semibold text-brass">{attendanceSummary.late}</td>
                  <td className="px-5 py-3 text-sm data-mono font-semibold text-clay">{attendanceSummary.absent}</td>
                  <td className="px-5 py-3 text-sm data-mono font-semibold text-ink-muted">{attendanceSummary.half_day}</td>
                  <td className="px-5 py-3">
                    <UtilizationBar pct={attendanceSummary.avgRate} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // ── Tab 3: Coverage ──

  const coverageSkeleton = (
    <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-canvas/50">
              {['Date', 'Shift', 'Assigned', 'Attended', 'Coverage'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-hairline last:border-0">
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-24" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-20" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-10" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-10" /></td>
                <td className="px-5 py-3"><div className="skeleton-row h-4 w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const coverageContent = (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Shift Coverage Gaps</h3>
          <p className="text-xs text-ink-muted mt-0.5">Assigned vs attended staff per shift</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={attFrom} onChange={e => { setAttFrom(e.target.value); setCoverageData([]); }}
            className="text-xs bg-surface border border-hairline rounded-md px-2 py-1 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40" />
          <span className="text-xs text-ink-muted">to</span>
          <input type="date" value={attTo} onChange={e => { setAttTo(e.target.value); setCoverageData([]); }}
            className="text-xs bg-surface border border-hairline rounded-md px-2 py-1 text-ink data-mono focus:outline-none focus:ring-1 focus:ring-nuxt/40 focus:border-nuxt/40" />
          <button
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted border border-hairline rounded-lg px-3 py-1.5 hems-hover hover:text-ink hover:border-ink-muted/30"
            onClick={() => {/* visual only */}}
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {coverageError && errorBanner(coverageError, fetchCoverage)}

      {coverageLoading ? (
        <>{coverageSkeleton}</>
      ) : (
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-canvas/50">
                  {['Date', 'Shift', 'Assigned', 'Attended', 'Status', 'Coverage %'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-ink-muted uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coverageData.map((row, i) => {
                  const pct = row.assigned_count > 0 ? Math.round((row.attended_count / row.assigned_count) * 100) : 0;
                  return (
                    <tr key={`${row.work_date}-${row.shift_name}-${i}`} className="border-b border-hairline last:border-0 table-row-hover">
                      <td className="px-5 py-3 text-sm font-medium text-ink">{formatDateShort(row.work_date)}</td>
                      <td className="px-5 py-3 text-sm text-ink-muted">{row.shift_name}</td>
                      <td className="px-5 py-3 text-sm data-mono text-ink-muted">{row.assigned_count}</td>
                      <td className="px-5 py-3 text-sm data-mono text-nuxt font-medium">{row.attended_count}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          row.coverage_status === 'full' ? 'text-nuxt' : row.coverage_status === 'partial' ? 'text-brass' : 'text-clay'
                        }`}>
                          {row.coverage_status === 'gapped' && <AlertTriangle size={12} />}
                          {row.coverage_status.charAt(0).toUpperCase() + row.coverage_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <UtilizationBar pct={pct} />
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-canvas/40 border-t-2 border-hairline">
                  <td className="px-5 py-3 text-sm font-semibold text-ink">Total</td>
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3 text-sm data-mono font-semibold text-ink">{coverageSummary.totalAssigned}</td>
                  <td className="px-5 py-3 text-sm data-mono font-semibold text-nuxt">{coverageSummary.totalAttended}</td>
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3">
                    <UtilizationBar pct={coverageSummary.coveragePct} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-ink-muted mt-1">Analytics and operational insights</p>
        </div>
      </div>

      {tabBar}

      {tab === 'staffing' && staffingContent}
      {tab === 'attendance' && attendanceContent}
      {tab === 'coverage' && coverageContent}
    </div>
  );
}
