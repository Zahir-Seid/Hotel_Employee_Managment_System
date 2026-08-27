package service

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/domain"
)

type ReportService struct {
	repo domain.ReportRepo
}

func NewReportService(repo domain.ReportRepo) *ReportService {
	return &ReportService{repo: repo}
}

func (s *ReportService) MonthlyAttendanceSummary(ctx context.Context, from, to time.Time) ([]domain.MonthlyAttendanceSummary, error) {
	return s.repo.MonthlyAttendanceSummary(ctx, from, to)
}

func (s *ReportService) DepartmentStaffing(ctx context.Context) ([]domain.DepartmentStaffing, error) {
	return s.repo.DepartmentStaffing(ctx)
}

func (s *ReportService) ShiftCoverageGaps(ctx context.Context, from, to time.Time) ([]domain.ShiftCoverageGap, error) {
	return s.repo.ShiftCoverageGaps(ctx, from, to)
}
