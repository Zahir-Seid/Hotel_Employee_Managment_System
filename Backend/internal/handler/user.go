package handler

import (
	"net/http"
	"strconv"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(s *service.UserService) *UserHandler {
	return &UserHandler{service: s}
}

func (h *UserHandler) RegisterRoutes(r chi.Router) {
	r.Get("/users", h.List)
	r.Post("/users", h.Create)
	r.Get("/users/{id}", h.Get)
	r.Put("/users/{id}", h.Update)
	r.Delete("/users/{id}", h.Delete)
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EmployeeID *int64          `json:"employee_id,omitempty"`
		Username   string          `json:"username"`
		Password   string          `json:"password"`
		Role       domain.UserRole `json:"role"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	user, err := h.service.Create(r.Context(), req.EmployeeID, req.Username, req.Password, req.Role, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	user.PasswordHash = ""
	respondData(w, http.StatusCreated, user)
}

func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	user, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, err)
		return
	}
	user.PasswordHash = ""
	respondData(w, http.StatusOK, user)
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.service.List(r.Context())
	if err != nil {
		respondError(w, err)
		return
	}
	for i := range users {
		users[i].PasswordHash = ""
	}
	respondData(w, http.StatusOK, users)
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req struct {
		EmployeeID *int64           `json:"employee_id,omitempty"`
		Username   *string          `json:"username,omitempty"`
		Password   *string          `json:"password,omitempty"`
		Role       *domain.UserRole `json:"role,omitempty"`
		IsActive   *bool            `json:"is_active,omitempty"`
	}
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	updates := make(map[string]interface{})
	if req.EmployeeID != nil { updates["employee_id"] = *req.EmployeeID }
	if req.Username != nil { updates["username"] = *req.Username }
	if req.Password != nil { updates["password"] = *req.Password }
	if req.Role != nil { updates["role"] = *req.Role }
	if req.IsActive != nil { updates["is_active"] = *req.IsActive }

	user, err := h.service.Update(r.Context(), id, updates, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	user.PasswordHash = ""
	respondData(w, http.StatusOK, user)
}

func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.service.Delete(r.Context(), id, actorUserID(r)); err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusNoContent, nil)
}
