# Hotel Employee Management System

A small, cleanly-layered backend for managing hotel staff: employees, departments,
roles, shifts, and attendance — with real RBAC, audit logging, and a CLI-only
superadmin bootstrap tool, in Go.

Full design docs: [`docs/PRD.md`](docs/PRD.md) · [`docs/SDD.md`](docs/SDD.md) ·
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/APP_FLOW.md`](docs/APP_FLOW.md) ·
diagrams in [`docs/diagrams/`](docs/diagrams/).

## Stack
Go 1.22 · chi (router) · sqlc (typed SQL) · goose (migrations) · PostgreSQL 16 ·
JWT + bcrypt (auth) · OpenAPI 3.0 + Swagger UI (docs).

## Architecture in one paragraph
A modular monolith, not microservices: one Postgres database, one HTTP service
(`main.exe`), and a separate privileged CLI (`admin.exe`) that talks to the
database directly and never binds a network port. Requests flow
`handler → service → repository (sqlc) → Postgres`; the service layer owns
transaction boundaries and business rules, so e.g. reassigning an employee's
role (closing the old `employee_roles` row, opening a new one, and writing the
audit log) happens atomically. See `docs/ARCHITECTURE.md` for the full rationale.

## Database design in one paragraph
Nine tables. Role assignment is modeled as history (`employee_roles`, effective
dated), not a single mutable column, so "who held what role when" is answerable
and a partial unique index enforces exactly one current role per employee at the
DB level. Attendance is always tied to a `shift_assignment` (not directly to an
employee+date), which is what makes the shift-coverage report able to detect
"assigned but never checked in" — a case a naive query on `attendance` alone
would miss. Full DDL and rationale in `docs/SDD.md` §4.

## Key decisions (see docs for full reasoning)
- **No microservices.** One database, one service — matches the actual scale of
  the problem; a message queue or separate services would be unjustified.
- **sqlc over an ORM.** Full control over the non-trivial report queries;
  compile-time-checked SQL, no hidden N+1s.
- **admin.exe is a separate binary**, not an API endpoint or seed script — the
  only way to mint a `super_admin` account is via `admin.exe createsuperuser`,
  run on the host/container with DB access. The `users` API endpoint explicitly
  refuses to create or promote to `super_admin`, even for an authenticated
  super_admin caller.
- **Audit logging lives in the service layer**, not generic HTTP middleware, so
  it captures real before/after domain state and commits atomically with the
  mutation it's logging.

## Project layout
```
cmd/api/       → main.exe entrypoint
cmd/admin/     → admin.exe entrypoint
internal/      → config, db(sqlc), domain, repository, service, handler, middleware, audit, auth
migrations/    → goose SQL migrations
openapi/       → openapi.yaml (Swagger UI served from /docs)
docs/          → PRD, SDD, ARCHITECTURE, APP_FLOW, diagrams
```

## Running it locally

**Prerequisites:** Docker + Docker Compose, Go 1.22+ (only needed if you want to
run outside Docker), `sqlc` and `goose` CLIs (only needed if you change queries
or migrations — the generated code / applied schema is checked in / applied on
container start).

```bash
# 1. copy env
cp .env.example .env

# 2. start Postgres + API (migrations run automatically on API startup)
docker compose up --build

# 3. in another shell, create the first superadmin (one-time)
docker compose run --rm admin createsuperuser --username admin --email admin@hotel.com

# 4. open Swagger UI
open http://localhost:8080/docs

# 5. log in to get a token
curl -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"<the password you set>"}'
```

**Running tests**
```bash
go test ./...                 # unit tests (service layer, mocked repos)
go test ./internal/repository/... -tags=integration   # needs a live test DB
```

**Regenerating sqlc code / adding a migration**
```bash
goose -dir migrations postgres "$DATABASE_URL" create add_something sql
sqlc generate
```

## API reference
Full contract in `openapi/openapi.yaml`, browsable at `/docs` once the service
is running. Summary table in `docs/SDD.md` §5.

## Reports
Three report endpoints ship with this system; the shift-coverage-gap report
(`GET /reports/shift-coverage-gaps`) is the one worth reading closely — it
combines a generated date series with an anti-join to surface shifts with zero
staff assigned *and* shifts where everyone assigned no-showed, which a simple
filter on the `attendance` table alone cannot detect. Query + explanation in
`docs/SDD.md` §6.3.
