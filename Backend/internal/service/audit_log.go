package service

import (
	"context"
	"time"

	"github.com/hotel-ems/internal/domain"
)

type AuditLogService struct {
	repo domain.AuditLogRepo
}

func NewAuditLogService(repo domain.AuditLogRepo) *AuditLogService {
	return &AuditLogService{repo: repo}
}

func (s *AuditLogService) List(ctx context.Context, entityType *string, entityID *int64, from, to *time.Time) ([]domain.AuditLog, error) {
	return s.repo.List(ctx, entityType, entityID, from, to)
}
