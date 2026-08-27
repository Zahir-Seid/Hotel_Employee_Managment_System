package service

import (
	"context"

	"github.com/hotel-ems/internal/audit"
	"github.com/hotel-ems/internal/domain"
)

type DepartmentService struct {
	repo        domain.DepartmentRepo
	auditWriter *audit.Writer
}

func NewDepartmentService(repo domain.DepartmentRepo, auditWriter *audit.Writer) *DepartmentService {
	return &DepartmentService{repo: repo, auditWriter: auditWriter}
}

func (s *DepartmentService) Create(ctx context.Context, name, description string, actorUserID int64) (*domain.Department, error) {
	dept, err := s.repo.Create(ctx, name, description)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "CREATE", "department", &dept.ID, nil, dept, nil)
	return dept, nil
}

func (s *DepartmentService) GetByID(ctx context.Context, id int64) (*domain.Department, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *DepartmentService) List(ctx context.Context) ([]domain.Department, error) {
	return s.repo.List(ctx)
}

func (s *DepartmentService) Update(ctx context.Context, id int64, name, description *string, actorUserID int64) (*domain.Department, error) {
	before, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	dept, err := s.repo.Update(ctx, id, name, description)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "UPDATE", "department", &dept.ID, before, dept, nil)
	return dept, nil
}

func (s *DepartmentService) Delete(ctx context.Context, id int64, actorUserID int64) error {
	before, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "DELETE", "department", &id, before, nil, nil)
	return nil
}
