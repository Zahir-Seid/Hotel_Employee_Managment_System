package domain

import (
	"time"
)

// Enums

type EmployeeStatus string

const (
	EmployeeStatusActive     EmployeeStatus = "active"
	EmployeeStatusInactive   EmployeeStatus = "inactive"
	EmployeeStatusTerminated EmployeeStatus = "terminated"
)

type AttendanceStatus string

const (
	AttendanceStatusPresent  AttendanceStatus = "present"
	AttendanceStatusLate     AttendanceStatus = "late"
	AttendanceStatusAbsent   AttendanceStatus = "absent"
	AttendanceStatusHalfDay  AttendanceStatus = "half_day"
)

type UserRole string

const (
	UserRoleSuperAdmin UserRole = "super_admin"
	UserRoleHRManager  UserRole = "hr_manager"
	UserRoleStaff      UserRole = "staff"
)

// Entities

type Department struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Role struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Employee struct {
	ID           int64          `json:"id"`
	EmployeeCode string         `json:"employee_code"`
	FirstName    string         `json:"first_name"`
	LastName     string         `json:"last_name"`
	Email        string         `json:"email"`
	Phone        *string        `json:"phone,omitempty"`
	DepartmentID *int64         `json:"department_id,omitempty"`
	HireDate     time.Time      `json:"hire_date"`
	Status       EmployeeStatus `json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`

	// Joined fields
	Department   *Department `json:"department,omitempty"`
	CurrentRole  *Role       `json:"current_role,omitempty"`
}

type EmployeeRole struct {
	ID            int64      `json:"id"`
	EmployeeID    int64      `json:"employee_id"`
	RoleID        int64      `json:"role_id"`
	EffectiveFrom time.Time  `json:"effective_from"`
	EffectiveTo   *time.Time `json:"effective_to,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`

	// Joined fields
	Role *Role `json:"role,omitempty"`
}

func (er EmployeeRole) IsCurrent() bool {
	return er.EffectiveTo == nil
}

type Shift struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	StartTime time.Time `json:"start_time"` // uses time.Time with date ignored
	EndTime   time.Time `json:"end_time"`
	CreatedAt time.Time `json:"created_at"`
}

type ShiftAssignment struct {
	ID         int64     `json:"id"`
	EmployeeID int64     `json:"employee_id"`
	ShiftID    int64     `json:"shift_id"`
	WorkDate   time.Time `json:"work_date"`
	CreatedBy  *int64    `json:"created_by,omitempty"`
	CreatedAt  time.Time `json:"created_at"`

	// Joined fields
	Employee *Employee `json:"employee,omitempty"`
	Shift    *Shift    `json:"shift,omitempty"`
}

type Attendance struct {
	ID                int64            `json:"id"`
	ShiftAssignmentID int64            `json:"shift_assignment_id"`
	CheckInTime       *time.Time       `json:"check_in_time,omitempty"`
	CheckOutTime      *time.Time       `json:"check_out_time,omitempty"`
	Status            AttendanceStatus `json:"status"`
	Notes             *string          `json:"notes,omitempty"`
	RecordedBy        *int64           `json:"recorded_by,omitempty"`
	CreatedAt         time.Time        `json:"created_at"`
	UpdatedAt         time.Time        `json:"updated_at"`

	// Joined fields
	ShiftAssignment *ShiftAssignment `json:"shift_assignment,omitempty"`
}

type User struct {
	ID           int64     `json:"id"`
	EmployeeID   *int64    `json:"employee_id,omitempty"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	Role         UserRole  `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Joined fields
	Employee *Employee `json:"employee,omitempty"`
}

type AuditLog struct {
	ID          int64           `json:"id"`
	ActorUserID *int64          `json:"actor_user_id,omitempty"`
	Action      string          `json:"action"`
	EntityType  string          `json:"entity_type"`
	EntityID    *int64          `json:"entity_id,omitempty"`
	BeforeData  *map[string]any `json:"before_data,omitempty"`
	AfterData   *map[string]any `json:"after_data,omitempty"`
	IPAddress   *string         `json:"ip_address,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
}

// Report types

type MonthlyAttendanceSummary struct {
	EmployeeID         int64   `json:"employee_id"`
	FirstName          string  `json:"first_name"`
	LastName           string  `json:"last_name"`
	Department         string  `json:"department"`
	PresentCount       int64   `json:"present_count"`
	LateCount          int64   `json:"late_count"`
	AbsentCount        int64   `json:"absent_count"`
	HalfDayCount       int64   `json:"half_day_count"`
	AttendanceRatePct  float64 `json:"attendance_rate_pct"`
}

type DepartmentStaffing struct {
	Department string `json:"department"`
	Role       string `json:"role"`
	Headcount  int64  `json:"headcount"`
}

type ShiftCoverageGap struct {
	WorkDate        time.Time `json:"work_date"`
	ShiftName       string    `json:"shift_name"`
	AssignedCount   int64     `json:"assigned_count"`
	AttendedCount   int64     `json:"attended_count"`
	CoverageStatus  string    `json:"coverage_status"`
}
