package repository

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type shiftRepo struct {
	q *sqlc.Queries
}

func NewShiftRepo(q *sqlc.Queries) domain.ShiftRepo {
	return &shiftRepo{q: q}
}

func mapShift(s sqlc.Shift) *domain.Shift {
	return &domain.Shift{
		ID:        s.ID,
		Name:      s.Name,
		StartTime: s.StartTime,
		EndTime:   s.EndTime,
		CreatedAt: s.CreatedAt,
	}
}

func (r *shiftRepo) Create(ctx context.Context, name string, startTime, endTime time.Time) (*domain.Shift, error) {
	row, err := r.q.CreateShift(ctx, sqlc.CreateShiftParams{
		Name:      name,
		StartTime: startTime,
		EndTime:   endTime,
	})
	if err != nil {
		if isConflict(err) {
			return nil, domain.ErrConflict
		}
		return nil, err
	}
	return mapShift(row), nil
}

func (r *shiftRepo) GetByID(ctx context.Context, id int64) (*domain.Shift, error) {
	row, err := r.q.GetShift(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapShift(row), nil
}

func (r *shiftRepo) List(ctx context.Context) ([]domain.Shift, error) {
	rows, err := r.q.ListShifts(ctx)
	if err != nil {
		return nil, err
	}
	var result []domain.Shift
	for _, r := range rows {
		result = append(result, *mapShift(r))
	}
	return result, nil
}

func (r *shiftRepo) Update(ctx context.Context, id int64, name *string, startTime, endTime *time.Time) (*domain.Shift, error) {
	row, err := r.q.UpdateShift(ctx, sqlc.UpdateShiftParams{
		Name:      name,
		StartTime: startTime,
		EndTime:   endTime,
		ID:        id,
	})
	if err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return mapShift(row), nil
}

func (r *shiftRepo) Delete(ctx context.Context, id int64) error {
	err := r.q.DeleteShift(ctx, id)
	if err != nil {
		return err
	}
	return nil
}
