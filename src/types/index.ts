export type RoleType = 'EDUCATION_MANAGER' | 'HEAD_OF_TRACK' | 'QA_TEAM' | 'INSTRUCTOR' | 'OBSERVER';

export type ObservationType = 'TECHNICAL' | 'NON_TECHNICAL';

export type ObservationStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'ARCHIVED';

export type InstructorStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'INACTIVE';

export type InstructorTier = 'A+' | 'A' | 'B+' | 'B' | 'Needs Improvement';

export function getTierFromScore(score: number): InstructorTier {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  return 'Needs Improvement';
}

export function getTierBadgeClass(tier: InstructorTier): string {
  switch (tier) {
    case 'A+':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    case 'A':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    case 'B+':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    case 'B':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300 dark:border-orange-800';
    case 'Needs Improvement':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800';
  }
}

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
  employeeId: string; // Teacher Code (e.g. INS-0001)
  teacherCode?: string; // Alias for employeeId
  trackId: string;
  track?: Track;
  title: string;
  specialization: string;
  phone?: string;
  email?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | string;
  hireDate: string;
  status: InstructorStatus;
  averageScore: number;
  totalObserved: number;
  lastObservedAt?: string;
  tier?: InstructorTier;
  groupsCount?: number;
  groups?: Group[];
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  code: string; // e.g. GRP-001
  trackId: string;
  track?: Track;
  trackCode?: string;
  instructorId: string;
  instructor?: Instructor;
  teacherCode?: string;
  teacherName?: string;
  term?: string;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';
  studentCount: number;
  observationsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherImportRow {
  teacherCode?: string;
  teacherName: string;
  email: string;
  phone?: string;
  track: string;
  employmentType?: string;
  status?: string;
}

export interface GroupImportRow {
  groupCode: string;
  groupName: string;
  track: string;
  teacherCode: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value?: any;
  message: string;
}

export interface ImportValidationResult<T> {
  isValid: boolean;
  totalRows: number;
  validCount: number;
  errorCount: number;
  validRows: (T & { rowNumber: number; [key: string]: any })[];
  errors: ImportValidationError[];
}

export interface SubCriterion {
  id: string;
  mainCriterionId: string;
  name: string;
  description: string;
  weightPercentage: number; // percentage of parent main criterion weight (sum inside main criterion must = 100%)
  calculatedScore: number;  // (weightPercentage / 100) * mainCriterion.calculatedScore
  orderIndex: number;
  isActive: boolean;
}

export interface MainCriterion {
  id: string;
  templateVersionId: string;
  name: string;
  description: string;
  weightPercentage: number; // percentage of total observation score (sum of all main criteria must = 100%)
  calculatedScore: number;  // (weightPercentage / 100) * template.totalScore
  orderIndex: number;
  isActive: boolean;
  subCriteria: SubCriterion[];
}

export interface SubCriterionResult {
  id: string;
  observationId: string;
  mainCriterionId: string;
  subCriterionId: string;
  subCriterionName: string;
  weightPercentage: number;
  maxScore: number;
  score: number;
  feedback?: string;
}

export interface MainCriterionResult {
  id: string;
  observationId: string;
  mainCriterionId: string;
  mainCriterionName: string;
  weightPercentage: number;
  maxScore: number;
  score: number;
  percentage: number;
  subResults: SubCriterionResult[];
}

// Flat criterion maintained for backward compatibility where needed
export interface ObservationCriterion {
  id: string;
  templateVersionId: string;
  name: string;
  description: string;
  weightPercentage: number;
  orderIndex: number;
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: string;
  changeLog: string;
  totalScore: number;
  createdById: string;
  createdBy?: User;
  isActive: boolean;
  mainCriteria: MainCriterion[];
  criteria?: ObservationCriterion[];
  createdAt: string;
}

export interface ObservationTemplate {
  id: string;
  code: string;
  name: string;
  type: ObservationType;
  description: string;
  totalScore: number; // Master Total Score (e.g. 100, 50, 20, 10)
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

export interface ActionPlanItem {
  id: string;
  objective: string;
  actionSteps: string;
  deadline: string;
  assignedTo: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
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
  maxScore: number;         // Master Total Score (e.g. 100, 50, 20, 10)
  totalScore: number;       // Sum of all achieved points across main criteria
  weightedScore?: number;
  percentageScore: number;  // (totalScore / maxScore) * 100
  grade?: string;           // 'A+' | 'A' | 'B+' | 'B' | 'Needs Improvement'
  tier?: InstructorTier;
  mainResults?: MainCriterionResult[]; // Stored separately for reporting
  subResults?: SubCriterionResult[];   // Stored separately for reporting
  scores?: ObservationScore[];         // legacy compatibility
  feedback?: ObservationFeedback;
  actionPlan?: ActionPlanItem[];
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

// KPI Management
export interface KpiDefinition {
  id: string;
  code: string;
  name: string;
  category: 'PEDAGOGICAL' | 'TECHNICAL' | 'STUDENT_SUCCESS' | 'DELIVERY';
  weight: number; // Percentage, e.g. 25
  targetValue: number; // e.g. 85
  unit: string; // e.g. '%', 'pts', 'hrs'
  description: string;
}

export interface KpiScorecard {
  instructorId: string;
  instructorName: string;
  trackName: string;
  period: string; // e.g. 'Oct 2026'
  compositeScore: number; // 0-100
  tier: InstructorTier;
  kpiScores: {
    kpiId: string;
    kpiName: string;
    weight: number;
    target: number;
    actual: number;
    achieved: boolean;
  }[];
}

export interface KpiMonthlyHistory {
  month: string;
  averageKpi: number;
  targetKpi: number;
  aPlusCount: number;
  aCount: number;
  bPlusCount: number;
  bCount: number;
}

// Coaching & Development
export interface CoachingActionItem {
  id: string;
  task: string;
  targetDate: string;
  isCompleted: boolean;
}

export interface CoachingSession {
  id: string;
  instructorId: string;
  instructorName: string;
  coachId: string;
  coachName: string;
  trackId: string;
  trackName: string;
  date: string;
  focusArea: 'PEDAGOGY' | 'TECH_MASTERY' | 'STUDENT_ENGAGEMENT' | 'TIME_MANAGEMENT' | 'CURRICULUM';
  objectives: string;
  coachNotes: string;
  actionItems: CoachingActionItem[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FOLLOW_UP_REQUIRED';
  followUpDate?: string;
  createdAt: string;
}

export interface InstructorImprovementPlan {
  id: string;
  instructorId: string;
  instructorName: string;
  trackId: string;
  title: string;
  reason: string;
  startDate: string;
  targetReviewDate: string;
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'SUCCESSFUL' | 'EXTENDED';
  milestones: {
    title: string;
    deadline: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  }[];
  mentorName: string;
}

// Feedback & Quality
export interface StudentFeedbackRecord {
  id: string;
  instructorId: string;
  instructorName: string;
  trackId: string;
  trackName: string;
  groupId: string;
  groupName: string;
  submissionDate: string;
  overallRating: number; // 1 to 5
  clarityRating: number;
  engagementRating: number;
  supportRating: number;
  pacingRating: number;
  studentComments: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

export interface QualityMetric {
  id: string;
  title: string;
  value: number;
  target: number;
  change: string;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'NEEDS_ATTENTION';
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
    tierDistribution: {
      aPlus: number;
      a: number;
      bPlus: number;
      b: number;
    };
    educationWorkload?: {
      totalTeachers: number;
      totalGroups: number;
      groupsPerTeacher: number;
      observationCoveragePct: number;
      teachersWithoutGroups: number;
      groupsWithoutObservations: number;
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
    averageScore: number;
  }[];
  topInstructors: {
    id: string;
    name: string;
    avatar?: string;
    trackName: string;
    averageScore: number;
    tier: InstructorTier;
    totalObserved: number;
  }[];
  improvementInstructors: {
    id: string;
    name: string;
    avatar?: string;
    trackName: string;
    averageScore: number;
    tier: InstructorTier;
    recommendedCoaching: string;
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
