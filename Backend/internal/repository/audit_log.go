package repository

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/db/sqlc"
)

type auditLogRepo struct {
	q *sqlc.Queries
}

func NewAuditLogRepo(q *sqlc.Queries) domain.AuditLogRepo {
	return &auditLogRepo{q: q}
}

func mapAuditLog(a sqlc.AuditLog) *domain.AuditLog {
	return &domain.AuditLog{
		ID:          a.ID,
		ActorUserID: a.ActorUserID,
		Action:      a.Action,
		EntityType:  a.EntityType,
		EntityID:    a.EntityID,
		BeforeData:  &a.BeforeData,
		AfterData:   &a.AfterData,
		IPAddress:   a.IPAddress,
		CreatedAt:   a.CreatedAt,
	}
}

func (r *auditLogRepo) Create(ctx context.Context, actorUserID *int64, action, entityType string, entityID *int64, before, after *map[string]any, ipAddress *string) (*domain.AuditLog, error) {
	row, err := r.q.CreateAuditLog(ctx, sqlc.CreateAuditLogParams{
		ActorUserID: actorUserID,
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		BeforeData:  derefMap(before),
		AfterData:   derefMap(after),
		IPAddress:   ipAddress,
	})
	if err != nil {
		return nil, err
	}
	return mapAuditLog(row), nil
}

func (r *auditLogRepo) List(ctx context.Context, entityType *string, entityID *int64, from, to *time.Time) ([]domain.AuditLog, error) {
	rows, err := r.q.ListAuditLogs(ctx, sqlc.ListAuditLogsParams{
		EntityType: entityType,
		EntityID:   entityID,
		FromDate:   from,
		ToDate:     to,
	})
	if err != nil {
		return nil, err
	}
	var result []domain.AuditLog
	for _, r := range rows {
		result = append(result, *mapAuditLog(r))
	}
	return result, nil
}
