-- +goose Up
-- +goose StatementBegin

CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'half_day');
CREATE TYPE user_role AS ENUM ('super_admin', 'hr_manager', 'staff');

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
    effective_to   DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one current role per employee at the DB level
CREATE UNIQUE INDEX ux_employee_roles_current
    ON employee_roles(employee_id) WHERE effective_to IS NULL;

CREATE TABLE shifts (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
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

-- Fix forward reference in shift_assignments
ALTER TABLE shift_assignments
    ADD CONSTRAINT fk_shift_assignments_created_by
    FOREIGN KEY (created_by) REFERENCES users(id);

CREATE TABLE audit_logs (
    id            BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action        TEXT NOT NULL,
    entity_type   TEXT NOT NULL,
    entity_id     BIGINT,
    before_data   JSONB,
    after_data    JSONB,
    ip_address    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX ix_audit_logs_created_at ON audit_logs(created_at);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS shift_assignments CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS employee_roles CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS attendance_status;
DROP TYPE IF EXISTS employee_status;

-- +goose StatementEnd
