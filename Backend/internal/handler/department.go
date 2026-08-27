package handler

import (
	"net/http"
	"strconv"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type DepartmentHandler struct {
	service *service.DepartmentService
}

func NewDepartmentHandler(s *service.DepartmentService) *DepartmentHandler {
	return &DepartmentHandler{service: s}
}

func (h *DepartmentHandler) RegisterRoutes(r chi.Router) {
	r.Get("/departments", h.List)
	r.Post("/departments", h.Create)
	r.Get("/departments/{id}", h.Get)
	r.Put("/departments/{id}", h.Update)
	r.Delete("/departments/{id}", h.Delete)
}

func (h *DepartmentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description,omitempty"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	dept, err := h.service.Create(r.Context(), req.Name, req.Description, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusCreated, dept)
}

func (h *DepartmentHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	dept, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, dept)
}

func (h *DepartmentHandler) List(w http.ResponseWriter, r *http.Request) {
	depts, err := h.service.List(r.Context())
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, depts)
}

func (h *DepartmentHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req struct {
		Name        *string `json:"name,omitempty"`
		Description *string `json:"description,omitempty"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	dept, err := h.service.Update(r.Context(), id, req.Name, req.Description, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, dept)
}

func (h *DepartmentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.service.Delete(r.Context(), id, actorUserID(r)); err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusNoContent, nil)
}
