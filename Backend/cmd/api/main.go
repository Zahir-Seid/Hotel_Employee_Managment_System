package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/hotel-ems/internal/audit"
	"github.com/hotel-ems/internal/auth"
	"github.com/hotel-ems/internal/config"
	"github.com/hotel-ems/internal/db"
	"github.com/hotel-ems/internal/db/sqlc"
	"github.com/hotel-ems/internal/handler"
	"github.com/hotel-ems/internal/middleware"
	"github.com/hotel-ems/internal/repository"
	"github.com/hotel-ems/internal/service"
)

func main() {
	cfg := config.Load()
	pool, err := db.NewPool(cfg)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	q := sqlc.New(pool)
	deptRepo := repository.NewDepartmentRepo(q)
	roleRepo := repository.NewRoleRepo(q)
	empRepo := repository.NewEmployeeRepo(q)
	empRoleRepo := repository.NewEmployeeRoleRepo(q)
	shiftRepo := repository.NewShiftRepo(q)
	shiftAssignRepo := repository.NewShiftAssignmentRepo(q)
	attRepo := repository.NewAttendanceRepo(q)
	userRepo := repository.NewUserRepo(q)
	auditRepo := repository.NewAuditLogRepo(q)
	reportRepo := repository.NewReportRepo(q)

	jwtManager := auth.NewJWTManager(cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)
	auditWriter := audit.NewWriter(auditRepo)

	authSvc := service.NewAuthService(userRepo, jwtManager)
	deptSvc := service.NewDepartmentService(deptRepo, auditWriter)
	roleSvc := service.NewRoleService(roleRepo, auditWriter)
	empSvc := service.NewEmployeeService(pool, empRepo, empRoleRepo, roleRepo, deptRepo, auditWriter)
	shiftSvc := service.NewShiftService(shiftRepo, auditWriter)
	shiftAssignSvc := service.NewShiftAssignmentService(shiftAssignRepo, auditWriter)
	attSvc := service.NewAttendanceService(attRepo, shiftAssignRepo, shiftRepo, auditWriter)
	userSvc := service.NewUserService(userRepo, auditWriter)
	reportSvc := service.NewReportService(reportRepo)
	auditLogSvc := service.NewAuditLogService(auditRepo)

	authHandler := handler.NewAuthHandler(authSvc)
	deptHandler := handler.NewDepartmentHandler(deptSvc)
	roleHandler := handler.NewRoleHandler(roleSvc)
	empHandler := handler.NewEmployeeHandler(empSvc)
	shiftHandler := handler.NewShiftHandler(shiftSvc)
	shiftAssignHandler := handler.NewShiftAssignmentHandler(shiftAssignSvc)
	attHandler := handler.NewAttendanceHandler(attSvc)
	userHandler := handler.NewUserHandler(userSvc)
	reportHandler := handler.NewReportHandler(reportSvc)
	auditLogHandler := handler.NewAuditLogHandler(auditLogSvc)
	dashboardHandler := handler.NewDashboardHandler(empRepo, attRepo, shiftAssignRepo, deptRepo, empRoleRepo, auditRepo)

	r := chi.NewRouter()
	r.Use(chimiddleware.RedirectSlashes)
	r.Use(middleware.Recover)
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           43200,
	}))

	authHandler.RegisterRoutes(r)

	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(jwtManager))
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireRole("hr_manager", "super_admin"))
			deptHandler.RegisterRoutes(r)
			roleHandler.RegisterRoutes(r)
			empHandler.RegisterRoutes(r)
			shiftHandler.RegisterRoutes(r)
			shiftAssignHandler.RegisterRoutes(r)
			attHandler.RegisterRoutes(r)
			reportHandler.RegisterRoutes(r)
			dashboardHandler.RegisterRoutes(r)
		})
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireRole("super_admin"))
			userHandler.RegisterRoutes(r)
			auditLogHandler.RegisterRoutes(r)
		})
	})

	r.Get("/docs", swaggerHandler)
	r.Get("/openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "openapi/openapi.yaml")
	})

	addr := cfg.ListenAddr()
	log.Printf("API listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}

func swaggerHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(`<!DOCTYPE html>
<html>
<head>
  <title>Hotel EMS API</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.yaml',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.presets.standalonePreset]
    });
  </script>
</body>
</html>`))
}
