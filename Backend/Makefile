.PHONY: all build run test migrate-up migrate-down sqlc generate admin

all: build

build:
	CGO_ENABLED=0 go build -o bin/main.exe ./cmd/api
	CGO_ENABLED=0 go build -o bin/admin.exe ./cmd/admin

run:
	go run ./cmd/api

run-admin:
	go run ./cmd/admin

test:
	go test ./...

test-integration:
	go test ./internal/repository/... -tags=integration

migrate-up:
	goose -dir migrations postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DATABASE_URL)" down

migrate-status:
	goose -dir migrations postgres "$(DATABASE_URL)" status

sqlc:
	sqlc generate

generate: sqlc

dev-up:
	docker compose up --build

dev-admin:
	docker compose run --rm admin
