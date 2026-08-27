package repository

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type attendanceRepo struct {
	q *sqlc.Queries
}

func NewAttendanceRepo(q *sqlc.Queries) domain.AttendanceRepo {
	return &attendanceRepo{q: q}
}

func mapAttendance(a sqlc.Attendance) *domain.Attendance {
	return &domain.Attendance{
		ID:                a.ID,
		ShiftAssignmentID: a.ShiftAssignmentID,
		CheckInTime:       a.CheckInTime,
		CheckOutTime:      a.CheckOutTime,
		Status:            domain.AttendanceStatus(a.Status),
		Notes:             a.Notes,
		RecordedBy:        a.RecordedBy,
		CreatedAt:         a.CreatedAt,
		UpdatedAt:         a.UpdatedAt,
	}
}

func (r *attendanceRepo) Create(ctx context.Context, shiftAssignmentID int64, checkInTime *time.Time, status domain.AttendanceStatus, recordedBy *int64) (*domain.Attendance, error) {
	row, err := r.q.CreateAttendance(ctx, sqlc.CreateAttendanceParams{
		ShiftAssignmentID: shiftAssignmentID,
		CheckInTime:       checkInTime,
		Status:            sqlc.AttendanceStatus(status),
		RecordedBy:        recordedBy,
	})
	if err != nil {
		return nil, err
	}
	return mapAttendance(row), nil
}

func (r *attendanceRepo) GetByShiftAssignment(ctx context.Context, shiftAssignmentID int64) (*domain.Attendance, error) {
	row, err := r.q.GetAttendanceByShiftAssignment(ctx, shiftAssignmentID)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapAttendance(row), nil
}

func (r *attendanceRepo) UpdateCheckIn(ctx context.Context, shiftAssignmentID int64, checkIn time.Time, status domain.AttendanceStatus) (*domain.Attendance, error) {
	row, err := r.q.UpdateAttendanceCheckIn(ctx, sqlc.UpdateAttendanceCheckInParams{
		CheckInTime:       checkIn,
		Status:            sqlc.AttendanceStatus(status),
		ShiftAssignmentID: shiftAssignmentID,
	})
	if err != nil {
		return nil, err
	}
	return mapAttendance(row), nil
}

func (r *attendanceRepo) UpdateCheckOut(ctx context.Context, shiftAssignmentID int64, checkOut time.Time, status domain.AttendanceStatus) (*domain.Attendance, error) {
	row, err := r.q.UpdateAttendanceCheckOut(ctx, sqlc.UpdateAttendanceCheckOutParams{
		CheckOutTime:      checkOut,
		Status:            sqlc.AttendanceStatus(status),
		ShiftAssignmentID: shiftAssignmentID,
	})
	if err != nil {
		return nil, err
	}
	return mapAttendance(row), nil
}

func (r *attendanceRepo) ListByEmployee(ctx context.Context, employeeID int64, from, to *time.Time) ([]domain.Attendance, error) {
	rows, err := r.q.ListAttendanceByEmployee(ctx, sqlc.ListAttendanceByEmployeeParams{
		EmployeeID: employeeID,
		FromDate:   from,
		ToDate:     to,
	})
	if err != nil {
		return nil, err
	}
	var result []domain.Attendance
	for _, r := range rows {
		result = append(result, *mapAttendance(r))
	}
	return result, nil
}
