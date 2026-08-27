package middleware

import (
	"net/http"
	"slices"

	"github.com/hotel-ems/internal/domain"
)

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := r.Context().Value(domain.ContextKeyRole).(string)
			if !ok || !slices.Contains(roles, role) {
				http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
