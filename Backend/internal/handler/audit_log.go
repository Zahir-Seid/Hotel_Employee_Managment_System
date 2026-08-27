package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type AuditLogHandler struct {
	service *service.AuditLogService
}

func NewAuditLogHandler(s *service.AuditLogService) *AuditLogHandler {
	return &AuditLogHandler{service: s}
}

func (h *AuditLogHandler) RegisterRoutes(r chi.Router) {
	r.Get("/audit-logs", h.List)
}

func (h *AuditLogHandler) List(w http.ResponseWriter, r *http.Request) {
	var entityType *string
	var entityID *int64
	var from, to *time.Time
	if v := r.URL.Query().Get("entity_type"); v != "" {
		entityType = &v
	}
	if v := r.URL.Query().Get("entity_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil { entityID = &id }
	}
	if v := r.URL.Query().Get("from"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil { from = &t }
	}
	if v := r.URL.Query().Get("to"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil { to = &t }
	}
	logs, err := h.service.List(r.Context(), entityType, entityID, from, to)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, logs)
}
