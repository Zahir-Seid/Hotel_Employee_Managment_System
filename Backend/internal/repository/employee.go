package repository

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type employeeRepo struct {
	q *sqlc.Queries
}

func NewEmployeeRepo(q *sqlc.Queries) domain.EmployeeRepo {
	return &employeeRepo{q: q}
}

func mapEmployee(e sqlc.Employee) *domain.Employee {
	return &domain.Employee{
		ID:           e.ID,
		EmployeeCode: e.EmployeeCode,
		FirstName:    e.FirstName,
		LastName:     e.LastName,
		Email:        e.Email,
		Phone:        e.Phone,
		DepartmentID: e.DepartmentID,
		HireDate:     e.HireDate,
		Status:       domain.EmployeeStatus(e.Status),
		CreatedAt:    e.CreatedAt,
		UpdatedAt:    e.UpdatedAt,
	}
}

func (r *employeeRepo) Create(ctx context.Context, code, firstName, lastName, email, phone string, deptID *int64, hireDate time.Time, status domain.EmployeeStatus) (*domain.Employee, error) {
	row, err := r.q.CreateEmployee(ctx, sqlc.CreateEmployeeParams{
		EmployeeCode: code,
		FirstName:    firstName,
		LastName:     lastName,
		Email:        email,
		Phone:        strPtr(phone),
		DepartmentID: deptID,
		HireDate:     hireDate,
		Status:       sqlc.EmployeeStatus(status),
	})
	if err != nil {
		if isConflict(err) {
			return nil, domain.ErrConflict
		}
		return nil, err
	}
	return mapEmployee(row), nil
}

func (r *employeeRepo) GetByID(ctx context.Context, id int64) (*domain.Employee, error) {
	row, err := r.q.GetEmployee(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapEmployee(row), nil
}

func (r *employeeRepo) GetByEmail(ctx context.Context, email string) (*domain.Employee, error) {
	row, err := r.q.GetEmployeeByEmail(ctx, email)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapEmployee(row), nil
}

func (r *employeeRepo) List(ctx context.Context, departmentID *int64, status *domain.EmployeeStatus) ([]domain.Employee, error) {
	var s *sqlc.EmployeeStatus
	if status != nil {
		t := sqlc.EmployeeStatus(*status)
		s = &t
	}
	rows, err := r.q.ListEmployees(ctx, sqlc.ListEmployeesParams{
		DepartmentID: departmentID,
		Status:       s,
	})
	if err != nil {
		return nil, err
	}
	var result []domain.Employee
	for _, r := range rows {
		result = append(result, *mapEmployee(r))
	}
	return result, nil
}

func (r *employeeRepo) Update(ctx context.Context, id int64, updates map[string]interface{}) (*domain.Employee, error) {
	params := sqlc.UpdateEmployeeParams{ID: id}
	if v, ok := updates["employee_code"]; ok {
		s := v.(string)
		params.EmployeeCode = &s
	}
	if v, ok := updates["first_name"]; ok {
		s := v.(string)
		params.FirstName = &s
	}
	if v, ok := updates["last_name"]; ok {
		s := v.(string)
		params.LastName = &s
	}
	if v, ok := updates["email"]; ok {
		s := v.(string)
		params.Email = &s
	}
	if v, ok := updates["phone"]; ok {
		s := v.(string)
		params.Phone = &s
	}
	if v, ok := updates["department_id"]; ok {
		s := v.(int64)
		params.DepartmentID = &s
	}
	if v, ok := updates["hire_date"]; ok {
		s := v.(time.Time)
		params.HireDate = &s
	}
	if v, ok := updates["status"]; ok {
		s := sqlc.EmployeeStatus(v.(domain.EmployeeStatus))
		params.Status = &s
	}
	row, err := r.q.UpdateEmployee(ctx, params)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		if isConflict(err) {
			return nil, domain.ErrConflict
		}
		return nil, err
	}
	return mapEmployee(row), nil
}

func (r *employeeRepo) UpdateDepartment(ctx context.Context, employeeID, departmentID int64) error {
	err := r.q.UpdateEmployeeDepartment(ctx, departmentID, employeeID)
	if err != nil {
		return err
	}
	return nil
}

func (r *employeeRepo) Delete(ctx context.Context, id int64) error {
	err := r.q.DeleteEmployee(ctx, id)
	if err != nil {
		return err
	}
	return nil
}
