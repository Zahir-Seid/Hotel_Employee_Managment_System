package sqlc

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
)

type Queries struct {
	db DBTX
}

func New(db DBTX) *Queries {
	return &Queries{db: db}
}

func (q *Queries) WithTx(tx pgx.Tx) *Queries {
	return &Queries{db: tx}
}

// --- Departments ---

const createDepartment = `-- name: CreateDepartment :one
INSERT INTO departments (name, description)
VALUES ($1, $2)
RETURNING id, name, description, created_at, updated_at
`

type CreateDepartmentParams struct {
	Name        string
	Description *string
}

func (q *Queries) CreateDepartment(ctx context.Context, arg CreateDepartmentParams) (Department, error) {
	row := q.db.QueryRow(ctx, createDepartment, arg.Name, arg.Description)
	var i Department
	err := row.Scan(&i.ID, &i.Name, &i.Description, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const getDepartment = `-- name: GetDepartment :one
SELECT id, name, description, created_at, updated_at FROM departments WHERE id = $1
`

func (q *Queries) GetDepartment(ctx context.Context, id int64) (Department, error) {
	row := q.db.QueryRow(ctx, getDepartment, id)
	var i Department
	err := row.Scan(&i.ID, &i.Name, &i.Description, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const listDepartments = `-- name: ListDepartments :many
SELECT id, name, description, created_at, updated_at FROM departments ORDER BY name
`

func (q *Queries) ListDepartments(ctx context.Context) ([]Department, error) {
	rows, err := q.db.Query(ctx, listDepartments)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Department
	for rows.Next() {
		var i Department
		if err := rows.Scan(&i.ID, &i.Name, &i.Description, &i.CreatedAt, &i.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

const updateDepartment = `-- name: UpdateDepartment :one
UPDATE departments SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = now()
WHERE id = $3
RETURNING id, name, description, created_at, updated_at
`

type UpdateDepartmentParams struct {
	Name        *string
	Description *string
	ID          int64
}

func (q *Queries) UpdateDepartment(ctx context.Context, arg UpdateDepartmentParams) (Department, error) {
	row := q.db.QueryRow(ctx, updateDepartment, arg.Name, arg.Description, arg.ID)
	var i Department
	err := row.Scan(&i.ID, &i.Name, &i.Description, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const deleteDepartment = `-- name: DeleteDepartment :exec
DELETE FROM departments WHERE id = $1
`

func (q *Queries) DeleteDepartment(ctx context.Context, id int64) error {
	_, err := q.db.Exec(ctx, deleteDepartment, id)
	return err
}

// --- Roles ---

const createRole = `-- name: CreateRole :one
INSERT INTO roles (name, description)
VALUES ($1, $2)
RETURNING id, name, description, created_at, updated_at
`

type CreateRoleParams struct {
	Name        string
	Description *string
}

func (q *Queries) CreateRole(ctx context.Context, arg CreateRoleParams) (Role, error) {
	row := q.db.QueryRow(ctx, createRole, arg.Name, arg.Description)
	var i Role
	err := row.Scan(&i.ID, &i.Name, &i.Description, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const getRole = `-- name: GetRole :one
SELECT id, name, description, created_at, updated_at FROM roles WHERE id = $1
`

func (q *Queries) GetRole(ctx context.Context, id int64) (Role, error) {
	row := q.db.QueryRow(ctx, getRole, id)
	var i Role
	err := row.Scan(&i.ID, &i.Name, &i.Description, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const listRoles = `-- name: ListRoles :many
SELECT id, name, description, created_at, updated_at FROM roles ORDER BY name
`

func (q *Queries) ListRoles(ctx context.Context) ([]Role, error) {
	rows, err := q.db.Query(ctx, listRoles)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Role
	for rows.Next() {
		var i Role
		if err := rows.Scan(&i.ID, &i.Name, &i.Description, &i.CreatedAt, &i.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

const updateRole = `-- name: UpdateRole :one
UPDATE roles SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = now()
WHERE id = $3
RETURNING id, name, description, created_at, updated_at
`

type UpdateRoleParams struct {
	Name        *string
	Description *string
	ID          int64
}

func (q *Queries) UpdateRole(ctx context.Context, arg UpdateRoleParams) (Role, error) {
	row := q.db.QueryRow(ctx, updateRole, arg.Name, arg.Description, arg.ID)
	var i Role
	err := row.Scan(&i.ID, &i.Name, &i.Description, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const deleteRole = `-- name: DeleteRole :exec
DELETE FROM roles WHERE id = $1
`

func (q *Queries) DeleteRole(ctx context.Context, id int64) error {
	_, err := q.db.Exec(ctx, deleteRole, id)
	return err
}

// --- Employees ---

const createEmployee = `-- name: CreateEmployee :one
INSERT INTO employees (employee_code, first_name, last_name, email, phone, department_id, hire_date, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at
`

type CreateEmployeeParams struct {
	EmployeeCode string
	FirstName    string
	LastName     string
	Email        string
	Phone        *string
	DepartmentID *int64
	HireDate     time.Time
	Status       EmployeeStatus
}

func (q *Queries) CreateEmployee(ctx context.Context, arg CreateEmployeeParams) (Employee, error) {
	row := q.db.QueryRow(ctx, createEmployee,
		arg.EmployeeCode, arg.FirstName, arg.LastName, arg.Email,
		arg.Phone, arg.DepartmentID, arg.HireDate, arg.Status,
	)
	var i Employee
	err := row.Scan(
		&i.ID, &i.EmployeeCode, &i.FirstName, &i.LastName, &i.Email,
		&i.Phone, &i.DepartmentID, &i.HireDate, &i.Status, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const getEmployee = `-- name: GetEmployee :one
SELECT id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at
FROM employees WHERE id = $1
`

func (q *Queries) GetEmployee(ctx context.Context, id int64) (Employee, error) {
	row := q.db.QueryRow(ctx, getEmployee, id)
	var i Employee
	err := row.Scan(
		&i.ID, &i.EmployeeCode, &i.FirstName, &i.LastName, &i.Email,
		&i.Phone, &i.DepartmentID, &i.HireDate, &i.Status, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const getEmployeeByEmail = `-- name: GetEmployeeByEmail :one
SELECT id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at
FROM employees WHERE email = $1
`

func (q *Queries) GetEmployeeByEmail(ctx context.Context, email string) (Employee, error) {
	row := q.db.QueryRow(ctx, getEmployeeByEmail, email)
	var i Employee
	err := row.Scan(
		&i.ID, &i.EmployeeCode, &i.FirstName, &i.LastName, &i.Email,
		&i.Phone, &i.DepartmentID, &i.HireDate, &i.Status, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const listEmployees = `-- name: ListEmployees :many
SELECT id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at
FROM employees
WHERE ($1::bigint IS NULL OR department_id = $1)
  AND ($2::employee_status IS NULL OR status = $2)
ORDER BY created_at DESC
`

type ListEmployeesParams struct {
	DepartmentID *int64
	Status       *EmployeeStatus
}

func (q *Queries) ListEmployees(ctx context.Context, arg ListEmployeesParams) ([]Employee, error) {
	rows, err := q.db.Query(ctx, listEmployees, arg.DepartmentID, arg.Status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Employee
	for rows.Next() {
		var i Employee
		if err := rows.Scan(
			&i.ID, &i.EmployeeCode, &i.FirstName, &i.LastName, &i.Email,
			&i.Phone, &i.DepartmentID, &i.HireDate, &i.Status, &i.CreatedAt, &i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

const updateEmployee = `-- name: UpdateEmployee :one
UPDATE employees SET
    employee_code = COALESCE($1, employee_code),
    first_name = COALESCE($2, first_name),
    last_name = COALESCE($3, last_name),
    email = COALESCE($4, email),
    phone = COALESCE($5, phone),
    department_id = COALESCE($6, department_id),
    hire_date = COALESCE($7, hire_date),
    status = COALESCE($8, status),
    updated_at = now()
WHERE id = $9
RETURNING id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at
`

type UpdateEmployeeParams struct {
	EmployeeCode *string
	FirstName    *string
	LastName     *string
	Email        *string
	Phone        *string
	DepartmentID *int64
	HireDate     *time.Time
	Status       *EmployeeStatus
	ID           int64
}

func (q *Queries) UpdateEmployee(ctx context.Context, arg UpdateEmployeeParams) (Employee, error) {
	row := q.db.QueryRow(ctx, updateEmployee,
		arg.EmployeeCode, arg.FirstName, arg.LastName, arg.Email,
		arg.Phone, arg.DepartmentID, arg.HireDate, arg.Status, arg.ID,
	)
	var i Employee
	err := row.Scan(
		&i.ID, &i.EmployeeCode, &i.FirstName, &i.LastName, &i.Email,
		&i.Phone, &i.DepartmentID, &i.HireDate, &i.Status, &i.CreatedAt, &i.UpdatedAt,
	)
	return i, err
}

const updateEmployeeDepartment = `-- name: UpdateEmployeeDepartment :exec
UPDATE employees SET department_id = $1, updated_at = now() WHERE id = $2
`

func (q *Queries) UpdateEmployeeDepartment(ctx context.Context, departmentID, employeeID int64) error {
	_, err := q.db.Exec(ctx, updateEmployeeDepartment, departmentID, employeeID)
	return err
}

const deleteEmployee = `-- name: DeleteEmployee :exec
DELETE FROM employees WHERE id = $1
`

func (q *Queries) DeleteEmployee(ctx context.Context, id int64) error {
	_, err := q.db.Exec(ctx, deleteEmployee, id)
	return err
}

// --- Employee Roles ---

const getCurrentEmployeeRole = `-- name: GetCurrentEmployeeRole :one
SELECT er.id, er.employee_id, er.role_id, er.effective_from, er.effective_to, er.created_at
FROM employee_roles er
WHERE er.employee_id = $1 AND er.effective_to IS NULL
`

func (q *Queries) GetCurrentEmployeeRole(ctx context.Context, employeeID int64) (EmployeeRole, error) {
	row := q.db.QueryRow(ctx, getCurrentEmployeeRole, employeeID)
	var i EmployeeRole
	err := row.Scan(&i.ID, &i.EmployeeID, &i.RoleID, &i.EffectiveFrom, &i.EffectiveTo, &i.CreatedAt)
	return i, err
}

const closeCurrentEmployeeRole = `-- name: CloseCurrentEmployeeRole :exec
UPDATE employee_roles SET effective_to = $1 WHERE employee_id = $2 AND effective_to IS NULL
`

func (q *Queries) CloseCurrentEmployeeRole(ctx context.Context, effectiveTo time.Time, employeeID int64) error {
	_, err := q.db.Exec(ctx, closeCurrentEmployeeRole, effectiveTo, employeeID)
	return err
}

const insertEmployeeRole = `-- name: InsertEmployeeRole :one
INSERT INTO employee_roles (employee_id, role_id, effective_from)
VALUES ($1, $2, $3)
RETURNING id, employee_id, role_id, effective_from, effective_to, created_at
`

type InsertEmployeeRoleParams struct {
	EmployeeID    int64
	RoleID        int64
	EffectiveFrom time.Time
}

func (q *Queries) InsertEmployeeRole(ctx context.Context, arg InsertEmployeeRoleParams) (EmployeeRole, error) {
	row := q.db.QueryRow(ctx, insertEmployeeRole, arg.EmployeeID, arg.RoleID, arg.EffectiveFrom)
	var i EmployeeRole
	err := row.Scan(&i.ID, &i.EmployeeID, &i.RoleID, &i.EffectiveFrom, &i.EffectiveTo, &i.CreatedAt)
	return i, err
}

const listEmployeeRoles = `-- name: ListEmployeeRoles :many
SELECT id, employee_id, role_id, effective_from, effective_to, created_at
FROM employee_roles WHERE employee_id = $1 ORDER BY effective_from DESC
`

func (q *Queries) ListEmployeeRoles(ctx context.Context, employeeID int64) ([]EmployeeRole, error) {
	rows, err := q.db.Query(ctx, listEmployeeRoles, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []EmployeeRole
	for rows.Next() {
		var i EmployeeRole
		if err := rows.Scan(&i.ID, &i.EmployeeID, &i.RoleID, &i.EffectiveFrom, &i.EffectiveTo, &i.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

// --- Shifts ---

const createShift = `-- name: CreateShift :one
INSERT INTO shifts (name, start_time, end_time)
VALUES ($1, $2, $3)
RETURNING id, name, start_time, end_time, created_at
`

type CreateShiftParams struct {
	Name      string
	StartTime time.Time
	EndTime   time.Time
}

func (q *Queries) CreateShift(ctx context.Context, arg CreateShiftParams) (Shift, error) {
	row := q.db.QueryRow(ctx, createShift, arg.Name, arg.StartTime, arg.EndTime)
	var i Shift
	err := row.Scan(&i.ID, &i.Name, &i.StartTime, &i.EndTime, &i.CreatedAt)
	return i, err
}

const getShift = `-- name: GetShift :one
SELECT id, name, start_time, end_time, created_at FROM shifts WHERE id = $1
`

func (q *Queries) GetShift(ctx context.Context, id int64) (Shift, error) {
	row := q.db.QueryRow(ctx, getShift, id)
	var i Shift
	err := row.Scan(&i.ID, &i.Name, &i.StartTime, &i.EndTime, &i.CreatedAt)
	return i, err
}

const listShifts = `-- name: ListShifts :many
SELECT id, name, start_time, end_time, created_at FROM shifts ORDER BY start_time
`

func (q *Queries) ListShifts(ctx context.Context) ([]Shift, error) {
	rows, err := q.db.Query(ctx, listShifts)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Shift
	for rows.Next() {
		var i Shift
		if err := rows.Scan(&i.ID, &i.Name, &i.StartTime, &i.EndTime, &i.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

const updateShift = `-- name: UpdateShift :one
UPDATE shifts SET name = COALESCE($1, name), start_time = COALESCE($2, start_time), end_time = COALESCE($3, end_time)
WHERE id = $4
RETURNING id, name, start_time, end_time, created_at
`

type UpdateShiftParams struct {
	Name      *string
	StartTime *time.Time
	EndTime   *time.Time
	ID        int64
}

func (q *Queries) UpdateShift(ctx context.Context, arg UpdateShiftParams) (Shift, error) {
	row := q.db.QueryRow(ctx, updateShift, arg.Name, arg.StartTime, arg.EndTime, arg.ID)
	var i Shift
	err := row.Scan(&i.ID, &i.Name, &i.StartTime, &i.EndTime, &i.CreatedAt)
	return i, err
}

const deleteShift = `-- name: DeleteShift :exec
DELETE FROM shifts WHERE id = $1
`

func (q *Queries) DeleteShift(ctx context.Context, id int64) error {
	_, err := q.db.Exec(ctx, deleteShift, id)
	return err
}

// --- Shift Assignments ---

const createShiftAssignment = `-- name: CreateShiftAssignment :one
INSERT INTO shift_assignments (employee_id, shift_id, work_date, created_by)
VALUES ($1, $2, $3, $4)
RETURNING id, employee_id, shift_id, work_date, created_by, created_at
`

type CreateShiftAssignmentParams struct {
	EmployeeID int64
	ShiftID    int64
	WorkDate   time.Time
	CreatedBy  *int64
}

func (q *Queries) CreateShiftAssignment(ctx context.Context, arg CreateShiftAssignmentParams) (ShiftAssignment, error) {
	row := q.db.QueryRow(ctx, createShiftAssignment, arg.EmployeeID, arg.ShiftID, arg.WorkDate, arg.CreatedBy)
	var i ShiftAssignment
	err := row.Scan(&i.ID, &i.EmployeeID, &i.ShiftID, &i.WorkDate, &i.CreatedBy, &i.CreatedAt)
	return i, err
}

const getShiftAssignment = `-- name: GetShiftAssignment :one
SELECT id, employee_id, shift_id, work_date, created_by, created_at
FROM shift_assignments WHERE id = $1
`

func (q *Queries) GetShiftAssignment(ctx context.Context, id int64) (ShiftAssignment, error) {
	row := q.db.QueryRow(ctx, getShiftAssignment, id)
	var i ShiftAssignment
	err := row.Scan(&i.ID, &i.EmployeeID, &i.ShiftID, &i.WorkDate, &i.CreatedBy, &i.CreatedAt)
	return i, err
}

const getShiftAssignmentByEmployeeDate = `-- name: GetShiftAssignmentByEmployeeDate :one
SELECT id, employee_id, shift_id, work_date, created_by, created_at
FROM shift_assignments WHERE employee_id = $1 AND work_date = $2
`

func (q *Queries) GetShiftAssignmentByEmployeeDate(ctx context.Context, employeeID int64, workDate time.Time) (ShiftAssignment, error) {
	row := q.db.QueryRow(ctx, getShiftAssignmentByEmployeeDate, employeeID, workDate)
	var i ShiftAssignment
	err := row.Scan(&i.ID, &i.EmployeeID, &i.ShiftID, &i.WorkDate, &i.CreatedBy, &i.CreatedAt)
	return i, err
}

const listShiftAssignments = `-- name: ListShiftAssignments :many
SELECT id, employee_id, shift_id, work_date, created_by, created_at
FROM shift_assignments
WHERE ($1::bigint IS NULL OR employee_id = $1)
  AND ($2::bigint IS NULL OR shift_id = $2)
  AND ($3::date IS NULL OR work_date >= $3)
  AND ($4::date IS NULL OR work_date <= $4)
ORDER BY work_date DESC, id DESC
`

type ListShiftAssignmentsParams struct {
	EmployeeID *int64
	ShiftID    *int64
	FromDate   *time.Time
	ToDate     *time.Time
}

func (q *Queries) ListShiftAssignments(ctx context.Context, arg ListShiftAssignmentsParams) ([]ShiftAssignment, error) {
	rows, err := q.db.Query(ctx, listShiftAssignments, arg.EmployeeID, arg.ShiftID, arg.FromDate, arg.ToDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ShiftAssignment
	for rows.Next() {
		var i ShiftAssignment
		if err := rows.Scan(&i.ID, &i.EmployeeID, &i.ShiftID, &i.WorkDate, &i.CreatedBy, &i.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

const deleteShiftAssignment = `-- name: DeleteShiftAssignment :exec
DELETE FROM shift_assignments WHERE id = $1
`

func (q *Queries) DeleteShiftAssignment(ctx context.Context, id int64) error {
	_, err := q.db.Exec(ctx, deleteShiftAssignment, id)
	return err
}

// --- Attendance ---

const createAttendance = `-- name: CreateAttendance :one
INSERT INTO attendance (shift_assignment_id, check_in_time, status, recorded_by)
VALUES ($1, $2, $3, $4)
RETURNING id, shift_assignment_id, check_in_time, check_out_time, status, notes, recorded_by, created_at, updated_at
`

type CreateAttendanceParams struct {
	ShiftAssignmentID int64
	CheckInTime       *time.Time
	Status            AttendanceStatus
	RecordedBy        *int64
}

func (q *Queries) CreateAttendance(ctx context.Context, arg CreateAttendanceParams) (Attendance, error) {
	row := q.db.QueryRow(ctx, createAttendance, arg.ShiftAssignmentID, arg.CheckInTime, arg.Status, arg.RecordedBy)
	var i Attendance
	err := row.Scan(&i.ID, &i.ShiftAssignmentID, &i.CheckInTime, &i.CheckOutTime, &i.Status, &i.Notes, &i.RecordedBy, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const getAttendanceByShiftAssignment = `-- name: GetAttendanceByShiftAssignment :one
SELECT id, shift_assignment_id, check_in_time, check_out_time, status, notes, recorded_by, created_at, updated_at
FROM attendance WHERE shift_assignment_id = $1
`

func (q *Queries) GetAttendanceByShiftAssignment(ctx context.Context, shiftAssignmentID int64) (Attendance, error) {
	row := q.db.QueryRow(ctx, getAttendanceByShiftAssignment, shiftAssignmentID)
	var i Attendance
	err := row.Scan(&i.ID, &i.ShiftAssignmentID, &i.CheckInTime, &i.CheckOutTime, &i.Status, &i.Notes, &i.RecordedBy, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const updateAttendanceCheckIn = `-- name: UpdateAttendanceCheckIn :one
UPDATE attendance SET check_in_time = $1, status = $2, updated_at = now()
WHERE shift_assignment_id = $3
RETURNING id, shift_assignment_id, check_in_time, check_out_time, status, notes, recorded_by, created_at, updated_at
`

type UpdateAttendanceCheckInParams struct {
	CheckInTime       time.Time
	Status            AttendanceStatus
	ShiftAssignmentID int64
}

func (q *Queries) UpdateAttendanceCheckIn(ctx context.Context, arg UpdateAttendanceCheckInParams) (Attendance, error) {
	row := q.db.QueryRow(ctx, updateAttendanceCheckIn, arg.CheckInTime, arg.Status, arg.ShiftAssignmentID)
	var i Attendance
	err := row.Scan(&i.ID, &i.ShiftAssignmentID, &i.CheckInTime, &i.CheckOutTime, &i.Status, &i.Notes, &i.RecordedBy, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const updateAttendanceCheckOut = `-- name: UpdateAttendanceCheckOut :one
UPDATE attendance SET check_out_time = $1, status = $2, updated_at = now()
WHERE shift_assignment_id = $3
RETURNING id, shift_assignment_id, check_in_time, check_out_time, status, notes, recorded_by, created_at, updated_at
`

type UpdateAttendanceCheckOutParams struct {
	CheckOutTime      time.Time
	Status            AttendanceStatus
	ShiftAssignmentID int64
}

func (q *Queries) UpdateAttendanceCheckOut(ctx context.Context, arg UpdateAttendanceCheckOutParams) (Attendance, error) {
	row := q.db.QueryRow(ctx, updateAttendanceCheckOut, arg.CheckOutTime, arg.Status, arg.ShiftAssignmentID)
	var i Attendance
	err := row.Scan(&i.ID, &i.ShiftAssignmentID, &i.CheckInTime, &i.CheckOutTime, &i.Status, &i.Notes, &i.RecordedBy, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const listAttendanceByEmployee = `-- name: ListAttendanceByEmployee :many
SELECT a.id, a.shift_assignment_id, a.check_in_time, a.check_out_time, a.status, a.notes, a.recorded_by, a.created_at, a.updated_at
FROM attendance a
JOIN shift_assignments sa ON sa.id = a.shift_assignment_id
WHERE sa.employee_id = $1
  AND ($2::date IS NULL OR sa.work_date >= $2)
  AND ($3::date IS NULL OR sa.work_date <= $3)
ORDER BY sa.work_date DESC
`

type ListAttendanceByEmployeeParams struct {
	EmployeeID int64
	FromDate   *time.Time
	ToDate     *time.Time
}

func (q *Queries) ListAttendanceByEmployee(ctx context.Context, arg ListAttendanceByEmployeeParams) ([]Attendance, error) {
	rows, err := q.db.Query(ctx, listAttendanceByEmployee, arg.EmployeeID, arg.FromDate, arg.ToDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Attendance
	for rows.Next() {
		var i Attendance
		if err := rows.Scan(&i.ID, &i.ShiftAssignmentID, &i.CheckInTime, &i.CheckOutTime, &i.Status, &i.Notes, &i.RecordedBy, &i.CreatedAt, &i.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

// --- Users ---

const createUser = `-- name: CreateUser :one
INSERT INTO users (employee_id, username, password_hash, role, is_active)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, employee_id, username, password_hash, role, is_active, created_at, updated_at
`

type CreateUserParams struct {
	EmployeeID   *int64
	Username     string
	PasswordHash string
	Role         UserRole
	IsActive     bool
}

func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (User, error) {
	row := q.db.QueryRow(ctx, createUser, arg.EmployeeID, arg.Username, arg.PasswordHash, arg.Role, arg.IsActive)
	var i User
	err := row.Scan(&i.ID, &i.EmployeeID, &i.Username, &i.PasswordHash, &i.Role, &i.IsActive, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const getUser = `-- name: GetUser :one
SELECT id, employee_id, username, password_hash, role, is_active, created_at, updated_at FROM users WHERE id = $1
`

func (q *Queries) GetUser(ctx context.Context, id int64) (User, error) {
	row := q.db.QueryRow(ctx, getUser, id)
	var i User
	err := row.Scan(&i.ID, &i.EmployeeID, &i.Username, &i.PasswordHash, &i.Role, &i.IsActive, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const getUserByUsername = `-- name: GetUserByUsername :one
SELECT id, employee_id, username, password_hash, role, is_active, created_at, updated_at FROM users WHERE username = $1
`

func (q *Queries) GetUserByUsername(ctx context.Context, username string) (User, error) {
	row := q.db.QueryRow(ctx, getUserByUsername, username)
	var i User
	err := row.Scan(&i.ID, &i.EmployeeID, &i.Username, &i.PasswordHash, &i.Role, &i.IsActive, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const listUsers = `-- name: ListUsers :many
SELECT id, employee_id, username, password_hash, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC
`

func (q *Queries) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := q.db.Query(ctx, listUsers)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []User
	for rows.Next() {
		var i User
		if err := rows.Scan(&i.ID, &i.EmployeeID, &i.Username, &i.PasswordHash, &i.Role, &i.IsActive, &i.CreatedAt, &i.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

const updateUser = `-- name: UpdateUser :one
UPDATE users SET
    employee_id = COALESCE($1, employee_id),
    username = COALESCE($2, username),
    password_hash = COALESCE($3, password_hash),
    role = COALESCE($4, role),
    is_active = COALESCE($5, is_active),
    updated_at = now()
WHERE id = $6
RETURNING id, employee_id, username, password_hash, role, is_active, created_at, updated_at
`

type UpdateUserParams struct {
	EmployeeID   *int64
	Username     *string
	PasswordHash *string
	Role         *UserRole
	IsActive     *bool
	ID           int64
}

func (q *Queries) UpdateUser(ctx context.Context, arg UpdateUserParams) (User, error) {
	row := q.db.QueryRow(ctx, updateUser, arg.EmployeeID, arg.Username, arg.PasswordHash, arg.Role, arg.IsActive, arg.ID)
	var i User
	err := row.Scan(&i.ID, &i.EmployeeID, &i.Username, &i.PasswordHash, &i.Role, &i.IsActive, &i.CreatedAt, &i.UpdatedAt)
	return i, err
}

const deleteUser = `-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1
`

func (q *Queries) DeleteUser(ctx context.Context, id int64) error {
	_, err := q.db.Exec(ctx, deleteUser, id)
	return err
}

// --- Audit Logs ---

const createAuditLog = `-- name: CreateAuditLog :one
INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address, created_at
`

type CreateAuditLogParams struct {
	ActorUserID *int64
	Action      string
	EntityType  string
	EntityID    *int64
	BeforeData  map[string]any
	AfterData   map[string]any
	IPAddress   *string
}

func (q *Queries) CreateAuditLog(ctx context.Context, arg CreateAuditLogParams) (AuditLog, error) {
	row := q.db.QueryRow(ctx, createAuditLog, arg.ActorUserID, arg.Action, arg.EntityType, arg.EntityID, arg.BeforeData, arg.AfterData, arg.IPAddress)
	var i AuditLog
	err := row.Scan(&i.ID, &i.ActorUserID, &i.Action, &i.EntityType, &i.EntityID, &i.BeforeData, &i.AfterData, &i.IPAddress, &i.CreatedAt)
	return i, err
}

const listAuditLogs = `-- name: ListAuditLogs :many
SELECT id, actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address, created_at
FROM audit_logs
WHERE ($1::text IS NULL OR entity_type = $1)
  AND ($2::bigint IS NULL OR entity_id = $2)
  AND ($3::timestamptz IS NULL OR created_at >= $3)
  AND ($4::timestamptz IS NULL OR created_at <= $4)
ORDER BY created_at DESC
`

type ListAuditLogsParams struct {
	EntityType *string
	EntityID   *int64
	FromDate   *time.Time
	ToDate     *time.Time
}

func (q *Queries) ListAuditLogs(ctx context.Context, arg ListAuditLogsParams) ([]AuditLog, error) {
	rows, err := q.db.Query(ctx, listAuditLogs, arg.EntityType, arg.EntityID, arg.FromDate, arg.ToDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []AuditLog
	for rows.Next() {
		var i AuditLog
		if err := rows.Scan(&i.ID, &i.ActorUserID, &i.Action, &i.EntityType, &i.EntityID, &i.BeforeData, &i.AfterData, &i.IPAddress, &i.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

// --- Reports ---

const monthlyAttendanceSummary = `-- name: MonthlyAttendanceSummary :many
SELECT
  e.id, e.first_name, e.last_name, d.name AS department,
  COUNT(*) FILTER (WHERE a.status = 'present')  AS present_count,
  COUNT(*) FILTER (WHERE a.status = 'late')      AS late_count,
  COUNT(*) FILTER (WHERE a.status = 'absent')    AS absent_count,
  COUNT(*) FILTER (WHERE a.status = 'half_day')  AS half_day_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE a.status IN ('present','late')) / NULLIF(COUNT(*), 0),
  1) AS attendance_rate_pct
FROM employees e
JOIN departments d      ON d.id = e.department_id
JOIN shift_assignments sa ON sa.employee_id = e.id
JOIN attendance a        ON a.shift_assignment_id = sa.id
WHERE sa.work_date BETWEEN $1 AND $2
GROUP BY e.id, e.first_name, e.last_name, d.name
ORDER BY attendance_rate_pct ASC
`

type MonthlyAttendanceSummaryRow struct {
	ID                int64
	FirstName         string
	LastName          string
	Department        string
	PresentCount      int64
	LateCount         int64
	AbsentCount       int64
	HalfDayCount      int64
	AttendanceRatePct float64
}

func (q *Queries) MonthlyAttendanceSummary(ctx context.Context, from, to time.Time) ([]MonthlyAttendanceSummaryRow, error) {
	rows, err := q.db.Query(ctx, monthlyAttendanceSummary, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []MonthlyAttendanceSummaryRow
	for rows.Next() {
		var i MonthlyAttendanceSummaryRow
		if err := rows.Scan(
			&i.ID, &i.FirstName, &i.LastName, &i.Department,
			&i.PresentCount, &i.LateCount, &i.AbsentCount, &i.HalfDayCount, &i.AttendanceRatePct,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

const departmentStaffing = `-- name: DepartmentStaffing :many
SELECT d.name AS department, r.name AS role, COUNT(*) AS headcount
FROM employees e
JOIN departments d       ON d.id = e.department_id
JOIN employee_roles er   ON er.employee_id = e.id AND er.effective_to IS NULL
JOIN roles r             ON r.id = er.role_id
WHERE e.status = 'active'
GROUP BY d.name, r.name
ORDER BY d.name, headcount DESC
`

type DepartmentStaffingRow struct {
	Department string
	Role       string
	Headcount  int64
}

func (q *Queries) DepartmentStaffing(ctx context.Context) ([]DepartmentStaffingRow, error) {
	rows, err := q.db.Query(ctx, departmentStaffing)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []DepartmentStaffingRow
	for rows.Next() {
		var i DepartmentStaffingRow
		if err := rows.Scan(&i.Department, &i.Role, &i.Headcount); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}

const shiftCoverageGaps = `-- name: ShiftCoverageGaps :many
WITH date_range AS (
  SELECT generate_series($1::date, $2::date, interval '1 day')::date AS work_date
),
expected AS (
  SELECT dr.work_date, s.id AS shift_id, s.name AS shift_name
  FROM date_range dr
  CROSS JOIN shifts s
),
actual AS (
  SELECT sa.work_date, sa.shift_id,
         COUNT(sa.id) AS assigned_count,
         COUNT(a.id) FILTER (WHERE a.status IN ('present','late')) AS attended_count
  FROM shift_assignments sa
  LEFT JOIN attendance a ON a.shift_assignment_id = sa.id
  WHERE sa.work_date BETWEEN $1 AND $2
  GROUP BY sa.work_date, sa.shift_id
)
SELECT e.work_date, e.shift_name,
       COALESCE(a.assigned_count, 0)  AS assigned_count,
       COALESCE(a.attended_count, 0)  AS attended_count,
       CASE
         WHEN COALESCE(a.assigned_count, 0) = 0 THEN 'NO_STAFF_ASSIGNED'
         WHEN a.attended_count = 0                THEN 'FULL_NO_SHOW'
         WHEN a.attended_count < a.assigned_count  THEN 'PARTIAL_COVERAGE'
         ELSE 'OK'
       END AS coverage_status
FROM expected e
LEFT JOIN actual a ON a.work_date = e.work_date AND a.shift_id = e.shift_id
WHERE COALESCE(a.assigned_count, 0) = 0 OR a.attended_count < a.assigned_count
ORDER BY e.work_date, e.shift_name
`

type ShiftCoverageGapsRow struct {
	WorkDate       time.Time
	ShiftName      string
	AssignedCount  int64
	AttendedCount  int64
	CoverageStatus string
}

func (q *Queries) ShiftCoverageGaps(ctx context.Context, from, to time.Time) ([]ShiftCoverageGapsRow, error) {
	rows, err := q.db.Query(ctx, shiftCoverageGaps, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ShiftCoverageGapsRow
	for rows.Next() {
		var i ShiftCoverageGapsRow
		if err := rows.Scan(&i.WorkDate, &i.ShiftName, &i.AssignedCount, &i.AttendedCount, &i.CoverageStatus); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	return items, rows.Err()
}
