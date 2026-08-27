package service

import (
	"context"

	"github.com/hotel-ems/internal/audit"
	"github.com/hotel-ems/internal/domain"
)

type RoleService struct {
	repo        domain.RoleRepo
	auditWriter *audit.Writer
}

func NewRoleService(repo domain.RoleRepo, auditWriter *audit.Writer) *RoleService {
	return &RoleService{repo: repo, auditWriter: auditWriter}
}

func (s *RoleService) Create(ctx context.Context, name, description string, actorUserID int64) (*domain.Role, error) {
	role, err := s.repo.Create(ctx, name, description)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "CREATE", "role", &role.ID, nil, role, nil)
	return role, nil
}

func (s *RoleService) GetByID(ctx context.Context, id int64) (*domain.Role, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *RoleService) List(ctx context.Context) ([]domain.Role, error) {
	return s.repo.List(ctx)
}

func (s *RoleService) Update(ctx context.Context, id int64, name, description *string, actorUserID int64) (*domain.Role, error) {
	before, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	role, err := s.repo.Update(ctx, id, name, description)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "UPDATE", "role", &role.ID, before, role, nil)
	return role, nil
}

func (s *RoleService) Delete(ctx context.Context, id int64, actorUserID int64) error {
	before, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "DELETE", "role", &id, before, nil, nil)
	return nil
}
