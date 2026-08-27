# ARCHITECTURE — Hotel Employee Management System

This complements the SDD with the *why* behind the structure: dependency direction,
transaction boundaries, error handling, and testing strategy — the things that
distinguish a layered monolith from a pile of handlers calling SQL.

## 1. Style: Modular Monolith, Layered
One deployable service (plus the ops CLI), four logical layers, dependencies point
inward only:

```
handler  →  service  →  repository (sqlc)  →  postgres
   ↑            ↑
  DTOs      domain types (no framework types leak past the service boundary)
```

- **handler**: HTTP concerns only — decode request, call service, encode response,
  map domain errors → HTTP status codes. No SQL, no business rules.
- **service**: business rules and transaction boundaries. E.g. "reassigning a role"
  is one service call that (a) closes the current `employee_roles` row, (b) opens
  a new one, (c) writes the audit log — all in one DB transaction.
- **repository**: thin wrapper around sqlc-generated queries, implements interfaces
  defined in `domain` so services depend on an interface, not on sqlc directly
  (keeps services testable with a mock repository).
- **domain**: plain Go structs/enums + repository interfaces. No sqlc types here —
  repository layer maps sqlc rows → domain structs, so a future storage swap
  wouldn't ripple into business logic.

Why not a "fat handler" tutorial style: it works for a demo but hides the two things
this challenge is actually testing — relationship integrity and a real report query.
Why not full hexagonal/DDD with aggregates and domain events: unjustified ceremony
for 9 tables and 3 reports; would read as over-engineering, not seniority.

## 2. Cross-Cutting Concerns

### Transactions
Any service method that writes to more than one table (role reassignment,
attendance recording + audit) opens a single `pgx.Tx`, passes it through the
repository calls, and commits once. Repository methods accept a `Querier`
interface (sqlc supports this natively) so the same method works inside or
outside a transaction.

### Error handling
Domain-level sentinel errors (`ErrNotFound`, `ErrConflict`, `ErrInvalidState`)
defined in `internal/domain/errors.go`. The handler layer's single error-mapping
function translates these to HTTP codes (404/409/422), so handlers never write
`http.Error` ad hoc — one place to keep the API's error shape consistent.

### Audit logging
Implemented as a service-layer concern (see SDD §8), not a generic HTTP middleware
that just logs the request body — that would miss the actual before/after domain
state and couldn't be trusted for compliance-style reporting.

### AuthN/AuthZ
JWT validation is middleware; role-gating is a small `RequireRole(...roles)`
middleware factory applied per-route in the router setup — visible at a glance
in `cmd/api/main.go` which routes need which role, rather than buried in handler
bodies.

### Config
One `config.Load()` reads env vars into a typed struct, used identically by
`main.exe` and `admin.exe` — this is *why* they can share a DB connection setup
without duplicating logic, while `admin.exe` never imports `net/http` or the
handler/middleware packages at all.

## 3. Deployment View
Single Postgres container + single Go binary container (or two, since `admin.exe`
is normally run as a one-off `docker compose run admin ...`, not a long-lived
process). No load balancer, no service mesh, no queue — a hotel's employee
roster does not need horizontal scaling, and pretending otherwise would be the
over-engineering failure mode.

```
docker-compose.yml
  ├─ postgres:16        (volume-backed)
  └─ api (main.exe)     (depends_on postgres, runs goose up on start)

admin.exe is invoked ad hoc: `docker compose run --rm admin createsuperuser ...`
```

## 4. Testing Strategy (proportional to scope)
- **Repository**: integration tests against a real Postgres (testcontainers or a
  docker-compose test DB), because the whole point of this layer is the SQL.
- **Service**: unit tests with a mocked repository interface, focused on the
  business rules that aren't obvious from the schema — e.g. role reassignment
  correctly closes the previous `employee_roles` row.
- **Handler**: a handful of `httptest` request/response tests for auth/RBAC
  behavior (401 vs 403) and error-code mapping.
- Not pursued: exhaustive e2e/UI tests — no UI in scope, and full e2e would be
  disproportionate to a 1-day, backend-only challenge.

## 5. Security Notes
- Passwords: bcrypt, cost 12.
- JWT: short-lived access token + refresh token; secret from env, never hardcoded.
- SQL injection: not applicable by construction — sqlc generates parameterized
  queries only, no string concatenation anywhere in the codebase.
- Privilege escalation: the `users` handler explicitly rejects creating/promoting
  to `super_admin` via the API (see SDD §7) — the only way to mint one is
  `admin.exe`, which requires host/DB access, not network access.
- Audit trail: append-only `audit_logs`, no update/delete endpoint exposed for it.
