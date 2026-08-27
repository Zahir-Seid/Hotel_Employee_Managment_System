package repository

import (
	"context"

	"github.com/hotel-ems/internal/db/sqlc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	q  *sqlc.Queries
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{
		q:  sqlc.New(db),
		db: db,
	}
}

func (r *Repository) Queries() *sqlc.Queries {
	return r.q
}

func (r *Repository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	return r.db.Begin(ctx)
}

func isNotFound(err error) bool {
	if err == nil {
		return false
	}
	return err == pgx.ErrNoRows
}

func isConflict(err error) bool {
	if err == nil {
		return false
	}
	pgErr, ok := err.(*pgconn.PgError)
	if ok {
		return pgErr.Code == "23505"
	}
	return false
}
