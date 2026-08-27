package service

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/audit"
	"github.com/hotel-ems/internal/domain"
)

type ShiftService struct {
	repo        domain.ShiftRepo
	auditWriter *audit.Writer
}

func NewShiftService(repo domain.ShiftRepo, auditWriter *audit.Writer) *ShiftService {
	return &ShiftService{repo: repo, auditWriter: auditWriter}
}

func (s *ShiftService) Create(ctx context.Context, name string, startTime, endTime time.Time, actorUserID int64) (*domain.Shift, error) {
	shift, err := s.repo.Create(ctx, name, startTime, endTime)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "CREATE", "shift", &shift.ID, nil, shift, nil)
	return shift, nil
}

func (s *ShiftService) GetByID(ctx context.Context, id int64) (*domain.Shift, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ShiftService) List(ctx context.Context) ([]domain.Shift, error) {
	return s.repo.List(ctx)
}

func (s *ShiftService) Update(ctx context.Context, id int64, name *string, startTime, endTime *time.Time, actorUserID int64) (*domain.Shift, error) {
	before, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	shift, err := s.repo.Update(ctx, id, name, startTime, endTime)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "UPDATE", "shift", &shift.ID, before, shift, nil)
	return shift, nil
}

func (s *ShiftService) Delete(ctx context.Context, id int64, actorUserID int64) error {
	before, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "DELETE", "shift", &id, before, nil, nil)
	return nil
}
