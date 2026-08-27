package domain

// Context keys for request context values set by middleware.
type ContextKey string

const (
	ContextKeyUserID     ContextKey = "user_id"
	ContextKeyUsername   ContextKey = "username"
	ContextKeyRole       ContextKey = "role"
	ContextKeyEmployeeID ContextKey = "employee_id"
)
