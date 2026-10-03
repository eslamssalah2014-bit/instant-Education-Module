import {
  User,
  Track,
  Instructor,
  Group,
  ObservationTemplate,
  ObservationTemplateVersion,
  ObservationCriterion,
  MainCriterion,
  SubCriterion,
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
// CLEAN SYSTEM STATE (DYNAMIC BUSINESS DATA PURGED)
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
export const initialKpis: KpiDefinition[] = [];
export const initialQualityMetrics: QualityMetric[] = [];

// =========================================================================
// SYSTEM CONFIGURATION: RESTORED OBSERVATION TEMPLATES & CRITERIA
// =========================================================================

// 1. Hierarchical Sub Criteria
export const initialSubCriteria: SubCriterion[] = [
  // Sub criteria for Technical - Main 1: Content Knowledge (30 Points)
  {
    id: 'sc-tech-1-1',
    mainCriterionId: 'mc-tech-1',
    name: 'Accuracy of Information',
    description: 'Presents correct syntax, algorithms, patterns, and bug-free logic with precision.',
    weightPercentage: 40, // 40% of 30 = 12 Points
    calculatedScore: 12,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'sc-tech-1-2',
    mainCriterionId: 'mc-tech-1',
    name: 'Depth of Explanation',
    description: 'Articulates underlying runtime mechanisms, memory considerations, and architectural trade-offs.',
    weightPercentage: 30, // 30% of 30 = 9 Points
    calculatedScore: 9,
    orderIndex: 2,
    isActive: true,
  },
  {
    id: 'sc-tech-1-3',
    mainCriterionId: 'mc-tech-1',
    name: 'Use of Examples',
    description: 'Incorporates realistic production examples, concrete edge-cases, and relevant code patterns.',
    weightPercentage: 30, // 30% of 30 = 9 Points
    calculatedScore: 9,
    orderIndex: 3,
    isActive: true,
  },

  // Sub criteria for Technical - Main 2: Delivery & Communication (40 Points)
  {
    id: 'sc-tech-2-1',
    mainCriterionId: 'mc-tech-2',
    name: 'Clarity of Voice',
    description: 'Clear articulation, appropriate vocal variety, audible microphone volume, and precise terminology.',
    weightPercentage: 50, // 50% of 40 = 20 Points
    calculatedScore: 20,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'sc-tech-2-2',
    mainCriterionId: 'mc-tech-2',
    name: 'Pacing',
    description: 'Comfortable delivery speed allowing students to absorb code transitions and take notes.',
    weightPercentage: 25, // 25% of 40 = 10 Points
    calculatedScore: 10,
    orderIndex: 2,
    isActive: true,
  },
  {
    id: 'sc-tech-2-3',
    mainCriterionId: 'mc-tech-2',
    name: 'Body Language',
    description: 'Engaged camera presence, open demeanor, and energetic instruction.',
    weightPercentage: 25, // 25% of 40 = 10 Points
    calculatedScore: 10,
    orderIndex: 3,
    isActive: true,
  },

  // Sub criteria for Technical - Main 3: Student Engagement (30 Points)
  {
    id: 'sc-tech-3-1',
    mainCriterionId: 'mc-tech-3',
    name: 'Asking Questions',
    description: 'Frequently checks for understanding using targeted questions and prompts.',
    weightPercentage: 50, // 50% of 30 = 15 Points
    calculatedScore: 15,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'sc-tech-3-2',
    mainCriterionId: 'mc-tech-3',
    name: 'Encouraging Discussion',
    description: 'Invites student questions, facilitates peer debugging, and validates alternative approaches.',
    weightPercentage: 50, // 50% of 30 = 15 Points
    calculatedScore: 15,
    orderIndex: 2,
    isActive: true,
  },

  // Sub criteria for Non-Technical - Main 1: Pedagogical Delivery (35 Points)
  {
    id: 'sc-nontech-1-1',
    mainCriterionId: 'mc-nontech-1',
    name: 'Active Learning & Socratic Interaction',
    description: 'Uses participatory exercises and scaffolds student inquiry rather than passive lecturing.',
    weightPercentage: 50,
    calculatedScore: 17.5,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'sc-nontech-1-2',
    mainCriterionId: 'mc-nontech-1',
    name: 'Moderation & Discussion Flow',
    description: 'Manages chat questions, student turns, and breakout dynamics smoothly.',
    weightPercentage: 50,
    calculatedScore: 17.5,
    orderIndex: 2,
    isActive: true,
  },

  // Sub criteria for Non-Technical - Main 2: Communication & Empathy (35 Points)
  {
    id: 'sc-nontech-2-1',
    mainCriterionId: 'mc-nontech-2',
    name: 'Vocal Variety & Clarity',
    description: 'Engaging tone, articulate phrasing, and accessible language.',
    weightPercentage: 50,
    calculatedScore: 17.5,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'sc-nontech-2-2',
    mainCriterionId: 'mc-nontech-2',
    name: 'Empathy & Constructive Demeanor',
    description: 'Validates student struggles and delivers supportive, growth-oriented feedback.',
    weightPercentage: 50,
    calculatedScore: 17.5,
    orderIndex: 2,
    isActive: true,
  },

  // Sub criteria for Non-Technical - Main 3: Time Management (30 Points)
  {
    id: 'sc-nontech-3-1',
    mainCriterionId: 'mc-nontech-3',
    name: 'Punctuality & Agenda Adherence',
    description: 'Begins on time and follows a structured lesson agenda.',
    weightPercentage: 50,
    calculatedScore: 15,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'sc-nontech-3-2',
    mainCriterionId: 'mc-nontech-3',
    name: 'Q&A Buffer & Transition Management',
    description: 'Allocates dedicated question time without running over scheduled class finish.',
    weightPercentage: 50,
    calculatedScore: 15,
    orderIndex: 2,
    isActive: true,
  },
];

// 2. Hierarchical Main Criteria
export const initialMainCriteria: MainCriterion[] = [
  // --- Technical Template Main Criteria (Total Score = 100) ---
  {
    id: 'mc-tech-1',
    templateVersionId: 'tmpl-ver-tech-1',
    name: 'Content Knowledge',
    description: 'Demonstrates deep mastery of architectural concepts, frameworks, and precision of explanations.',
    weightPercentage: 30, // 30% of 100 = 30 points
    calculatedScore: 30,
    orderIndex: 1,
    isActive: true,
    subCriteria: initialSubCriteria.filter((sc) => sc.mainCriterionId === 'mc-tech-1'),
  },
  {
    id: 'mc-tech-2',
    templateVersionId: 'tmpl-ver-tech-1',
    name: 'Delivery & Communication',
    description: 'Clarity, pacing, live demonstration competence, and technical communication.',
    weightPercentage: 40, // 40% of 100 = 40 points
    calculatedScore: 40,
    orderIndex: 2,
    isActive: true,
    subCriteria: initialSubCriteria.filter((sc) => sc.mainCriterionId === 'mc-tech-2'),
  },
  {
    id: 'mc-tech-3',
    templateVersionId: 'tmpl-ver-tech-1',
    name: 'Student Engagement',
    description: 'Active learning, student inquiry, troubleshooting scaffolding, and discussion facilitation.',
    weightPercentage: 30, // 30% of 100 = 30 points
    calculatedScore: 30,
    orderIndex: 3,
    isActive: true,
    subCriteria: initialSubCriteria.filter((sc) => sc.mainCriterionId === 'mc-tech-3'),
  },

  // --- Non-Technical Template Main Criteria (Total Score = 100) ---
  {
    id: 'mc-nontech-1',
    templateVersionId: 'tmpl-ver-nontech-1',
    name: 'Pedagogical Delivery & Facilitation',
    description: 'Classroom moderation, active learning structure, and instructional delivery.',
    weightPercentage: 35,
    calculatedScore: 35,
    orderIndex: 1,
    isActive: true,
    subCriteria: initialSubCriteria.filter((sc) => sc.mainCriterionId === 'mc-nontech-1'),
  },
  {
    id: 'mc-nontech-2',
    templateVersionId: 'tmpl-ver-nontech-1',
    name: 'Communication & Empathy',
    description: 'Vocal variety, listening, and constructive empathetic student rapport.',
    weightPercentage: 35,
    calculatedScore: 35,
    orderIndex: 2,
    isActive: true,
    subCriteria: initialSubCriteria.filter((sc) => sc.mainCriterionId === 'mc-nontech-2'),
  },
  {
    id: 'mc-nontech-3',
    templateVersionId: 'tmpl-ver-nontech-1',
    name: 'Time & Classroom Management',
    description: 'Punctuality, pacing, schedule adherence, and Q&A timeboxing.',
    weightPercentage: 30,
    calculatedScore: 30,
    orderIndex: 3,
    isActive: true,
    subCriteria: initialSubCriteria.filter((sc) => sc.mainCriterionId === 'mc-nontech-3'),
  },
];

// 3. Flat Observation Criteria (for backwards compatibility)
export const initialCriteria: ObservationCriterion[] = [
  {
    id: 'crit-tech-1',
    templateVersionId: 'tmpl-ver-tech-1',
    name: 'Technical Knowledge & Architecture',
    description: 'Demonstrates deep mastery of architectural concepts, frameworks, and runtime mechanisms.',
    weightPercentage: 25,
    orderIndex: 1,
    isActive: true,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'crit-tech-2',
    templateVersionId: 'tmpl-ver-tech-1',
    name: 'Content Accuracy & Code Quality',
    description: 'Presents correct syntax, algorithms, design patterns, and bug-free logic with precision.',
    weightPercentage: 20,
    orderIndex: 2,
    isActive: true,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'crit-tech-3',
    templateVersionId: 'tmpl-ver-tech-1',
    name: 'Live Demonstration & Problem Solving',
    description: 'Executes live coding effectively, articulates trade-offs, and handles edge cases calmly.',
    weightPercentage: 20,
    orderIndex: 3,
    isActive: true,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'crit-tech-4',
    templateVersionId: 'tmpl-ver-tech-1',
    name: 'Student Problem Solving Support',
    description: 'Patiently facilitates debugging strategies and scaffolds student thinking.',
    weightPercentage: 20,
    orderIndex: 4,
    isActive: true,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'crit-tech-5',
    templateVersionId: 'tmpl-ver-tech-1',
    name: 'Technical Communication & Analogies',
    description: 'Translates complex low-level concepts into digestible analogies.',
    weightPercentage: 15,
    orderIndex: 5,
    isActive: true,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'crit-nontech-1',
    templateVersionId: 'tmpl-ver-nontech-1',
    name: 'Communication Skills',
    description: 'Clear articulation, appropriate vocal variety and pacing, and active listening.',
    weightPercentage: 25,
    orderIndex: 1,
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-02-15T08:00:00.000Z',
  },
  {
    id: 'crit-nontech-2',
    templateVersionId: 'tmpl-ver-nontech-1',
    name: 'Student Engagement',
    description: 'Employs active learning, questioning, and reaches disengaged learners.',
    weightPercentage: 25,
    orderIndex: 2,
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-02-15T08:00:00.000Z',
  },
  {
    id: 'crit-nontech-3',
    templateVersionId: 'tmpl-ver-nontech-1',
    name: 'Classroom Management',
    description: 'Maintains an inclusive, respectful environment and moderates discussion flow.',
    weightPercentage: 20,
    orderIndex: 3,
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-02-15T08:00:00.000Z',
  },
  {
    id: 'crit-nontech-4',
    templateVersionId: 'tmpl-ver-nontech-1',
    name: 'Time Management',
    description: 'Starts and concludes punctually, paces lecture vs hands-on practice.',
    weightPercentage: 15,
    orderIndex: 4,
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-02-15T08:00:00.000Z',
  },
  {
    id: 'crit-nontech-5',
    templateVersionId: 'tmpl-ver-nontech-1',
    name: 'Professionalism',
    description: 'Preparedness, high-quality materials, empathetic rapport, and constructive tone.',
    weightPercentage: 15,
    orderIndex: 5,
    isActive: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-02-15T08:00:00.000Z',
  },
];

// 4. Template Versions
export const initialVersions: ObservationTemplateVersion[] = [
  {
    id: 'tmpl-ver-tech-1',
    templateId: 'tmpl-tech',
    versionNumber: 'v1.0',
    changeLog: 'Standard hierarchical technical evaluation rubric (Content Knowledge, Delivery, Engagement).',
    totalScore: 100,
    createdById: 'usr-em-1',
    isActive: true,
    mainCriteria: initialMainCriteria.filter((mc) => mc.templateVersionId === 'tmpl-ver-tech-1'),
    criteria: initialCriteria.filter((c) => c.templateVersionId === 'tmpl-ver-tech-1'),
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'tmpl-ver-nontech-1',
    templateId: 'tmpl-nontech',
    versionNumber: 'v1.0',
    changeLog: 'Standard pedagogical evaluation rubric (Delivery, Communication, Time Management).',
    totalScore: 100,
    createdById: 'usr-em-1',
    isActive: true,
    mainCriteria: initialMainCriteria.filter((mc) => mc.templateVersionId === 'tmpl-ver-nontech-1'),
    criteria: initialCriteria.filter((c) => c.templateVersionId === 'tmpl-ver-nontech-1'),
    createdAt: '2026-02-15T08:00:00.000Z',
  },
];

// 5. Observation Templates
export const initialTemplates: ObservationTemplate[] = [
  {
    id: 'tmpl-tech',
    code: 'TMPL-TECH-EVAL',
    name: 'Technical Observation Template',
    type: 'TECHNICAL',
    description: 'Standardized evaluation metric for assessing technical mastery, live demonstration, and code problem solving.',
    isActive: true,
    isArchived: false,
    totalScore: 100,
    currentVersionId: 'tmpl-ver-tech-1',
    currentVersion: initialVersions[0],
    versions: [initialVersions[0]],
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-10-02T11:39:00.606Z',
  },
  {
    id: 'tmpl-nontech',
    code: 'TMPL-NONTECH-EVAL',
    name: 'Non-Technical Observation Template',
    type: 'NON_TECHNICAL',
    description: 'Pedagogical evaluation framework for classroom management, student engagement, communication, and professionalism.',
    isActive: true,
    isArchived: false,
    totalScore: 100,
    currentVersionId: 'tmpl-ver-nontech-1',
    currentVersion: initialVersions[1],
    versions: [initialVersions[1]],
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-02-15T08:00:00.000Z',
  },
];
