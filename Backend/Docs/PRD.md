# PRD — Hotel Employee Management System (HEMS)

## 1. Purpose
A small, well-architected backend system that manages hotel staff: who they are, what
department/role they belong to, what shifts they work, and whether they showed up.
Built to demonstrate senior-level judgment on a small problem — correct data modeling,
clean layering, real auth/audit concerns, and one genuinely useful report — rather than
breadth of features.

## 2. Scope
**In scope**
- Employee CRUD
- Department CRUD + employee assignment
- Role CRUD + employee assignment (with history)
- Shift template CRUD + daily shift assignment
- Attendance recording (check-in/check-out, status)
- Reports (attendance summary, department staffing, shift coverage gaps)
- JWT-based API auth with RBAC (super_admin / hr_manager / staff)
- Audit logging of all mutating actions
- Superadmin bootstrap via a separate privileged executable (`admin.exe`)
- OpenAPI 3.0 spec + Swagger UI

**Out of scope (explicitly, to keep this "small" per the brief)**
- Payroll, leave management, scheduling optimization/AI rostering
- Multi-tenant / multi-hotel support
- Microservices, message queues, distributed transactions
- Mobile apps, real-time push (WebSocket presence, etc.)

## 3. Actors
| Role        | Description                                            | Can do |
|-------------|----------------------------------------------------------|--------|
| super_admin | Created only via `admin.exe`. Full system access.        | Everything, incl. managing users |
| hr_manager  | Day-to-day HR operator, created by super_admin via API.   | CRUD employees/departments/roles/shifts/attendance, view reports |
| staff       | An employee's own login (optional, stretch).              | View own profile, own attendance, own shifts |

## 4. Functional Requirements
1. CRUD employees (with department + current role visible on read).
2. Assign/reassign employee to a department.
3. Assign/reassign employee to a role, preserving history (who held what role, when).
4. Define shift templates (name, start/end time) and assign an employee to a shift on a given date.
5. Record attendance against a shift assignment (check-in/out time, computed status).
6. Reports:
   - Monthly attendance summary per employee (present/late/absent %).
   - Department staffing breakdown by current role.
   - Shift coverage gap report (assigned-but-no-show detection).
7. Full OpenAPI-documented REST API, browsable via Swagger UI.
8. Every create/update/delete is captured in an audit log (actor, entity, before/after, timestamp).
9. Super admin account cannot be created through the API — only through `admin.exe`.

## 5. Non-Functional Requirements
- **Correctness over cleverness**: no distributed system, one Postgres instance, ACID transactions where it matters (e.g. attendance write + audit write).
- **Runs locally in minutes**: `docker-compose up`, one `.env`, `goose` migrations, `make run`.
- **Traceable**: every mutation attributable to a user, with audit trail.
- **Documented**: OpenAPI spec is the source of truth for the HTTP contract; this doc set is the source of truth for design intent.

## 6. Success Criteria (mapping back to the challenge brief)
- Proper relational modeling across employees/departments/roles/shifts/attendance
- At least one non-trivial report (we ship three, one is genuinely non-trivial — see SDD section on reports)
- README covers architecture, DB design, decisions, run instructions
- Technology choices are modern, intentional, and justified (Go, chi, sqlc, goose, OpenAPI)
