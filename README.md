# Hotel Employee Management System

A backend system for managing hotel staff — employees, departments, roles, shifts,
and attendance — with JWT-based RBAC, audit logging, and a CLI-only superadmin
bootstrap tool, built in Go.

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Go 1.22 |
| Router | chi |
| DB access | sqlc (typed SQL, no ORM) |
| Migrations | goose |
| Database | PostgreSQL 16 |
| Auth | JWT (HS256) + bcrypt |
| API docs | OpenAPI 3.0 + Swagger UI |

## Architecture

```mermaid
flowchart TB
    subgraph Clients
        SW[Swagger UI]
        PM[Postman / curl]
    end

    subgraph MainExe["main.exe (API)"]
        R[chi Router]
        MW[Middleware: Recover → Logger → Auth → RBAC]
        H[Handlers]
        S[Services]
        REPO[Repository - sqlc]
    end

    subgraph AdminExe["admin.exe (CLI)"]
        CMD[createsuperuser / reset-password]
        AREPO[Repository - shared]
    end

    DB[(PostgreSQL)]

    SW --> R
    PM --> R
    R --> MW --> H --> S --> REPO --> DB
    CMD --> AREPO --> DB
```

**Modular monolith** — one deployable service (`main.exe`) plus a separate privileged
CLI (`admin.exe`). Dependencies point inward: `handler → service → repository → Postgres`.
The service layer owns transaction boundaries and business rules.

## Database Design

```mermaid
erDiagram
    DEPARTMENTS ||--o{ EMPLOYEES : "has"
    ROLES ||--o{ EMPLOYEE_ROLES : "assigned via"
    EMPLOYEES ||--o{ EMPLOYEE_ROLES : "has history of"
    EMPLOYEES ||--o{ SHIFT_ASSIGNMENTS : "assigned to"
    SHIFTS ||--o{ SHIFT_ASSIGNMENTS : "template for"
    SHIFT_ASSIGNMENTS ||--|| ATTENDANCE : "recorded as"
    EMPLOYEES ||--o| USERS : "may have login"
    USERS ||--o{ AUDIT_LOGS : "performs"
```

9 tables. Key design choices:

- **Role history** — `employee_roles` is effective-dated (not a mutable column), so
  "who held what role when" is answerable. A partial unique index enforces exactly
  one current role per employee at the DB level.
- **Attendance tied to assignments** — attendance always references a
  `shift_assignment` (not directly employee+date), enabling the shift coverage report
  to detect "assigned but never checked in" — a case a naive query on `attendance`
  alone would miss.
- **Audit trail** — append-only `audit_logs` with JSONB before/after snapshots,
  written atomically inside the same transaction as the mutation.

## Key Decisions

| Decision | Rationale |
|---|---|
| **sqlc over ORM** | Full control over non-trivial report queries; compile-time-checked SQL, no hidden N+1s. |
| **Separate admin.exe** | The only way to mint a `super_admin` is via CLI with DB access — the API explicitly rejects creating/promoting to `super_admin`. |
| **Audit in service layer** | Captures true before/after domain state, not just the raw HTTP request body. Commits atomically with the mutation. |
| **No microservices** | One database, one service — matches the actual scale. A message queue would be unjustified. |

## Running Locally

### Option A — Docker Compose (recommended)

```bash
cd Backend
cp .env.example .env
docker compose up --build          # starts Postgres + API, runs migrations on startup

# In another terminal — create the first superadmin (one-time)
docker compose run --rm admin createsuperuser

# Open Swagger UI
open http://localhost:8080/docs
```

### Option B — Without Docker

**Prerequisites:** Go 1.22+, PostgreSQL 16+

```bash
# 1. Create the database and role
psql -U postgres -h localhost -c "CREATE ROLE hotel WITH LOGIN PASSWORD 'hotel';"
psql -U postgres -h localhost -c "CREATE DATABASE hotel_ems OWNER hotel;"

# 2. Run the migration
psql -U hotel -h localhost -d hotel_ems -f Backend/migrations/001_init.sql

# 3. Configure and run
cd Backend
cp .env.example .env               # edit DATABASE_URL if your Postgres is different
make run                           # API starts on :8080

# 4. Create the first superadmin (one-time)
go run ./cmd/admin createsuperuser
```

## API Endpoints

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh` |
| Employees | `GET/POST /employees`, `GET/PUT/DELETE /employees/{id}` |
| Departments | `GET/POST /departments`, `GET/PUT/DELETE /departments/{id}` |
| Roles | `GET/POST /roles`, `GET/PUT/DELETE /roles/{id}` |
| Shifts | `GET/POST /shifts`, `GET/PUT/DELETE /shifts/{id}` |
| Shift Assignments | `GET/POST /shift-assignments`, `DELETE /shift-assignments/{id}` |
| Attendance | `POST /attendance/check-in`, `POST /attendance/check-out` |
| Reports | `GET /reports/attendance-summary`, `GET /reports/department-staffing`, `GET /reports/shift-coverage-gaps` |
| Users | `GET/POST /users`, `GET/PUT/DELETE /users/{id}` *(super_admin only)* |
| Audit Logs | `GET /audit-logs` *(super_admin + hr_manager)* |

Full contract: `openapi/openapi.yaml` — browsable at `/docs` when the API is running.

## Reports

Three report endpoints. The shift-coverage-gap report is the non-trivial one — it
combines a generated date series with an anti-join to surface:

- **NO_STAFF_ASSIGNED** — a shift template with zero employees assigned
- **FULL_NO_SHOW** — everyone assigned was absent
- **PARTIAL_COVERAGE** — some assigned employees showed, some didn't

A naive `SELECT * FROM attendance WHERE status='absent'` would miss the case where
**no attendance row exists at all**.

## Project Structure

```
cmd/api/         → HTTP server entrypoint
cmd/admin/       → CLI entrypoint (createsuperuser, reset-password, list-users)
internal/
  config/        → env loading
  db/            → connection pool + sqlc generated code
  domain/        → entities, enums, repository interfaces (ports)
  repository/    → sqlc-backed implementations
  service/       → business rules + transaction boundaries
  handler/       → HTTP handlers + request/response DTOs
  middleware/    → auth, RBAC, logger, recover
  audit/         → audit log writer
  auth/          → JWT + bcrypt
migrations/      → goose SQL migrations
openapi/         → OpenAPI 3.0 spec
Docs/            → PRD, SDD, ARCHITECTURE, APP_FLOW, diagrams
```

## Documentation

| Doc | Description |
|---|---|
| [PRD](Docs/PRD.md) | Product requirements and scope |
| [SDD](Docs/SDD.md) | Software design — data model, API surface, reports, auth |
| [ARCHITECTURE](Docs/ARCHITECTURE.md) | Why the layers exist, transaction boundaries, security |
| [APP_FLOW](Docs/APP_FLOW.md) | Sequence diagrams for key flows |
