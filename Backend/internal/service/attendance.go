package service

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/audit"
	"github.com/hotel-ems/internal/domain"
)

type AttendanceService struct {
	repo            domain.AttendanceRepo
	shiftAssignRepo domain.ShiftAssignmentRepo
	shiftRepo       domain.ShiftRepo
	auditWriter     *audit.Writer
}

func NewAttendanceService(
	repo domain.AttendanceRepo,
	shiftAssignRepo domain.ShiftAssignmentRepo,
	shiftRepo domain.ShiftRepo,
	auditWriter *audit.Writer,
) *AttendanceService {
	return &AttendanceService{
		repo:            repo,
		shiftAssignRepo: shiftAssignRepo,
		shiftRepo:       shiftRepo,
		auditWriter:     auditWriter,
	}
}

func (s *AttendanceService) CheckIn(ctx context.Context, shiftAssignmentID int64, checkInTime time.Time, recordedBy int64) (*domain.Attendance, error) {
	// Verify shift assignment exists
	sa, err := s.shiftAssignRepo.GetByID(ctx, shiftAssignmentID)
	if err != nil {
		return nil, err
	}

	// Check if already checked in
	existing, err := s.repo.GetByShiftAssignment(ctx, shiftAssignmentID)
	if err == nil && existing.CheckInTime != nil {
		return nil, domain.ErrInvalidState
	}

	// Get shift to determine lateness
	shift, err := s.shiftRepo.GetByID(ctx, sa.ShiftID)
	if err != nil {
		return nil, err
	}

	status := domain.AttendanceStatusPresent
	// Compare times (ignoring dates)
	if checkInTime.After(shift.StartTime) {
		status = domain.AttendanceStatusLate
	}

	// Single insert with check-in time
	result, err := s.repo.Create(ctx, shiftAssignmentID, &checkInTime, status, &recordedBy)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &recordedBy, "CREATE", "attendance", &result.ID, nil, result, nil)
	return result, nil
}

func (s *AttendanceService) CheckOut(ctx context.Context, shiftAssignmentID int64, checkOutTime time.Time, recordedBy int64) (*domain.Attendance, error) {
	att, err := s.repo.GetByShiftAssignment(ctx, shiftAssignmentID)
	if err != nil {
		return nil, err
	}
	if att.CheckInTime == nil {
		return nil, domain.ErrInvalidState
	}
	if att.CheckOutTime != nil {
		return nil, domain.ErrInvalidState
	}

	// Determine if half-day based on shift end time
	sa, err := s.shiftAssignRepo.GetByID(ctx, shiftAssignmentID)
	if err != nil {
		return nil, err
	}
	shift, err := s.shiftRepo.GetByID(ctx, sa.ShiftID)
	if err != nil {
		return nil, err
	}

	status := att.Status
	if checkOutTime.Before(shift.EndTime) {
		status = domain.AttendanceStatusHalfDay
	}

	result, err := s.repo.UpdateCheckOut(ctx, shiftAssignmentID, checkOutTime, status)
	if err != nil {
		return nil, err
	}
	_ = s.auditWriter.Write(ctx, &recordedBy, "UPDATE", "attendance", &result.ID, att, result, nil)
	return result, nil
}

func (s *AttendanceService) ListByEmployee(ctx context.Context, employeeID int64, from, to *time.Time) ([]domain.Attendance, error) {
	return s.repo.ListByEmployee(ctx, employeeID, from, to)
}
