-- name: CreateDepartment :one
INSERT INTO departments (name, description)
VALUES ($1, $2)
RETURNING id, name, description, created_at, updated_at;

-- name: GetDepartment :one
SELECT id, name, description, created_at, updated_at FROM departments WHERE id = $1;

-- name: ListDepartments :many
SELECT id, name, description, created_at, updated_at FROM departments ORDER BY name;

-- name: UpdateDepartment :one
UPDATE departments SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = now()
WHERE id = $3
RETURNING id, name, description, created_at, updated_at;

-- name: DeleteDepartment :exec
DELETE FROM departments WHERE id = $1;

-- name: CreateRole :one
INSERT INTO roles (name, description)
VALUES ($1, $2)
RETURNING id, name, description, created_at, updated_at;

-- name: GetRole :one
SELECT id, name, description, created_at, updated_at FROM roles WHERE id = $1;

-- name: ListRoles :many
SELECT id, name, description, created_at, updated_at FROM roles ORDER BY name;

-- name: UpdateRole :one
UPDATE roles SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = now()
WHERE id = $3
RETURNING id, name, description, created_at, updated_at;

-- name: DeleteRole :exec
DELETE FROM roles WHERE id = $1;

-- name: CreateEmployee :one
INSERT INTO employees (employee_code, first_name, last_name, email, phone, department_id, hire_date, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at;

-- name: GetEmployee :one
SELECT id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at
FROM employees WHERE id = $1;

-- name: GetEmployeeByEmail :one
SELECT id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at
FROM employees WHERE email = $1;

-- name: ListEmployees :many
SELECT id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at
FROM employees
WHERE ($1::bigint IS NULL OR department_id = $1)
  AND ($2::employee_status IS NULL OR status = $2)
ORDER BY created_at DESC;

-- name: UpdateEmployee :one
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
RETURNING id, employee_code, first_name, last_name, email, phone, department_id, hire_date, status, created_at, updated_at;

-- name: UpdateEmployeeDepartment :exec
UPDATE employees SET department_id = $1, updated_at = now() WHERE id = $2;

-- name: DeleteEmployee :exec
DELETE FROM employees WHERE id = $1;

-- name: GetCurrentEmployeeRole :one
SELECT er.id, er.employee_id, er.role_id, er.effective_from, er.effective_to, er.created_at
FROM employee_roles er
WHERE er.employee_id = $1 AND er.effective_to IS NULL;

-- name: CloseCurrentEmployeeRole :exec
UPDATE employee_roles SET effective_to = $1 WHERE employee_id = $2 AND effective_to IS NULL;

-- name: InsertEmployeeRole :one
INSERT INTO employee_roles (employee_id, role_id, effective_from)
VALUES ($1, $2, $3)
RETURNING id, employee_id, role_id, effective_from, effective_to, created_at;

-- name: ListEmployeeRoles :many
SELECT id, employee_id, role_id, effective_from, effective_to, created_at
FROM employee_roles WHERE employee_id = $1 ORDER BY effective_from DESC;

-- name: CreateShift :one
INSERT INTO shifts (name, start_time, end_time)
VALUES ($1, $2, $3)
RETURNING id, name, start_time, end_time, created_at;

-- name: GetShift :one
SELECT id, name, start_time, end_time, created_at FROM shifts WHERE id = $1;

-- name: ListShifts :many
SELECT id, name, start_time, end_time, created_at FROM shifts ORDER BY start_time;

-- name: UpdateShift :one
UPDATE shifts SET name = COALESCE($1, name), start_time = COALESCE($2, start_time), end_time = COALESCE($3, end_time)
WHERE id = $4
RETURNING id, name, start_time, end_time, created_at;

-- name: DeleteShift :exec
DELETE FROM shifts WHERE id = $1;

-- name: CreateShiftAssignment :one
INSERT INTO shift_assignments (employee_id, shift_id, work_date, created_by)
VALUES ($1, $2, $3, $4)
RETURNING id, employee_id, shift_id, work_date, created_by, created_at;

-- name: GetShiftAssignment :one
SELECT id, employee_id, shift_id, work_date, created_by, created_at
FROM shift_assignments WHERE id = $1;

-- name: GetShiftAssignmentByEmployeeDate :one
SELECT id, employee_id, shift_id, work_date, created_by, created_at
FROM shift_assignments WHERE employee_id = $1 AND work_date = $2;

-- name: ListShiftAssignments :many
SELECT id, employee_id, shift_id, work_date, created_by, created_at
FROM shift_assignments
WHERE ($1::bigint IS NULL OR employee_id = $1)
  AND ($2::bigint IS NULL OR shift_id = $2)
  AND ($3::date IS NULL OR work_date >= $3)
  AND ($4::date IS NULL OR work_date <= $4)
ORDER BY work_date DESC, id DESC;

-- name: DeleteShiftAssignment :exec
DELETE FROM shift_assignments WHERE id = $1;

-- name: CreateAttendance :one
INSERT INTO attendance (shift_assignment_id, check_in_time, status, recorded_by)
VALUES ($1, $2, $3, $4)
RETURNING id, shift_assignment_id, check_in_time, check_out_time, status, notes, recorded_by, created_at, updated_at;

-- name: GetAttendanceByShiftAssignment :one
SELECT id, shift_assignment_id, check_in_time, check_out_time, status, notes, recorded_by, created_at, updated_at
FROM attendance WHERE shift_assignment_id = $1;

-- name: UpdateAttendanceCheckIn :one
UPDATE attendance SET check_in_time = $1, status = $2, updated_at = now()
WHERE shift_assignment_id = $3
RETURNING id, shift_assignment_id, check_in_time, check_out_time, status, notes, recorded_by, created_at, updated_at;

-- name: UpdateAttendanceCheckOut :one
UPDATE attendance SET check_out_time = $1, status = $2, updated_at = now()
WHERE shift_assignment_id = $3
RETURNING id, shift_assignment_id, check_in_time, check_out_time, status, notes, recorded_by, created_at, updated_at;

-- name: ListAttendanceByEmployee :many
SELECT a.id, a.shift_assignment_id, a.check_in_time, a.check_out_time, a.status, a.notes, a.recorded_by, a.created_at, a.updated_at
FROM attendance a
JOIN shift_assignments sa ON sa.id = a.shift_assignment_id
WHERE sa.employee_id = $1
  AND ($2::date IS NULL OR sa.work_date >= $2)
  AND ($3::date IS NULL OR sa.work_date <= $3)
ORDER BY sa.work_date DESC;

-- name: CreateUser :one
INSERT INTO users (employee_id, username, password_hash, role, is_active)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, employee_id, username, password_hash, role, is_active, created_at, updated_at;

-- name: GetUser :one
SELECT id, employee_id, username, password_hash, role, is_active, created_at, updated_at FROM users WHERE id = $1;

-- name: GetUserByUsername :one
SELECT id, employee_id, username, password_hash, role, is_active, created_at, updated_at FROM users WHERE username = $1;

-- name: ListUsers :many
SELECT id, employee_id, username, password_hash, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC;

-- name: UpdateUser :one
UPDATE users SET
    employee_id = COALESCE($1, employee_id),
    username = COALESCE($2, username),
    password_hash = COALESCE($3, password_hash),
    role = COALESCE($4, role),
    is_active = COALESCE($5, is_active),
    updated_at = now()
WHERE id = $6
RETURNING id, employee_id, username, password_hash, role, is_active, created_at, updated_at;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: CreateAuditLog :one
INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address, created_at;

-- name: ListAuditLogs :many
SELECT id, actor_user_id, action, entity_type, entity_id, before_data, after_data, ip_address, created_at
FROM audit_logs
WHERE ($1::text IS NULL OR entity_type = $1)
  AND ($2::bigint IS NULL OR entity_id = $2)
  AND ($3::timestamptz IS NULL OR created_at >= $3)
  AND ($4::timestamptz IS NULL OR created_at <= $4)
ORDER BY created_at DESC;

-- name: MonthlyAttendanceSummary :many
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
ORDER BY attendance_rate_pct ASC;

-- name: DepartmentStaffing :many
SELECT d.name AS department, r.name AS role, COUNT(*) AS headcount
FROM employees e
JOIN departments d       ON d.id = e.department_id
JOIN employee_roles er   ON er.employee_id = e.id AND er.effective_to IS NULL
JOIN roles r             ON r.id = er.role_id
WHERE e.status = 'active'
GROUP BY d.name, r.name
ORDER BY d.name, headcount DESC;

-- name: ShiftCoverageGaps :many
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
ORDER BY e.work_date, e.shift_name;
