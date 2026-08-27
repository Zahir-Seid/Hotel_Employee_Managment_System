package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type ShiftHandler struct {
	service *service.ShiftService
}

func NewShiftHandler(s *service.ShiftService) *ShiftHandler {
	return &ShiftHandler{service: s}
}

func (h *ShiftHandler) RegisterRoutes(r chi.Router) {
	r.Get("/shifts", h.List)
	r.Post("/shifts", h.Create)
	r.Get("/shifts/{id}", h.Get)
	r.Put("/shifts/{id}", h.Update)
	r.Delete("/shifts/{id}", h.Delete)
}

func (h *ShiftHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name      string `json:"name"`
		StartTime string `json:"start_time"`
		EndTime   string `json:"end_time"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	st, _ := time.Parse("15:04:05", req.StartTime)
	et, _ := time.Parse("15:04:05", req.EndTime)
	shift, err := h.service.Create(r.Context(), req.Name, st, et, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusCreated, shift)
}

func (h *ShiftHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	shift, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, shift)
}

func (h *ShiftHandler) List(w http.ResponseWriter, r *http.Request) {
	shifts, err := h.service.List(r.Context())
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, shifts)
}

func (h *ShiftHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req struct {
		Name      *string `json:"name,omitempty"`
		StartTime *string `json:"start_time,omitempty"`
		EndTime   *string `json:"end_time,omitempty"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	var st, et *time.Time
	if req.StartTime != nil {
		t, _ := time.Parse("15:04:05", *req.StartTime)
		st = &t
	}
	if req.EndTime != nil {
		t, _ := time.Parse("15:04:05", *req.EndTime)
		et = &t
	}
	shift, err := h.service.Update(r.Context(), id, req.Name, st, et, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, shift)
}

func (h *ShiftHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.service.Delete(r.Context(), id, actorUserID(r)); err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusNoContent, nil)
}
