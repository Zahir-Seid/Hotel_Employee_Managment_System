package handler

import (
	"encoding/json"
	"net/http"

	"github.com/hotel-ems/internal/domain"
)

type Response struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, err error) {
	status := http.StatusInternalServerError
	switch err {
	case domain.ErrNotFound:
		status = http.StatusNotFound
	case domain.ErrConflict:
		status = http.StatusConflict
	case domain.ErrUnauthorized:
		status = http.StatusUnauthorized
	case domain.ErrForbidden:
		status = http.StatusForbidden
	case domain.ErrInvalidState:
		status = http.StatusUnprocessableEntity
	case domain.ErrValidation:
		status = http.StatusBadRequest
	}
	respondJSON(w, status, Response{Error: err.Error()})
}

func respondData(w http.ResponseWriter, status int, data interface{}) {
	respondJSON(w, status, Response{Data: data})
}

func parseBody(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func actorUserID(r *http.Request) int64 {
	if v := r.Context().Value(domain.ContextKeyUserID); v != nil {
		if i, ok := v.(int64); ok {
			return i
		}
	}
	return 0
}
