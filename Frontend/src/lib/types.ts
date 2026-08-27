// ── HEMS Domain Types ──
// Aligned with Go backend models (snake_case JSON from Go, camelCase in TS)

export type EmployeeStatus = 'active' | 'inactive' | 'terminated';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';
export type UserRole = 'super_admin' | 'hr_manager' | 'staff';

// ── Auth ──

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface AuthUser {
  user_id: number;
  username: string;
  role: UserRole;
}

// ── Employee ──

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  hire_date: string;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
  department?: Department;
  current_role?: Role;
}

export interface EmployeeCreateInput {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department_id?: string;
  hire_date: string;
  status?: EmployeeStatus;
}

export interface EmployeeUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department_id?: string;
  hire_date?: string;
  status?: EmployeeStatus;
}

// ── Department ──

export interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentCreateInput {
  name: string;
  description?: string;
}

// ── Role ──

export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RoleCreateInput {
  name: string;
  description?: string;
}

// ── Shift (template) ──

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface ShiftCreateInput {
  name: string;
  start_time: string;
  end_time: string;
}

// ── Shift Assignment ──

export interface ShiftAssignment {
  id: string;
  employee_id: string;
  shift_id: string;
  work_date: string;
  created_by?: string;
  created_at: string;
  employee?: Employee;
  shift?: Shift;
}

export interface ShiftAssignmentCreateInput {
  employee_id: string;
  shift_id: string;
  work_date: string;
}

// ── Attendance ──

export interface Attendance {
  id: string;
  shift_assignment_id: string;
  check_in_time?: string;
  check_out_time?: string;
  status: AttendanceStatus;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
  shift_assignment?: ShiftAssignment;
}

export interface CheckInInput {
  shift_assignment_id: string;
  check_in_time: string;
}

export interface CheckOutInput {
  shift_assignment_id: string;
  check_out_time: string;
}

// ── Audit ──

export interface AuditLog {
  id: string;
  actor_user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// ── Dashboard ──

export interface DashboardData {
  total_active: number;
  present_today: number;
  late_today: number;
  absent_today: number;
  open_shift_gaps: number;
  staffing: DepartmentStaffing[];
  recent_audit: AuditLog[];
}

export interface DepartmentStaffing {
  department: string;
  headcount: number;
}

// ── Reports ──

export interface MonthlyAttendanceSummary {
  employee_id: number;
  first_name: string;
  last_name: string;
  department: string;
  present_count: number;
  late_count: number;
  absent_count: number;
  half_day_count: number;
  attendance_rate_pct: number;
}

export interface DepartmentStaffingReport {
  department: string;
  role: string;
  headcount: number;
}

export interface ShiftCoverageGap {
  work_date: string;
  shift_name: string;
  assigned_count: number;
  attended_count: number;
  coverage_status: string;
}

// ── User ──

export interface User {
  id: string;
  employee_id?: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Navigation ──

export type HemsRoute =
  | { page: 'dashboard' }
  | { page: 'employees' }
  | { page: 'employees-new' }
  | { page: 'employees-detail'; id: string }
  | { page: 'employees-edit'; id: string }
  | { page: 'departments' }
  | { page: 'departments-new' }
  | { page: 'departments-detail'; id: string }
  | { page: 'roles' }
  | { page: 'roles-new' }
  | { page: 'roles-detail'; id: string }
  | { page: 'shifts' }
  | { page: 'shifts-assign' }
  | { page: 'attendance' }
  | { page: 'attendance-record' }
  | { page: 'reports' }
  | { page: 'audit-log' };

export interface NavItem {
  label: string;
  page: HemsRoute['page'];
  icon: string;
  disabled?: boolean;
}
