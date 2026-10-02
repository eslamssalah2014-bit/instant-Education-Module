export type RoleType = 'EDUCATION_MANAGER' | 'HEAD_OF_TRACK' | 'QA_TEAM' | 'INSTRUCTOR';

export type ObservationType = 'TECHNICAL' | 'NON_TECHNICAL';

export type ObservationStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'ARCHIVED';

export type InstructorStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'INACTIVE';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roleType: RoleType;
  phone?: string;
  department?: string;
  trackId?: string; // If Head of Track, assigned track ID
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: RoleType;
  displayName: string;
  description: string;
  permissions: string[];
}

export interface Track {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  headUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  id: string;
  userId: string;
  user?: User;
  employeeId: string;
  trackId: string;
  track?: Track;
  title: string;
  specialization: string;
  hireDate: string;
  status: InstructorStatus;
  averageScore: number;
  totalObserved: number;
  lastObservedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  trackId: string;
  track?: Track;
  instructorId: string;
  instructor?: Instructor;
  term: string;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationCriterion {
  id: string;
  templateVersionId: string;
  name: string;
  description: string;
  weightPercentage: number; // 0 - 100
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: string; // e.g. "v1.0"
  changeLog: string;
  createdById: string;
  createdBy?: User;
  isActive: boolean;
  criteria: ObservationCriterion[];
  createdAt: string;
}

export interface ObservationTemplate {
  id: string;
  code: string;
  name: string;
  type: ObservationType;
  description: string;
  isActive: boolean;
  isArchived: boolean;
  currentVersionId?: string;
  currentVersion?: ObservationTemplateVersion;
  versions?: ObservationTemplateVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface ObservationScore {
  id: string;
  observationId: string;
  criterionId: string;
  criterionName: string;
  score: number; // 1 - 10
  weight: number; // e.g. 20%
  weightedScore: number; // (score / 10) * weight
  feedback: string;
  createdAt: string;
}

export interface ObservationFeedback {
  id: string;
  observationId: string;
  generalComments: string;
  strengths: string;
  areasForImprovement: string;
  recommendations: string;
  createdAt: string;
  updatedAt: string;
}

export interface Observation {
  id: string;
  observationCode: string;
  templateVersionId: string;
  templateVersion?: ObservationTemplateVersion;
  type: ObservationType;
  instructorId: string;
  instructor?: Instructor;
  observerId: string;
  observer?: User;
  groupId: string;
  group?: Group;
  trackId: string;
  track?: Track;
  observationDate: string;
  status: ObservationStatus;
  totalScore: number;       // Average of criteria scores (1-10)
  weightedScore: number;    // Weighted score (out of 100)
  percentageScore: number;  // Percentage score (0 - 100%)
  grade?: string;           // "Outstanding" (90-100), "Proficient" (80-89), "Developing" (70-79), "Needs Attention" (<70)
  scores?: ObservationScore[];
  feedback?: ObservationFeedback;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'OBSERVATION_SUBMITTED' | 'FEEDBACK_READY' | 'REPORT_READY' | 'CRITERIA_UPDATED';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: RoleType;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}
