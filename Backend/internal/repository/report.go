package repository

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type reportRepo struct {
	q *sqlc.Queries
}

func NewReportRepo(q *sqlc.Queries) domain.ReportRepo {
	return &reportRepo{q: q}
}

func (r *reportRepo) MonthlyAttendanceSummary(ctx context.Context, from, to time.Time) ([]domain.MonthlyAttendanceSummary, error) {
	rows, err := r.q.MonthlyAttendanceSummary(ctx, from, to)
	if err != nil {
		return nil, err
	}
	var result []domain.MonthlyAttendanceSummary
	for _, row := range rows {
		result = append(result, domain.MonthlyAttendanceSummary{
			EmployeeID:        row.ID,
			FirstName:         row.FirstName,
			LastName:          row.LastName,
			Department:        row.Department,
			PresentCount:      row.PresentCount,
			LateCount:         row.LateCount,
			AbsentCount:       row.AbsentCount,
			HalfDayCount:      row.HalfDayCount,
			AttendanceRatePct: row.AttendanceRatePct,
		})
	}
	return result, nil
}

func (r *reportRepo) DepartmentStaffing(ctx context.Context) ([]domain.DepartmentStaffing, error) {
	rows, err := r.q.DepartmentStaffing(ctx)
	if err != nil {
		return nil, err
	}
	var result []domain.DepartmentStaffing
	for _, row := range rows {
		result = append(result, domain.DepartmentStaffing{
			Department: row.Department,
			Role:       row.Role,
			Headcount:  row.Headcount,
		})
	}
	return result, nil
}

func (r *reportRepo) ShiftCoverageGaps(ctx context.Context, from, to time.Time) ([]domain.ShiftCoverageGap, error) {
	rows, err := r.q.ShiftCoverageGaps(ctx, from, to)
	if err != nil {
		return nil, err
	}
	var result []domain.ShiftCoverageGap
	for _, row := range rows {
		result = append(result, domain.ShiftCoverageGap{
			WorkDate:       row.WorkDate,
			ShiftName:      row.ShiftName,
			AssignedCount:  row.AssignedCount,
			AttendedCount:  row.AttendedCount,
			CoverageStatus: row.CoverageStatus,
		})
	}
	return result, nil
}
