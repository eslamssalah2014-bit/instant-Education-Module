import {
  User,
  Track,
  Group,
  Instructor,
  Observation,
  ObservationTemplate,
  ObservationTemplateVersion,
  DashboardAnalytics,
  Notification,
  AuditLog,
  ObservationType,
  ObservationStatus,
} from '../types';

let currentUserId: string = localStorage.getItem('erp_active_user_id') || 'usr-em-1';

export const setApiUserId = (userId: string) => {
  currentUserId = userId;
  localStorage.setItem('erp_active_user_id', userId);
};

export const getApiUserId = () => currentUserId;

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (currentUserId) {
    headers.set('x-user-id', currentUserId);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unexpected error occurred' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const api = {
  // Auth
  getUsers: () => request<User[]>('/auth/users'),
  getCurrentUser: () => request<User>('/auth/me'),

  // Meta
  getMeta: () => request<{ tracks: Track[]; groups: Group[] }>('/meta'),

  // Dashboard
  getDashboardAnalytics: (trackId?: string) =>
    request<DashboardAnalytics>(`/dashboard/analytics${trackId ? `?trackId=${trackId}` : ''}`),

  // Observations
  getObservations: (params: {
    teacherId?: string;
    trackId?: string;
    groupId?: string;
    observerId?: string;
    observationType?: ObservationType;
    startDate?: string;
    endDate?: string;
    search?: string;
    status?: ObservationStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return request<{
      items: Observation[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/observations?${query.toString()}`);
  },

  getObservationById: (id: string) => request<Observation>(`/observations/${id}`),

  getTemplatePreview: (type: ObservationType) =>
    request<ObservationTemplate & { currentVersion: ObservationTemplateVersion }>(
      `/observations/template-preview/${type}`
    ),

  createObservation: (payload: {
    instructorId: string;
    groupId: string;
    observationType: ObservationType;
    observationDate?: string;
    scores: { criterionId: string; score: number; feedback: string }[];
    feedback: {
      generalComments: string;
      strengths: string;
      areasForImprovement: string;
      recommendations: string;
    };
  }) =>
    request<Observation>('/observations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Templates
  getTemplates: () => request<ObservationTemplate[]>('/templates'),
  getTemplateById: (id: string) => request<ObservationTemplate>(`/templates/${id}`),
  createTemplate: (data: {
    name: string;
    code: string;
    type: ObservationType;
    description: string;
    criteria: { name: string; description: string; weightPercentage: number; orderIndex: number }[];
  }) =>
    request<ObservationTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bumpTemplateVersion: (
    templateId: string,
    data: {
      versionNumber: string;
      changeLog: string;
      criteria: { name: string; description: string; weightPercentage: number; orderIndex: number; isActive?: boolean }[];
    }
  ) =>
    request<ObservationTemplateVersion>(`/templates/${templateId}/version`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cloneTemplate: (templateId: string) =>
    request<ObservationTemplate>(`/templates/${templateId}/clone`, {
      method: 'POST',
    }),
  toggleTemplateStatus: (templateId: string, isActive: boolean) =>
    request<ObservationTemplate>(`/templates/${templateId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  archiveTemplate: (templateId: string, isArchived: boolean) =>
    request<ObservationTemplate>(`/templates/${templateId}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ isArchived }),
    }),

  // Instructors
  getInstructors: () => request<(Instructor & { user?: User; track?: Track })[]>('/instructors'),
  getInstructorById: (id: string) =>
    request<Instructor & { user?: User; track?: Track }>(`/instructors/${id}`),
  getInstructorGroups: (instructorId: string) => request<Group[]>(`/instructors/${instructorId}/groups`),
  getInstructorPortalData: () =>
    request<{
      instructor: Instructor & { user?: User; track?: Track };
      stats: {
        numberObservations: number;
        averageScore: number;
        highestScore: number;
        lowestScore: number;
        lastObservationDate: string | null;
        status: string;
      };
      observations: Observation[];
    }>('/instructors/portal/me'),

  // Reports
  getReportData: (reportType: string, params: { trackId?: string; startDate?: string; endDate?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.trackId) query.append('trackId', params.trackId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    return request<{
      reportType: string;
      generatedAt: string;
      generatedBy: string;
      data: any[];
    }>(`/reports/${reportType}?${query.toString()}`);
  },

  // Notifications
  getNotifications: () => request<Notification[]>('/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
};
