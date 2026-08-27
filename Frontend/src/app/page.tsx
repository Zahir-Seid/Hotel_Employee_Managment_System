'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RouterProvider, useRouter as useHemsRouter } from '@/hooks/use-router';
import { MobileSidebarProvider } from '@/hooks/use-mobile-sidebar';
import { Sidebar } from '@/components/hems/Sidebar';
import { Topbar } from '@/components/hems/Topbar';
import { DashboardView } from '@/components/hems/DashboardView';
import { EmployeesListView } from '@/components/hems/EmployeesListView';
import { EmployeeNewView } from '@/components/hems/EmployeeNewView';
import { EmployeeDetailView } from '@/components/hems/EmployeeDetailView';
import { DepartmentsView } from '@/components/hems/DepartmentsView';
import { DepartmentNewView } from '@/components/hems/DepartmentNewView';
import { RolesView } from '@/components/hems/RolesView';
import { RoleNewView } from '@/components/hems/RoleNewView';
import { ShiftsView } from '@/components/hems/ShiftsView';
import { AttendanceView } from '@/components/hems/AttendanceView';
import { ReportsView } from '@/components/hems/ReportsView';
import { AuditLogView } from '@/components/hems/AuditLogView';
import type { HemsRoute } from '@/lib/types';

function AppContent() {
  const { route } = useHemsRouter();

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div className="md:ml-56 min-h-screen flex flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6" role="main">
          <PageRouter route={route} />
        </main>
      </div>
    </div>
  );
}

function PageRouter({ route }: { route: HemsRoute }) {
  switch (route.page) {
    case 'dashboard':
      return <DashboardView />;
    case 'employees':
      return <EmployeesListView />;
    case 'employees-new':
      return <EmployeeNewView />;
    case 'employees-detail':
      return <EmployeeDetailView id={route.id} />;
    case 'employees-edit':
      return <EmployeeDetailView id={route.id} editMode />;
    case 'departments':
      return <DepartmentsView />;
    case 'departments-new':
      return <DepartmentNewView />;
    case 'departments-detail':
      return <DepartmentsView />;
    case 'roles':
      return <RolesView />;
    case 'roles-new':
      return <RoleNewView />;
    case 'roles-detail':
      return <RolesView />;
    case 'shifts':
    case 'shifts-assign':
      return <ShiftsView />;
    case 'attendance':
    case 'attendance-record':
      return <AttendanceView />;
    case 'reports':
      return <ReportsView />;
    case 'audit-log':
      return <AuditLogView />;
    default:
      return <DashboardView />;
  }
}

function AuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="text-sm text-ink/40">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <RouterProvider>
      <MobileSidebarProvider>
        <AppContent />
      </MobileSidebarProvider>
    </RouterProvider>
  );
}

export default function Home() {
  return <AuthGuard />;
}
