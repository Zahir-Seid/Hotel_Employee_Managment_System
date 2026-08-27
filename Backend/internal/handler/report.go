package handler

import (
	"net/http"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type ReportHandler struct {
	service *service.ReportService
}

func NewReportHandler(s *service.ReportService) *ReportHandler {
	return &ReportHandler{service: s}
}

func (h *ReportHandler) RegisterRoutes(r chi.Router) {
	r.Get("/reports/attendance-summary", h.AttendanceSummary)
	r.Get("/reports/department-staffing", h.DepartmentStaffing)
	r.Get("/reports/shift-coverage-gaps", h.ShiftCoverageGaps)
}

func (h *ReportHandler) AttendanceSummary(w http.ResponseWriter, r *http.Request) {
	from, _ := time.Parse("2006-01-02", r.URL.Query().Get("from"))
	to, _ := time.Parse("2006-01-02", r.URL.Query().Get("to"))
	if from.IsZero() || to.IsZero() {
		respondError(w, domain.ErrValidation)
		return
	}
	data, err := h.service.MonthlyAttendanceSummary(r.Context(), from, to)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, data)
}

func (h *ReportHandler) DepartmentStaffing(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.DepartmentStaffing(r.Context())
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, data)
}

func (h *ReportHandler) ShiftCoverageGaps(w http.ResponseWriter, r *http.Request) {
	from, _ := time.Parse("2006-01-02", r.URL.Query().Get("from"))
	to, _ := time.Parse("2006-01-02", r.URL.Query().Get("to"))
	if from.IsZero() || to.IsZero() {
		respondError(w, domain.ErrValidation)
		return
	}
	data, err := h.service.ShiftCoverageGaps(r.Context(), from, to)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, data)
}
