import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Check,
  Plus,
  UserCheck,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFeedback } from '../../context/FeedbackContext';
import { api } from '../../services/api';
import { Notification } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, currentTab, onNavigate }) => {
  const { currentUser, allUsers, switchUser, canCreateObservation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError } = useFeedback();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Performance Dashboard';
      case 'observations':
        return 'Instructor Observation Records';
      case 'create-observation':
        return 'Conduct New Instructor Observation';
      case 'criteria-management':
        return 'Criteria & Evaluation Template Builder';
      case 'instructor-portal':
        return 'My Observations & Performance Portal';
      case 'reports':
        return 'Advanced Academic Reports Center';
      case 'audit-logs':
        return 'Security & Audit Logs';
      default:
        return 'Education Management';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
            {getPageTitle(currentTab)}
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Instant ERP</span>
            <span>/</span>
            <span>Education</span>
            <span>/</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400 capitalize">
              {currentTab.replace('-', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Action: New Observation */}
        {canCreateObservation && (
          <button
            onClick={() => onNavigate('create-observation')}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Observation</span>
          </button>
        )}

        {/* Full System Data Reset Button */}
        <button
          onClick={() => setShowResetModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 hover:text-rose-800 transition active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
          title="Full System Data Reset (Purge all business & test records)"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Reset System</span>
        </button>

        {/* Persona / RBAC Role Switcher */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg border border-indigo-200/80 bg-indigo-50/60 px-2.5 py-1.5 text-xs font-medium text-indigo-900 shadow-sm transition hover:bg-indigo-100 dark:border-indigo-800/80 dark:bg-indigo-950/40 dark:text-indigo-200"
            title="Switch User Persona for RBAC Testing"
          >
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <div className="text-left hidden md:block">
              <span className="block text-[10px] uppercase tracking-wider text-indigo-500 font-bold">
                Persona (RBAC)
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {currentUser?.name?.split(' ')[0]} ({currentUser?.roleType.replace('_', ' ')})
              </span>
            </div>
            <UserCheck className="h-3.5 w-3.5 text-indigo-500 md:ml-1" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Test RBAC Personas
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Switch user to experience specific role permissions and views.
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto py-1 space-y-1">
                {allUsers.map((user) => {
                  const isSelected = currentUser?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setShowRoleSwitcher(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 font-semibold'
                          : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <img
                        src={
                          user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`
                        }
                        alt={user.name}
                        className="h-7 w-7 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{user.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                              user.roleType === 'EDUCATION_MANAGER'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                : user.roleType === 'HEAD_OF_TRACK'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                : user.roleType === 'QA_TEAM'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                            }`}
                          >
                            {user.roleType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {user.department || user.email}
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No notifications yet</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`p-2.5 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        !notif.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </div>

      {/* Full Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/60 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="rounded-xl bg-rose-100 p-2.5 dark:bg-rose-950/60">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Full System Data Reset
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  Permanent clean installation wipe
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p>This action will permanently purge all business and test records from all application tables:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                <li>All Instructors, Groups, and Tracks</li>
                <li>All Observations, Scores, and Feedbacks</li>
                <li>All Coaching sessions, Action plans, and PIPs</li>
                <li>All Student feedback, KPIs, and Quality metrics</li>
                <li>All Audit logs and Notifications</li>
              </ul>
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60 text-[11px] text-slate-500">
                <strong>Kept intact:</strong> Database schema, tables, columns, relations, 4 system roles, and 1 required admin account (Dr. Sarah Jenkins).
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    await api.resetSystemData();
                    showSuccess('Full data reset completed. All business tables cleared to 0 rows.');
                    setShowResetModal(false);
                    setTimeout(() => {
                      window.location.reload();
                    }, 500);
                  } catch (err: any) {
                    showError(err.message || 'Failed to reset system data');
                    setIsResetting(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Confirm Full Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
