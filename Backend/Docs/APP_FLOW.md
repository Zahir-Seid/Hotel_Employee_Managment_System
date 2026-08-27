# APP FLOW — Hotel Employee Management System

Walkthroughs of the key flows end-to-end. Standalone renderable versions of each
diagram are in `docs/diagrams/*.mermaid`.

## 1. Superadmin Bootstrap (admin.exe — day zero, before any API traffic exists)

```mermaid
sequenceDiagram
    actor Op as Operator (shell)
    participant Admin as admin.exe
    participant Cfg as config.Load()
    participant Repo as repository.UserRepo
    participant DB as PostgreSQL

    Op->>Admin: admin.exe createsuperuser --username jdoe --email jdoe@hotel.com
    Admin->>Op: prompt "Password:" (masked input)
    Op->>Admin: ********
    Admin->>Cfg: load DB config from .env
    Admin->>Admin: bcrypt.Hash(password, cost=12)
    Admin->>Repo: CreateUser(username, hash, role=super_admin)
    Repo->>DB: INSERT INTO users (...) VALUES (...)
    DB-->>Repo: user row (id)
    Repo-->>Admin: ok
    Admin-->>Op: "Superadmin 'jdoe' created."
```

Note: no HTTP server involved. `admin.exe` never binds a port.

## 2. Login

```mermaid
sequenceDiagram
    actor Client
    participant API as chi router (main.exe)
    participant H as AuthHandler
    participant S as AuthService
    participant Repo as UserRepo
    participant DB

    Client->>API: POST /auth/login {username, password}
    API->>H: route match
    H->>S: Login(username, password)
    S->>Repo: GetByUsername(username)
    Repo->>DB: SELECT * FROM users WHERE username=$1
    DB-->>Repo: user row
    Repo-->>S: user
    S->>S: bcrypt.Compare(password, user.password_hash)
    S->>S: issue JWT {sub, role, employee_id}, exp=15m
    S-->>H: {access_token, refresh_token}
    H-->>Client: 200 OK {tokens}
```

## 3. Role Reassignment (multi-table write inside one transaction)

```mermaid
sequenceDiagram
    actor HR as hr_manager
    participant API
    participant MW as Auth+RBAC Middleware
    participant H as EmployeeHandler
    participant S as EmployeeService
    participant Repo
    participant DB
    participant Audit as AuditWriter

    HR->>API: POST /employees/42/role {role_id: 7}
    API->>MW: validate JWT, require role in [hr_manager, super_admin]
    MW->>H: forward
    H->>S: ReassignRole(ctx, employeeID=42, newRoleID=7, actorUserID)
    S->>Repo: BeginTx()
    S->>Repo: GetCurrentRole(42)  -- for audit "before" snapshot
    Repo->>DB: SELECT ... WHERE employee_id=42 AND effective_to IS NULL
    DB-->>Repo: current role row
    S->>Repo: CloseCurrentRole(42, effective_to=today)
    Repo->>DB: UPDATE employee_roles SET effective_to=today WHERE ...
    S->>Repo: InsertNewRole(42, 7, effective_from=today)
    Repo->>DB: INSERT INTO employee_roles (...)
    S->>Audit: Write(actor, action=UPDATE, entity=employee_role, before, after)
    Audit->>DB: INSERT INTO audit_logs (...)
    S->>Repo: CommitTx()
    Repo-->>S: ok
    S-->>H: updated employee view
    H-->>HR: 200 OK {employee, current_role}
```

Why this is one transaction: an inconsistent state (old role closed, new role
insert failed) would silently leave an employee with *no* current role — a data
integrity bug, not just a UX one. Committing atomically prevents that.

## 4. Shift Assignment → Attendance → Report (the core operational loop)

```mermaid
sequenceDiagram
    actor HR as hr_manager
    actor Staff as front-desk clerk
    participant API
    participant SAService as ShiftAssignmentService
    participant AttService as AttendanceService
    participant Repo
    participant DB

    HR->>API: POST /shift-assignments {employee_id, shift_id, work_date}
    API->>SAService: Assign(...)
    SAService->>Repo: INSERT shift_assignments (unique on employee_id+work_date)
    Repo->>DB: insert
    DB-->>Repo: 409 if duplicate, else row
    Repo-->>HR: 201 Created

    Staff->>API: POST /attendance/check-in {shift_assignment_id}
    API->>AttService: CheckIn(id, now())
    AttService->>Repo: compute status (on-time vs late vs shift already ended)
    Repo->>DB: INSERT INTO attendance (...)
    DB-->>Repo: row
    AttService-->>Staff: 201 Created {status: "present"|"late"}

    HR->>API: GET /reports/shift-coverage-gaps?from=...&to=...
    API->>Repo: run coverage-gap CTE query (see SDD §6.3)
    Repo->>DB: execute
    DB-->>Repo: rows: FULL_NO_SHOW / PARTIAL_COVERAGE / NO_STAFF_ASSIGNED
    Repo-->>HR: 200 OK {gaps: [...]}
```

## 5. Employee & RBAC State Notes
- An employee record can exist with `status='inactive'` without deleting history —
  attendance/role history for a terminated employee is preserved (soft-delete
  pattern on `employees.status`, hard FK constraints protect referential
  integrity elsewhere).
- `staff` role (if implemented) can only ever query `/employees/{id}/...` where
  `{id}` matches their own `employee_id` claim — enforced in the service layer,
  not just hidden in the UI, since there is no UI.
