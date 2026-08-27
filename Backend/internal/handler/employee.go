package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/hotel-ems/internal/domain"
	"github.com/hotel-ems/internal/service"
	"github.com/go-chi/chi/v5"
)

type EmployeeHandler struct {
	service *service.EmployeeService
}

func NewEmployeeHandler(s *service.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{service: s}
}

type createEmployeeRequest struct {
	EmployeeCode string              `json:"employee_code"`
	FirstName    string              `json:"first_name"`
	LastName     string              `json:"last_name"`
	Email        string              `json:"email"`
	Phone        string              `json:"phone,omitempty"`
	DepartmentID *int64              `json:"department_id,omitempty"`
	HireDate     string              `json:"hire_date"`
	Status       domain.EmployeeStatus `json:"status,omitempty"`
}

type updateEmployeeRequest struct {
	FirstName    *string              `json:"first_name,omitempty"`
	LastName     *string              `json:"last_name,omitempty"`
	Email        *string              `json:"email,omitempty"`
	Phone        *string              `json:"phone,omitempty"`
	DepartmentID *int64               `json:"department_id,omitempty"`
	HireDate     *string              `json:"hire_date,omitempty"`
	Status       *domain.EmployeeStatus `json:"status,omitempty"`
}

func (h *EmployeeHandler) RegisterRoutes(r chi.Router) {
	r.Get("/employees", h.List)
	r.Post("/employees", h.Create)
	r.Get("/employees/{id}", h.Get)
	r.Put("/employees/{id}", h.Update)
	r.Delete("/employees/{id}", h.Delete)
	r.Post("/employees/{id}/department", h.UpdateDepartment)
	r.Post("/employees/{id}/role", h.ReassignRole)
}

func (h *EmployeeHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createEmployeeRequest
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	hireDate, _ := time.Parse("2006-01-02", req.HireDate)
	status := req.Status
	if status == "" {
		status = domain.EmployeeStatusActive
	}
	emp, err := h.service.Create(r.Context(), req.EmployeeCode, req.FirstName, req.LastName, req.Email, req.Phone, req.DepartmentID, hireDate, status, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusCreated, emp)
}

func (h *EmployeeHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	emp, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, emp)
}

func (h *EmployeeHandler) List(w http.ResponseWriter, r *http.Request) {
	var deptID *int64
	if v := r.URL.Query().Get("department_id"); v != "" {
		if id, err := strconv.ParseInt(v, 10, 64); err == nil {
			deptID = &id
		}
	}
	var status *domain.EmployeeStatus
	if v := r.URL.Query().Get("status"); v != "" {
		s := domain.EmployeeStatus(v)
		status = &s
	}
	emps, err := h.service.List(r.Context(), deptID, status)
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, emps)
}

func (h *EmployeeHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req updateEmployeeRequest
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	updates := make(map[string]interface{})
	if req.FirstName != nil { updates["first_name"] = *req.FirstName }
	if req.LastName != nil { updates["last_name"] = *req.LastName }
	if req.Email != nil { updates["email"] = *req.Email }
	if req.Phone != nil { updates["phone"] = *req.Phone }
	if req.DepartmentID != nil { updates["department_id"] = *req.DepartmentID }
	if req.HireDate != nil {
		if d, err := time.Parse("2006-01-02", *req.HireDate); err == nil {
			updates["hire_date"] = d
		}
	}
	if req.Status != nil { updates["status"] = *req.Status }

	emp, err := h.service.Update(r.Context(), id, updates, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, emp)
}

func (h *EmployeeHandler) UpdateDepartment(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req struct{ DepartmentID int64 `json:"department_id"` }
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	if err := h.service.UpdateDepartment(r.Context(), id, req.DepartmentID, actorUserID(r)); err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, map[string]string{"message": "department updated"})
}

func (h *EmployeeHandler) ReassignRole(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	var req struct{ RoleID int64 `json:"role_id"` }
	if err := parseBody(r, &req); err != nil {
		respondError(w, domain.ErrValidation)
		return
	}
	emp, err := h.service.ReassignRole(r.Context(), id, req.RoleID, actorUserID(r))
	if err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusOK, emp)
}

func (h *EmployeeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.service.Delete(r.Context(), id, actorUserID(r)); err != nil {
		respondError(w, err)
		return
	}
	respondData(w, http.StatusNoContent, nil)
}
