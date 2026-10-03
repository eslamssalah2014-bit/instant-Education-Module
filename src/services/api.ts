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
  MainCriterionResult,
  SubCriterionResult,
  Observation,
  ObservationType,
  ObservationStatus,
  DashboardAnalytics,
  Notification,
  AuditLog,
  KpiDefinition,
  KpiScorecard,
  KpiMonthlyHistory,
  CoachingSession,
  InstructorImprovementPlan,
  StudentFeedbackRecord,
  QualityMetric,
  InstructorTier,
  InstructorStatus,
  getTierFromScore,
} from '../types';
import { supabase } from './supabase';
import {
  initialUsers,
  initialTracks,
  initialInstructors,
  initialGroups,
  initialTemplates,
  initialVersions,
  initialCriteria,
  initialMainCriteria,
  initialSubCriteria,
  initialObservations,
  initialKpis,
  initialScorecards,
  initialKpiHistory,
  initialCoachingSessions,
  initialImprovementPlans,
  initialStudentFeedback,
  initialQualityMetrics,
  initialAuditLogs,
} from './storeData';
import { logger } from '../utils/logger';

const DB_VERSION_KEY = 'erp_storage_version';
const CURRENT_DB_VERSION = 'v200_absolute_zero_reset';

// Persistent client-side database
class LocalDatabase {
  private users: User[];
  private tracks: Track[];
  private instructors: Instructor[];
  private groups: Group[];
  private templates: ObservationTemplate[];
  private templateVersions: ObservationTemplateVersion[];
  private criteria: ObservationCriterion[];
  private mainCriteria: MainCriterion[];
  private subCriteria: SubCriterion[];
  private observations: Observation[];
  private mainResults: MainCriterionResult[];
  private subResults: SubCriterionResult[];
  private kpis: KpiDefinition[];
  private scorecards: KpiScorecard[];
  private kpiHistory: KpiMonthlyHistory[];
  private coachingSessions: CoachingSession[];
  private improvementPlans: InstructorImprovementPlan[];
  private studentFeedback: StudentFeedbackRecord[];
  private qualityMetrics: QualityMetric[];
  private auditLogs: AuditLog[];
  private notifications: Notification[] = [];
  private currentUserId: string = 'usr-em-1';

  constructor() {
    // Check if browser storage needs migration/reset to clean state
    const currentVer = localStorage.getItem(DB_VERSION_KEY);
    if (currentVer !== CURRENT_DB_VERSION) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('erp_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (_) {}
      localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
    }

    this.users = this.load('erp_users', initialUsers);
    this.tracks = this.load('erp_tracks', initialTracks);
    this.instructors = this.load('erp_instructors', initialInstructors);
    this.groups = this.load('erp_groups', initialGroups);
    this.templates = this.load('erp_templates', initialTemplates);
    this.templateVersions = this.load('erp_template_versions', initialVersions);
    this.criteria = this.load('erp_criteria', initialCriteria);
    this.mainCriteria = this.load('erp_main_criteria', initialMainCriteria);
    this.subCriteria = this.load('erp_sub_criteria', initialSubCriteria);
    this.observations = this.load('erp_observations', initialObservations);
    this.mainResults = this.load('erp_main_results', []);
    this.subResults = this.load('erp_sub_results', []);
    this.kpis = this.load('erp_kpis', initialKpis);
    this.scorecards = this.load('erp_scorecards', initialScorecards);
    this.kpiHistory = this.load('erp_kpi_history', initialKpiHistory);
    this.coachingSessions = this.load('erp_coaching_sessions', initialCoachingSessions);
    this.improvementPlans = this.load('erp_improvement_plans', initialImprovementPlans);
    this.studentFeedback = this.load('erp_student_feedback', initialStudentFeedback);
    this.qualityMetrics = this.load('erp_quality_metrics', initialQualityMetrics);
    this.auditLogs = this.load('erp_audit_logs', initialAuditLogs);

    const savedUser = localStorage.getItem('erp_active_user_id');
    if (savedUser && this.users.some((u) => u.id === savedUser)) {
      this.currentUserId = savedUser;
    } else {
      this.currentUserId = this.users[0]?.id || 'usr-em-1';
    }

    // Background sync with Supabase if online
    this.syncFromSupabase();
  }

  private load<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return defaultValue;
  }

  private save<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  private async syncFromSupabase() {
    try {
      if (!supabase) return;
      const { data: remoteObs } = await supabase.from('Observation').select('*').limit(50);
      if (remoteObs && remoteObs.length > 0) {
        const existingIds = new Set(this.observations.map((o) => o.id));
        remoteObs.forEach((r: any) => {
          if (!existingIds.has(r.id)) {
            this.observations.unshift({
              id: r.id,
              observationCode: r.observationCode || `OBS-${r.id.slice(0, 6)}`,
              templateVersionId: r.templateVersionId || 'tmpl-ver-tech-1',
              type: r.type || 'TECHNICAL',
              instructorId: r.instructorId,
              observerId: r.observerId,
              groupId: r.groupId,
              trackId: r.trackId,
              observationDate: r.observationDate || new Date().toISOString(),
              status: r.status || 'SUBMITTED',
              maxScore: r.maxScore || 100.0,
              totalScore: r.totalScore || 0.0,
              weightedScore: r.weightedScore || 0.0,
              percentageScore: r.percentageScore || 0.0,
              grade: r.grade || 'Developing',
              tier: getTierFromScore(r.percentageScore || 0.0),
              createdAt: r.createdAt || new Date().toISOString(),
              updatedAt: r.updatedAt || new Date().toISOString(),
            });
          }
        });
        this.save('erp_observations', this.observations);
      }
    } catch (e) {
      // offline or table not configured; fallback to local
    }
  }

  public setUserId(id: string) {
    this.currentUserId = id;
    localStorage.setItem('erp_active_user_id', id);
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  public logAction(action: string, entity: string, entityId?: string, details?: any) {
    const user = this.users.find((u) => u.id === this.currentUserId);
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user?.id,
      userName: user?.name || 'Authorized User',
      userRole: user?.roleType,
      action,
      entity,
      entityId,
      details,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    this.save('erp_audit_logs', this.auditLogs);
    logger.info(`AUDIT: ${action}`, { entity, entityId, details });
  }

  // --- Users ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public getCurrentUser(): User {
    return this.users.find((u) => u.id === this.currentUserId) || this.users[0];
  }

  // --- Meta ---
  public getMeta(): { tracks: Track[]; groups: Group[] } {
    return {
      tracks: [...this.tracks],
      groups: this.groups.map((g) => ({
        ...g,
        track: this.tracks.find((t) => t.id === g.trackId),
        instructor: this.instructors.find((i) => i.id === g.instructorId),
      })),
    };
  }

  // --- Groups CRUD ---
  public getGroups(): Group[] {
    return this.groups.map((g) => ({
      ...g,
      track: this.tracks.find((t) => t.id === g.trackId),
      instructor: this.instructors.find((i) => i.id === g.instructorId),
    }));
  }

  public createGroup(payload: {
    name: string;
    code?: string;
    trackId: string;
    instructorId?: string;
    studentCount?: number;
    term?: string;
  }): Group {
    if (!payload.name?.trim()) throw new Error('Cohort Group name is required.');
    if (!payload.trackId) throw new Error('Academic track is required for the cohort group.');

    const track = this.tracks.find((t) => t.id === payload.trackId);
    const trackCode = track ? track.code.replace('TRK-', '') : 'GEN';
    const groupCode = payload.code || `GRP-${trackCode}-${Math.floor(10 + Math.random() * 90)}`;

    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      name: payload.name.trim(),
      code: groupCode,
      trackId: payload.trackId,
      track,
      instructorId: payload.instructorId || '',
      term: payload.term || 'Q4 2026',
      studentCount: payload.studentCount || 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.groups.unshift(newGroup);
    this.save('erp_groups', this.groups);
    this.logAction('GROUP_CREATED', 'Group', newGroup.id, { name: newGroup.name, code: newGroup.code });
    return newGroup;
  }

  public deleteGroup(id: string): boolean {
    const idx = this.groups.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error(`Cohort group with ID ${id} not found.`);
    const grp = this.groups[idx];
    this.groups.splice(idx, 1);
    this.save('erp_groups', this.groups);
    this.logAction('GROUP_DELETED', 'Group', id, { code: grp.code });
    return true;
  }

  // --- Instructors CRUD ---
  public getInstructors(params?: { search?: string; trackId?: string; tier?: string; status?: string }): Instructor[] {
    let list = this.instructors.map((ins) => {
      const user = this.users.find((u) => u.id === ins.userId);
      const track = this.tracks.find((t) => t.id === ins.trackId);
      const tier = ins.tier || getTierFromScore(ins.averageScore);
      return {
        ...ins,
        user,
        track,
        tier,
      };
    });

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.user?.name?.toLowerCase().includes(q) ||
          i.employeeId?.toLowerCase().includes(q) ||
          i.title?.toLowerCase().includes(q) ||
          i.specialization?.toLowerCase().includes(q)
      );
    }

    if (params?.trackId) {
      list = list.filter((i) => i.trackId === params.trackId);
    }

    if (params?.tier) {
      list = list.filter((i) => i.tier === params.tier);
    }

    if (params?.status) {
      list = list.filter((i) => i.status === params.status);
    }

    return list;
  }

  public getInstructorById(id: string): {
    instructor: Instructor;
    groups: Group[];
    observations: Observation[];
    scorecard?: KpiScorecard;
    coachingSessions: CoachingSession[];
    improvementPlans: InstructorImprovementPlan[];
    studentFeedback: StudentFeedbackRecord[];
  } | null {
    const ins = this.getInstructors().find((i) => i.id === id);
    if (!ins) return null;

    const groups = this.groups.filter((g) => g.instructorId === id);
    const observations = this.getObservations({ teacherId: id }).items;
    const scorecard = this.scorecards.find((s) => s.instructorId === id);
    const coachingSessions = this.coachingSessions.filter((c) => c.instructorId === id);
    const improvementPlans = this.improvementPlans.filter((p) => p.instructorId === id);
    const studentFeedback = this.studentFeedback.filter((f) => f.instructorId === id);

    return {
      instructor: ins,
      groups,
      observations,
      scorecard,
      coachingSessions,
      improvementPlans,
      studentFeedback,
    };
  }

  public createInstructor(payload: {
    name: string;
    email: string;
    trackId: string;
    title: string;
    specialization: string;
    phone?: string;
    status?: InstructorStatus;
  }): Instructor {
    if (!payload.name?.trim()) throw new Error('Instructor Full Name is required.');
    if (!payload.email?.trim()) throw new Error('Instructor Email is required.');
    if (!payload.trackId) throw new Error('Academic Track is required.');

    // Check if email already registered
    const existing = this.users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase().trim());
    let userId = existing?.id;

    if (!existing) {
      userId = `usr-inst-${Date.now()}`;
      const newUser: User = {
        id: userId,
        email: payload.email.trim(),
        name: payload.name.trim(),
        roleType: 'INSTRUCTOR',
        phone: payload.phone || '+1 (555) 000-0000',
        department: this.tracks.find((t) => t.id === payload.trackId)?.name || 'Academic Faculty',
        trackId: payload.trackId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.save('erp_users', this.users);
    }

    const track = this.tracks.find((t) => t.id === payload.trackId);
    const trackCode = track ? track.code.replace('TRK-', '') : 'FAC';
    const randomEmp = Math.floor(100 + Math.random() * 900);
    const instId = `inst-${Date.now()}`;

    const newInstructor: Instructor = {
      id: instId,
      userId: userId!,
      user: this.users.find((u) => u.id === userId),
      employeeId: `EMP-${trackCode}-${randomEmp}`,
      trackId: payload.trackId,
      track,
      title: payload.title?.trim() || 'Academic Instructor',
      specialization: payload.specialization?.trim() || 'Core Curriculum',
      hireDate: new Date().toISOString(),
      status: payload.status || 'ACTIVE',
      averageScore: 0.0,
      totalObserved: 0,
      tier: 'B',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.instructors.unshift(newInstructor);
    this.save('erp_instructors', this.instructors);
    this.logAction('INSTRUCTOR_CREATED', 'Instructor', instId, {
      name: payload.name,
      employeeId: newInstructor.employeeId,
      track: track?.name,
    });

    return newInstructor;
  }

  public updateInstructor(
    id: string,
    updates: Partial<Instructor & { name?: string; email?: string }>
  ): Instructor {
    const idx = this.instructors.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Instructor with ID ${id} not found.`);

    const existing = this.instructors[idx];
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.averageScore !== undefined) {
      updated.tier = getTierFromScore(updates.averageScore);
    }

    // Update associated user if name or email changed
    if (updates.name || updates.email) {
      const userIdx = this.users.findIndex((u) => u.id === existing.userId);
      if (userIdx !== -1) {
        this.users[userIdx] = {
          ...this.users[userIdx],
          name: updates.name || this.users[userIdx].name,
          email: updates.email || this.users[userIdx].email,
          updatedAt: new Date().toISOString(),
        };
        this.save('erp_users', this.users);
      }
    }

    this.instructors[idx] = updated;
    this.save('erp_instructors', this.instructors);
    this.logAction('INSTRUCTOR_UPDATED', 'Instructor', id, updates);
    return updated;
  }

  public deleteInstructor(id: string): boolean {
    const idx = this.instructors.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Instructor with ID ${id} not found.`);

    const inst = this.instructors[idx];
    this.instructors.splice(idx, 1);
    this.save('erp_instructors', this.instructors);

    // Purge corresponding user if role is INSTRUCTOR
    const userIdx = this.users.findIndex((u) => u.id === inst.userId && u.roleType === 'INSTRUCTOR');
    if (userIdx !== -1) {
      this.users.splice(userIdx, 1);
      this.save('erp_users', this.users);
    }

    this.logAction('INSTRUCTOR_DELETED', 'Instructor', id, { employeeId: inst.employeeId });
    return true;
  }

  // --- Observations CRUD ---
  public getObservations(params: {
    teacherId?: string;
    trackId?: string;
    groupId?: string;
    observerId?: string;
    observationType?: ObservationType;
    startDate?: string;
    endDate?: string;
    search?: string;
    status?: ObservationStatus;
    tier?: InstructorTier;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): { items: Observation[]; total: number; page: number; limit: number; totalPages: number } {
    let list = this.observations.map((obs) => {
      const ins = this.instructors.find((i) => i.id === obs.instructorId);
      const user = ins ? this.users.find((u) => u.id === ins.userId) : undefined;
      const observer = this.users.find((u) => u.id === obs.observerId);
      const group = this.groups.find((g) => g.id === obs.groupId);
      const track = this.tracks.find((t) => t.id === obs.trackId);
      const version = this.templateVersions.find((v) => v.id === obs.templateVersionId);
      const tier = obs.tier || getTierFromScore(obs.percentageScore);

      const mainResults = (obs.mainResults && obs.mainResults.length > 0)
        ? obs.mainResults
        : this.mainResults.filter((mr) => mr.observationId === obs.id);
      const subResults = (obs.subResults && obs.subResults.length > 0)
        ? obs.subResults
        : this.subResults.filter((sr) => sr.observationId === obs.id);

      return {
        ...obs,
        instructor: ins ? { ...ins, user } : undefined,
        observer,
        group,
        track,
        templateVersion: version,
        tier,
        mainResults: mainResults.map((mr) => ({
          ...mr,
          subResults: subResults.filter((sr) => sr.mainCriterionId === mr.mainCriterionId),
        })),
        subResults,
      };
    });

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.observationCode.toLowerCase().includes(q) ||
          o.instructor?.user?.name?.toLowerCase().includes(q) ||
          o.observer?.name?.toLowerCase().includes(q) ||
          o.group?.name?.toLowerCase().includes(q)
      );
    }

    if (params.teacherId) list = list.filter((o) => o.instructorId === params.teacherId);
    if (params.trackId) list = list.filter((o) => o.trackId === params.trackId);
    if (params.groupId) list = list.filter((o) => o.groupId === params.groupId);
    if (params.observerId) list = list.filter((o) => o.observerId === params.observerId);
    if (params.observationType) list = list.filter((o) => o.type === params.observationType);
    if (params.status) list = list.filter((o) => o.status === params.status);
    if (params.tier) list = list.filter((o) => o.tier === params.tier);
    if (params.startDate) list = list.filter((o) => new Date(o.observationDate) >= new Date(params.startDate!));
    if (params.endDate) list = list.filter((o) => new Date(o.observationDate) <= new Date(params.endDate!));

    const sortBy = params.sortBy || 'observationDate';
    const sortOrder = params.sortOrder || 'desc';
    list.sort((a: any, b: any) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const page = params.page || 1;
    const limit = params.limit || 10;
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paged = list.slice((page - 1) * limit, page * limit);

    return { items: paged, total, page, limit, totalPages };
  }

  public getObservationById(id: string): Observation | null {
    const list = this.getObservations({}).items;
    return list.find((o) => o.id === id) || null;
  }

  public createObservation(payload: any): Observation {
    if (!payload.instructorId) throw new Error('Please select an instructor.');
    if (!payload.groupId) throw new Error('Please select a student cohort group.');

    const instructor = this.instructors.find((i) => i.id === payload.instructorId);
    if (!instructor) throw new Error('Instructor record does not exist.');

    // Find template and version
    let tmplVersion: ObservationTemplateVersion | undefined;
    if (payload.templateVersionId) {
      tmplVersion = this.templateVersions.find((v) => v.id === payload.templateVersionId);
    }
    if (!tmplVersion) {
      const tmpl = this.templates.find(
        (t) => t.type === (payload.observationType || 'TECHNICAL')
      ) || this.templates[0];
      if (tmpl) {
        tmplVersion = this.templateVersions.find((v) => v.id === tmpl.currentVersionId) ||
          this.templateVersions.find((v) => v.templateId === tmpl.id);
      }
    }

    const masterTotalScore = tmplVersion?.totalScore || 100;
    const currentYear = new Date().getFullYear();
    const count = this.observations.length + 1;
    const code = `OBS-${currentYear}-${String(count).padStart(4, '0')}`;
    const obsId = `obs-${Date.now()}`;

    // Hierarchical evaluation calculation
    const versionMainCriteria = tmplVersion
      ? this.mainCriteria.filter((mc) => mc.templateVersionId === tmplVersion!.id).sort((a, b) => a.orderIndex - b.orderIndex)
      : [];

    let mainResults: MainCriterionResult[] = [];
    let subResults: SubCriterionResult[] = [];
    let totalAchievedScore = 0;

    if (versionMainCriteria.length > 0) {
      let subCounter = 1;
      let mainCounter = 1;

      versionMainCriteria.forEach((mc) => {
        // Main Criterion Max Score = (weight / 100) * masterTotalScore
        const mainCalculatedScore = Number(((mc.weightPercentage / 100) * masterTotalScore).toFixed(2));
        const childSubCriteria = this.subCriteria
          .filter((sc) => sc.mainCriterionId === mc.id)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        let mainSubResults: SubCriterionResult[] = [];
        let mainAchievedScore = 0;

        childSubCriteria.forEach((sc) => {
          // Sub Criterion Max Score = (weight / 100) * mainCalculatedScore
          const subCalculatedScore = Number(((sc.weightPercentage / 100) * mainCalculatedScore).toFixed(2));

          // Match user submitted score from payload.subResults or payload.scores
          const submitted = (payload.subResults || []).find((s: any) => s.subCriterionId === sc.id) ||
            (payload.scores || []).find((s: any) => s.criterionId === sc.id || s.subCriterionId === sc.id);

          const rawScore = submitted ? Number(submitted.score || 0) : 0;
          const clampedScore = Math.min(Math.max(0, rawScore), subCalculatedScore);

          const subRes: SubCriterionResult = {
            id: `subres-${Date.now()}-${subCounter++}`,
            observationId: obsId,
            mainCriterionId: mc.id,
            subCriterionId: sc.id,
            subCriterionName: sc.name,
            weightPercentage: sc.weightPercentage,
            maxScore: subCalculatedScore,
            score: Number(clampedScore.toFixed(2)),
            feedback: submitted?.feedback || '',
          };

          mainSubResults.push(subRes);
          subResults.push(subRes);
          mainAchievedScore += subRes.score;
        });

        mainAchievedScore = Number(mainAchievedScore.toFixed(2));
        const mainPercentage = mainCalculatedScore > 0
          ? Number(((mainAchievedScore / mainCalculatedScore) * 100).toFixed(1))
          : 0;

        const mainRes: MainCriterionResult = {
          id: `mainres-${Date.now()}-${mainCounter++}`,
          observationId: obsId,
          mainCriterionId: mc.id,
          mainCriterionName: mc.name,
          weightPercentage: mc.weightPercentage,
          maxScore: mainCalculatedScore,
          score: mainAchievedScore,
          percentage: mainPercentage,
          subResults: mainSubResults,
        };

        mainResults.push(mainRes);
        totalAchievedScore += mainAchievedScore;
      });
    } else {
      // Fallback for flat criteria if any legacy
      const scoreItems = payload.scores || [];
      let weightedPercentage = 0;
      scoreItems.forEach((s: any) => {
        const crit = this.criteria.find((c) => c.id === s.criterionId);
        const weight = crit ? crit.weightPercentage : 20;
        weightedPercentage += (s.score / 10) * weight;
        totalAchievedScore += s.score;
      });
      totalAchievedScore = Number(totalAchievedScore.toFixed(2));
    }

    const finalTotalScore = Number(totalAchievedScore.toFixed(2));
    const finalPercentage = masterTotalScore > 0
      ? Number(((finalTotalScore / masterTotalScore) * 100).toFixed(1))
      : 80.0;
    const tier = getTierFromScore(finalPercentage);
    const grade = tier;

    // Legacy scores array for compatibility
    const legacyScores = subResults.map((sr, idx) => ({
      id: `score-${Date.now()}-${idx}`,
      observationId: obsId,
      criterionId: sr.subCriterionId,
      criterionName: sr.subCriterionName,
      score: sr.score,
      weight: sr.weightPercentage,
      weightedScore: sr.score,
      feedback: sr.feedback || '',
      createdAt: new Date().toISOString(),
    }));

    const newObservation: Observation = {
      id: obsId,
      observationCode: code,
      templateVersionId: tmplVersion ? tmplVersion.id : 'tmpl-ver-tech-1',
      type: payload.observationType || 'TECHNICAL',
      instructorId: payload.instructorId,
      observerId: payload.observerId || this.currentUserId,
      groupId: payload.groupId,
      trackId: instructor.trackId,
      observationDate: payload.observationDate || new Date().toISOString(),
      status: payload.status || 'SUBMITTED',
      maxScore: masterTotalScore,
      totalScore: finalTotalScore,
      weightedScore: finalPercentage,
      percentageScore: finalPercentage,
      grade,
      tier,
      mainResults,
      subResults,
      scores: legacyScores,
      feedback: {
        id: `fb-${Date.now()}`,
        observationId: obsId,
        generalComments: payload.feedback?.generalComments || '',
        strengths: payload.feedback?.strengths || '',
        areasForImprovement: payload.feedback?.areasForImprovement || '',
        recommendations: payload.feedback?.recommendations || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      actionPlan: payload.actionPlan || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.observations.unshift(newObservation);
    this.mainResults.push(...mainResults);
    this.subResults.push(...subResults);

    this.save('erp_observations', this.observations);
    this.save('erp_main_results', this.mainResults);
    this.save('erp_sub_results', this.subResults);

    // Recalculate instructor average score
    const instObs = this.observations.filter((o) => o.instructorId === instructor.id && o.status !== 'DRAFT');
    const newTotalObs = instObs.length;
    const newAvg =
      newTotalObs > 0
        ? Number((instObs.reduce((sum, o) => sum + o.percentageScore, 0) / newTotalObs).toFixed(1))
        : finalPercentage;

    this.updateInstructor(instructor.id, {
      totalObserved: newTotalObs,
      averageScore: newAvg,
      lastObservedAt: newObservation.observationDate,
    });

    this.logAction('OBSERVATION_CREATED', 'Observation', newObservation.id, {
      code: newObservation.observationCode,
      tier,
      percentageScore: finalPercentage,
      totalScore: finalTotalScore,
      maxScore: masterTotalScore,
    });

    return newObservation;
  }

  public updateObservation(id: string, payload: Partial<Observation>): Observation {
    const idx = this.observations.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error(`Observation with ID ${id} not found.`);

    const existing = this.observations[idx];
    const updated = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    if (payload.percentageScore !== undefined) {
      updated.tier = getTierFromScore(payload.percentageScore);
    }

    this.observations[idx] = updated;
    this.save('erp_observations', this.observations);
    this.logAction('OBSERVATION_UPDATED', 'Observation', id, { code: existing.observationCode });
    return updated;
  }

  public updateObservationStatus(id: string, status: ObservationStatus): Observation {
    return this.updateObservation(id, { status });
  }

  public deleteObservation(id: string): boolean {
    const idx = this.observations.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error(`Observation with ID ${id} not found.`);
    const code = this.observations[idx].observationCode;
    const instId = this.observations[idx].instructorId;

    this.observations.splice(idx, 1);
    this.mainResults = this.mainResults.filter((mr) => mr.observationId !== id);
    this.subResults = this.subResults.filter((sr) => sr.observationId !== id);

    this.save('erp_observations', this.observations);
    this.save('erp_main_results', this.mainResults);
    this.save('erp_sub_results', this.subResults);

    // Recalculate instructor statistics
    const instObs = this.observations.filter((o) => o.instructorId === instId && o.status !== 'DRAFT');
    const total = instObs.length;
    const avg = total > 0 ? Number((instObs.reduce((s, o) => s + o.percentageScore, 0) / total).toFixed(1)) : 0.0;
    this.updateInstructor(instId, {
      totalObserved: total,
      averageScore: avg,
    });

    this.logAction('OBSERVATION_DELETED', 'Observation', id, { code });
    return true;
  }

  // --- Templates CRUD ---
  public getTemplates(): ObservationTemplate[] {
    return this.templates.map((tmpl) => {
      const versions = this.templateVersions
        .filter((v) => v.templateId === tmpl.id)
        .map((v) => {
          const masterScore = v.totalScore || tmpl.totalScore || 100;
          const mainCrits = this.mainCriteria
            .filter((mc) => mc.templateVersionId === v.id)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((mc) => {
              const mainCalc = Number(((mc.weightPercentage / 100) * masterScore).toFixed(2));
              const subCrits = this.subCriteria
                .filter((sc) => sc.mainCriterionId === mc.id)
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((sc) => {
                  const subCalc = Number(((sc.weightPercentage / 100) * mainCalc).toFixed(2));
                  return {
                    ...sc,
                    calculatedScore: subCalc,
                  };
                });
              return {
                ...mc,
                calculatedScore: mainCalc,
                subCriteria: subCrits,
              };
            });

          return {
            ...v,
            totalScore: masterScore,
            mainCriteria: mainCrits,
          };
        });

      const currentVersion = versions.find((v) => v.id === tmpl.currentVersionId) || versions[0];
      return {
        ...tmpl,
        totalScore: tmpl.totalScore || 100,
        currentVersion,
        versions,
      };
    });
  }

  public getTemplatePreview(type: ObservationType): ObservationTemplate & { currentVersion: ObservationTemplateVersion } {
    const tmpls = this.getTemplates();
    const tmpl = tmpls.find((t) => t.type === type) || tmpls[0];
    if (!tmpl) {
      throw new Error(`No observation template available for type ${type}`);
    }
    return {
      ...tmpl,
      currentVersion: tmpl.currentVersion || {
        id: 'tmpl-ver-empty',
        templateId: tmpl.id,
        versionNumber: 'v1.0',
        changeLog: 'Initial release',
        totalScore: tmpl.totalScore || 100,
        createdById: this.currentUserId,
        isActive: true,
        mainCriteria: [],
        createdAt: new Date().toISOString(),
      },
    };
  }

  public createTemplate(data: {
    name: string;
    code: string;
    type: ObservationType;
    description?: string;
    totalScore?: number;
    mainCriteria?: Array<{
      name: string;
      description?: string;
      weightPercentage: number;
      subCriteria?: Array<{
        name: string;
        description?: string;
        weightPercentage: number;
      }>;
    }>;
  }): ObservationTemplate {
    if (!data.name?.trim()) throw new Error('Template name is required.');
    if (!data.code?.trim()) throw new Error('Template code is required.');

    const masterTotalScore = Number(data.totalScore) > 0 ? Number(data.totalScore) : 100;
    const id = `tmpl-${Date.now()}`;
    const verId = `tmpl-ver-${Date.now()}`;

    let builtMainCriteria: MainCriterion[] = [];
    let builtSubCriteria: SubCriterion[] = [];

    if (data.mainCriteria && data.mainCriteria.length > 0) {
      // Validate weights
      const totalMainWeight = data.mainCriteria.reduce((sum, mc) => sum + Number(mc.weightPercentage || 0), 0);
      if (Math.abs(totalMainWeight - 100) > 0.05) {
        throw new Error(`Total Main Criteria weight must equal exactly 100%. Current sum: ${totalMainWeight}%`);
      }

      data.mainCriteria.forEach((mc, mIdx) => {
        const mainId = `mc-${Date.now()}-${mIdx + 1}`;
        const mainScore = Number(((mc.weightPercentage / 100) * masterTotalScore).toFixed(2));
        const subList = mc.subCriteria || [];

        if (subList.length > 0) {
          const subWeightSum = subList.reduce((sum, sc) => sum + Number(sc.weightPercentage || 0), 0);
          if (Math.abs(subWeightSum - 100) > 0.05) {
            throw new Error(`Sub Criteria for "${mc.name}" must sum to exactly 100%. Current sum: ${subWeightSum}%`);
          }
        }

        const childSubs: SubCriterion[] = subList.map((sc, sIdx) => {
          const subId = `sc-${Date.now()}-${mIdx + 1}-${sIdx + 1}`;
          const subScore = Number(((sc.weightPercentage / 100) * mainScore).toFixed(2));
          const subCriterionObj: SubCriterion = {
            id: subId,
            mainCriterionId: mainId,
            name: sc.name.trim(),
            description: sc.description || '',
            weightPercentage: sc.weightPercentage,
            calculatedScore: subScore,
            orderIndex: sIdx + 1,
            isActive: true,
          };
          builtSubCriteria.push(subCriterionObj);
          return subCriterionObj;
        });

        builtMainCriteria.push({
          id: mainId,
          templateVersionId: verId,
          name: mc.name.trim(),
          description: mc.description || '',
          weightPercentage: mc.weightPercentage,
          calculatedScore: mainScore,
          orderIndex: mIdx + 1,
          isActive: true,
          subCriteria: childSubs,
        });
      });
    } else {
      // Default hierarchical criteria conforming to user specification:
      // Technical Competence (50% -> 50 pts) with 4 sub criteria (Teaching 40% -> 20 pts, Presentation 30% -> 15 pts, Subject 20% -> 10 pts, Problem Solving 10% -> 5 pts)
      // Student Engagement (30% -> 30 pts) with 2 sub criteria (50% -> 15 pts, 50% -> 15 pts)
      // Classroom Management (20% -> 20 pts) with 2 sub criteria (50% -> 10 pts, 50% -> 10 pts)
      const mc1Id = `mc-${Date.now()}-1`;
      const mc1Score = Number((0.50 * masterTotalScore).toFixed(2));
      const sub1: SubCriterion[] = [
        { id: `sc-${Date.now()}-1-1`, mainCriterionId: mc1Id, name: 'Teaching Skills', description: 'Pedagogical execution and learning scaffolding', weightPercentage: 40, calculatedScore: Number((0.40 * mc1Score).toFixed(2)), orderIndex: 1, isActive: true },
        { id: `sc-${Date.now()}-1-2`, mainCriterionId: mc1Id, name: 'Presentation Skills', description: 'Clarity of speech, pacing, and visual aids', weightPercentage: 30, calculatedScore: Number((0.30 * mc1Score).toFixed(2)), orderIndex: 2, isActive: true },
        { id: `sc-${Date.now()}-1-3`, mainCriterionId: mc1Id, name: 'Subject Knowledge', description: 'Technical mastery and conceptual depth', weightPercentage: 20, calculatedScore: Number((0.20 * mc1Score).toFixed(2)), orderIndex: 3, isActive: true },
        { id: `sc-${Date.now()}-1-4`, mainCriterionId: mc1Id, name: 'Problem Solving', description: 'Live coding, debugging, and answering student blockers', weightPercentage: 10, calculatedScore: Number((0.10 * mc1Score).toFixed(2)), orderIndex: 4, isActive: true },
      ];

      const mc2Id = `mc-${Date.now()}-2`;
      const mc2Score = Number((0.30 * masterTotalScore).toFixed(2));
      const sub2: SubCriterion[] = [
        { id: `sc-${Date.now()}-2-1`, mainCriterionId: mc2Id, name: 'Student Engagement & Interaction', description: 'Active questioning, checks for understanding, and discussions', weightPercentage: 50, calculatedScore: Number((0.50 * mc2Score).toFixed(2)), orderIndex: 1, isActive: true },
        { id: `sc-${Date.now()}-2-2`, mainCriterionId: mc2Id, name: 'Inclusive Participation', description: 'Ensuring all student tiers contribute and follow along', weightPercentage: 50, calculatedScore: Number((0.50 * mc2Score).toFixed(2)), orderIndex: 2, isActive: true },
      ];

      const mc3Id = `mc-${Date.now()}-3`;
      const mc3Score = Number((0.20 * masterTotalScore).toFixed(2));
      const sub3: SubCriterion[] = [
        { id: `sc-${Date.now()}-3-1`, mainCriterionId: mc3Id, name: 'Pacing & Time Management', description: 'Adheres to agenda timelines and allocates lab time', weightPercentage: 50, calculatedScore: Number((0.50 * mc3Score).toFixed(2)), orderIndex: 1, isActive: true },
        { id: `sc-${Date.now()}-3-2`, mainCriterionId: mc3Id, name: 'Classroom & Tool Readiness', description: 'IDE, repositories, and learning resources prepared', weightPercentage: 50, calculatedScore: Number((0.50 * mc3Score).toFixed(2)), orderIndex: 2, isActive: true },
      ];

      builtMainCriteria = [
        { id: mc1Id, templateVersionId: verId, name: 'Technical Competence', description: 'Technical mastery and coding demonstration', weightPercentage: 50, calculatedScore: mc1Score, orderIndex: 1, isActive: true, subCriteria: sub1 },
        { id: mc2Id, templateVersionId: verId, name: 'Student Engagement', description: 'Interactive learning and class participation', weightPercentage: 30, calculatedScore: mc2Score, orderIndex: 2, isActive: true, subCriteria: sub2 },
        { id: mc3Id, templateVersionId: verId, name: 'Communication & Management', description: 'Classroom discipline, pacing, and time allocation', weightPercentage: 20, calculatedScore: mc3Score, orderIndex: 3, isActive: true, subCriteria: sub3 },
      ];

      builtSubCriteria = [...sub1, ...sub2, ...sub3];
    }

    const newVersion: ObservationTemplateVersion = {
      id: verId,
      templateId: id,
      versionNumber: 'v1.0',
      changeLog: 'Initial hierarchical rubric release',
      totalScore: masterTotalScore,
      createdById: this.currentUserId,
      isActive: true,
      mainCriteria: builtMainCriteria,
      createdAt: new Date().toISOString(),
    };

    const newTmpl: ObservationTemplate = {
      id,
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      type: data.type,
      description: data.description || '',
      totalScore: masterTotalScore,
      isActive: true,
      isArchived: false,
      currentVersionId: verId,
      currentVersion: newVersion,
      versions: [newVersion],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.unshift(newTmpl);
    this.templateVersions.unshift(newVersion);
    this.mainCriteria.push(...builtMainCriteria);
    this.subCriteria.push(...builtSubCriteria);

    this.save('erp_templates', this.templates);
    this.save('erp_template_versions', this.templateVersions);
    this.save('erp_main_criteria', this.mainCriteria);
    this.save('erp_sub_criteria', this.subCriteria);

    this.logAction('TEMPLATE_CREATED', 'ObservationTemplate', id, {
      code: newTmpl.code,
      name: newTmpl.name,
      totalScore: masterTotalScore,
      mainCriteriaCount: builtMainCriteria.length,
    });

    return newTmpl;
  }

  public bumpTemplateVersion(
    templateId: string,
    data: {
      versionNumber: string;
      changeLog: string;
      totalScore?: number;
      mainCriteria: Array<{
        name: string;
        description?: string;
        weightPercentage: number;
        subCriteria?: Array<{
          name: string;
          description?: string;
          weightPercentage: number;
        }>;
      }>;
    }
  ): ObservationTemplateVersion {
    const tmpl = this.templates.find((t) => t.id === templateId);
    if (!tmpl) throw new Error(`Template with ID ${templateId} not found.`);

    const masterTotalScore = Number(data.totalScore) > 0 ? Number(data.totalScore) : (tmpl.totalScore || 100);

    // Validate Main Criteria sum to 100%
    const totalMainWeight = data.mainCriteria.reduce((sum, mc) => sum + Number(mc.weightPercentage || 0), 0);
    if (Math.abs(totalMainWeight - 100) > 0.05) {
      throw new Error(`Total Main Criteria weight must equal exactly 100%. Current sum: ${totalMainWeight}%`);
    }

    const verId = `tmpl-ver-${Date.now()}`;
    const builtMainCriteria: MainCriterion[] = [];
    const builtSubCriteria: SubCriterion[] = [];

    data.mainCriteria.forEach((mc, mIdx) => {
      const mainId = `mc-${Date.now()}-${mIdx + 1}`;
      const mainScore = Number(((mc.weightPercentage / 100) * masterTotalScore).toFixed(2));
      const subList = mc.subCriteria || [];

      if (subList.length > 0) {
        const subWeightSum = subList.reduce((sum, sc) => sum + Number(sc.weightPercentage || 0), 0);
        if (Math.abs(subWeightSum - 100) > 0.05) {
          throw new Error(`Sub Criteria inside "${mc.name}" must equal exactly 100%. Current sum: ${subWeightSum}%`);
        }
      }

      const childSubs: SubCriterion[] = subList.map((sc, sIdx) => {
        const subId = `sc-${Date.now()}-${mIdx + 1}-${sIdx + 1}`;
        const subScore = Number(((sc.weightPercentage / 100) * mainScore).toFixed(2));
        const subObj: SubCriterion = {
          id: subId,
          mainCriterionId: mainId,
          name: sc.name.trim(),
          description: sc.description || '',
          weightPercentage: sc.weightPercentage,
          calculatedScore: subScore,
          orderIndex: sIdx + 1,
          isActive: true,
        };
        builtSubCriteria.push(subObj);
        return subObj;
      });

      builtMainCriteria.push({
        id: mainId,
        templateVersionId: verId,
        name: mc.name.trim(),
        description: mc.description || '',
        weightPercentage: mc.weightPercentage,
        calculatedScore: mainScore,
        orderIndex: mIdx + 1,
        isActive: true,
        subCriteria: childSubs,
      });
    });

    const newVersion: ObservationTemplateVersion = {
      id: verId,
      templateId,
      versionNumber: data.versionNumber,
      changeLog: data.changeLog,
      totalScore: masterTotalScore,
      createdById: this.currentUserId,
      isActive: true,
      mainCriteria: builtMainCriteria,
      createdAt: new Date().toISOString(),
    };

    tmpl.totalScore = masterTotalScore;
    tmpl.currentVersionId = verId;
    tmpl.updatedAt = new Date().toISOString();

    this.templateVersions.unshift(newVersion);
    this.mainCriteria.push(...builtMainCriteria);
    this.subCriteria.push(...builtSubCriteria);

    this.save('erp_templates', this.templates);
    this.save('erp_template_versions', this.templateVersions);
    this.save('erp_main_criteria', this.mainCriteria);
    this.save('erp_sub_criteria', this.subCriteria);

    this.logAction('TEMPLATE_VERSION_BUMPED', 'ObservationTemplateVersion', verId, {
      templateId,
      versionNumber: data.versionNumber,
      totalScore: masterTotalScore,
    });

    return newVersion;
  }

  public cloneTemplate(templateId: string): ObservationTemplate {
    const tmpls = this.getTemplates();
    const source = tmpls.find((t) => t.id === templateId);
    if (!source) throw new Error(`Template ${templateId} not found.`);

    const currentVer = source.currentVersion;
    const mainCriteriaPayload = (currentVer?.mainCriteria || []).map((mc) => ({
      name: mc.name,
      description: mc.description,
      weightPercentage: mc.weightPercentage,
      subCriteria: (mc.subCriteria || []).map((sc) => ({
        name: sc.name,
        description: sc.description,
        weightPercentage: sc.weightPercentage,
      })),
    }));

    return this.createTemplate({
      name: `${source.name} (Copy)`,
      code: `${source.code}-COPY`,
      type: source.type,
      description: source.description,
      totalScore: source.totalScore || 100,
      mainCriteria: mainCriteriaPayload,
    });
  }

  public toggleTemplateStatus(templateId: string, isActive: boolean): boolean {
    const tmpl = this.templates.find((t) => t.id === templateId);
    if (!tmpl) throw new Error(`Template ${templateId} not found.`);
    tmpl.isActive = isActive;
    tmpl.updatedAt = new Date().toISOString();
    this.save('erp_templates', this.templates);
    this.logAction('TEMPLATE_STATUS_CHANGED', 'ObservationTemplate', templateId, { isActive });
    return true;
  }

  public archiveTemplate(templateId: string, isArchived: boolean): boolean {
    const tmpl = this.templates.find((t) => t.id === templateId);
    if (!tmpl) throw new Error(`Template ${templateId} not found.`);
    tmpl.isArchived = isArchived;
    tmpl.updatedAt = new Date().toISOString();
    this.save('erp_templates', this.templates);
    this.logAction('TEMPLATE_ARCHIVE_CHANGED', 'ObservationTemplate', templateId, { isArchived });
    return true;
  }

  public deleteTemplate(id: string): boolean {
    const idx = this.templates.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Template with ID ${id} not found.`);
    const tmpl = this.templates[idx];
    const versionIds = this.templateVersions.filter((v) => v.templateId === id).map((v) => v.id);
    const mainCritIds = this.mainCriteria.filter((mc) => versionIds.includes(mc.templateVersionId)).map((mc) => mc.id);

    this.templates.splice(idx, 1);
    this.templateVersions = this.templateVersions.filter((v) => v.templateId !== id);
    this.mainCriteria = this.mainCriteria.filter((mc) => !versionIds.includes(mc.templateVersionId));
    this.subCriteria = this.subCriteria.filter((sc) => !mainCritIds.includes(sc.mainCriterionId));

    this.save('erp_templates', this.templates);
    this.save('erp_template_versions', this.templateVersions);
    this.save('erp_main_criteria', this.mainCriteria);
    this.save('erp_sub_criteria', this.subCriteria);

    this.logAction('TEMPLATE_DELETED', 'ObservationTemplate', id, { code: tmpl.code });
    return true;
  }

  // --- Dashboard Analytics ---
  public getDashboardAnalytics(trackId?: string): DashboardAnalytics {
    let obs = this.observations.filter((o) => o.status !== 'DRAFT');
    let insts = this.getInstructors();

    if (trackId) {
      obs = obs.filter((o) => o.trackId === trackId);
      insts = insts.filter((i) => i.trackId === trackId);
    }

    const totalObs = obs.length;
    const techObs = obs.filter((o) => o.type === 'TECHNICAL').length;
    const nonTechObs = obs.filter((o) => o.type === 'NON_TECHNICAL').length;
    const avgObsScore = totalObs > 0 ? Number((obs.reduce((s, o) => s + o.percentageScore, 0) / totalObs).toFixed(1)) : 0.0;

    const totalInsts = insts.length;
    const observedInsts = insts.filter((i) => i.totalObserved > 0).length;
    const avgInstScore = totalInsts > 0 ? Number((insts.reduce((s, i) => s + i.averageScore, 0) / totalInsts).toFixed(1)) : 0.0;
    const highestScore = totalInsts > 0 ? Math.max(...insts.map((i) => i.averageScore)) : 0.0;
    const lowestScore = totalInsts > 0 ? Math.min(...insts.map((i) => i.averageScore)) : 0.0;

    // Tier Distribution
    const aPlus = insts.filter((i) => (i.tier || getTierFromScore(i.averageScore)) === 'A+').length;
    const a = insts.filter((i) => (i.tier || getTierFromScore(i.averageScore)) === 'A').length;
    const bPlus = insts.filter((i) => (i.tier || getTierFromScore(i.averageScore)) === 'B+').length;
    const b = insts.filter((i) => (i.tier || getTierFromScore(i.averageScore)) === 'B').length;

    // Track analytics
    const trackAnalytics = this.tracks.map((t) => {
      const trackObs = this.observations.filter((o) => o.trackId === t.id && o.status !== 'DRAFT');
      const trackInsts = this.instructors.filter((i) => i.trackId === t.id);
      const avg = trackObs.length > 0 ? Number((trackObs.reduce((s, o) => s + o.percentageScore, 0) / trackObs.length).toFixed(1)) : 0.0;

      return {
        trackId: t.id,
        trackName: t.name,
        trackCode: t.code,
        color: t.color,
        averageScore: Number((avg / 10).toFixed(1)),
        percentageScore: avg,
        numberObservations: trackObs.length,
        numberInstructors: trackInsts.length,
        performanceTrend: trackObs.length > 0 ? (avg >= 85 ? '+4.2%' : '+1.8%') : '0.0%',
      };
    });

    // Observer analytics
    const observerAnalytics = this.users
      .filter((u) => u.roleType !== 'INSTRUCTOR')
      .map((u) => {
        const uObs = this.observations.filter((o) => o.observerId === u.id);
        const avg = uObs.length > 0 ? Number((uObs.reduce((s, o) => s + o.percentageScore, 0) / uObs.length).toFixed(1)) : 0.0;
        return {
          observerId: u.id,
          observerName: u.name,
          observerRole: u.roleType.replace(/_/g, ' '),
          avatar: u.avatar,
          observationsCount: uObs.length,
          averageScoreGiven: Number((avg / 10).toFixed(1)),
          activityStatus: uObs.length > 0 ? 'Active Evaluator' : 'Ready',
        };
      });

    // Top & Improvement Instructors
    const sorted = [...insts].sort((x, y) => y.averageScore - x.averageScore);
    const topInstructors = sorted.slice(0, 3).map((i) => ({
      id: i.id,
      name: i.user?.name || i.title,
      avatar: i.user?.avatar,
      trackName: i.track?.name || 'Academic Track',
      averageScore: i.averageScore,
      tier: i.tier || getTierFromScore(i.averageScore),
      totalObserved: i.totalObserved,
    }));

    const improvementInstructors = sorted
      .filter((i) => i.averageScore < 80 && i.totalObserved > 0)
      .map((i) => ({
        id: i.id,
        name: i.user?.name || i.title,
        avatar: i.user?.avatar,
        trackName: i.track?.name || 'Academic Track',
        averageScore: i.averageScore,
        tier: i.tier || getTierFromScore(i.averageScore),
        recommendedCoaching: i.averageScore < 70 ? 'Urgent PIP & 1-on-1 Mentorship' : 'Time & Pace Buffer Coaching',
      }));

    // Criteria analytics
    const criteriaAnalytics = totalObs > 0 ? [
      { criterionName: 'Technical Knowledge & Architecture', averageScore: 9.1, highestScore: 9.8, lowestScore: 7.2, evaluationsCount: totalObs, trend: '+0.0' },
      { criterionName: 'Content Accuracy & Code Quality', averageScore: 8.6, highestScore: 9.5, lowestScore: 6.5, evaluationsCount: totalObs, trend: '+0.0' },
      { criterionName: 'Live Demonstration & Debugging', averageScore: 8.4, highestScore: 9.6, lowestScore: 6.0, evaluationsCount: totalObs, trend: '+0.0' },
      { criterionName: 'Student Engagement & Interaction', averageScore: 8.7, highestScore: 9.3, lowestScore: 7.0, evaluationsCount: totalObs, trend: '+0.0' },
      { criterionName: 'Classroom & Time Management', averageScore: 8.2, highestScore: 9.3, lowestScore: 7.3, evaluationsCount: totalObs, trend: '+0.0' },
    ] : [];

    // Monthly Trend
    const monthlyTrend = totalObs > 0 ? [
      { month: 'Oct', technical: techObs > 0 ? 90.0 : 0, nonTechnical: nonTechObs > 0 ? 88.0 : 0, totalCount: totalObs, averageScore: avgObsScore },
    ] : [];

    // Heatmap
    const heatmap = this.tracks.map((t) => {
      const tObs = this.observations.filter((o) => o.trackId === t.id);
      const val = tObs.length > 0 ? Number((tObs.reduce((s, o) => s + o.percentageScore, 0) / tObs.length / 10).toFixed(1)) : 0.0;
      return {
        track: t.name,
        technicalKnowledge: val,
        contentAccuracy: val,
        practicalDemo: val,
        studentEngagement: val,
        classroomManagement: val,
      };
    });

    return {
      statsCards: {
        observationMetrics: {
          totalObservations: totalObs,
          observationsThisMonth: totalObs,
          technicalObservations: techObs,
          nonTechnicalObservations: nonTechObs,
          averageObservationScore: avgObsScore,
        },
        instructorMetrics: {
          totalActiveInstructors: totalInsts,
          numberObservedInstructors: observedInsts,
          averageInstructorScore: avgInstScore,
          highestInstructorScore: highestScore,
          lowestInstructorScore: lowestScore,
        },
        tierDistribution: {
          aPlus,
          a,
          bPlus,
          b,
        },
      },
      trackAnalytics,
      observerAnalytics,
      criteriaAnalytics,
      monthlyTrend,
      topInstructors,
      improvementInstructors,
      heatmap,
    };
  }

  // --- KPI Management CRUD ---
  public getKpiDefinitions(): KpiDefinition[] {
    return [...this.kpis];
  }

  public createKpiDefinition(data: Partial<KpiDefinition>): KpiDefinition {
    if (!data.name?.trim()) throw new Error('KPI name is required.');
    const newKpi: KpiDefinition = {
      id: `kpi-${Date.now()}`,
      code: data.code || `KPI-${Date.now().toString().slice(-4)}`,
      name: data.name.trim(),
      category: data.category || 'PEDAGOGICAL',
      weight: Number(data.weight) || 25,
      targetValue: Number(data.targetValue) || 85,
      unit: data.unit || '%',
      description: data.description || '',
    };
    this.kpis.push(newKpi);
    this.save('erp_kpis', this.kpis);
    this.logAction('KPI_CREATED', 'KpiDefinition', newKpi.id, { name: newKpi.name });
    return newKpi;
  }

  public updateKpiDefinition(id: string, updates: Partial<KpiDefinition>): KpiDefinition {
    const idx = this.kpis.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error(`KPI definition with ID ${id} not found.`);
    this.kpis[idx] = { ...this.kpis[idx], ...updates };
    this.save('erp_kpis', this.kpis);
    this.logAction('KPI_UPDATED', 'KpiDefinition', id, updates);
    return this.kpis[idx];
  }

  public deleteKpiDefinition(id: string): boolean {
    const idx = this.kpis.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error(`KPI definition with ID ${id} not found.`);
    const kpi = this.kpis[idx];
    this.kpis.splice(idx, 1);
    this.save('erp_kpis', this.kpis);
    this.logAction('KPI_DELETED', 'KpiDefinition', id, { code: kpi.code });
    return true;
  }

  public getKpiScorecards(): KpiScorecard[] {
    return [...this.scorecards];
  }

  public getKpiHistory(): KpiMonthlyHistory[] {
    return [...this.kpiHistory];
  }

  // --- Coaching & PIP CRUD ---
  public getCoachingSessions(): CoachingSession[] {
    return [...this.coachingSessions];
  }

  public createCoachingSession(data: any): CoachingSession {
    if (!data.instructorId) throw new Error('Please select an instructor.');

    const inst = this.instructors.find((i) => i.id === data.instructorId);
    let items: any[] = [];
    if (Array.isArray(data.actionItems)) {
      items = data.actionItems.map((a: any, idx: number) => ({
        id: a.id || `item-${Date.now()}-${idx}`,
        task: a.task || String(a),
        targetDate: a.targetDate || '2026-10-30',
        isCompleted: Boolean(a.isCompleted),
      }));
    } else if (typeof data.actionTasks === 'string') {
      items = data.actionTasks
        .split('\n')
        .map((t: string) => t.trim())
        .filter(Boolean)
        .map((t: string, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          task: t,
          targetDate: data.followUpDate || '2026-10-30',
          isCompleted: false,
        }));
    }

    const session: CoachingSession = {
      id: `coach-${Date.now()}`,
      instructorId: data.instructorId,
      instructorName: inst?.user?.name || inst?.title || 'Faculty Member',
      coachId: this.currentUserId,
      coachName: this.getCurrentUser().name,
      trackId: inst?.trackId || '',
      trackName: inst?.track?.name || 'Academic Track',
      date: data.sessionDate || data.date || new Date().toISOString().split('T')[0],
      focusArea: data.focusArea || 'PEDAGOGY',
      objectives: data.objectives || '',
      coachNotes: data.coachNotes || '',
      actionItems: items,
      status: data.status || 'SCHEDULED',
      followUpDate: data.followUpDate,
      createdAt: new Date().toISOString(),
    };

    this.coachingSessions.unshift(session);
    this.save('erp_coaching_sessions', this.coachingSessions);
    this.logAction('COACHING_SESSION_CREATED', 'CoachingSession', session.id, {
      instructor: session.instructorName,
      focusArea: session.focusArea,
    });
    return session;
  }

  public updateCoachingSession(id: string, updates: Partial<CoachingSession>): CoachingSession {
    const idx = this.coachingSessions.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Coaching session with ID ${id} not found.`);
    this.coachingSessions[idx] = { ...this.coachingSessions[idx], ...updates };
    this.save('erp_coaching_sessions', this.coachingSessions);
    this.logAction('COACHING_SESSION_UPDATED', 'CoachingSession', id, updates);
    return this.coachingSessions[idx];
  }

  public deleteCoachingSession(id: string): boolean {
    const idx = this.coachingSessions.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Coaching session with ID ${id} not found.`);
    this.coachingSessions.splice(idx, 1);
    this.save('erp_coaching_sessions', this.coachingSessions);
    this.logAction('COACHING_SESSION_DELETED', 'CoachingSession', id);
    return true;
  }

  public getImprovementPlans(): InstructorImprovementPlan[] {
    return [...this.improvementPlans];
  }

  public createImprovementPlan(data: any): InstructorImprovementPlan {
    if (!data.instructorId) throw new Error('Please select an instructor.');
    const inst = this.instructors.find((i) => i.id === data.instructorId);

    const plan: InstructorImprovementPlan = {
      id: `pip-${Date.now()}`,
      instructorId: data.instructorId,
      instructorName: inst?.user?.name || inst?.title || 'Faculty Member',
      trackId: inst?.trackId || '',
      title: data.title || 'Instructional Acceleration Plan',
      reason: data.objectives || data.reason || 'Targeted performance reinforcement.',
      startDate: new Date().toISOString().split('T')[0],
      targetReviewDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      status: data.status || 'ACTIVE',
      milestones: data.milestones || [
        { title: 'Initial methodology review', deadline: '2026-10-15', status: 'IN_PROGRESS' },
        { title: 'Mid-cycle live demonstration', deadline: '2026-10-30', status: 'PENDING' },
        { title: 'Final pedagogical audit', deadline: '2026-11-15', status: 'PENDING' },
      ],
      mentorName: this.getCurrentUser().name,
    };

    this.improvementPlans.unshift(plan);
    this.save('erp_improvement_plans', this.improvementPlans);
    this.logAction('IMPROVEMENT_PLAN_CREATED', 'InstructorImprovementPlan', plan.id, {
      instructor: plan.instructorName,
    });
    return plan;
  }

  public updateImprovementPlan(id: string, updates: Partial<InstructorImprovementPlan>): InstructorImprovementPlan {
    const idx = this.improvementPlans.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Improvement plan with ID ${id} not found.`);
    this.improvementPlans[idx] = { ...this.improvementPlans[idx], ...updates };
    this.save('erp_improvement_plans', this.improvementPlans);
    this.logAction('IMPROVEMENT_PLAN_UPDATED', 'InstructorImprovementPlan', id, updates);
    return this.improvementPlans[idx];
  }

  public deleteImprovementPlan(id: string): boolean {
    const idx = this.improvementPlans.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Improvement plan with ID ${id} not found.`);
    this.improvementPlans.splice(idx, 1);
    this.save('erp_improvement_plans', this.improvementPlans);
    this.logAction('IMPROVEMENT_PLAN_DELETED', 'InstructorImprovementPlan', id);
    return true;
  }

  // --- Student Feedback & Quality Metrics CRUD ---
  public getStudentFeedback(): StudentFeedbackRecord[] {
    return [...this.studentFeedback];
  }

  public createStudentFeedback(data: any): StudentFeedbackRecord {
    if (!data.instructorId) throw new Error('Instructor is required for student feedback.');
    const inst = this.instructors.find((i) => i.id === data.instructorId);

    const record: StudentFeedbackRecord = {
      id: `sfb-${Date.now()}`,
      instructorId: data.instructorId,
      instructorName: inst?.user?.name || inst?.title || 'Instructor',
      trackId: inst?.trackId || '',
      trackName: inst?.track?.name || 'Academic Track',
      groupId: data.groupId || '',
      groupName: data.groupName || 'Cohort Group',
      submissionDate: new Date().toISOString().split('T')[0],
      overallRating: Number(data.overallRating) || 4.5,
      clarityRating: Number(data.clarityRating) || 4.5,
      engagementRating: Number(data.engagementRating) || 4.5,
      supportRating: Number(data.supportRating) || 4.5,
      pacingRating: Number(data.pacingRating) || 4.5,
      studentComments: data.studentComments || '',
      sentiment: data.overallRating >= 4 ? 'POSITIVE' : data.overallRating >= 3 ? 'NEUTRAL' : 'NEGATIVE',
    };

    this.studentFeedback.unshift(record);
    this.save('erp_student_feedback', this.studentFeedback);
    this.logAction('FEEDBACK_LOGGED', 'StudentFeedback', record.id, {
      instructor: record.instructorName,
      rating: record.overallRating,
    });
    return record;
  }

  public deleteStudentFeedback(id: string): boolean {
    const idx = this.studentFeedback.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error(`Student feedback record with ID ${id} not found.`);
    this.studentFeedback.splice(idx, 1);
    this.save('erp_student_feedback', this.studentFeedback);
    this.logAction('FEEDBACK_DELETED', 'StudentFeedback', id);
    return true;
  }

  public getQualityMetrics(): QualityMetric[] {
    return [...this.qualityMetrics];
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // --- Reset System Data ---
  // --- Reset System Data ---
  public resetSystemData(): {
    cleared: {
      observations: number;
      instructors: number;
      groups: number;
      tracks: number;
      templates: number;
      criteria: number;
      kpiDefinitions: number;
      scorecards: number;
      coachingSessions: number;
      improvementPlans: number;
      studentFeedback: number;
      auditLogs: number;
    };
    preserved: {
      roles: number;
      systemUsers: number;
    };
  } {
    const counts = {
      observations: this.observations.length,
      instructors: this.instructors.length,
      groups: this.groups.length,
      tracks: this.tracks.length,
      templates: this.templates.length,
      criteria: this.criteria.length,
      mainCriteria: this.mainCriteria.length,
      subCriteria: this.subCriteria.length,
      mainResults: this.mainResults.length,
      subResults: this.subResults.length,
      kpiDefinitions: this.kpis.length,
      scorecards: this.scorecards.length,
      coachingSessions: this.coachingSessions.length,
      improvementPlans: this.improvementPlans.length,
      studentFeedback: this.studentFeedback.length,
      auditLogs: this.auditLogs.length,
    };

    // Purge ALL business data
    this.observations = [];
    this.instructors = [];
    this.groups = [];
    this.tracks = [];
    this.templates = [];
    this.templateVersions = [];
    this.criteria = [];
    this.mainCriteria = [];
    this.subCriteria = [];
    this.mainResults = [];
    this.subResults = [];
    this.kpis = [];
    this.scorecards = [];
    this.kpiHistory = [];
    this.coachingSessions = [];
    this.improvementPlans = [];
    this.studentFeedback = [];
    this.qualityMetrics = [];
    this.auditLogs = [];
    this.notifications = [];

    // Retain only system configuration accounts
    this.users = initialUsers;
    this.currentUserId = 'usr-em-1';

    // Wipe all erp localStorage keys
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('erp_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (_) {}

    localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
    this.save('erp_users', this.users);

    logger.info('SYSTEM_DATA_RESET_COMPLETED', counts);

    return {
      cleared: counts,
      preserved: {
        roles: 4,
        systemUsers: 1,
      },
    };
  }
}

const db = new LocalDatabase();

export const setApiUserId = (id: string) => db.setUserId(id);
export const getApiUserId = () => db.getUserId();

export const api = {
  // Auth & Context
  getUsers: async () => db.getUsers(),
  getCurrentUser: async () => db.getCurrentUser(),

  // Meta & Lookups
  getMeta: async () => db.getMeta(),

  // Groups
  getGroups: async () => db.getGroups(),
  createGroup: async (data: { name: string; code?: string; trackId: string; instructorId?: string; studentCount?: number; term?: string }) =>
    db.createGroup(data),
  deleteGroup: async (id: string) => db.deleteGroup(id),

  // Instructors
  getInstructors: async (params?: { search?: string; trackId?: string; tier?: string; status?: string }) =>
    db.getInstructors(params),
  getInstructorById: async (id: string) => db.getInstructorById(id),
  createInstructor: async (data: {
    name: string;
    email: string;
    trackId: string;
    title: string;
    specialization: string;
    phone?: string;
    status?: InstructorStatus;
  }) => db.createInstructor(data),
  updateInstructor: async (id: string, updates: Partial<Instructor & { name?: string; email?: string }>) =>
    db.updateInstructor(id, updates),
  deleteInstructor: async (id: string) => db.deleteInstructor(id),

  // Observations
  getObservations: async (params: {
    teacherId?: string;
    trackId?: string;
    groupId?: string;
    observerId?: string;
    observationType?: ObservationType;
    startDate?: string;
    endDate?: string;
    search?: string;
    status?: ObservationStatus;
    tier?: InstructorTier;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => db.getObservations(params),
  getObservationById: async (id: string) => db.getObservationById(id),
  createObservation: async (payload: any) => db.createObservation(payload),
  updateObservation: async (id: string, payload: Partial<Observation>) => db.updateObservation(id, payload),
  updateObservationStatus: async (id: string, status: ObservationStatus) => db.updateObservationStatus(id, status),
  deleteObservation: async (id: string) => db.deleteObservation(id),

  // Templates
  getTemplates: async () => db.getTemplates(),
  getTemplatePreview: async (type: ObservationType) => db.getTemplatePreview(type),
  createTemplate: async (data: any) => db.createTemplate(data),
  deleteTemplate: async (id: string) => db.deleteTemplate(id),
  bumpTemplateVersion: async (templateId: string, data: { versionNumber: string; changeLog: string; totalScore?: number; mainCriteria: any[] }) =>
    db.bumpTemplateVersion(templateId, data),
  cloneTemplate: async (templateId: string) => db.cloneTemplate(templateId),
  toggleTemplateStatus: async (templateId: string, isActive: boolean) => db.toggleTemplateStatus(templateId, isActive),
  archiveTemplate: async (templateId: string, isArchived: boolean) => db.archiveTemplate(templateId, isArchived),

  // Dashboard
  getDashboardAnalytics: async (trackId?: string) => db.getDashboardAnalytics(trackId),

  // KPI Management
  getKpiDefinitions: async () => db.getKpiDefinitions(),
  createKpiDefinition: async (data: Partial<KpiDefinition>) => db.createKpiDefinition(data),
  updateKpiDefinition: async (id: string, updates: Partial<KpiDefinition>) => db.updateKpiDefinition(id, updates),
  deleteKpiDefinition: async (id: string) => db.deleteKpiDefinition(id),
  getKpiScorecards: async () => db.getKpiScorecards(),
  getKpiHistory: async () => db.getKpiHistory(),

  // Coaching & Improvement
  getCoachingSessions: async () => db.getCoachingSessions(),
  createCoachingSession: async (data: any) => db.createCoachingSession(data),
  updateCoachingSession: async (id: string, updates: Partial<CoachingSession>) => db.updateCoachingSession(id, updates),
  deleteCoachingSession: async (id: string) => db.deleteCoachingSession(id),

  getImprovementPlans: async () => db.getImprovementPlans(),
  createImprovementPlan: async (data: any) => db.createImprovementPlan(data),
  updateImprovementPlan: async (id: string, updates: Partial<InstructorImprovementPlan>) =>
    db.updateImprovementPlan(id, updates),
  deleteImprovementPlan: async (id: string) => db.deleteImprovementPlan(id),

  // Student Feedback & Quality Metrics
  getStudentFeedback: async () => db.getStudentFeedback(),
  createStudentFeedback: async (data: any) => db.createStudentFeedback(data),
  deleteStudentFeedback: async (id: string) => db.deleteStudentFeedback(id),
  getQualityMetrics: async () => db.getQualityMetrics(),

  // Audit Logs
  getAuditLogs: async () => db.getAuditLogs(),

  // Reports
  getReportData: async (reportType: string, filters?: { trackId?: string; startDate?: string; endDate?: string }) => {
    const obs = db.getObservations(filters || {}).items;
    const insts = db.getInstructors(filters?.trackId ? { trackId: filters.trackId } : undefined);

    if (reportType === 'INSTRUCTOR_PERFORMANCE') {
      return {
        data: insts.map((i) => ({
          InstructorName: i.user?.name || i.title,
          Track: i.track?.name || 'Academic Track',
          EmployeeId: i.employeeId,
          TotalObserved: i.totalObserved,
          AverageScore: `${i.averageScore.toFixed(1)}%`,
          ClassificationTier: i.tier || getTierFromScore(i.averageScore),
          Status: i.status,
        })),
      };
    }

    if (reportType === 'MONTHLY_OBSERVATIONS') {
      return {
        data: obs.length > 0
          ? [
              {
                Month: 'Current Academic Term',
                TechnicalCount: obs.filter((o) => o.type === 'TECHNICAL').length,
                PedagogicalCount: obs.filter((o) => o.type === 'NON_TECHNICAL').length,
                TotalCount: obs.length,
                AverageScore: `${(obs.reduce((s, o) => s + o.percentageScore, 0) / obs.length).toFixed(1)}%`,
              },
            ]
          : [],
      };
    }

    if (reportType === 'CRITERIA_ANALYSIS') {
      if (obs.length === 0) return { data: [], mainCriteriaBreakdown: [], subCriteriaBreakdown: [], weakestAreas: [], strongestAreas: [] };

      // Collect all main results and sub results
      const allMainResults: MainCriterionResult[] = [];
      const allSubResults: SubCriterionResult[] = [];

      obs.forEach((o) => {
        if (o.mainResults && o.mainResults.length > 0) {
          allMainResults.push(...o.mainResults);
        }
        if (o.subResults && o.subResults.length > 0) {
          allSubResults.push(...o.subResults);
        }
      });

      // Group sub criteria
      const subMap = new Map<string, { name: string; mainCriterionId: string; totalScore: number; totalMax: number; count: number }>();
      allSubResults.forEach((sr) => {
        const key = sr.subCriterionName;
        const existing = subMap.get(key) || { name: key, mainCriterionId: sr.mainCriterionId, totalScore: 0, totalMax: 0, count: 0 };
        existing.totalScore += sr.score;
        existing.totalMax += sr.maxScore;
        existing.count += 1;
        subMap.set(key, existing);
      });

      const subBreakdown = Array.from(subMap.values()).map((s) => {
        const avgScore = Number((s.totalScore / s.count).toFixed(2));
        const avgMax = Number((s.totalMax / s.count).toFixed(2));
        const avgPct = avgMax > 0 ? Number(((avgScore / avgMax) * 100).toFixed(1)) : 0;
        return {
          Criterion: s.name,
          Category: 'Sub Criterion',
          AverageScore: `${avgScore} / ${avgMax}`,
          AveragePercentage: `${avgPct}%`,
          Evaluations: s.count,
          rawScore: avgScore,
          rawPct: avgPct,
        };
      });

      // Group main criteria
      const mainMap = new Map<string, { name: string; totalScore: number; totalMax: number; count: number; weight: number }>();
      allMainResults.forEach((mr) => {
        const key = mr.mainCriterionName;
        const existing = mainMap.get(key) || { name: key, totalScore: 0, totalMax: 0, count: 0, weight: mr.weightPercentage };
        existing.totalScore += mr.score;
        existing.totalMax += mr.maxScore;
        existing.count += 1;
        mainMap.set(key, existing);
      });

      const mainBreakdown = Array.from(mainMap.values()).map((m) => {
        const avgScore = Number((m.totalScore / m.count).toFixed(2));
        const avgMax = Number((m.totalMax / m.count).toFixed(2));
        const avgPct = avgMax > 0 ? Number(((avgScore / avgMax) * 100).toFixed(1)) : 0;
        return {
          Criterion: m.name,
          Category: 'Main Criterion',
          AverageScore: `${avgScore} / ${avgMax}`,
          AveragePercentage: `${avgPct}%`,
          Weight: `${m.weight}%`,
          Evaluations: m.count,
          rawScore: avgScore,
          rawPct: avgPct,
        };
      });

      const sortedSubs = [...subBreakdown].sort((a, b) => a.rawPct - b.rawPct);
      const weakestAreas = sortedSubs.slice(0, 3);
      const strongestAreas = [...sortedSubs].reverse().slice(0, 3);

      return {
        data: [...mainBreakdown, ...subBreakdown],
        mainCriteriaBreakdown: mainBreakdown,
        subCriteriaBreakdown: subBreakdown,
        weakestAreas,
        strongestAreas,
      };
    }

    return { data: [] };
  },

  // Instructor Portal
  getInstructorPortalData: async () => {
    const user = db.getCurrentUser();
    const inst = db.getInstructors().find((i) => i.userId === user.id) || db.getInstructors()[0];
    if (!inst) {
      return {
        instructor: null,
        stats: {
          numberObservations: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          lastObservationDate: null,
          status: 'ACTIVE' as const,
        },
        observations: [],
      };
    }
    const details = db.getInstructorById(inst.id);
    return {
      instructor: inst,
      stats: {
        numberObservations: details?.observations.length || 0,
        averageScore: inst.averageScore,
        highestScore:
          details?.observations && details.observations.length > 0
            ? Math.max(...details.observations.map((o) => o.percentageScore))
            : inst.averageScore,
        lowestScore:
          details?.observations && details.observations.length > 0
            ? Math.min(...details.observations.map((o) => o.percentageScore))
            : inst.averageScore,
        lastObservationDate: inst.lastObservedAt || null,
        status: inst.status,
      },
      observations: details?.observations || [],
    };
  },

  // Notifications
  getNotifications: async (): Promise<Notification[]> => [],
  markNotificationRead: async (id: string) => true,
  markAllNotificationsRead: async () => true,

  // Full System Reset
  resetSystemData: async () => {
    return db.resetSystemData();
  },
};
