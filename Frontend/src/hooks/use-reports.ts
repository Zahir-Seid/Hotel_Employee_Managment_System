'use client';

import { apiFetch } from '@/lib/api';
import type { MonthlyAttendanceSummary, DepartmentStaffingReport, ShiftCoverageGap } from '@/lib/types';

export function useReports() {
  const getAttendanceSummary = async (from: string, to: string): Promise<MonthlyAttendanceSummary[]> => {
    return apiFetch<MonthlyAttendanceSummary[]>(`/reports/attendance-summary?from=${from}&to=${to}`);
  };

  const getDepartmentStaffing = async (): Promise<DepartmentStaffingReport[]> => {
    return apiFetch<DepartmentStaffingReport[]>('/reports/department-staffing');
  };

  const getShiftCoverageGaps = async (from: string, to: string): Promise<ShiftCoverageGap[]> => {
    return apiFetch<ShiftCoverageGap[]>(`/reports/shift-coverage-gaps?from=${from}&to=${to}`);
  };

  return { getAttendanceSummary, getDepartmentStaffing, getShiftCoverageGaps };
}
