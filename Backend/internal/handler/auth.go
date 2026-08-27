package handler

import (
	"net/http"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler(s *service.AuthService) *AuthHandler {
	return &AuthHandler{service: s}
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *AuthHandler) RegisterRoutes(r chi.Router) {
	r.Post("/auth/login", h.Login)
	r.Post("/auth/refresh", h.Refresh)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	tokens, err := h.service.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, tokens)
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req refreshRequest
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	tokens, err := h.service.Refresh(r.Context(), req.RefreshToken)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, tokens)
}
