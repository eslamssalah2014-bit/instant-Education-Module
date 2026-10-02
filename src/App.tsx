import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ObservationsPage } from './pages/Observations/ObservationsPage';
import { CreateObservationPage } from './pages/CreateObservation/CreateObservationPage';
import { CriteriaManagementPage } from './pages/CriteriaManagement/CriteriaManagementPage';
import { InstructorPortalPage } from './pages/InstructorPortal/InstructorPortalPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogs/AuditLogsPage';
import { useAuth } from './context/AuthContext';

export const AppContent: React.FC = () => {
  const { currentUser, isInstructor, canCreateObservation, canManageTemplates } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Auto-route instructors to the instructor portal if on restricted tab
  useEffect(() => {
    if (isInstructor) {
      if (currentTab === 'dashboard' || currentTab === 'create-observation' || currentTab === 'criteria-management') {
        setCurrentTab('instructor-portal');
      }
    } else {
      if (currentTab === 'instructor-portal' && currentUser?.roleType === 'EDUCATION_MANAGER') {
        // keep or switch
      }
    }
  }, [currentUser, isInstructor]);

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'observations':
        return <ObservationsPage onNavigateToCreate={() => setCurrentTab('create-observation')} />;
      case 'create-observation':
        return (
          <CreateObservationPage
            onObservationCreated={(obsId) => {
              setCurrentTab('observations');
            }}
          />
        );
      case 'criteria-management':
        return <CriteriaManagementPage />;
      case 'instructor-portal':
        return <InstructorPortalPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarOpen ? 'pl-64' : 'pl-20'
        }`}
      >
        <Header
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
