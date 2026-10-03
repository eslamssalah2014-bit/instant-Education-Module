import fs from 'fs';
import path from 'path';
import {
  User,
  Role,
  Track,
  Instructor,
  Group,
  ObservationTemplate,
  ObservationTemplateVersion,
  ObservationCriterion,
  Observation,
  ObservationScore,
  ObservationFeedback,
  Notification,
  AuditLog,
  RoleType,
  ObservationType,
  ObservationStatus,
} from '../types.js';
import { calculateObservationScores } from './scoring.js';

interface StoreData {
  users: User[];
  roles: Role[];
  tracks: Track[];
  instructors: Instructor[];
  groups: Group[];
  templates: ObservationTemplate[];
  templateVersions: ObservationTemplateVersion[];
  criteria: ObservationCriterion[];
  observations: Observation[];
  scores: ObservationScore[];
  feedbacks: ObservationFeedback[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

class StorageService {
  private data: StoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StoreData {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse existing data file, initializing fresh seed data.', err);
      }
    }
    const seeded = this.generateInitialSeed();
    this.saveData(seeded);
    return seeded;
  }

  private saveData(data: StoreData = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist store data:', err);
    }
  }

  // --- Initial Seed Generation ---
  private generateInitialSeed(): StoreData {
    const roles: Role[] = [
      {
        id: 'role-em',
        name: 'EDUCATION_MANAGER',
        displayName: 'Education Manager',
        description: 'Executive management with full visibility and governance over curriculum and quality.',
        permissions: ['*'],
      },
      {
        id: 'role-hot',
        name: 'HEAD_OF_TRACK',
        displayName: 'Head of Track',
        description: 'Track leader supervising instructor performance and evaluations within their domain.',
        permissions: ['observations:create', 'observations:view_track', 'dashboard:view_track', 'analytics:view_track', 'reports:view_track'],
      },
      {
        id: 'role-qa',
        name: 'QA_TEAM',
        displayName: 'Quality Assurance Evaluator',
        description: 'Independent evaluation specialist conducting formal pedagogical & technical audits.',
        permissions: ['observations:create', 'observations:view_all', 'dashboard:view_all', 'analytics:view_all', 'reports:access', 'reports:export'],
      },
      {
        id: 'role-inst',
        name: 'INSTRUCTOR',
        displayName: 'Instructor / Faculty',
        description: 'Classroom instructor receiving feedback, observations, and recommendations.',
        permissions: ['observations:view_own', 'feedback:view_own'],
      },
    ];

    const tracks: Track[] = [
      {
        id: 'trk-fe',
        name: 'Frontend',
        code: 'TRK-FE',
        description: 'Modern Web Architecture, React, TypeScript, Performance & State Management',
        color: '#4f46e5',
        headUserId: 'usr-hot-fe',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'trk-be',
        name: 'Backend',
        code: 'TRK-BE',
        description: 'Distributed Systems, Microservices, PostgreSQL, Go, Node.js & Docker',
        color: '#0284c7',
        headUserId: 'usr-hot-be',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'trk-mob',
        name: 'Mobile',
        code: 'TRK-MOB',
        description: 'Cross-platform Mobile Engineering with React Native, Flutter & Native Bridge',
        color: '#10b981',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'trk-ai',
        name: 'AI & Data Analysis',
        code: 'TRK-AI',
        description: 'Deep Learning, LLM Pipelines, Python, PyTorch, Data Engineering & Analytics',
        color: '#8b5cf6',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'trk-sec',
        name: 'Cybersecurity',
        code: 'TRK-SEC',
        description: 'Application Security, Threat Hunting, Penetration Testing & Cloud SecOps',
        color: '#f59e0b',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'trk-uiux',
        name: 'UI/UX',
        code: 'TRK-UIUX',
        description: 'Product Design, Design Systems, Figma, Usability Testing & Design Thinking',
        color: '#ec4899',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-01-10T08:00:00.000Z',
      },
    ];

    const users: User[] = [
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
      {
        id: 'usr-hot-fe',
        email: 'alex.vance@instanterp.edu',
        name: 'Alex Vance',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        roleType: 'HEAD_OF_TRACK',
        trackId: 'trk-fe',
        phone: '+1 (555) 345-6789',
        department: 'Frontend Engineering',
        createdAt: '2026-01-05T08:00:00.000Z',
        updatedAt: '2026-01-05T08:00:00.000Z',
      },
      {
        id: 'usr-hot-be',
        email: 'elena.rostova@instanterp.edu',
        name: 'Dr. Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        roleType: 'HEAD_OF_TRACK',
        trackId: 'trk-be',
        phone: '+1 (555) 456-7890',
        department: 'Backend Architecture',
        createdAt: '2026-01-05T08:00:00.000Z',
        updatedAt: '2026-01-05T08:00:00.000Z',
      },
      {
        id: 'usr-qa-1',
        email: 'marcus.thorne@instanterp.edu',
        name: 'Marcus Thorne',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        roleType: 'QA_TEAM',
        phone: '+1 (555) 567-8901',
        department: 'Academic Quality Assurance',
        createdAt: '2026-01-06T08:00:00.000Z',
        updatedAt: '2026-01-06T08:00:00.000Z',
      },
      {
        id: 'usr-qa-2',
        email: 'layla.chen@instanterp.edu',
        name: 'Layla Chen',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        roleType: 'QA_TEAM',
        phone: '+1 (555) 678-9012',
        department: 'Academic Quality Assurance',
        createdAt: '2026-01-06T08:00:00.000Z',
        updatedAt: '2026-01-06T08:00:00.000Z',
      },
      // Instructors
      {
        id: 'usr-inst-1',
        email: 'david.miller@instanterp.edu',
        name: 'David Miller',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        roleType: 'INSTRUCTOR',
        trackId: 'trk-fe',
        phone: '+1 (555) 789-0123',
        department: 'Frontend Track',
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 'usr-inst-2',
        email: 'amira.hassan@instanterp.edu',
        name: 'Amira Hassan',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        roleType: 'INSTRUCTOR',
        trackId: 'trk-fe',
        phone: '+1 (555) 890-1234',
        department: 'Frontend Track',
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 'usr-inst-3',
        email: 'omar.farooq@instanterp.edu',
        name: 'Omar Farooq',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        roleType: 'INSTRUCTOR',
        trackId: 'trk-be',
        phone: '+1 (555) 901-2345',
        department: 'Backend Track',
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-01-15T08:00:00.000Z',
      },
      {
        id: 'usr-inst-4',
        email: 'priya.sharma@instanterp.edu',
        name: 'Priya Sharma',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        roleType: 'INSTRUCTOR',
        trackId: 'trk-mob',
        phone: '+1 (555) 012-3456',
        department: 'Mobile Track',
        createdAt: '2026-01-18T08:00:00.000Z',
        updatedAt: '2026-01-18T08:00:00.000Z',
      },
      {
        id: 'usr-inst-5',
        email: 'carlos.mendez@instanterp.edu',
        name: 'Carlos Mendez',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        roleType: 'INSTRUCTOR',
        trackId: 'trk-ai',
        phone: '+1 (555) 123-4567',
        department: 'AI & Data Track',
        createdAt: '2026-01-18T08:00:00.000Z',
        updatedAt: '2026-01-18T08:00:00.000Z',
      },
      {
        id: 'usr-inst-6',
        email: 'zane.mansoor@instanterp.edu',
        name: 'Zane Al-Mansoor',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        roleType: 'INSTRUCTOR',
        trackId: 'trk-sec',
        phone: '+1 (555) 234-5679',
        department: 'Cybersecurity Track',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
      {
        id: 'usr-inst-7',
        email: 'lisa.kim@instanterp.edu',
        name: 'Lisa Kim',
        avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80',
        roleType: 'INSTRUCTOR',
        trackId: 'trk-uiux',
        phone: '+1 (555) 345-6780',
        department: 'UI/UX Track',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-01-20T08:00:00.000Z',
      },
    ];

    const instructors: Instructor[] = [
      {
        id: 'inst-1',
        userId: 'usr-inst-1',
        employeeId: 'EMP-FE-001',
        trackId: 'trk-fe',
        title: 'Lead Frontend Instructor',
        specialization: 'React 19, TypeScript, Next.js, Web Architecture',
        hireDate: '2024-03-01T00:00:00.000Z',
        status: 'ACTIVE',
        averageScore: 9.1,
        totalObserved: 6,
        lastObservedAt: '2026-09-24T10:00:00.000Z',
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-09-24T10:00:00.000Z',
      },
      {
        id: 'inst-2',
        userId: 'usr-inst-2',
        employeeId: 'EMP-FE-002',
        trackId: 'trk-fe',
        title: 'Senior Frontend Instructor',
        specialization: 'Component Architecture, CSS Systems, Animation & Testing',
        hireDate: '2024-06-15T00:00:00.000Z',
        status: 'ACTIVE',
        averageScore: 8.7,
        totalObserved: 5,
        lastObservedAt: '2026-09-28T14:30:00.000Z',
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-09-28T14:30:00.000Z',
      },
      {
        id: 'inst-3',
        userId: 'usr-inst-3',
        employeeId: 'EMP-BE-001',
        trackId: 'trk-be',
        title: 'Staff Backend Specialist',
        specialization: 'Distributed Systems, High-Concurrency Node.js, Prisma, SQL Optimization',
        hireDate: '2023-11-01T00:00:00.000Z',
        status: 'ACTIVE',
        averageScore: 9.3,
        totalObserved: 7,
        lastObservedAt: '2026-09-25T11:00:00.000Z',
        createdAt: '2026-01-15T08:00:00.000Z',
        updatedAt: '2026-09-25T11:00:00.000Z',
      },
      {
        id: 'inst-4',
        userId: 'usr-inst-4',
        employeeId: 'EMP-MOB-001',
        trackId: 'trk-mob',
        title: 'Mobile Tech Specialist',
        specialization: 'React Native, Expo, Redux Toolkit, iOS & Android Deployment',
        hireDate: '2025-01-10T00:00:00.000Z',
        status: 'ACTIVE',
        averageScore: 8.4,
        totalObserved: 4,
        lastObservedAt: '2026-09-20T09:15:00.000Z',
        createdAt: '2026-01-18T08:00:00.000Z',
        updatedAt: '2026-09-20T09:15:00.000Z',
      },
      {
        id: 'inst-5',
        userId: 'usr-inst-5',
        employeeId: 'EMP-AI-001',
        trackId: 'trk-ai',
        title: 'Data Science & AI Mentor',
        specialization: 'PyTorch, Generative AI, RAG Systems, Advanced Pandas',
        hireDate: '2024-09-01T00:00:00.000Z',
        status: 'ACTIVE',
        averageScore: 8.9,
        totalObserved: 5,
        lastObservedAt: '2026-09-27T16:00:00.000Z',
        createdAt: '2026-01-18T08:00:00.000Z',
        updatedAt: '2026-09-27T16:00:00.000Z',
      },
      {
        id: 'inst-6',
        userId: 'usr-inst-6',
        employeeId: 'EMP-SEC-001',
        trackId: 'trk-sec',
        title: 'Security Operations Instructor',
        specialization: 'OWASP Top 10, Network Penetration, SIEM, DevSecOps',
        hireDate: '2024-02-15T00:00:00.000Z',
        status: 'ACTIVE',
        averageScore: 8.6,
        totalObserved: 4,
        lastObservedAt: '2026-09-18T13:00:00.000Z',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-09-18T13:00:00.000Z',
      },
      {
        id: 'inst-7',
        userId: 'usr-inst-7',
        employeeId: 'EMP-UI-001',
        trackId: 'trk-uiux',
        title: 'Product Design Lead Instructor',
        specialization: 'Design Tokens, User Research, Wireframing, Micro-interactions',
        hireDate: '2025-02-01T00:00:00.000Z',
        status: 'ACTIVE',
        averageScore: 9.0,
        totalObserved: 4,
        lastObservedAt: '2026-09-22T15:00:00.000Z',
        createdAt: '2026-01-20T08:00:00.000Z',
        updatedAt: '2026-09-22T15:00:00.000Z',
      },
    ];

    const groups: Group[] = [
      {
        id: 'grp-fe-14a',
        name: 'Frontend Cohort 14 - Group A',
        code: 'GRP-FE-14A',
        trackId: 'trk-fe',
        instructorId: 'inst-1',
        term: 'Q4 2026',
        studentCount: 26,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'grp-fe-14b',
        name: 'Frontend Cohort 14 - Group B',
        code: 'GRP-FE-14B',
        trackId: 'trk-fe',
        instructorId: 'inst-2',
        term: 'Q4 2026',
        studentCount: 24,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'grp-be-9',
        name: 'Backend Architecture Cohort 9',
        code: 'GRP-BE-09',
        trackId: 'trk-be',
        instructorId: 'inst-3',
        term: 'Q4 2026',
        studentCount: 22,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'grp-mob-6',
        name: 'Mobile Engineering Cohort 6',
        code: 'GRP-MOB-06',
        trackId: 'trk-mob',
        instructorId: 'inst-4',
        term: 'Q4 2026',
        studentCount: 20,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'grp-ai-5',
        name: 'AI & Data Science Cohort 5',
        code: 'GRP-AI-05',
        trackId: 'trk-ai',
        instructorId: 'inst-5',
        term: 'Q4 2026',
        studentCount: 28,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'grp-sec-8',
        name: 'Cybersecurity Analyst Cohort 8',
        code: 'GRP-SEC-08',
        trackId: 'trk-sec',
        instructorId: 'inst-6',
        term: 'Q4 2026',
        studentCount: 19,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'grp-ui-11',
        name: 'UI/UX Product Design Cohort 11',
        code: 'GRP-UI-11',
        trackId: 'trk-uiux',
        instructorId: 'inst-7',
        term: 'Q4 2026',
        studentCount: 25,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-01T08:00:00.000Z',
      },
    ];

    // Templates and Versions
    const templates: ObservationTemplate[] = [
      {
        id: 'tmpl-tech',
        code: 'TMPL-TECH-EVAL',
        name: 'Technical Observation Template',
        type: 'TECHNICAL',
        description: 'Standardized evaluation metric for assessing technical mastery, live demonstration, and code problem solving.',
        isActive: true,
        isArchived: false,
        currentVersionId: 'tmpl-ver-tech-1',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-03-01T08:00:00.000Z',
      },
      {
        id: 'tmpl-nontech',
        code: 'TMPL-NONTECH-EVAL',
        name: 'Non-Technical Observation Template',
        type: 'NON_TECHNICAL',
        description: 'Pedagogical evaluation framework for classroom management, student engagement, communication, and professionalism.',
        isActive: true,
        isArchived: false,
        currentVersionId: 'tmpl-ver-nontech-1',
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: '2026-02-15T08:00:00.000Z',
      },
    ];

    const templateVersions: ObservationTemplateVersion[] = [
      {
        id: 'tmpl-ver-tech-1',
        templateId: 'tmpl-tech',
        versionNumber: 'v1.1',
        changeLog: 'Rebalanced weights to emphasize hands-on student problem-solving support and real-world debugging workflows.',
        createdById: 'usr-em-1',
        isActive: true,
        criteria: [],
        createdAt: '2026-03-01T08:00:00.000Z',
      },
      {
        id: 'tmpl-ver-nontech-1',
        templateId: 'tmpl-nontech',
        versionNumber: 'v1.0',
        changeLog: 'Initial baseline non-technical evaluation criteria rubric across all tracks.',
        createdById: 'usr-em-1',
        isActive: true,
        criteria: [],
        createdAt: '2026-02-15T08:00:00.000Z',
      },
    ];

    const criteria: ObservationCriterion[] = [
      // Technical Criteria (v1.1) - Sum = 100%
      {
        id: 'crit-tech-1',
        templateVersionId: 'tmpl-ver-tech-1',
        name: 'Technical Knowledge',
        description: 'Demonstrates deep mastery of architectural concepts, frameworks, industry standards, and underlying runtime mechanisms.',
        weightPercentage: 25.0,
        orderIndex: 1,
        isActive: true,
        createdAt: '2026-03-01T08:00:00.000Z',
        updatedAt: '2026-03-01T08:00:00.000Z',
      },
      {
        id: 'crit-tech-2',
        templateVersionId: 'tmpl-ver-tech-1',
        name: 'Content Accuracy',
        description: 'Presents correct syntax, algorithms, design patterns, and bug-free logic with precision.',
        weightPercentage: 20.0,
        orderIndex: 2,
        isActive: true,
        createdAt: '2026-03-01T08:00:00.000Z',
        updatedAt: '2026-03-01T08:00:00.000Z',
      },
      {
        id: 'crit-tech-3',
        templateVersionId: 'tmpl-ver-tech-1',
        name: 'Practical Demonstration',
        description: 'Executes live coding effectively, articulates architectural trade-offs, and handles edge cases calmly.',
        weightPercentage: 20.0,
        orderIndex: 3,
        isActive: true,
        createdAt: '2026-03-01T08:00:00.000Z',
        updatedAt: '2026-03-01T08:00:00.000Z',
      },
      {
        id: 'crit-tech-4',
        templateVersionId: 'tmpl-ver-tech-1',
        name: 'Student Problem Solving Support',
        description: 'Patiently facilitates debugging strategies, scaffolds student thinking, and guides them towards root-cause discovery.',
        weightPercentage: 20.0,
        orderIndex: 4,
        isActive: true,
        createdAt: '2026-03-01T08:00:00.000Z',
        updatedAt: '2026-03-01T08:00:00.000Z',
      },
      {
        id: 'crit-tech-5',
        templateVersionId: 'tmpl-ver-tech-1',
        name: 'Technical Communication',
        description: 'Translates complex low-level concepts into digestible analogies and reinforces technical vocabulary.',
        weightPercentage: 15.0,
        orderIndex: 5,
        isActive: true,
        createdAt: '2026-03-01T08:00:00.000Z',
        updatedAt: '2026-03-01T08:00:00.000Z',
      },

      // Non-Technical Criteria (v1.0) - Sum = 100%
      {
        id: 'crit-nontech-1',
        templateVersionId: 'tmpl-ver-nontech-1',
        name: 'Communication Skills',
        description: 'Clear articulation, appropriate vocal variety and pacing, structured delivery, and active listening.',
        weightPercentage: 25.0,
        orderIndex: 1,
        isActive: true,
        createdAt: '2026-02-15T08:00:00.000Z',
        updatedAt: '2026-02-15T08:00:00.000Z',
      },
      {
        id: 'crit-nontech-2',
        templateVersionId: 'tmpl-ver-nontech-1',
        name: 'Student Engagement',
        description: 'Employs active learning, Socratic questioning, breakout peer programming, and reaches disengaged learners.',
        weightPercentage: 25.0,
        orderIndex: 2,
        isActive: true,
        createdAt: '2026-02-15T08:00:00.000Z',
        updatedAt: '2026-02-15T08:00:00.000Z',
      },
      {
        id: 'crit-nontech-3',
        templateVersionId: 'tmpl-ver-nontech-1',
        name: 'Classroom Management',
        description: 'Maintains an inclusive, respectful environment, moderates discussion flow, and manages chat/questions smoothly.',
        weightPercentage: 20.0,
        orderIndex: 3,
        isActive: true,
        createdAt: '2026-02-15T08:00:00.000Z',
        updatedAt: '2026-02-15T08:00:00.000Z',
      },
      {
        id: 'crit-nontech-4',
        templateVersionId: 'tmpl-ver-nontech-1',
        name: 'Time Management',
        description: 'Starts and concludes punctually, paces lecture vs hands-on practice, and leaves time for Q&A.',
        weightPercentage: 15.0,
        orderIndex: 4,
        isActive: true,
        createdAt: '2026-02-15T08:00:00.000Z',
        updatedAt: '2026-02-15T08:00:00.000Z',
      },
      {
        id: 'crit-nontech-5',
        templateVersionId: 'tmpl-ver-nontech-1',
        name: 'Professionalism',
        description: 'Preparedness, high quality deck/repository materials, empathetic rapport, and constructive feedback tone.',
        weightPercentage: 15.0,
        orderIndex: 5,
        isActive: true,
        createdAt: '2026-02-15T08:00:00.000Z',
        updatedAt: '2026-02-15T08:00:00.000Z',
      },
    ];

    // Seed Observations
    const rawObservations = [
      {
        id: 'obs-001',
        code: 'OBS-2026-0038',
        templateVersionId: 'tmpl-ver-tech-1',
        type: 'TECHNICAL' as ObservationType,
        instructorId: 'inst-1', // David Miller
        observerId: 'usr-hot-fe', // Alex Vance
        groupId: 'grp-fe-14a',
        trackId: 'trk-fe',
        date: '2026-09-24T10:00:00.000Z',
        status: 'SUBMITTED' as ObservationStatus,
        scores: [
          { critId: 'crit-tech-1', score: 9.5, fb: 'Exceptional breakdown of React Server Components and hydration cycles.' },
          { critId: 'crit-tech-2', score: 9.0, fb: 'Accurate explanation of fiber tree reconciliation.' },
          { critId: 'crit-tech-3', score: 9.5, fb: 'Live coding was flawlessly executed with zero terminal hesitation.' },
          { critId: 'crit-tech-4', score: 8.5, fb: 'Guided students patiently through build errors in their Next.js apps.' },
          { critId: 'crit-tech-5', score: 9.0, fb: 'Clear visual diagrams illustrating memory boundaries.' },
        ],
        general: 'David continues to display master-level instructional quality in advanced frontend mechanics.',
        strengths: 'Outstanding live code architecture, clear conceptual analogies, and high student confidence.',
        areas: 'Pace was slightly fast during the streaming SSR section for students newer to asynchronous streams.',
        recommendations: 'Add a 5-minute checkpoint recap after introducing complex streaming boundaries.',
      },
      {
        id: 'obs-002',
        code: 'OBS-2026-0039',
        templateVersionId: 'tmpl-ver-nontech-1',
        type: 'NON_TECHNICAL' as ObservationType,
        instructorId: 'inst-2', // Amira Hassan
        observerId: 'usr-qa-1', // Marcus Thorne
        groupId: 'grp-fe-14b',
        trackId: 'trk-fe',
        date: '2026-09-28T14:30:00.000Z',
        status: 'SUBMITTED' as ObservationStatus,
        scores: [
          { critId: 'crit-nontech-1', score: 9.0, fb: 'Very warm, articulate voice with engaging cadence.' },
          { critId: 'crit-nontech-2', score: 9.0, fb: 'Excellent utilization of Miro board polls and pair-programming rounds.' },
          { critId: 'crit-nontech-3', score: 8.5, fb: 'Classroom was very well structured with quiet students drawn in.' },
          { critId: 'crit-nontech-4', score: 8.0, fb: 'Session ran 7 minutes over scheduled end time due to extended Q&A.' },
          { critId: 'crit-nontech-5', score: 9.0, fb: 'High degree of professionalism, empathetic support for struggling learners.' },
        ],
        general: 'Engaging, pedagogical masterclass in fostering collaboration among cohort students.',
        strengths: 'Student engagement and psychological safety in the virtual classroom are tier-one.',
        areas: 'Time management during final lab wrap-up needs firmer timeboxing.',
        recommendations: 'Use an explicit visual timer during final student presentations to preserve buffer time.',
      },
      {
        id: 'obs-003',
        code: 'OBS-2026-0040',
        templateVersionId: 'tmpl-ver-tech-1',
        type: 'TECHNICAL' as ObservationType,
        instructorId: 'inst-3', // Omar Farooq
        observerId: 'usr-hot-be', // Dr. Elena Rostova
        groupId: 'grp-be-9',
        trackId: 'trk-be',
        date: '2026-09-25T11:00:00.000Z',
        status: 'SUBMITTED' as ObservationStatus,
        scores: [
          { critId: 'crit-tech-1', score: 9.5, fb: 'Deep insight into PostgreSQL transaction isolation levels and deadlocks.' },
          { critId: 'crit-tech-2', score: 9.5, fb: 'Rigorous explanations of write-ahead logging and WAL checkpoints.' },
          { critId: 'crit-tech-3', score: 9.0, fb: 'Demonstrated psql EXPLAIN ANALYZE on complex indexing queries.' },
          { critId: 'crit-tech-4', score: 9.0, fb: 'Effectively helped students diagnose connection pooling bottlenecks.' },
          { critId: 'crit-tech-5', score: 9.5, fb: 'Brilliant conceptual whiteboard diagrams.' },
        ],
        general: 'One of our strongest technical sessions this quarter. Students gained senior-level engineering heuristics.',
        strengths: 'Command of database internals, crisp explanations of high-throughput distributed systems.',
        areas: 'Ensure terminal font size is bumped 2 points higher for students on lower-resolution screens.',
        recommendations: 'Share the reproduction queries script in repository immediately after class.',
      },
      {
        id: 'obs-004',
        code: 'OBS-2026-0041',
        templateVersionId: 'tmpl-ver-tech-1',
        type: 'TECHNICAL' as ObservationType,
        instructorId: 'inst-5', // Carlos Mendez
        observerId: 'usr-em-1', // Dr. Sarah Jenkins
        groupId: 'grp-ai-5',
        trackId: 'trk-ai',
        date: '2026-09-27T16:00:00.000Z',
        status: 'SUBMITTED' as ObservationStatus,
        scores: [
          { critId: 'crit-tech-1', score: 9.0, fb: 'Solid grasp of vector embeddings, FAISS, and cosine similarity calculations.' },
          { critId: 'crit-tech-2', score: 9.0, fb: 'Accurate explanation of chunk overlap trade-offs in RAG pipelines.' },
          { critId: 'crit-tech-3', score: 8.5, fb: 'Jupyter notebook demo was comprehensive and well structured.' },
          { critId: 'crit-tech-4', score: 8.5, fb: 'Patiently guided students through CUDA out-of-memory errors.' },
          { critId: 'crit-tech-5', score: 9.5, fb: 'Superb pedagogical analogies for high-dimensional vector spaces.' },
        ],
        general: 'Carlos delivered a well-crafted modern RAG workshop that demystified generative AI workflows.',
        strengths: 'Visualizing math and spatial intuitions; encouraging student curiosity.',
        areas: 'Notebook pip installs took 10 minutes at the start; environment setup could be pre-baked.',
        recommendations: 'Provide a pre-configured Docker container or Google Colab link prior to class start.',
      },
      {
        id: 'obs-005',
        code: 'OBS-2026-0042',
        templateVersionId: 'tmpl-ver-tech-1',
        type: 'TECHNICAL' as ObservationType,
        instructorId: 'inst-4', // Priya Sharma
        observerId: 'usr-qa-2', // Layla Chen
        groupId: 'grp-mob-6',
        trackId: 'trk-mob',
        date: '2026-09-20T09:15:00.000Z',
        status: 'SUBMITTED' as ObservationStatus,
        scores: [
          { critId: 'crit-tech-1', score: 8.5, fb: 'Good command of React Native new architecture (Fabric & TurboModules).' },
          { critId: 'crit-tech-2', score: 8.5, fb: 'Accurate distinction between JS thread and UI thread.' },
          { critId: 'crit-tech-3', score: 8.0, fb: 'Encountered simulator build error which took 8 minutes to resolve live.' },
          { critId: 'crit-tech-4', score: 8.5, fb: 'Helpful hints on Android SDK pathing.' },
          { critId: 'crit-tech-5', score: 8.5, fb: 'Clear explanation of bridge vs JSI.' },
        ],
        general: 'Solid technical session on mobile architecture with practical troubleshooting tips.',
        strengths: 'Real-world deployment perspective and honest debugging demeanor.',
        areas: 'Live simulator glitches caused minor distraction in mid-session.',
        recommendations: 'Keep a warm backup emulator already compiled and running in the background.',
      },
      {
        id: 'obs-006',
        code: 'OBS-2026-0043',
        templateVersionId: 'tmpl-ver-tech-1',
        type: 'TECHNICAL' as ObservationType,
        instructorId: 'inst-6', // Zane Al-Mansoor
        observerId: 'usr-qa-1', // Marcus Thorne
        groupId: 'grp-sec-8',
        trackId: 'trk-sec',
        date: '2026-09-18T13:00:00.000Z',
        status: 'SUBMITTED' as ObservationStatus,
        scores: [
          { critId: 'crit-tech-1', score: 9.0, fb: 'Deep understanding of CSRF tokens, SameSite cookie attributes, and XSS.' },
          { critId: 'crit-tech-2', score: 8.5, fb: 'Precise demonstration of payload crafting in Burp Suite.' },
          { critId: 'crit-tech-3', score: 8.5, fb: 'Live exploit laboratory was safe and well isolated.' },
          { critId: 'crit-tech-4', score: 8.5, fb: 'Provided clear scaffolding for students finding hidden vulnerabilities.' },
          { critId: 'crit-tech-5', score: 8.5, fb: 'Emphasized ethical boundaries and responsible disclosure.' },
        ],
        general: 'High impact security laboratory that gave students hands-on offensive and defensive skills.',
        strengths: 'Ethical rigor, live tooling mastery with Burp Suite and Wireshark.',
        areas: 'Pacing was dense; a few beginners struggled to keep up with terminal shortcuts.',
        recommendations: 'Include a cheat-sheet of terminal flags in the pre-lab reading.',
      },
      {
        id: 'obs-007',
        code: 'OBS-2026-0044',
        templateVersionId: 'tmpl-ver-nontech-1',
        type: 'NON_TECHNICAL' as ObservationType,
        instructorId: 'inst-7', // Lisa Kim
        observerId: 'usr-em-1', // Dr. Sarah Jenkins
        groupId: 'grp-ui-11',
        trackId: 'trk-uiux',
        date: '2026-09-22T15:00:00.000Z',
        status: 'SUBMITTED' as ObservationStatus,
        scores: [
          { critId: 'crit-nontech-1', score: 9.5, fb: 'Articulate, inspiring presentation voice with exquisite visual slides.' },
          { critId: 'crit-nontech-2', score: 9.0, fb: 'Dynamic critique circles where every student critiqued a peer design.' },
          { critId: 'crit-nontech-3', score: 9.0, fb: 'Maintained energetic, positive, constructive studio culture.' },
          { critId: 'crit-nontech-4', score: 8.5, fb: 'Timekeeping was crisp and balanced between critique and Figma labs.' },
          { critId: 'crit-nontech-5', score: 9.0, fb: 'Exemplary professional feedback framing.' },
        ],
        general: 'Stellar design studio atmosphere that simulates a top-tier product team design critique.',
        strengths: 'Empathetic critique delivery, active student engagement, beautiful visual materials.',
        areas: 'Ensure quieter students in remote breakouts get equal floor time.',
        recommendations: 'Implement a structured 3-minute round-robin timer per presenter during critiques.',
      },
      {
        id: 'obs-008',
        code: 'OBS-2026-0045',
        templateVersionId: 'tmpl-ver-tech-1',
        type: 'TECHNICAL' as ObservationType,
        instructorId: 'inst-1', // David Miller
        observerId: 'usr-qa-2', // Layla Chen
        groupId: 'grp-fe-14a',
        trackId: 'trk-fe',
        date: '2026-08-14T10:00:00.000Z',
        status: 'SUBMITTED' as ObservationStatus,
        scores: [
          { critId: 'crit-tech-1', score: 9.0, fb: 'Strong grasp of TypeScript generics and type narrowing.' },
          { critId: 'crit-tech-2', score: 9.0, fb: 'Clear distinction between type and interface inheritance.' },
          { critId: 'crit-tech-3', score: 9.0, fb: 'Live refactoring of untyped code into type-safe modules.' },
          { critId: 'crit-tech-4', score: 8.5, fb: 'Patient answers to compiler error questions.' },
          { critId: 'crit-tech-5', score: 8.5, fb: 'Good visual aids on union vs intersection types.' },
        ],
        general: 'Excellent foundational TypeScript session that gave students genuine confidence in static typing.',
        strengths: 'Incremental complexity buildup, clean code habits.',
        areas: 'A few edge-case utility types could have used more visual breakdown.',
        recommendations: 'Provide a supplementary reference sheet on conditional types.',
      },
    ];

    const observations: Observation[] = [];
    const scores: ObservationScore[] = [];
    const feedbacks: ObservationFeedback[] = [];

    // Helper map of criteria for scoring calculations
    const criteriaMap = new Map<string, ObservationCriterion>();
    for (const c of criteria) criteriaMap.set(c.id, c);

    for (const raw of rawObservations) {
      const templateCrit = criteria.filter((c) => c.templateVersionId === raw.templateVersionId);
      const calc = calculateObservationScores(
        templateCrit,
        raw.scores.map((s) => ({ criterionId: s.critId, score: s.score, feedback: s.fb }))
      );

      const obs: Observation = {
        id: raw.id,
        observationCode: raw.code,
        templateVersionId: raw.templateVersionId,
        type: raw.type,
        instructorId: raw.instructorId,
        observerId: raw.observerId,
        groupId: raw.groupId,
        trackId: raw.trackId,
        observationDate: raw.date,
        status: raw.status,
        totalScore: calc.totalScore,
        weightedScore: calc.weightedScore,
        percentageScore: calc.percentageScore,
        grade: calc.grade,
        createdAt: raw.date,
        updatedAt: raw.date,
      };
      observations.push(obs);

      for (const item of calc.scoresWithCalculations) {
        scores.push({
          id: `score-${raw.id}-${item.criterionId}`,
          observationId: raw.id,
          criterionId: item.criterionId,
          criterionName: item.criterionName,
          score: item.score,
          weight: item.weight,
          weightedScore: item.weightedScore,
          feedback: item.feedback,
          createdAt: raw.date,
        });
      }

      feedbacks.push({
        id: `fb-${raw.id}`,
        observationId: raw.id,
        generalComments: raw.general,
        strengths: raw.strengths,
        areasForImprovement: raw.areas,
        recommendations: raw.recommendations,
        createdAt: raw.date,
        updatedAt: raw.date,
      });
    }

    const notifications: Notification[] = [
      {
        id: 'notif-1',
        userId: 'usr-inst-1',
        title: 'New Observation Report Submitted',
        message: 'Alex Vance submitted a Technical Observation for Frontend Cohort 14 - Group A. Score: 91.5%',
        type: 'OBSERVATION_SUBMITTED',
        isRead: false,
        link: '/observations/obs-001',
        createdAt: '2026-09-24T11:15:00.000Z',
      },
      {
        id: 'notif-2',
        userId: 'usr-inst-2',
        title: 'Observation Feedback Published',
        message: 'Marcus Thorne finalized observation notes and recommendations for your recent session.',
        type: 'FEEDBACK_READY',
        isRead: false,
        link: '/observations/obs-002',
        createdAt: '2026-09-28T15:00:00.000Z',
      },
      {
        id: 'notif-3',
        userId: 'usr-em-1',
        title: 'Template v1.1 Active',
        message: 'Technical Observation Template updated with rebalanced weights.',
        type: 'CRITERIA_UPDATED',
        isRead: true,
        link: '/criteria-management',
        createdAt: '2026-03-01T09:00:00.000Z',
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'log-1',
        userId: 'usr-hot-fe',
        userName: 'Alex Vance',
        userRole: 'HEAD_OF_TRACK',
        action: 'OBSERVATION_SUBMITTED',
        entity: 'Observation',
        entityId: 'obs-001',
        details: { observationCode: 'OBS-2026-0038', instructor: 'David Miller', weightedScore: 91.5 },
        ipAddress: '192.168.1.104',
        createdAt: '2026-09-24T10:15:00.000Z',
      },
      {
        id: 'log-2',
        userId: 'usr-qa-1',
        userName: 'Marcus Thorne',
        userRole: 'QA_TEAM',
        action: 'OBSERVATION_SUBMITTED',
        entity: 'Observation',
        entityId: 'obs-002',
        details: { observationCode: 'OBS-2026-0039', instructor: 'Amira Hassan', weightedScore: 87.5 },
        ipAddress: '192.168.1.112',
        createdAt: '2026-09-28T14:45:00.000Z',
      },
      {
        id: 'log-3',
        userId: 'usr-em-1',
        userName: 'Dr. Sarah Jenkins',
        userRole: 'EDUCATION_MANAGER',
        action: 'TEMPLATE_VERSION_CREATED',
        entity: 'ObservationTemplate',
        entityId: 'tmpl-tech',
        details: { versionNumber: 'v1.1', changeLog: 'Rebalanced weights to emphasize hands-on student problem-solving support.' },
        ipAddress: '192.168.1.10',
        createdAt: '2026-03-01T08:00:00.000Z',
      },
    ];

    return {
      users,
      roles,
      tracks,
      instructors,
      groups,
      templates,
      templateVersions,
      criteria,
      observations,
      scores,
      feedbacks,
      notifications,
      auditLogs,
    };
  }

  // --- Read Methods ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getTracks(): Track[] {
    return this.data.tracks;
  }

  public getTrackById(id: string): Track | undefined {
    return this.data.tracks.find((t) => t.id === id);
  }

  public getInstructors(): (Instructor & { user?: User; track?: Track })[] {
    return this.data.instructors.map((inst) => ({
      ...inst,
      user: this.data.users.find((u) => u.id === inst.userId),
      track: this.data.tracks.find((t) => t.id === inst.trackId),
    }));
  }

  public getInstructorById(id: string): (Instructor & { user?: User; track?: Track }) | undefined {
    const inst = this.data.instructors.find((i) => i.id === id);
    if (!inst) return undefined;
    return {
      ...inst,
      user: this.data.users.find((u) => u.id === inst.userId),
      track: this.data.tracks.find((t) => t.id === inst.trackId),
    };
  }

  public getInstructorByUserId(userId: string): (Instructor & { user?: User; track?: Track }) | undefined {
    const inst = this.data.instructors.find((i) => i.userId === userId);
    if (!inst) return undefined;
    return {
      ...inst,
      user: this.data.users.find((u) => u.id === inst.userId),
      track: this.data.tracks.find((t) => t.id === inst.trackId),
    };
  }

  public getGroups(): (Group & { track?: Track; instructor?: Instructor & { user?: User } })[] {
    return this.data.groups.map((grp) => {
      const inst = this.getInstructorById(grp.instructorId);
      return {
        ...grp,
        track: this.data.tracks.find((t) => t.id === grp.trackId),
        instructor: inst,
      };
    });
  }

  public getGroupsByInstructorId(instructorId: string): Group[] {
    return this.data.groups.filter((g) => g.instructorId === instructorId);
  }

  public getGroupsByTrackId(trackId: string): Group[] {
    return this.data.groups.filter((g) => g.trackId === trackId);
  }

  // --- Templates & Criteria ---
  public getTemplates(): (ObservationTemplate & { currentVersion?: ObservationTemplateVersion; versions?: ObservationTemplateVersion[] })[] {
    return this.data.templates.map((tmpl) => {
      const versions = this.data.templateVersions
        .filter((v) => v.templateId === tmpl.id)
        .map((v) => ({
          ...v,
          createdBy: this.data.users.find((u) => u.id === v.createdById),
          criteria: this.data.criteria.filter((c) => c.templateVersionId === v.id).sort((a, b) => a.orderIndex - b.orderIndex),
        }));
      const currentVersion = versions.find((v) => v.id === tmpl.currentVersionId) || versions[0];
      return {
        ...tmpl,
        currentVersion,
        versions,
      };
    });
  }

  public getTemplateById(id: string): (ObservationTemplate & { currentVersion?: ObservationTemplateVersion; versions?: ObservationTemplateVersion[] }) | undefined {
    const templates = this.getTemplates();
    return templates.find((t) => t.id === id);
  }

  public getActiveTemplateByType(type: ObservationType): (ObservationTemplate & { currentVersion: ObservationTemplateVersion }) | undefined {
    const templates = this.getTemplates();
    const tmpl = templates.find((t) => t.type === type && t.isActive && !t.isArchived);
    if (!tmpl || !tmpl.currentVersion) return undefined;
    return tmpl as ObservationTemplate & { currentVersion: ObservationTemplateVersion };
  }

  public createTemplate(payload: {
    name: string;
    code: string;
    type: ObservationType;
    description: string;
    criteria: { name: string; description: string; weightPercentage: number; orderIndex: number }[];
    userId: string;
  }): ObservationTemplate {
    const templateId = `tmpl-${Date.now()}`;
    const versionId = `ver-${Date.now()}`;

    // Validate weights sum to 100%
    const totalWeight = payload.criteria.reduce((sum, c) => sum + Number(c.weightPercentage), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Total criteria weights must equal 100%. Current sum: ${totalWeight}%`);
    }

    const template: ObservationTemplate = {
      id: templateId,
      code: payload.code.toUpperCase(),
      name: payload.name,
      type: payload.type,
      description: payload.description,
      isActive: true,
      isArchived: false,
      currentVersionId: versionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const version: ObservationTemplateVersion = {
      id: versionId,
      templateId,
      versionNumber: 'v1.0',
      changeLog: 'Initial template release',
      createdById: payload.userId,
      isActive: true,
      criteria: [],
      createdAt: new Date().toISOString(),
    };

    const newCriteria: ObservationCriterion[] = payload.criteria.map((c, idx) => ({
      id: `crit-${Date.now()}-${idx}`,
      templateVersionId: versionId,
      name: c.name,
      description: c.description,
      weightPercentage: Number(c.weightPercentage),
      orderIndex: c.orderIndex || idx + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    this.data.templates.push(template);
    this.data.templateVersions.push(version);
    this.data.criteria.push(...newCriteria);

    this.addAuditLog({
      userId: payload.userId,
      action: 'TEMPLATE_CREATED',
      entity: 'ObservationTemplate',
      entityId: templateId,
      details: { templateCode: payload.code, name: payload.name, criteriaCount: newCriteria.length },
    });

    this.saveData();
    return template;
  }

  public updateTemplateVersion(payload: {
    templateId: string;
    versionNumber: string;
    changeLog: string;
    userId: string;
    criteria: { id?: string; name: string; description: string; weightPercentage: number; orderIndex: number; isActive?: boolean }[];
  }): ObservationTemplateVersion {
    const template = this.data.templates.find((t) => t.id === payload.templateId);
    if (!template) throw new Error('Template not found');

    const totalWeight = payload.criteria.reduce((sum, c) => sum + Number(c.weightPercentage), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Total criteria weights must equal 100%. Current sum: ${totalWeight}%`);
    }

    const versionId = `ver-${Date.now()}`;
    const newVersion: ObservationTemplateVersion = {
      id: versionId,
      templateId: payload.templateId,
      versionNumber: payload.versionNumber,
      changeLog: payload.changeLog,
      createdById: payload.userId,
      isActive: true,
      criteria: [],
      createdAt: new Date().toISOString(),
    };

    // Mark previous versions as not active current version
    this.data.templateVersions
      .filter((v) => v.templateId === payload.templateId)
      .forEach((v) => (v.isActive = false));

    const newCriteria: ObservationCriterion[] = payload.criteria.map((c, idx) => ({
      id: `crit-${Date.now()}-${idx}`,
      templateVersionId: versionId,
      name: c.name,
      description: c.description,
      weightPercentage: Number(c.weightPercentage),
      orderIndex: c.orderIndex || idx + 1,
      isActive: c.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    this.data.templateVersions.push(newVersion);
    this.data.criteria.push(...newCriteria);

    template.currentVersionId = versionId;
    template.updatedAt = new Date().toISOString();

    this.addAuditLog({
      userId: payload.userId,
      action: 'TEMPLATE_VERSION_CREATED',
      entity: 'ObservationTemplate',
      entityId: payload.templateId,
      details: { versionNumber: payload.versionNumber, changeLog: payload.changeLog },
    });

    // Notify education managers & QA team
    this.addNotification({
      userId: 'usr-em-1',
      title: `Template ${template.name} Updated to ${payload.versionNumber}`,
      message: `Change log: ${payload.changeLog}`,
      type: 'CRITERIA_UPDATED',
      link: '/criteria-management',
    });

    this.saveData();
    return newVersion;
  }

  public cloneTemplate(templateId: string, userId: string): ObservationTemplate {
    const source = this.getTemplateById(templateId);
    if (!source) throw new Error('Template not found');

    const newCode = `${source.code}-COPY-${Math.floor(100 + Math.random() * 900)}`;
    const newName = `${source.name} (Copy)`;

    return this.createTemplate({
      name: newName,
      code: newCode,
      type: source.type,
      description: `Cloned from ${source.name}. ${source.description}`,
      criteria: (source.currentVersion?.criteria || []).map((c) => ({
        name: c.name,
        description: c.description,
        weightPercentage: c.weightPercentage,
        orderIndex: c.orderIndex,
      })),
      userId,
    });
  }

  public toggleTemplateStatus(templateId: string, isActive: boolean, userId: string): ObservationTemplate {
    const tmpl = this.data.templates.find((t) => t.id === templateId);
    if (!tmpl) throw new Error('Template not found');
    tmpl.isActive = isActive;
    tmpl.updatedAt = new Date().toISOString();

    this.addAuditLog({
      userId,
      action: isActive ? 'TEMPLATE_ACTIVATED' : 'TEMPLATE_DEACTIVATED',
      entity: 'ObservationTemplate',
      entityId: templateId,
      details: { isActive },
    });

    this.saveData();
    return tmpl;
  }

  public archiveTemplate(templateId: string, isArchived: boolean, userId: string): ObservationTemplate {
    const tmpl = this.data.templates.find((t) => t.id === templateId);
    if (!tmpl) throw new Error('Template not found');
    tmpl.isArchived = isArchived;
    tmpl.updatedAt = new Date().toISOString();

    this.addAuditLog({
      userId,
      action: isArchived ? 'TEMPLATE_ARCHIVED' : 'TEMPLATE_RESTORED',
      entity: 'ObservationTemplate',
      entityId: templateId,
      details: { isArchived },
    });

    this.saveData();
    return tmpl;
  }

  // --- Observations ---
  public getObservations(
    filters: {
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
    },
    currentUser?: User
  ): {
    items: Observation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    let result = this.data.observations.map((obs) => this.hydrateObservation(obs));

    // RBAC Filter Enforcement
    if (currentUser) {
      if (currentUser.roleType === 'INSTRUCTOR') {
        const inst = this.getInstructorByUserId(currentUser.id);
        result = result.filter((obs) => obs.instructorId === (inst?.id || 'none'));
      } else if (currentUser.roleType === 'HEAD_OF_TRACK' && currentUser.trackId) {
        result = result.filter((obs) => obs.trackId === currentUser.trackId);
      }
      // Education Manager and QA Team have access to view all observations
    }

    // Apply User Filters
    if (filters.teacherId) {
      result = result.filter((obs) => obs.instructorId === filters.teacherId);
    }
    if (filters.trackId) {
      result = result.filter((obs) => obs.trackId === filters.trackId);
    }
    if (filters.groupId) {
      result = result.filter((obs) => obs.groupId === filters.groupId);
    }
    if (filters.observerId) {
      result = result.filter((obs) => obs.observerId === filters.observerId);
    }
    if (filters.observationType) {
      result = result.filter((obs) => obs.type === filters.observationType);
    }
    if (filters.status) {
      result = result.filter((obs) => obs.status === filters.status);
    }
    if (filters.startDate) {
      result = result.filter((obs) => new Date(obs.observationDate) >= new Date(filters.startDate!));
    }
    if (filters.endDate) {
      result = result.filter((obs) => new Date(obs.observationDate) <= new Date(filters.endDate!));
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter((obs) => {
        const teacherName = obs.instructor?.user?.name.toLowerCase() || '';
        const groupName = obs.group?.name.toLowerCase() || '';
        const observerName = obs.observer?.name.toLowerCase() || '';
        const trackName = obs.track?.name.toLowerCase() || '';
        const code = obs.observationCode.toLowerCase();
        return (
          teacherName.includes(term) ||
          groupName.includes(term) ||
          observerName.includes(term) ||
          trackName.includes(term) ||
          code.includes(term)
        );
      });
    }

    // Sorting
    const sortBy = filters.sortBy || 'observationDate';
    const sortOrder = filters.sortOrder || 'desc';
    result.sort((a, b) => {
      let valA: any = (a as any)[sortBy];
      let valB: any = (b as any)[sortBy];
      if (sortBy === 'teacherName') {
        valA = a.instructor?.user?.name || '';
        valB = b.instructor?.user?.name || '';
      } else if (sortBy === 'groupName') {
        valA = a.group?.name || '';
        valB = b.group?.name || '';
      } else if (sortBy === 'trackName') {
        valA = a.track?.name || '';
        valB = b.track?.name || '';
      } else if (sortBy === 'observerName') {
        valA = a.observer?.name || '';
        valB = b.observer?.name || '';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = result.length;
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const items = result.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public getObservationById(id: string, currentUser?: User): Observation | undefined {
    const raw = this.data.observations.find((o) => o.id === id);
    if (!raw) return undefined;

    const obs = this.hydrateObservation(raw);

    // Permission Verification
    if (currentUser) {
      if (currentUser.roleType === 'INSTRUCTOR') {
        const inst = this.getInstructorByUserId(currentUser.id);
        if (obs.instructorId !== inst?.id) {
          throw new Error('Access denied: You can only view your own observations');
        }
      } else if (currentUser.roleType === 'HEAD_OF_TRACK' && currentUser.trackId) {
        if (obs.trackId !== currentUser.trackId) {
          throw new Error('Access denied: You can only view observations in your assigned track');
        }
      }
    }

    return obs;
  }

  public hydrateObservation(obs: Observation): Observation {
    const instructor = this.getInstructorById(obs.instructorId);
    const observer = this.getUserById(obs.observerId);
    const group = this.data.groups.find((g) => g.id === obs.groupId);
    const track = this.getTrackById(obs.trackId);
    const templateVersion = this.data.templateVersions.find((v) => v.id === obs.templateVersionId);
    const scores = this.data.scores.filter((s) => s.observationId === obs.id);
    const feedback = this.data.feedbacks.find((f) => f.observationId === obs.id);

    return {
      ...obs,
      instructor,
      observer,
      group: group
        ? {
            ...group,
            track,
            instructor,
          }
        : undefined,
      track,
      templateVersion: templateVersion
        ? {
            ...templateVersion,
            criteria: this.data.criteria.filter((c) => c.templateVersionId === templateVersion.id),
          }
        : undefined,
      scores,
      feedback,
    };
  }

  public createObservation(
    payload: {
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
    },
    observer: User
  ): Observation {
    // RBAC validation: Education Manager, Head of Track, QA Team only
    if (observer.roleType === 'INSTRUCTOR') {
      throw new Error('Instructors are not authorized to create observations');
    }

    const instructor = this.getInstructorById(payload.instructorId);
    if (!instructor) throw new Error('Instructor not found');

    const group = this.data.groups.find((g) => g.id === payload.groupId);
    if (!group) throw new Error('Group not found');

    // Head of track check
    if (observer.roleType === 'HEAD_OF_TRACK' && observer.trackId && observer.trackId !== group.trackId) {
      throw new Error('Head of Track can only create observations within their assigned track');
    }

    // Load active template version
    const template = this.getActiveTemplateByType(payload.observationType);
    if (!template || !template.currentVersion) {
      throw new Error(`Active template not found for type: ${payload.observationType}`);
    }

    const criteria = this.data.criteria.filter((c) => c.templateVersionId === template.currentVersion.id && c.isActive);
    if (criteria.length === 0) {
      throw new Error('No active criteria found in the template version');
    }

    // Live calculation
    const calc = calculateObservationScores(criteria, payload.scores);

    const obsCount = this.data.observations.length + 1;
    const observationId = `obs-${Date.now()}`;
    const observationCode = `OBS-2026-${String(obsCount).padStart(4, '0')}`;
    const observationDate = payload.observationDate || new Date().toISOString();

    const newObservation: Observation = {
      id: observationId,
      observationCode,
      templateVersionId: template.currentVersion.id,
      type: payload.observationType,
      instructorId: payload.instructorId,
      observerId: observer.id,
      groupId: payload.groupId,
      trackId: group.trackId,
      observationDate,
      status: 'SUBMITTED',
      totalScore: calc.totalScore,
      weightedScore: calc.weightedScore,
      percentageScore: calc.percentageScore,
      grade: calc.grade,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newScores: ObservationScore[] = calc.scoresWithCalculations.map((item) => ({
      id: `score-${observationId}-${item.criterionId}`,
      observationId,
      criterionId: item.criterionId,
      criterionName: item.criterionName,
      score: item.score,
      weight: item.weight,
      weightedScore: item.weightedScore,
      feedback: item.feedback,
      createdAt: new Date().toISOString(),
    }));

    const newFeedback: ObservationFeedback = {
      id: `fb-${observationId}`,
      observationId,
      generalComments: payload.feedback.generalComments,
      strengths: payload.feedback.strengths,
      areasForImprovement: payload.feedback.areasForImprovement,
      recommendations: payload.feedback.recommendations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.observations.unshift(newObservation);
    this.data.scores.push(...newScores);
    this.data.feedbacks.push(newFeedback);

    // Update Instructor Metrics
    const rawInst = this.data.instructors.find((i) => i.id === payload.instructorId);
    if (rawInst) {
      const allInstObs = this.data.observations.filter((o) => o.instructorId === rawInst.id);
      const sumScores = allInstObs.reduce((s, o) => s + o.totalScore, 0);
      rawInst.totalObserved = allInstObs.length;
      rawInst.averageScore = Number((sumScores / allInstObs.length).toFixed(2));
      rawInst.lastObservedAt = observationDate;
      rawInst.updatedAt = new Date().toISOString();
    }

    // Send Notification to Instructor
    if (instructor.user) {
      this.addNotification({
        userId: instructor.user.id,
        title: 'New Observation Recorded',
        message: `${observer.name} conducted a ${payload.observationType.replace('_', ' ')} evaluation. Grade: ${calc.grade} (${calc.percentageScore}%)`,
        type: 'OBSERVATION_SUBMITTED',
        link: `/observations/${observationId}`,
      });
    }

    // Audit Log
    this.addAuditLog({
      userId: observer.id,
      userName: observer.name,
      userRole: observer.roleType,
      action: 'OBSERVATION_CREATED',
      entity: 'Observation',
      entityId: observationId,
      details: {
        observationCode,
        instructorName: instructor.user?.name,
        trackName: group.track?.name,
        weightedScore: calc.weightedScore,
        grade: calc.grade,
      },
    });

    this.saveData();
    return this.hydrateObservation(newObservation);
  }

  // --- Executive Dashboard & Analytics ---
  public getDashboardAnalytics(currentUser?: User, trackFilter?: string) {
    let observations = this.data.observations.map((o) => this.hydrateObservation(o));
    let instructors = this.getInstructors();

    // Head of track restriction
    if (currentUser?.roleType === 'HEAD_OF_TRACK' && currentUser.trackId) {
      observations = observations.filter((o) => o.trackId === currentUser.trackId);
      instructors = instructors.filter((i) => i.trackId === currentUser.trackId);
    } else if (trackFilter) {
      observations = observations.filter((o) => o.trackId === trackFilter);
      instructors = instructors.filter((i) => i.trackId === trackFilter);
    }

    // Observation Metrics
    const totalObservations = observations.length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const observationsThisMonth = observations.filter((o) => new Date(o.observationDate) >= startOfMonth).length;
    const technicalObservations = observations.filter((o) => o.type === 'TECHNICAL').length;
    const nonTechnicalObservations = observations.filter((o) => o.type === 'NON_TECHNICAL').length;
    const avgScore =
      totalObservations > 0
        ? Number((observations.reduce((sum, o) => sum + o.totalScore, 0) / totalObservations).toFixed(2))
        : 0;

    // Instructor Metrics
    const totalActiveInstructors = instructors.filter((i) => i.status === 'ACTIVE').length;
    const observedInstructors = instructors.filter((i) => i.totalObserved > 0);
    const numberObservedInstructors = observedInstructors.length;
    const avgInstructorScore =
      numberObservedInstructors > 0
        ? Number((observedInstructors.reduce((sum, i) => sum + i.averageScore, 0) / numberObservedInstructors).toFixed(2))
        : 0;
    const instructorScores = observedInstructors.map((i) => i.averageScore);
    const highestInstructorScore = instructorScores.length > 0 ? Math.max(...instructorScores) : 0;
    const lowestInstructorScore = instructorScores.length > 0 ? Math.min(...instructorScores) : 0;

    // Track Analytics
    const tracks = currentUser?.roleType === 'HEAD_OF_TRACK' && currentUser.trackId
      ? this.data.tracks.filter((t) => t.id === currentUser.trackId)
      : this.data.tracks;

    const trackAnalytics = tracks.map((track) => {
      const trackObs = observations.filter((o) => o.trackId === track.id);
      const trackInsts = instructors.filter((i) => i.trackId === track.id);
      const averageScore =
        trackObs.length > 0
          ? Number((trackObs.reduce((sum, o) => sum + o.totalScore, 0) / trackObs.length).toFixed(2))
          : 0;
      
      return {
        trackId: track.id,
        trackName: track.name,
        trackCode: track.code,
        color: track.color,
        averageScore,
        percentageScore: Number((averageScore * 10).toFixed(1)),
        numberObservations: trackObs.length,
        numberInstructors: trackInsts.length,
        performanceTrend: averageScore >= 9.0 ? 'Exceptional' : averageScore >= 8.5 ? 'Strong' : 'Steady',
      };
    });

    // Observer Analytics
    const observersMap = new Map<string, { observer: User; count: number; totalScore: number }>();
    for (const obs of observations) {
      if (!obs.observer) continue;
      const existing = observersMap.get(obs.observer.id) || { observer: obs.observer, count: 0, totalScore: 0 };
      existing.count += 1;
      existing.totalScore += obs.totalScore;
      observersMap.set(obs.observer.id, existing);
    }

    const observerAnalytics = Array.from(observersMap.values()).map(({ observer, count, totalScore }) => ({
      observerId: observer.id,
      observerName: observer.name,
      observerRole: observer.roleType,
      avatar: observer.avatar,
      observationsCount: count,
      averageScoreGiven: Number((totalScore / count).toFixed(2)),
      activityStatus: count >= 3 ? 'High Activity' : 'Moderate Activity',
    }));

    // Criteria Analytics
    const criteriaScoresMap = new Map<string, { criterionName: string; scores: number[] }>();
    for (const s of this.data.scores) {
      const obs = observations.find((o) => o.id === s.observationId);
      if (!obs) continue; // Respect track filter
      const existing = criteriaScoresMap.get(s.criterionName) || { criterionName: s.criterionName, scores: [] };
      existing.scores.push(s.score);
      criteriaScoresMap.set(s.criterionName, existing);
    }

    const criteriaAnalytics = Array.from(criteriaScoresMap.values()).map(({ criterionName, scores }) => {
      const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      const highest = Math.max(...scores);
      const lowest = Math.min(...scores);
      return {
        criterionName,
        averageScore: avg,
        highestScore: highest,
        lowestScore: lowest,
        evaluationsCount: scores.length,
        trend: avg >= 9.0 ? '+4.2% MoM' : avg >= 8.5 ? '+1.8% MoM' : '-0.5% MoM',
      };
    });

    // Trend Graphs / Monthly Trend
    const monthlyTrend = totalObservations > 0 ? [
      { month: 'Oct 2026', technical: technicalObservations > 0 ? 9.0 : 0, nonTechnical: nonTechnicalObservations > 0 ? 8.8 : 0, totalCount: totalObservations },
    ] : [];

    // Performance Heatmap matrix
    const heatmap = totalObservations > 0 ? tracks.map((t) => ({
      track: t.name,
      technicalKnowledge: 0,
      contentAccuracy: 0,
      practicalDemo: 0,
      studentEngagement: 0,
      classroomManagement: 0,
    })) : [];

    return {
      statsCards: {
        observationMetrics: {
          totalObservations,
          observationsThisMonth,
          technicalObservations,
          nonTechnicalObservations,
          averageObservationScore: avgScore,
        },
        instructorMetrics: {
          totalActiveInstructors,
          numberObservedInstructors,
          averageInstructorScore: avgInstructorScore,
          highestInstructorScore,
          lowestInstructorScore,
        },
      },
      trackAnalytics,
      observerAnalytics,
      criteriaAnalytics,
      monthlyTrend,
      heatmap,
    };
  }

  // --- Instructor Portal ---
  public getInstructorPortalData(userId: string) {
    const instructor = this.getInstructorByUserId(userId);
    if (!instructor) {
      throw new Error('Instructor profile not found for this user');
    }

    const observations = this.data.observations
      .filter((o) => o.instructorId === instructor.id)
      .map((o) => this.hydrateObservation(o))
      .sort((a, b) => new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime());

    const scores = observations.map((o) => o.totalScore);
    const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    return {
      instructor,
      stats: {
        numberObservations: observations.length,
        averageScore: avgScore,
        highestScore,
        lowestScore,
        lastObservationDate: observations[0]?.observationDate || null,
        status: instructor.status,
      },
      observations,
    };
  }

  // --- Advanced Reports Center ---
  public generateReport(
    reportType: 'INSTRUCTOR_PERFORMANCE' | 'TRACK_PERFORMANCE' | 'OBSERVER_PERFORMANCE' | 'MONTHLY_OBSERVATIONS' | 'CRITERIA_ANALYSIS',
    filters: { trackId?: string; startDate?: string; endDate?: string }
  ) {
    const observations = this.data.observations.map((o) => this.hydrateObservation(o));

    switch (reportType) {
      case 'INSTRUCTOR_PERFORMANCE': {
        const instructors = this.getInstructors();
        return instructors.map((inst) => {
          const instObs = observations.filter((o) => o.instructorId === inst.id);
          const avg = instObs.length > 0 ? Number((instObs.reduce((s, o) => s + o.totalScore, 0) / instObs.length).toFixed(2)) : 0;
          return {
            employeeId: inst.employeeId,
            name: inst.user?.name || 'Unknown',
            track: inst.track?.name || 'General',
            title: inst.title,
            totalObservations: instObs.length,
            averageScore: avg,
            percentageScore: Number((avg * 10).toFixed(1)),
            lastObservation: instObs[0]?.observationDate || 'N/A',
            rating: avg >= 9.0 ? 'Outstanding' : avg >= 8.0 ? 'Proficient' : 'Needs Development',
          };
        });
      }
      case 'TRACK_PERFORMANCE': {
        return this.data.tracks.map((track) => {
          const trackObs = observations.filter((o) => o.trackId === track.id);
          const trackInsts = this.data.instructors.filter((i) => i.trackId === track.id);
          const avg = trackObs.length > 0 ? Number((trackObs.reduce((s, o) => s + o.totalScore, 0) / trackObs.length).toFixed(2)) : 0;
          return {
            trackName: track.name,
            trackCode: track.code,
            activeInstructors: trackInsts.length,
            totalEvaluations: trackObs.length,
            averageScore: avg,
            performanceIndex: Number((avg * 10).toFixed(1)) + '%',
            health: avg >= 8.8 ? 'Excellent' : 'Good',
          };
        });
      }
      case 'OBSERVER_PERFORMANCE': {
        const observers = this.data.users.filter((u) => u.roleType === 'EDUCATION_MANAGER' || u.roleType === 'QA_TEAM' || u.roleType === 'HEAD_OF_TRACK');
        return observers.map((obs) => {
          const userObs = observations.filter((o) => o.observerId === obs.id);
          const avg = userObs.length > 0 ? Number((userObs.reduce((s, o) => s + o.totalScore, 0) / userObs.length).toFixed(2)) : 0;
          return {
            observerName: obs.name,
            role: obs.roleType,
            department: obs.department || 'Academic QA',
            conductedObservations: userObs.length,
            averageScoreIssued: avg,
            complianceRate: '100%',
          };
        });
      }
      case 'MONTHLY_OBSERVATIONS': {
        return [
          { month: 'June 2026', total: 15, technical: 10, nonTechnical: 5, averageScore: 8.55 },
          { month: 'July 2026', total: 18, technical: 11, nonTechnical: 7, averageScore: 8.62 },
          { month: 'August 2026', total: 22, technical: 14, nonTechnical: 8, averageScore: 8.84 },
          { month: 'September 2026', total: 25, technical: 16, nonTechnical: 9, averageScore: 9.02 },
          { month: 'October 2026', total: 8, technical: 5, nonTechnical: 3, averageScore: 9.15 },
        ];
      }
      case 'CRITERIA_ANALYSIS': {
        const map = new Map<string, number[]>();
        for (const s of this.data.scores) {
          const list = map.get(s.criterionName) || [];
          list.push(s.score);
          map.set(s.criterionName, list);
        }
        return Array.from(map.entries()).map(([criterion, scores]) => {
          const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
          return {
            criterionName: criterion,
            count: scores.length,
            averageScore: avg,
            highest: Math.max(...scores),
            lowest: Math.min(...scores),
            variance: Number((Math.max(...scores) - Math.min(...scores)).toFixed(2)),
          };
        });
      }
    }
  }

  // --- Notifications & Audit ---
  public getNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const item: Notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(item);
    this.saveData();
    return item;
  }

  public markNotificationAsRead(id: string): boolean {
    const item = this.data.notifications.find((n) => n.id === id);
    if (!item) return false;
    item.isRead = true;
    this.saveData();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.data.notifications
      .filter((n) => n.userId === userId)
      .forEach((n) => (n.isRead = true));
    this.saveData();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const item: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...log,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(item);
    this.saveData();
    return item;
  }
}

export const storage = new StorageService();
