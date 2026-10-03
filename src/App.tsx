import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { InstructorsPage } from './pages/Instructors/InstructorsPage';
import { ObservationsPage } from './pages/Observations/ObservationsPage';
import { CreateObservationPage } from './pages/CreateObservation/CreateObservationPage';
import { KpiManagementPage } from './pages/KpiManagement/KpiManagementPage';
import { CoachingPage } from './pages/Coaching/CoachingPage';
import { FeedbackQualityPage } from './pages/FeedbackQuality/FeedbackQualityPage';
import { CriteriaManagementPage } from './pages/CriteriaManagement/CriteriaManagementPage';
import { GroupsManagementPage } from './pages/Groups/GroupsManagementPage';
import { InstructorPortalPage } from './pages/InstructorPortal/InstructorPortalPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogs/AuditLogsPage';
import { useAuth } from './context/AuthContext';
import { Observation } from './types';

export const AppContent: React.FC = () => {
  const { currentUser, isInstructor } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [observationTarget, setObservationTarget] = useState<{ teacherId?: string; groupId?: string; sessionId?: string } | null>(null);

  // Auto-route instructors to instructor portal if visiting restricted manager screens
  useEffect(() => {
    if (isInstructor) {
      if (
        currentTab === 'dashboard' ||
        currentTab === 'create-observation' ||
        currentTab === 'criteria-management' ||
        currentTab === 'instructors' ||
        currentTab === 'groups' ||
        currentTab === 'audit-logs'
      ) {
        setCurrentTab('instructor-portal');
      }
    }
  }, [currentUser, isInstructor]);

  const handleEditObservation = (obs: Observation) => {
    setEditingObservation(obs);
    setObservationTarget(null);
    setCurrentTab('create-observation');
  };

  const handleFinishObservation = () => {
    setEditingObservation(null);
    setObservationTarget(null);
    setCurrentTab('observations');
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigateToInstructors={() => setCurrentTab('instructors')}
            onNavigateToObservations={() => setCurrentTab('observations')}
            onNavigateToCoaching={() => setCurrentTab('coaching')}
            onNavigateToGroups={() => setCurrentTab('groups')}
          />
        );
      case 'instructors':
        return (
          <InstructorsPage
            onNavigateToObservation={(instId) => {
              setEditingObservation(null);
              setObservationTarget({ teacherId: instId });
              setCurrentTab('create-observation');
            }}
            onNavigateToGroups={() => setCurrentTab('groups')}
          />
        );
      case 'groups':
        return (
          <GroupsManagementPage
            onNavigateToObservation={(teacherId, groupId, sessionId) => {
              setEditingObservation(null);
              setObservationTarget({ teacherId, groupId, sessionId });
              setCurrentTab('create-observation');
            }}
          />
        );
      case 'observations':
        return (
          <ObservationsPage
            onNavigateToCreate={() => {
              setEditingObservation(null);
              setObservationTarget(null);
              setCurrentTab('create-observation');
            }}
            onNavigateToEdit={handleEditObservation}
          />
        );
      case 'create-observation':
        return (
          <CreateObservationPage
            editingObservation={editingObservation}
            initialTeacherId={observationTarget?.teacherId}
            initialGroupId={observationTarget?.groupId}
            initialSessionId={observationTarget?.sessionId}
            onObservationCreated={handleFinishObservation}
            onCancel={() => {
              setEditingObservation(null);
              setObservationTarget(null);
              setCurrentTab('observations');
            }}
          />
        );
      case 'kpis':
        return <KpiManagementPage />;
      case 'coaching':
        return <CoachingPage />;
      case 'feedback-quality':
        return <FeedbackQualityPage />;
      case 'criteria-management':
        return <CriteriaManagementPage />;
      case 'instructor-portal':
        return <InstructorPortalPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      default:
        return (
          <DashboardPage
            onNavigateToInstructors={() => setCurrentTab('instructors')}
            onNavigateToObservations={() => setCurrentTab('observations')}
            onNavigateToCoaching={() => setCurrentTab('coaching')}
            onNavigateToGroups={() => setCurrentTab('groups')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'create-observation') {
            setEditingObservation(null);
            setObservationTarget(null);
          }
          setCurrentTab(tab);
        }}
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
          onNavigate={(tab) => {
            if (tab !== 'create-observation') {
              setEditingObservation(null);
              setObservationTarget(null);
            }
            setCurrentTab(tab);
          }}
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
