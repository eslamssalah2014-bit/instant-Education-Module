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
  trackId?: string;
  createdAt: string;
  updatedAt: string;
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
  weightPercentage: number;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: string;
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
  score: number;
  weight: number;
  weightedScore: number;
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
  totalScore: number;
  weightedScore: number;
  percentageScore: number;
  grade?: string;
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
  type: string;
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

export interface DashboardAnalytics {
  statsCards: {
    observationMetrics: {
      totalObservations: number;
      observationsThisMonth: number;
      technicalObservations: number;
      nonTechnicalObservations: number;
      averageObservationScore: number;
    };
    instructorMetrics: {
      totalActiveInstructors: number;
      numberObservedInstructors: number;
      averageInstructorScore: number;
      highestInstructorScore: number;
      lowestInstructorScore: number;
    };
  };
  trackAnalytics: {
    trackId: string;
    trackName: string;
    trackCode: string;
    color: string;
    averageScore: number;
    percentageScore: number;
    numberObservations: number;
    numberInstructors: number;
    performanceTrend: string;
  }[];
  observerAnalytics: {
    observerId: string;
    observerName: string;
    observerRole: string;
    avatar?: string;
    observationsCount: number;
    averageScoreGiven: number;
    activityStatus: string;
  }[];
  criteriaAnalytics: {
    criterionName: string;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    evaluationsCount: number;
    trend: string;
  }[];
  monthlyTrend: {
    month: string;
    technical: number;
    nonTechnical: number;
    totalCount: number;
  }[];
  heatmap: {
    track: string;
    technicalKnowledge: number;
    contentAccuracy: number;
    practicalDemo: number;
    studentEngagement: number;
    classroomManagement: number;
  }[];
}
