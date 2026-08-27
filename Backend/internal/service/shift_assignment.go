package service

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/audit"
	"github.com/hotel-ems/internal/domain"
)

type ShiftAssignmentService struct {
	repo        domain.ShiftAssignmentRepo
	auditWriter *audit.Writer
}

func NewShiftAssignmentService(repo domain.ShiftAssignmentRepo, auditWriter *audit.Writer) *ShiftAssignmentService {
	return &ShiftAssignmentService{repo: repo, auditWriter: auditWriter}
}

func (s *ShiftAssignmentService) Create(ctx context.Context, employeeID, shiftID int64, workDate time.Time, createdBy int64) (*domain.ShiftAssignment, error) {
	// Check for duplicate assignment on same day
	if existing, err := s.repo.GetByEmployeeAndDate(ctx, employeeID, workDate); err == nil && existing != nil {
		return nil, domain.ErrConflict
	}
	cb := &createdBy
	sa, err := s.repo.Create(ctx, employeeID, shiftID, workDate, cb)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, cb, "CREATE", "shift_assignment", &sa.ID, nil, sa, nil)
	return sa, nil
}

func (s *ShiftAssignmentService) GetByID(ctx context.Context, id int64) (*domain.ShiftAssignment, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ShiftAssignmentService) List(ctx context.Context, employeeID, shiftID *int64, from, to *time.Time) ([]domain.ShiftAssignment, error) {
	return s.repo.List(ctx, employeeID, shiftID, from, to)
}

func (s *ShiftAssignmentService) Delete(ctx context.Context, id int64, actorUserID int64) error {
	before, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	_ = s.auditWriter.Write(ctx, &actorUserID, "DELETE", "shift_assignment", &id, before, nil, nil)
	return nil
}
