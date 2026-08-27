# SDD — Hotel Employee Management System

## 1. Tech Stack & Rationale
| Layer | Choice | Why |
|---|---|---|
| Language | Go 1.22+ | Static typing, fast compile, single static binary — good fit for two executables (`main.exe`, `admin.exe`) sharing one codebase. |
| Router | chi | Lightweight, idiomatic net/http, good middleware chaining, no framework magic. |
| DB access | sqlc | Generates typed Go from raw SQL — no ORM ambiguity, full control over the non-trivial report queries, compile-time checked. |
| Migrations | goose | Simple up/down SQL migrations, plain SQL files (readable in review), works standalone or embedded. |
| DB | PostgreSQL 16 | Window functions, `FILTER`, `jsonb` for audit payloads, proper FK constraints. |
| API docs | OpenAPI 3.0 (hand-written `openapi.yaml`) + swagger-ui served statically | Contract-first documentation, importable into Postman/Insomnia. |
| Auth | JWT (HS256) + bcrypt | Stateless, standard, no session store needed for a system this size. |
| Config | `.env` via `godotenv` / plain env vars | 12-factor, no config server needed. |

**Deliberately not used:** GORM/ent (hides SQL we want to show off), microservices/queues (unjustified complexity for this scope), gRPC (no second service to talk to).

## 2. High-Level Architecture

```
                        ┌─────────────────────┐
                        │   Swagger UI /       │
                        │   Postman / curl     │
                        └──────────┬───────────┘
                                   │ HTTPS
                        ┌──────────▼───────────┐
                        │   cmd/api (main.exe)  │
                        │   chi router          │
                        │  ┌─────────────────┐  │
                        │  │ Middleware chain │  │
                        │  │ Recover→Logger→  │  │
                        │  │ Auth(JWT)→RBAC→  │  │
                        │  │ Audit            │  │
                        │  └────────┬────────┘  │
                        │           ▼            │
                        │       Handlers         │
                        │           ▼            │
                        │       Services          │
                        │      (business rules)   │
                        │           ▼            │
                        │   Repositories (sqlc)   │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │      PostgreSQL        │
                        └──────────▲───────────┘
                                   │ direct DB conn (no HTTP)
                        ┌──────────┴───────────┐
                        │  cmd/admin (admin.exe)│
                        │  createsuperuser,     │
                        │  reset-password,      │
                        │  migrate wrapper      │
                        └───────────────────────┘
```

Both binaries import the same `internal/` packages (config, db, domain, repository).
`admin.exe` skips the handler/service/middleware layers entirely and talks to the
repository layer directly — this is intentional: privileged identity bootstrap should
never be reachable over the network surface.

## 3. Project Structure

```
hotel-ems/
  cmd/
    api/main.go            # main.exe — HTTP server entrypoint
    admin/main.go          # admin.exe — CLI entrypoint
  internal/
    config/                # env loading, struct
    db/
      queries/*.sql        # sqlc source queries
      sqlc/                # generated code (checked in)
    domain/                # entities, enums, interfaces (ports)
    repository/             # sqlc-backed implementations of domain interfaces
    service/                # business logic (validation, orchestration, tx boundaries)
    handler/                # chi handlers, request/response DTOs
    middleware/             # auth, rbac, audit, recover, request-logger
    audit/                  # audit log writer
    auth/                   # jwt issue/verify, bcrypt
  migrations/               # goose .sql files
  openapi/openapi.yaml
  docs/                     # this doc set + diagrams
  docker-compose.yml
  Makefile
  .env.example
  go.mod
```

## 4. Data Model

### 4.1 Entity list
- `departments` — Front Desk, Housekeeping, F&B, etc.
- `roles` — Manager, Supervisor, Receptionist, Housekeeper, etc.
- `employees` — core person record, FK to current department
- `employee_roles` — history of role assignments per employee (effective-dated)
- `shifts` — shift templates (Morning 06:00–14:00, etc.)
- `shift_assignments` — an employee assigned to a shift template on a specific date
- `attendance` — one row per shift_assignment, records actual check-in/out + status
- `users` — login accounts (optionally linked to an employee), RBAC role
- `audit_logs` — append-only log of mutating actions

### 4.2 Key relationships
- `employees.department_id → departments.id` (many employees : one current department)
- `employee_roles.employee_id → employees.id`, `employee_roles.role_id → roles.id` — many-to-many over time, but only one row per employee has `effective_to IS NULL` (current role) at a time — enforced by a partial unique index.
- `shift_assignments.employee_id → employees.id`, `shift_assignments.shift_id → shifts.id`, unique on `(employee_id, work_date)` — an employee can't be double-booked in a day.
- `attendance.shift_assignment_id → shift_assignments.id`, unique 1:1 — attendance always ties back to a planned assignment, so we can detect "assigned but never checked in" (see report 3).
- `users.employee_id → employees.id` nullable (super_admin has no employee record).
- `audit_logs.actor_user_id → users.id`, no FK cascade delete (logs must survive user deletion).

### 4.3 Schema (goose migration, condensed)

```sql
CREATE TYPE employee_status AS ENUM ('active','inactive','terminated');
CREATE TYPE attendance_status AS ENUM ('present','late','absent','half_day');
CREATE TYPE user_role AS ENUM ('super_admin','hr_manager','staff');

CREATE TABLE departments (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employees (
  id            BIGSERIAL PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
  hire_date     DATE NOT NULL,
  status        employee_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employee_roles (
  id             BIGSERIAL PRIMARY KEY,
  employee_id    BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role_id        BIGINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to   DATE,               -- NULL = currently active
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- only one "current" role per employee at a time
CREATE UNIQUE INDEX ux_employee_roles_current
  ON employee_roles(employee_id) WHERE effective_to IS NULL;

CREATE TABLE shifts (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,      -- 'Morning', 'Evening', 'Night'
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shift_assignments (
  id          BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id    BIGINT NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
  work_date   DATE NOT NULL,
  created_by  BIGINT REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);

CREATE TABLE attendance (
  id                  BIGSERIAL PRIMARY KEY,
  shift_assignment_id BIGINT NOT NULL UNIQUE REFERENCES shift_assignments(id) ON DELETE CASCADE,
  check_in_time       TIMESTAMPTZ,
  check_out_time      TIMESTAMPTZ,
  status              attendance_status NOT NULL,
  notes               TEXT,
  recorded_by         BIGINT REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  employee_id   BIGINT UNIQUE REFERENCES employees(id) ON DELETE SET NULL,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'staff',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,           -- 'CREATE','UPDATE','DELETE'
  entity_type   TEXT NOT NULL,           -- 'employee','shift_assignment', ...
  entity_id     BIGINT,
  before_data   JSONB,
  after_data    JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

Indexes worth calling out: `ux_employee_roles_current` (partial unique index) is the
piece that makes "current role" a DB-enforced invariant instead of an application
convention — a small, deliberate correctness choice.

## 5. API Surface (summary — full contract in `openapi/openapi.yaml`)

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh` |
| Employees | `GET/POST /employees`, `GET/PUT/DELETE /employees/{id}` |
| Departments | `GET/POST /departments`, `GET/PUT/DELETE /departments/{id}`, `POST /employees/{id}/department` |
| Roles | `GET/POST /roles`, `GET/PUT/DELETE /roles/{id}`, `POST /employees/{id}/role` (closes old, opens new) |
| Shifts | `GET/POST /shifts`, `PUT/DELETE /shifts/{id}` |
| Shift Assignments | `GET/POST /shift-assignments`, `DELETE /shift-assignments/{id}`, `GET /employees/{id}/shifts` |
| Attendance | `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /employees/{id}/attendance` |
| Reports | `GET /reports/attendance-summary`, `GET /reports/department-staffing`, `GET /reports/shift-coverage-gaps` |
| Users (admin surface) | `GET/POST /users`, `PUT /users/{id}` — **note: role must be `hr_manager` or `staff`; `super_admin` is rejected by the handler even for a super_admin caller** |

All mutating endpoints run through `middleware.Audit`, which snapshots the entity
before and after the service call inside the same DB transaction.

## 6. Reports (the "non-trivial query" requirement)

### 6.1 Monthly attendance summary per employee
Aggregates attendance status counts and computes an attendance rate, joined through
shift_assignments → employees → departments.

```sql
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
```

### 6.2 Department staffing by current role (uses the effective-dated table correctly)
```sql
SELECT d.name AS department, r.name AS role, COUNT(*) AS headcount
FROM employees e
JOIN departments d       ON d.id = e.department_id
JOIN employee_roles er   ON er.employee_id = e.id AND er.effective_to IS NULL
JOIN roles r             ON r.id = er.role_id
WHERE e.status = 'active'
GROUP BY d.name, r.name
ORDER BY d.name, headcount DESC;
```

### 6.3 Shift coverage gaps (the genuinely non-trivial one)
Finds shifts that were **assigned but never attended** (no-shows) *and* flags
days where a shift template has zero coverage at all — combining an anti-join
with a generated date series so gaps show up even when no row exists.

```sql
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
```

This is the query worth walking an interviewer through: it surfaces operational
risk (an entire shift with nobody assigned, or everyone assigned but no-shows)
that a naive `SELECT * FROM attendance WHERE status='absent'` would miss entirely,
because it also catches the case where **no attendance row exists at all**.

## 7. Auth & RBAC
- `POST /auth/login` verifies bcrypt hash, issues a short-lived JWT (15 min) with
  `sub`, `role`, `employee_id` claims, plus a longer-lived refresh token.
- `middleware.Auth` validates the JWT; `middleware.RequireRole(roles...)` gates
  handlers by claim.
- `super_admin` is a bootstrap/break-glass identity — it can manage `users`, but
  the `users` handler explicitly refuses to create another `super_admin` account,
  even when called by an existing super_admin. That's a deliberate constraint, not
  an oversight: the only path to a super_admin is `admin.exe createsuperuser`.

## 8. Audit Logging Design
- Implemented as `internal/audit`, invoked from the **service layer** (not the
  handler), so it captures true before/after domain state, not just the raw
  request body.
- Write happens inside the same DB transaction as the mutation — if the audit
  insert fails, the mutation rolls back. Consistency over cleverness.
- Fields: actor, action, entity_type, entity_id, before/after JSONB, IP, timestamp.
- Read surface: `GET /audit-logs?entity_type=&entity_id=&from=&to=` (super_admin
  and hr_manager only).

## 9. admin.exe — Superadmin & Ops CLI
A separate compiled binary, no HTTP listener, connects to Postgres using the same
`.env`/config package as `main.exe`.

```
admin.exe createsuperuser --username jdoe --email jdoe@hotel.com   # prompts for password (masked stdin), bcrypt-hashes, inserts user_role='super_admin'
admin.exe reset-password --username jdoe
admin.exe list-users
admin.exe migrate up|down|status         # thin wrapper over goose
```

Why a separate executable instead of a `--seed` flag on the API or a POST
endpoint: identity bootstrap for the highest privilege level shouldn't be
reachable over any network path, authenticated or not. This mirrors why
Django's `createsuperuser` is a management command, not a view.

## 10. Sequence Diagrams, Class/UML, ERD
See `docs/diagrams/` — rendered separately in mermaid for step-by-step walkthroughs
of: (a) attendance check-in flow, (b) role reassignment flow, (c) admin.exe superuser
bootstrap, plus the ERD and domain class diagram.

## 11. Suggested 12-Hour Build Timeline
| Hours | Focus |
|---|---|
| 0–1 | Scaffold repo, docker-compose (Postgres), goose init, sqlc config, chi skeleton |
| 1–3 | Migrations for all tables, sqlc queries + generate, repository layer |
| 3–5 | Service layer + domain validation, employees/departments/roles handlers |
| 5–6.5 | Shifts, shift_assignments, attendance handlers |
| 6.5–8 | Auth (JWT/bcrypt), RBAC middleware, audit middleware + service hooks |
| 8–9.5 | Reports endpoints (the 3 queries above) |
| 9.5–10.5 | admin.exe (createsuperuser, reset-password, migrate wrapper) |
| 10.5–11.5 | OpenAPI spec + Swagger UI wiring, Postman smoke test |
| 11.5–12 | README, final pass, docker-compose end-to-end run |
