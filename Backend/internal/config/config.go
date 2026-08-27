package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL      string
	APIHost          string
	APIPort          string
	JWTSecret        string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration
	Environment      string
}

func Load() *Config {
	_ = godotenv.Load()

	accessExpiry, _ := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	refreshExpiry, _ := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "7d"))

	return &Config{
		DatabaseURL:      getEnv("DATABASE_URL", ""),
		APIHost:          getEnv("API_HOST", "0.0.0.0"),
		APIPort:          getEnv("API_PORT", "8080"),
		JWTSecret:        getEnv("JWT_SECRET", "change-me-in-production"),
		JWTAccessExpiry:  accessExpiry,
		JWTRefreshExpiry: refreshExpiry,
		Environment:      getEnv("ENV", "development"),
	}
}

func (c *Config) ListenAddr() string {
	return fmt.Sprintf("%s:%s", c.APIHost, c.APIPort)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
