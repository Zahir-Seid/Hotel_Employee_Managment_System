package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type ShiftAssignmentHandler struct {
	service *service.ShiftAssignmentService
}

func NewShiftAssignmentHandler(s *service.ShiftAssignmentService) *ShiftAssignmentHandler {
	return &ShiftAssignmentHandler{service: s}
}

func (h *ShiftAssignmentHandler) RegisterRoutes(r chi.Router) {
	r.Get("/shift-assignments", h.List)
	r.Post("/shift-assignments", h.Create)
	r.Delete("/shift-assignments/{id}", h.Delete)
	r.Get("/employees/{id}/shifts", h.ListByEmployee)
}

func (h *ShiftAssignmentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EmployeeID int64  `json:"employee_id"`
		ShiftID    int64  `json:"shift_id"`
		WorkDate   string `json:"work_date"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	wd, _ := time.Parse("2006-01-02", req.WorkDate)
	sa, err := h.service.Create(r.Context(), req.EmployeeID, req.ShiftID, wd, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusCreated, sa)
}

func (h *ShiftAssignmentHandler) List(w http.ResponseWriter, r *http.Request) {
	var employeeID, shiftID *int64
	var from, to *time.Time
	if v := r.URL.Query().Get("employee_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil { employeeID = &id }
	}
	if v := r.URL.Query().Get("shift_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil { shiftID = &id }
	}
	if v := r.URL.Query().Get("from"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil { from = &t }
	}
	if v := r.URL.Query().Get("to"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil { to = &t }
	}
	sas, err := h.service.List(r.Context(), employeeID, shiftID, from, to)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, sas)
}

func (h *ShiftAssignmentHandler) ListByEmployee(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	sas, err := h.service.List(r.Context(), &id, nil, nil, nil)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, sas)
}

func (h *ShiftAssignmentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.service.Delete(r.Context(), id, actorUserID(r)); err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusNoContent, nil)
}
