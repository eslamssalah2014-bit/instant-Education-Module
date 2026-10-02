import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  FileCheck2,
  GraduationCap,
  BarChart3,
  ShieldAlert,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen }) => {
  const {
    currentUser,
    isEducationManager,
    isHeadOfTrack,
    isQaTeam,
    isInstructor,
    canCreateObservation,
    canManageTemplates,
    canAccessReports,
  } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: isEducationManager || isHeadOfTrack || isQaTeam,
      badge: isHeadOfTrack ? 'Track' : undefined,
    },
    {
      id: 'observations',
      label: 'Observations',
      icon: ClipboardList,
      show: true,
      badge: undefined,
    },
    {
      id: 'create-observation',
      label: 'New Observation',
      icon: PlusCircle,
      show: canCreateObservation,
      highlight: true,
    },
    {
      id: 'criteria-management',
      label: 'Criteria & Templates',
      icon: FileCheck2,
      show: canManageTemplates,
      badge: 'v1.1',
    },
    {
      id: 'instructor-portal',
      label: 'My Observations',
      icon: GraduationCap,
      show: true,
      badge: isInstructor ? 'My Portal' : undefined,
    },
    {
      id: 'reports',
      label: 'Reports Center',
      icon: BarChart3,
      show: canAccessReports,
    },
    {
      id: 'audit-logs',
      label: 'Audit Trail',
      icon: ShieldAlert,
      show: isEducationManager,
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Instant<span className="text-indigo-600 dark:text-indigo-400">ERP</span>
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Education Module
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {isOpen && (
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Academic Performance
          </div>
        )}

        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={!isOpen ? item.label : undefined}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 relative ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                } ${item.highlight && !isActive ? 'border border-dashed border-indigo-300/80 dark:border-indigo-800/80 bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-indigo-600 dark:bg-indigo-400" />
                )}
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                {isOpen && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {isOpen && item.badge && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {item.badge}
                  </span>
                )}
                {isOpen && isActive && (
                  <ChevronRight className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                )}
              </button>
            );
          })}
      </div>

      {/* User Status Card */}
      {currentUser && (
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div
            className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
              isOpen ? 'bg-slate-50 dark:bg-slate-800/40' : 'justify-center'
            }`}
          >
            <img
              src={
                currentUser.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=6366f1&color=fff`
              }
              alt={currentUser.name}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            {isOpen && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser.roleType.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
