import type { EmployeeStatus, AttendanceStatus, UserRole } from '@/lib/types';

type ChipVariant =
  | { type: 'status'; value: EmployeeStatus }
  | { type: 'attendance'; value: AttendanceStatus }
  | { type: 'role'; value: string };

const STATUS_CLASS: Record<string, string> = {
  active: 'keycard-chip-active',
  inactive: 'keycard-chip-inactive',
  present: 'keycard-chip-present',
  absent: 'keycard-chip-absent',
  late: 'keycard-chip-late',
  half_day: 'keycard-chip-half-day',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
  staff: 'Staff',
};

export function KeycardChip({ variant }: { variant: ChipVariant }) {
  let label: string;
  let className: string;

  if (variant.type === 'role') {
    label = ROLE_LABELS[variant.value] || variant.value;
    className = 'keycard-chip-role';
  } else {
    label = variant.value.charAt(0).toUpperCase() + variant.value.slice(1).replace('_', ' ');
    className = STATUS_CLASS[variant.value] || 'keycard-chip-inactive';
  }

  return <span className={`keycard-chip ${className}`}>{label}</span>;
}
