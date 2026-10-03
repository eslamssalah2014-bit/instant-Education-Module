import {
  User,
  Track,
  Instructor,
  Group,
  ObservationTemplate,
  ObservationTemplateVersion,
  ObservationCriterion,
  Observation,
  KpiDefinition,
  KpiScorecard,
  KpiMonthlyHistory,
  CoachingSession,
  InstructorImprovementPlan,
  StudentFeedbackRecord,
  QualityMetric,
  AuditLog,
} from '../types';

// =========================================================================
// SINGLE REQUIRED ADMIN SYSTEM ACCOUNT
// =========================================================================
export const initialUsers: User[] = [
  {
    id: 'usr-em-1',
    email: 'sarah.jenkins@instanterp.edu',
    name: 'Dr. Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    roleType: 'EDUCATION_MANAGER',
    phone: '+1 (555) 234-5678',
    department: 'Education Leadership',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
];

// =========================================================================
// 100% CLEAN SYSTEM STATE (ALL BUSINESS DATA PURGED)
// =========================================================================
export const initialTracks: Track[] = [];
export const initialInstructors: Instructor[] = [];
export const initialGroups: Group[] = [];
export const initialObservations: Observation[] = [];
export const initialScorecards: KpiScorecard[] = [];
export const initialKpiHistory: KpiMonthlyHistory[] = [];
export const initialCoachingSessions: CoachingSession[] = [];
export const initialImprovementPlans: InstructorImprovementPlan[] = [];
export const initialStudentFeedback: StudentFeedbackRecord[] = [];
export const initialAuditLogs: AuditLog[] = [];
export const initialCriteria: ObservationCriterion[] = [];
export const initialVersions: ObservationTemplateVersion[] = [];
export const initialTemplates: ObservationTemplate[] = [];
export const initialKpis: KpiDefinition[] = [];
export const initialQualityMetrics: QualityMetric[] = [];
