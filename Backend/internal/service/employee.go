package service

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/audit"
	"github.com/hotel-ems/internal/db/sqlc"
	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/repository"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EmployeeService struct {
	db              *pgxpool.Pool
	employeeRepo    domain.EmployeeRepo
	employeeRoleRepo domain.EmployeeRoleRepo
	roleRepo        domain.RoleRepo
	deptRepo        domain.DepartmentRepo
	auditWriter     *audit.Writer
}

func NewEmployeeService(
	db *pgxpool.Pool,
	employeeRepo domain.EmployeeRepo,
	employeeRoleRepo domain.EmployeeRoleRepo,
	roleRepo domain.RoleRepo,
	deptRepo domain.DepartmentRepo,
	auditWriter *audit.Writer,
) *EmployeeService {
	return &EmployeeService{
		db:              db,
		employeeRepo:    employeeRepo,
		employeeRoleRepo: employeeRoleRepo,
		roleRepo:        roleRepo,
		deptRepo:        deptRepo,
		auditWriter:     auditWriter,
	}
}

func (s *EmployeeService) Create(ctx context.Context, code, firstName, lastName, email, phone string, deptID *int64, hireDate time.Time, status domain.EmployeeStatus, actorUserID int64) (*domain.Employee, error) {
	emp, err := s.employeeRepo.Create(ctx, code, firstName, lastName, email, phone, deptID, hireDate, status)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "CREATE", "employee", &emp.ID, nil, emp, nil)
	return emp, nil
}

func (s *EmployeeService) GetByID(ctx context.Context, id int64) (*domain.Employee, error) {
	emp, err := s.employeeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	// Load department
	if emp.DepartmentID != nil {
		dept, _ := s.deptRepo.GetByID(ctx, *emp.DepartmentID)
		emp.Department = dept
	}
	// Load current role
	if er, err := s.employeeRoleRepo.GetCurrentByEmployee(ctx, id); err == nil {
		if role, err := s.roleRepo.GetByID(ctx, er.RoleID); err == nil {
			er.Role = role
			emp.CurrentRole = role
		}
	}
	return emp, nil
}

func (s *EmployeeService) List(ctx context.Context, departmentID *int64, status *domain.EmployeeStatus) ([]domain.Employee, error) {
	return s.employeeRepo.List(ctx, departmentID, status)
}

func (s *EmployeeService) Update(ctx context.Context, id int64, updates map[string]interface{}, actorUserID int64) (*domain.Employee, error) {
	before, err := s.employeeRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	emp, err := s.employeeRepo.Update(ctx, id, updates)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "UPDATE", "employee", &emp.ID, before, emp, nil)
	return emp, nil
}

func (s *EmployeeService) UpdateDepartment(ctx context.Context, employeeID, departmentID int64, actorUserID int64) error {
	before, err := s.employeeRepo.GetByID(ctx, employeeID)
	if err != nil {
		return err
	}
	if err := s.employeeRepo.UpdateDepartment(ctx, employeeID, departmentID); err != nil {
		return err
	}
	after, _ := s.employeeRepo.GetByID(ctx, employeeID)
	_ = s.auditWriter.Write(ctx, &actorUserID, "UPDATE", "employee", &employeeID, before, after, nil)
	return nil
}

func (s *EmployeeService) ReassignRole(ctx context.Context, employeeID, newRoleID int64, actorUserID int64) (*domain.Employee, error) {
	// Validate employee exists
	if _, err := s.employeeRepo.GetByID(ctx, employeeID); err != nil {
		return nil, err
	}
	// Validate role exists
	if _, err := s.roleRepo.GetByID(ctx, newRoleID); err != nil {
		return nil, err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Create transactional repo instances
	txQueries := sqlc.New(tx)
	txEmpRoleRepo := repository.NewEmployeeRoleRepo(txQueries)

	// Get current role for audit "before" snapshot
	var beforeRole *domain.EmployeeRole
	if current, err := txEmpRoleRepo.GetCurrentByEmployee(ctx, employeeID); err == nil {
		beforeRole = current
	}

	// Close current role (inside tx)
	if beforeRole != nil {
		if err := txEmpRoleRepo.CloseCurrentRole(ctx, employeeID, time.Now()); err != nil {
			return nil, err
		}
	}

	// Insert new role (inside tx)
	newER, err := txEmpRoleRepo.InsertRole(ctx, employeeID, newRoleID, time.Now())
	if err != nil {
		return nil, err
	}

	// Audit log inside tx
	beforeSnap := map[string]any{"employee_id": employeeID}
	if beforeRole != nil {
		beforeSnap["role_id"] = beforeRole.RoleID
	}
	afterSnap := map[string]any{"employee_id": employeeID, "role_id": newRoleID}
	_ = s.auditWriter.Write(ctx, &actorUserID, "UPDATE", "employee_role", &newER.ID, beforeSnap, afterSnap, nil)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	// Reload employee with new role
	return s.GetByID(ctx, employeeID)
}

func (s *EmployeeService) Delete(ctx context.Context, id int64, actorUserID int64) error {
	before, err := s.employeeRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.employeeRepo.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "DELETE", "employee", &id, before, nil, nil)
	return nil
}
