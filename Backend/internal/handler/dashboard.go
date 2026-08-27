package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/hotel-ems/internal/domain"
)

type DashboardHandler struct {
	empRepo       domain.EmployeeRepo
	attRepo       domain.AttendanceRepo
	shiftAssRepo  domain.ShiftAssignmentRepo
	deptRepo      domain.DepartmentRepo
	empRoleRepo   domain.EmployeeRoleRepo
	auditRepo     domain.AuditLogRepo
}

func NewDashboardHandler(
	empRepo domain.EmployeeRepo,
	attRepo domain.AttendanceRepo,
	shiftAssRepo domain.ShiftAssignmentRepo,
	deptRepo domain.DepartmentRepo,
	empRoleRepo domain.EmployeeRoleRepo,
	auditRepo domain.AuditLogRepo,
) *DashboardHandler {
	return &DashboardHandler{
		empRepo:      empRepo,
		attRepo:      attRepo,
		shiftAssRepo: shiftAssRepo,
		deptRepo:     deptRepo,
		empRoleRepo:  empRoleRepo,
		auditRepo:    auditRepo,
	}
}

func (h *DashboardHandler) RegisterRoutes(r chi.Router) {
	r.Get("/dashboard", h.Get)
}

type dashboardResponse struct {
	TotalActive int64              `json:"total_active"`
	PresentToday int64             `json:"present_today"`
	LateToday   int64              `json:"late_today"`
	AbsentToday int64              `json:"absent_today"`
	OpenShiftGaps int64            `json:"open_shift_gaps"`
	Staffing    []deptStaffingRow `json:"staffing"`
	RecentAudit []domain.AuditLog `json:"recent_audit"`
}

type deptStaffingRow struct {
	Department string `json:"department"`
	Headcount  int64  `json:"headcount"`
}

func (h *DashboardHandler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	activeStatus := domain.EmployeeStatusActive
	employees, err := h.empRepo.List(ctx, nil, &activeStatus)
	if err != nil {
		respondError(w, err)
		return
	}
	totalActive := int64(len(employees))

	today := time.Now().Truncate(24 * time.Hour)

	assignments, err := h.shiftAssRepo.List(ctx, nil, nil, &today, &today)
	if err != nil {
		respondError(w, err)
		return
	}

	var presentToday, lateToday, absentToday, openGaps int64
	for _, a := range assignments {
		att, err := h.attRepo.GetByShiftAssignment(ctx, a.ID)
		if err != nil || att == nil {
			openGaps++
			continue
		}
		switch att.Status {
		case domain.AttendanceStatusPresent:
			presentToday++
		case domain.AttendanceStatusLate:
			lateToday++
		case domain.AttendanceStatusAbsent:
			absentToday++
		}
	}

	departments, err := h.deptRepo.List(ctx)
	if err != nil {
		respondError(w, err)
		return
	}

	var staffing []deptStaffingRow
	for _, dept := range departments {
		emps, err := h.empRepo.List(ctx, &dept.ID, &activeStatus)
		if err != nil {
			continue
		}
		staffing = append(staffing, deptStaffingRow{
			Department: dept.Name,
			Headcount:  int64(len(emps)),
		})
	}

	auditLogs, err := h.auditRepo.List(ctx, nil, nil, nil, nil)
	if err != nil {
		auditLogs = []domain.AuditLog{}
	}
	if len(auditLogs) > 8 {
		auditLogs = auditLogs[:8]
	}

	respondData(w, http.StatusOK, dashboardResponse{
		TotalActive:  totalActive,
		PresentToday: presentToday,
		LateToday:    lateToday,
		AbsentToday:  absentToday,
		OpenShiftGaps: openGaps,
		Staffing:     staffing,
		RecentAudit:  auditLogs,
	})
}
