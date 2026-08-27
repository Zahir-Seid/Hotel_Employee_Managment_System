package handler

import (
	"net/http"
	"strconv"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type RoleHandler struct {
	service *service.RoleService
}

func NewRoleHandler(s *service.RoleService) *RoleHandler {
	return &RoleHandler{service: s}
}

func (h *RoleHandler) RegisterRoutes(r chi.Router) {
	r.Get("/roles", h.List)
	r.Post("/roles", h.Create)
	r.Get("/roles/{id}", h.Get)
	r.Put("/roles/{id}", h.Update)
	r.Delete("/roles/{id}", h.Delete)
}

func (h *RoleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description,omitempty"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	role, err := h.service.Create(r.Context(), req.Name, req.Description, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusCreated, role)
}

func (h *RoleHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	role, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, role)
}

func (h *RoleHandler) List(w http.ResponseWriter, r *http.Request) {
	roles, err := h.service.List(r.Context())
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, roles)
}

func (h *RoleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req struct {
		Name        *string `json:"name,omitempty"`
		Description *string `json:"description,omitempty"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	role, err := h.service.Update(r.Context(), id, req.Name, req.Description, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, role)
}

func (h *RoleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.service.Delete(r.Context(), id, actorUserID(r)); err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusNoContent, nil)
}
