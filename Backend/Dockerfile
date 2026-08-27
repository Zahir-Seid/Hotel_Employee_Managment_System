# Build stage
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git make
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

# API binary
FROM builder AS api-builder
RUN CGO_ENABLED=0 go build -o /app/main.exe ./cmd/api

# Admin binary
FROM builder AS admin-builder
RUN CGO_ENABLED=0 go build -o /app/admin.exe ./cmd/admin

# API runtime
FROM alpine:latest AS api
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=api-builder /app/main.exe /app/main.exe
COPY --from=api-builder /app/openapi /app/openapi
EXPOSE 8080
CMD ["/app/main.exe"]

# Admin runtime
FROM alpine:latest AS admin
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=admin-builder /app/admin.exe /app/admin.exe
ENTRYPOINT ["/app/admin.exe"]
