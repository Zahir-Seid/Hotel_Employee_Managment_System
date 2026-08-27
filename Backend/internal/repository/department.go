package repository

import (
	"context"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type departmentRepo struct {
	q *sqlc.Queries
}

func NewDepartmentRepo(q *sqlc.Queries) domain.DepartmentRepo {
	return &departmentRepo{q: q}
}

func mapDepartment(d sqlc.Department) *domain.Department {
	return &domain.Department{
		ID:          d.ID,
		Name:        d.Name,
		Description: d.Description,
		CreatedAt:   d.CreatedAt,
		UpdatedAt:   d.UpdatedAt,
	}
}

func (r *departmentRepo) Create(ctx context.Context, name, description string) (*domain.Department, error) {
	row, err := r.q.CreateDepartment(ctx, sqlc.CreateDepartmentParams{
		Name:        name,
		Description: strPtr(description),
	})
	if err != nil {
		return nil, err
	}
	return mapDepartment(row), nil
}

func (r *departmentRepo) GetByID(ctx context.Context, id int64) (*domain.Department, error) {
	row, err := r.q.GetDepartment(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapDepartment(row), nil
}

func (r *departmentRepo) List(ctx context.Context) ([]domain.Department, error) {
	rows, err := r.q.ListDepartments(ctx)
	if err != nil {
		return nil, err
	}
	var result []domain.Department
	for _, r := range rows {
		result = append(result, *mapDepartment(r))
	}
	return result, nil
}

func (r *departmentRepo) Update(ctx context.Context, id int64, name, description *string) (*domain.Department, error) {
	row, err := r.q.UpdateDepartment(ctx, sqlc.UpdateDepartmentParams{
		Name:        name,
		Description: description,
		ID:          id,
	})
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapDepartment(row), nil
}

func (r *departmentRepo) Delete(ctx context.Context, id int64) error {
	err := r.q.DeleteDepartment(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return domain.ErrNotFound
		}
		return err
	}
	return nil
}
