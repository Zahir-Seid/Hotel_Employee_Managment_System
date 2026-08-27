package repository

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type shiftAssignmentRepo struct {
	q *sqlc.Queries
}

func NewShiftAssignmentRepo(q *sqlc.Queries) domain.ShiftAssignmentRepo {
	return &shiftAssignmentRepo{q: q}
}

func mapShiftAssignment(sa sqlc.ShiftAssignment) *domain.ShiftAssignment {
	return &domain.ShiftAssignment{
		ID:         sa.ID,
		EmployeeID: sa.EmployeeID,
		ShiftID:    sa.ShiftID,
		WorkDate:   sa.WorkDate,
		CreatedBy:  sa.CreatedBy,
		CreatedAt:  sa.CreatedAt,
	}
}

func (r *shiftAssignmentRepo) Create(ctx context.Context, employeeID, shiftID int64, workDate time.Time, createdBy *int64) (*domain.ShiftAssignment, error) {
	row, err := r.q.CreateShiftAssignment(ctx, sqlc.CreateShiftAssignmentParams{
		EmployeeID: employeeID,
		ShiftID:    shiftID,
		WorkDate:   workDate,
		CreatedBy:  createdBy,
	})
	if err != nil {
		if isConflict(err) {
			return nil, domain.ErrConflict
		}
		return nil, err
	}
	return mapShiftAssignment(row), nil
}

func (r *shiftAssignmentRepo) GetByID(ctx context.Context, id int64) (*domain.ShiftAssignment, error) {
	row, err := r.q.GetShiftAssignment(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapShiftAssignment(row), nil
}

func (r *shiftAssignmentRepo) List(ctx context.Context, employeeID, shiftID *int64, from, to *time.Time) ([]domain.ShiftAssignment, error) {
	rows, err := r.q.ListShiftAssignments(ctx, sqlc.ListShiftAssignmentsParams{
		EmployeeID: employeeID,
		ShiftID:    shiftID,
		FromDate:   from,
		ToDate:     to,
	})
	if err != nil {
		return nil, err
	}
	var result []domain.ShiftAssignment
	for _, r := range rows {
		result = append(result, *mapShiftAssignment(r))
	}
	return result, nil
}

func (r *shiftAssignmentRepo) Delete(ctx context.Context, id int64) error {
	return r.q.DeleteShiftAssignment(ctx, id)
}

func (r *shiftAssignmentRepo) GetByEmployeeAndDate(ctx context.Context, employeeID int64, workDate time.Time) (*domain.ShiftAssignment, error) {
	row, err := r.q.GetShiftAssignmentByEmployeeDate(ctx, employeeID, workDate)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapShiftAssignment(row), nil
}
