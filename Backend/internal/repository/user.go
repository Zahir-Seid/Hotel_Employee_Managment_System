package repository

import (
	"context"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type userRepo struct {
	q *sqlc.Queries
}

func NewUserRepo(q *sqlc.Queries) domain.UserRepo {
	return &userRepo{q: q}
}

func mapUser(u sqlc.User) *domain.User {
	return &domain.User{
		ID:           u.ID,
		EmployeeID:   u.EmployeeID,
		Username:     u.Username,
		PasswordHash: u.PasswordHash,
		Role:         domain.UserRole(u.Role),
		IsActive:     u.IsActive,
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,
	}
}

func (r *userRepo) Create(ctx context.Context, employeeID *int64, username, passwordHash string, role domain.UserRole) (*domain.User, error) {
	row, err := r.q.CreateUser(ctx, sqlc.CreateUserParams{
		EmployeeID:   employeeID,
		Username:     username,
		PasswordHash: passwordHash,
		Role:         sqlc.UserRole(role),
		IsActive:     true,
	})
	if err != nil {
		if isConflict(err) {
			return nil, domain.ErrConflict
		}
		return nil, err
	}
	return mapUser(row), nil
}

func (r *userRepo) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	row, err := r.q.GetUser(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapUser(row), nil
}

func (r *userRepo) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	row, err := r.q.GetUserByUsername(ctx, username)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapUser(row), nil
}

func (r *userRepo) List(ctx context.Context) ([]domain.User, error) {
	rows, err := r.q.ListUsers(ctx)
	if err != nil {
		return nil, err
	}
	var result []domain.User
	for _, r := range rows {
		result = append(result, *mapUser(r))
	}
	return result, nil
}

func (r *userRepo) Update(ctx context.Context, id int64, updates map[string]interface{}) (*domain.User, error) {
	params := sqlc.UpdateUserParams{ID: id}
	if v, ok := updates["employee_id"]; ok {
		if v == nil {
			params.EmployeeID = nil
		} else {
			s := v.(int64)
			params.EmployeeID = &s
		}
	}
	if v, ok := updates["username"]; ok {
		s := v.(string)
		params.Username = &s
	}
	if v, ok := updates["password_hash"]; ok {
		s := v.(string)
		params.PasswordHash = &s
	}
	if v, ok := updates["role"]; ok {
		s := sqlc.UserRole(v.(domain.UserRole))
		params.Role = &s
	}
	if v, ok := updates["is_active"]; ok {
		s := v.(bool)
		params.IsActive = &s
	}
	row, err := r.q.UpdateUser(ctx, params)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		if isConflict(err) {
			return nil, domain.ErrConflict
		}
		return nil, err
	}
	return mapUser(row), nil
}

func (r *userRepo) Delete(ctx context.Context, id int64) error {
	return r.q.DeleteUser(ctx, id)
}
