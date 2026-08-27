package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type AttendanceHandler struct {
	service *service.AttendanceService
}

func NewAttendanceHandler(s *service.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{service: s}
}

func (h *AttendanceHandler) RegisterRoutes(r chi.Router) {
	r.Post("/attendance/check-in", h.CheckIn)
	r.Post("/attendance/check-out", h.CheckOut)
	r.Get("/employees/{id}/attendance", h.ListByEmployee)
}

func (h *AttendanceHandler) CheckIn(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ShiftAssignmentID int64  `json:"shift_assignment_id"`
		CheckInTime       string `json:"check_in_time"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	ci, _ := time.Parse(time.RFC3339, req.CheckInTime)
	att, err := h.service.CheckIn(r.Context(), req.ShiftAssignmentID, ci, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusCreated, att)
}

func (h *AttendanceHandler) CheckOut(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ShiftAssignmentID int64  `json:"shift_assignment_id"`
		CheckOutTime      string `json:"check_out_time"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	co, _ := time.Parse(time.RFC3339, req.CheckOutTime)
	att, err := h.service.CheckOut(r.Context(), req.ShiftAssignmentID, co, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, att)
}

func (h *AttendanceHandler) ListByEmployee(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var from, to *time.Time
	if v := r.URL.Query().Get("from"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil { from = &t }
	}
	if v := r.URL.Query().Get("to"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil { to = &t }
	}
	atts, err := h.service.ListByEmployee(r.Context(), id, from, to)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, atts)
}
