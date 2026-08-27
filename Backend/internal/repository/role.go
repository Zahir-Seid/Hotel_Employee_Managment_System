package repository

import (
	"context"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type roleRepo struct {
	q *sqlc.Queries
}

func NewRoleRepo(q *sqlc.Queries) domain.RoleRepo {
	return &roleRepo{q: q}
}

func mapRole(r sqlc.Role) *domain.Role {
	return &domain.Role{
		ID:          r.ID,
		Name:        r.Name,
		Description: r.Description,
		CreatedAt:   r.CreatedAt,
		UpdatedAt:   r.UpdatedAt,
	}
}

func (r *roleRepo) Create(ctx context.Context, name, description string) (*domain.Role, error) {
	row, err := r.q.CreateRole(ctx, sqlc.CreateRoleParams{
		Name:        name,
		Description: strPtr(description),
	})
	if err != nil {
		return nil, err
	}
	return mapRole(row), nil
}

func (r *roleRepo) GetByID(ctx context.Context, id int64) (*domain.Role, error) {
	row, err := r.q.GetRole(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapRole(row), nil
}

func (r *roleRepo) List(ctx context.Context) ([]domain.Role, error) {
	rows, err := r.q.ListRoles(ctx)
	if err != nil {
		return nil, err
	}
	var result []domain.Role
	for _, r := range rows {
		result = append(result, *mapRole(r))
	}
	return result, nil
}

func (r *roleRepo) Update(ctx context.Context, id int64, name, description *string) (*domain.Role, error) {
	row, err := r.q.UpdateRole(ctx, sqlc.UpdateRoleParams{
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
	return mapRole(row), nil
}

func (r *roleRepo) Delete(ctx context.Context, id int64) error {
	err := r.q.DeleteRole(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return domain.ErrNotFound
		}
		return err
	}
	return nil
}
