package service

import (
	"context"

	"github.com/hotel-ems/internal/audit"
	"github.com/hotel-ems/internal/auth"
	"github.com/hotel-ems/internal/domain"
)

type UserService struct {
	repo        domain.UserRepo
	auditWriter *audit.Writer
}

func NewUserService(repo domain.UserRepo, auditWriter *audit.Writer) *UserService {
	return &UserService{repo: repo, auditWriter: auditWriter}
}

func (s *UserService) Create(ctx context.Context, employeeID *int64, username, password string, role domain.UserRole, actorUserID int64) (*domain.User, error) {
	// Explicitly reject super_admin via API
	if role == domain.UserRoleSuperAdmin {
		return nil, domain.ErrForbidden
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		return nil, err
	}
	user, err := s.repo.Create(ctx, employeeID, username, hash, role)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "CREATE", "user", &user.ID, nil, user, nil)
	return user, nil
}

func (s *UserService) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *UserService) List(ctx context.Context) ([]domain.User, error) {
	return s.repo.List(ctx)
}

func (s *UserService) Update(ctx context.Context, id int64, updates map[string]interface{}, actorUserID int64) (*domain.User, error) {
	// Reject role promotion to super_admin
	if r, ok := updates["role"]; ok {
		if r.(domain.UserRole) == domain.UserRoleSuperAdmin {
			return nil, domain.ErrForbidden
		}
	}
	before, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if password, ok := updates["password"]; ok {
		hash, err := auth.HashPassword(password.(string))
		if err != nil {
			return nil, err
		}
		updates["password_hash"] = hash
		delete(updates, "password")
	}
	user, err := s.repo.Update(ctx, id, updates)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "UPDATE", "user", &user.ID, before, user, nil)
	return user, nil
}

func (s *UserService) Delete(ctx context.Context, id int64, actorUserID int64) error {
	before, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if before.Role == domain.UserRoleSuperAdmin {
		return domain.ErrForbidden
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "DELETE", "user", &id, before, nil, nil)
	return nil
}
