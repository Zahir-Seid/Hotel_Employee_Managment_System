package repository

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type employeeRoleRepo struct {
	q *sqlc.Queries
}

func NewEmployeeRoleRepo(q *sqlc.Queries) domain.EmployeeRoleRepo {
	return &employeeRoleRepo{q: q}
}

func mapEmployeeRole(er sqlc.EmployeeRole) *domain.EmployeeRole {
	return &domain.EmployeeRole{
		ID:            er.ID,
		EmployeeID:    er.EmployeeID,
		RoleID:        er.RoleID,
		EffectiveFrom: er.EffectiveFrom,
		EffectiveTo:   er.EffectiveTo,
		CreatedAt:     er.CreatedAt,
	}
}

func (r *employeeRoleRepo) GetCurrentByEmployee(ctx context.Context, employeeID int64) (*domain.EmployeeRole, error) {
	row, err := r.q.GetCurrentEmployeeRole(ctx, employeeID)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapEmployeeRole(row), nil
}

func (r *employeeRoleRepo) CloseCurrentRole(ctx context.Context, employeeID int64, effectiveTo time.Time) error {
	return r.q.CloseCurrentEmployeeRole(ctx, effectiveTo, employeeID)
}

func (r *employeeRoleRepo) InsertRole(ctx context.Context, employeeID, roleID int64, effectiveFrom time.Time) (*domain.EmployeeRole, error) {
	row, err := r.q.InsertEmployeeRole(ctx, sqlc.InsertEmployeeRoleParams{
		EmployeeID:    employeeID,
		RoleID:        roleID,
		EffectiveFrom: effectiveFrom,
	})
	if err != nil {
		return nil, err
	}
	return mapEmployeeRole(row), nil
}

func (r *employeeRoleRepo) ListByEmployee(ctx context.Context, employeeID int64) ([]domain.EmployeeRole, error) {
	rows, err := r.q.ListEmployeeRoles(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	var result []domain.EmployeeRole
	for _, r := range rows {
		result = append(result, *mapEmployeeRole(r))
	}
	return result, nil
}
