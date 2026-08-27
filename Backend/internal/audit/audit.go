package audit

import (
	"context"
	"encoding/json"

	"github.com/hotel-ems/internal/domain"
)

type Writer struct {
	repo domain.AuditLogRepo
}

func NewWriter(repo domain.AuditLogRepo) *Writer {
	return &Writer{repo: repo}
}

func (w *Writer) Write(ctx context.Context, actorUserID *int64, action, entityType string, entityID *int64, before, after interface{}, ipAddress *string) error {
	var beforeData, afterData *map[string]any
	if before != nil {
		b, _ := json.Marshal(before)
		var m map[string]any
		_ = json.Unmarshal(b, &m)
		beforeData = &m
	}
	if after != nil {
		a, _ := json.Marshal(after)
		var m map[string]any
		_ = json.Unmarshal(a, &m)
		afterData = &m
	}
	_, err := w.repo.Create(ctx, actorUserID, action, entityType, entityID, beforeData, afterData, ipAddress)
	return err
}
