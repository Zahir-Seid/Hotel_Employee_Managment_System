package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"syscall"

	"github.com/hotel-ems/internal/auth"
	"github.com/hotel-ems/internal/config"
	"github.com/hotel-ems/internal/db"
	"github.com/hotel-ems/internal/db/sqlc"
	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/repository"
	"golang.org/x/term"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: admin.exe <command> [options]")
		fmt.Println("Commands: createsuperuser, reset-password, list-users, migrate")
		os.Exit(1)
	}

	cfg := config.Load()
	pool, err := db.NewPool(cfg)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	q := sqlc.New(pool)
	userRepo := repository.NewUserRepo(q)

	switch os.Args[1] {
	case "createsuperuser":
		cmdCreateSuperUser(userRepo)
	case "reset-password":
		cmdResetPassword(userRepo)
	case "list-users":
		cmdListUsers(userRepo)
	case "migrate":
		fmt.Println("Run migrations with: goose -dir migrations postgres \"$DATABASE_URL\" up")
	default:
		fmt.Printf("Unknown command: %s\n", os.Args[1])
		os.Exit(1)
	}
}

func cmdCreateSuperUser(userRepo domain.UserRepo) {
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Username: ")
	username, _ := reader.ReadString('\n')
	username = trim(username)

	fmt.Print("Password: ")
	bytePassword, _ := term.ReadPassword(int(syscall.Stdin))
	fmt.Println()

	password := string(bytePassword)
	if password == "" {
		log.Fatal("password is required")
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		log.Fatalf("hash password: %v", err)
	}

	_, err = userRepo.Create(context.Background(), nil, username, hash, domain.UserRoleSuperAdmin)
	if err != nil {
		log.Fatalf("create user: %v", err)
	}

	fmt.Printf("Superadmin '%s' created.\n", username)
}

func cmdResetPassword(userRepo domain.UserRepo) {
	if len(os.Args) < 3 {
		log.Fatal("Usage: admin.exe reset-password --username <username>")
	}
	username := os.Args[3]

	fmt.Print("New Password: ")
	bytePassword, _ := term.ReadPassword(int(syscall.Stdin))
	fmt.Println()

	password := string(bytePassword)
	hash, err := auth.HashPassword(password)
	if err != nil {
		log.Fatalf("hash password: %v", err)
	}

	user, err := userRepo.GetByUsername(context.Background(), username)
	if err != nil {
		log.Fatalf("user not found: %v", err)
	}

	_, err = userRepo.Update(context.Background(), user.ID, map[string]interface{}{
		"password_hash": hash,
	})
	if err != nil {
		log.Fatalf("update password: %v", err)
	}
	fmt.Println("Password updated.")
}

func cmdListUsers(userRepo domain.UserRepo) {
	users, err := userRepo.List(context.Background())
	if err != nil {
		log.Fatalf("list users: %v", err)
	}
	for _, u := range users {
		fmt.Printf("%d | %s | %s | active=%v\n", u.ID, u.Username, u.Role, u.IsActive)
	}
}

func trim(s string) string {
	for len(s) > 0 && (s[len(s)-1] == '\n' || s[len(s)-1] == '\r') {
		s = s[:len(s)-1]
	}
	return s
}
