import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, RoleType } from '../types';
import { api, setApiUserId, getApiUserId } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  switchUser: (userId: string) => Promise<void>;
  // Role helpers
  isEducationManager: boolean;
  isHeadOfTrack: boolean;
  isQaTeam: boolean;
  isInstructor: boolean;
  canCreateObservation: boolean;
  canManageTemplates: boolean;
  canAccessReports: boolean;
  canExportReports: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsersAndCurrent = async () => {
    try {
      setIsLoading(true);
      const users = await api.getUsers();
      setAllUsers(users);

      const activeId = getApiUserId();
      const me = users.find((u) => u.id === activeId) || users[0];
      if (me) {
        setApiUserId(me.id);
        setCurrentUser(me);
      }
    } catch (err) {
      console.error('Failed to load users context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndCurrent();
  }, []);

  const switchUser = async (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      setApiUserId(userId);
      setCurrentUser(target);
    }
  };

  const isEducationManager = currentUser?.roleType === 'EDUCATION_MANAGER';
  const isHeadOfTrack = currentUser?.roleType === 'HEAD_OF_TRACK';
  const isQaTeam = currentUser?.roleType === 'QA_TEAM';
  const isInstructor = currentUser?.roleType === 'INSTRUCTOR';

  const canCreateObservation = isEducationManager || isHeadOfTrack || isQaTeam;
  const canManageTemplates = isEducationManager;
  const canAccessReports = isEducationManager || isQaTeam || isHeadOfTrack;
  const canExportReports = isEducationManager || isQaTeam;

  const value = useMemo(
    () => ({
      currentUser,
      allUsers,
      isLoading,
      switchUser,
      isEducationManager,
      isHeadOfTrack,
      isQaTeam,
      isInstructor,
      canCreateObservation,
      canManageTemplates,
      canAccessReports,
      canExportReports,
    }),
    [currentUser, allUsers, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
