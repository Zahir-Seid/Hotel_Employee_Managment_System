package service

import (
	"context"

	"github.com/hotel-ems/internal/auth"
	"github.com/hotel-ems/internal/domain"
)

type AuthService struct {
	userRepo   domain.UserRepo
	jwtManager *auth.JWTManager
}

func NewAuthService(userRepo domain.UserRepo, jwtManager *auth.JWTManager) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtManager: jwtManager,
	}
}

func (s *AuthService) Login(ctx context.Context, username, password string) (*auth.TokenPair, error) {
	user, err := s.userRepo.GetByUsername(ctx, username)
	if err != nil {
		if err == domain.ErrNotFound {
			return nil, domain.ErrUnauthorized
		}
		return nil, err
	}
	if !user.IsActive {
		return nil, domain.ErrUnauthorized
	}
	if !auth.CheckPassword(password, user.PasswordHash) {
		return nil, domain.ErrUnauthorized
	}
	return s.jwtManager.IssueTokenPair(user.ID, user.Username, string(user.Role), user.EmployeeID)
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*auth.TokenPair, error) {
	// For simplicity, we verify the refresh token as an access token
	// In production, you'd use a separate secret or store refresh tokens
	claims, err := s.jwtManager.VerifyAccessToken(refreshToken)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	if !user.IsActive {
		return nil, domain.ErrUnauthorized
	}
	return s.jwtManager.IssueTokenPair(user.ID, user.Username, string(user.Role), user.EmployeeID)
}
