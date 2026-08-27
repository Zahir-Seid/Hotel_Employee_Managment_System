package sqlc

import "time"

type EmployeeStatus string
const (
	EmployeeStatusActive     EmployeeStatus = "active"
	EmployeeStatusInactive   EmployeeStatus = "inactive"
	EmployeeStatusTerminated EmployeeStatus = "terminated"
)

type AttendanceStatus string
const (
	AttendanceStatusPresent AttendanceStatus = "present"
	AttendanceStatusLate    AttendanceStatus = "late"
	AttendanceStatusAbsent  AttendanceStatus = "absent"
	AttendanceStatusHalfDay AttendanceStatus = "half_day"
)

type UserRole string
const (
	UserRoleSuperAdmin UserRole = "super_admin"
	UserRoleHRManager  UserRole = "hr_manager"
	UserRoleStaff      UserRole = "staff"
)

type Department struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Role struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Employee struct {
	ID           int64          `json:"id"`
	EmployeeCode string         `json:"employee_code"`
	FirstName    string         `json:"first_name"`
	LastName     string         `json:"last_name"`
	Email        string         `json:"email"`
	Phone        *string        `json:"phone"`
	DepartmentID *int64         `json:"department_id"`
	HireDate     time.Time      `json:"hire_date"`
	Status       EmployeeStatus `json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

type EmployeeRole struct {
	ID            int64      `json:"id"`
	EmployeeID    int64      `json:"employee_id"`
	RoleID        int64      `json:"role_id"`
	EffectiveFrom time.Time  `json:"effective_from"`
	EffectiveTo   *time.Time `json:"effective_to"`
	CreatedAt     time.Time  `json:"created_at"`
}

type Shift struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	CreatedAt time.Time `json:"created_at"`
}

type ShiftAssignment struct {
	ID         int64     `json:"id"`
	EmployeeID int64     `json:"employee_id"`
	ShiftID    int64     `json:"shift_id"`
	WorkDate   time.Time `json:"work_date"`
	CreatedBy  *int64    `json:"created_by"`
	CreatedAt  time.Time `json:"created_at"`
}

type Attendance struct {
	ID                int64            `json:"id"`
	ShiftAssignmentID int64            `json:"shift_assignment_id"`
	CheckInTime       *time.Time       `json:"check_in_time"`
	CheckOutTime      *time.Time       `json:"check_out_time"`
	Status            AttendanceStatus `json:"status"`
	Notes             *string          `json:"notes"`
	RecordedBy        *int64           `json:"recorded_by"`
	CreatedAt         time.Time        `json:"created_at"`
	UpdatedAt         time.Time        `json:"updated_at"`
}

type User struct {
	ID           int64     `json:"id"`
	EmployeeID   *int64    `json:"employee_id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"password_hash"`
	Role         UserRole  `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type AuditLog struct {
	ID          int64          `json:"id"`
	ActorUserID *int64         `json:"actor_user_id"`
	Action      string         `json:"action"`
	EntityType  string         `json:"entity_type"`
	EntityID    *int64         `json:"entity_id"`
	BeforeData  map[string]any `json:"before_data"`
	AfterData   map[string]any `json:"after_data"`
	IPAddress   *string        `json:"ip_address"`
	CreatedAt   time.Time      `json:"created_at"`
}
