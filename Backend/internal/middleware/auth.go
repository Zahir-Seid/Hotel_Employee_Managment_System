package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/hotel-ems/internal/auth"
	"github.com/hotel-ems/internal/domain"
)

func Auth(jwtManager *auth.JWTManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			claims, err := jwtManager.VerifyAccessToken(parts[1])
			if err != nil {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), domain.ContextKeyUserID, claims.UserID)
			ctx = context.WithValue(ctx, domain.ContextKeyUsername, claims.Username)
			ctx = context.WithValue(ctx, domain.ContextKeyRole, claims.Role)
			ctx = context.WithValue(ctx, domain.ContextKeyEmployeeID, claims.EmployeeID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
