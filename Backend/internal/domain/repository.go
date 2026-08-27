package domain

import (
	"context"
	"time"
)

// DBTX is satisfied by *pgx.Conn, *pgxpool.Pool, and pgx.Tx
type DBTX interface {
	Exec(context.Context, string, ...interface{}) (interface{}, error)
	Query(context.Context, string, ...interface{}) (interface{}, error)
	QueryRow(context.Context, string, ...interface{}) interface{}
}

// DepartmentRepo
type DepartmentRepo interface {
	Create(ctx context.Context, name, description string) (*Department, error)
	GetByID(ctx context.Context, id int64) (*Department, error)
	List(ctx context.Context) ([]Department, error)
	Update(ctx context.Context, id int64, name, description *string) (*Department, error)
	Delete(ctx context.Context, id int64) error
}

// RoleRepo
type RoleRepo interface {
	Create(ctx context.Context, name, description string) (*Role, error)
	GetByID(ctx context.Context, id int64) (*Role, error)
	List(ctx context.Context) ([]Role, error)
	Update(ctx context.Context, id int64, name, description *string) (*Role, error)
	Delete(ctx context.Context, id int64) error
}

// EmployeeRepo
type EmployeeRepo interface {
	Create(ctx context.Context, code, firstName, lastName, email, phone string, deptID *int64, hireDate time.Time, status EmployeeStatus) (*Employee, error)
	GetByID(ctx context.Context, id int64) (*Employee, error)
	GetByEmail(ctx context.Context, email string) (*Employee, error)
	List(ctx context.Context, departmentID *int64, status *EmployeeStatus) ([]Employee, error)
	Update(ctx context.Context, id int64, updates map[string]interface{}) (*Employee, error)
	UpdateDepartment(ctx context.Context, employeeID, departmentID int64) error
	Delete(ctx context.Context, id int64) error
}

// EmployeeRoleRepo
type EmployeeRoleRepo interface {
	GetCurrentByEmployee(ctx context.Context, employeeID int64) (*EmployeeRole, error)
	CloseCurrentRole(ctx context.Context, employeeID int64, effectiveTo time.Time) error
	InsertRole(ctx context.Context, employeeID, roleID int64, effectiveFrom time.Time) (*EmployeeRole, error)
	ListByEmployee(ctx context.Context, employeeID int64) ([]EmployeeRole, error)
}

// ShiftRepo
type ShiftRepo interface {
	Create(ctx context.Context, name string, startTime, endTime time.Time) (*Shift, error)
	GetByID(ctx context.Context, id int64) (*Shift, error)
	List(ctx context.Context) ([]Shift, error)
	Update(ctx context.Context, id int64, name *string, startTime, endTime *time.Time) (*Shift, error)
	Delete(ctx context.Context, id int64) error
}

// ShiftAssignmentRepo
type ShiftAssignmentRepo interface {
	Create(ctx context.Context, employeeID, shiftID int64, workDate time.Time, createdBy *int64) (*ShiftAssignment, error)
	GetByID(ctx context.Context, id int64) (*ShiftAssignment, error)
	List(ctx context.Context, employeeID, shiftID *int64, from, to *time.Time) ([]ShiftAssignment, error)
	Delete(ctx context.Context, id int64) error
	GetByEmployeeAndDate(ctx context.Context, employeeID int64, workDate time.Time) (*ShiftAssignment, error)
}

// AttendanceRepo
type AttendanceRepo interface {
	Create(ctx context.Context, shiftAssignmentID int64, checkInTime *time.Time, status AttendanceStatus, recordedBy *int64) (*Attendance, error)
	GetByShiftAssignment(ctx context.Context, shiftAssignmentID int64) (*Attendance, error)
	UpdateCheckIn(ctx context.Context, shiftAssignmentID int64, checkIn time.Time, status AttendanceStatus) (*Attendance, error)
	UpdateCheckOut(ctx context.Context, shiftAssignmentID int64, checkOut time.Time, status AttendanceStatus) (*Attendance, error)
	ListByEmployee(ctx context.Context, employeeID int64, from, to *time.Time) ([]Attendance, error)
}

// UserRepo
type UserRepo interface {
	Create(ctx context.Context, employeeID *int64, username, passwordHash string, role UserRole) (*User, error)
	GetByID(ctx context.Context, id int64) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	List(ctx context.Context) ([]User, error)
	Update(ctx context.Context, id int64, updates map[string]interface{}) (*User, error)
	Delete(ctx context.Context, id int64) error
}

// AuditLogRepo
type AuditLogRepo interface {
	Create(ctx context.Context, actorUserID *int64, action, entityType string, entityID *int64, before, after *map[string]any, ipAddress *string) (*AuditLog, error)
	List(ctx context.Context, entityType *string, entityID *int64, from, to *time.Time) ([]AuditLog, error)
}

// ReportRepo
type ReportRepo interface {
	MonthlyAttendanceSummary(ctx context.Context, from, to time.Time) ([]MonthlyAttendanceSummary, error)
	DepartmentStaffing(ctx context.Context) ([]DepartmentStaffing, error)
	ShiftCoverageGaps(ctx context.Context, from, to time.Time) ([]ShiftCoverageGap, error)
}
