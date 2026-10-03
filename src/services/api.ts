import {
  User,
  Track,
  Instructor,
  Group,
  ObservationTemplate,
  ObservationTemplateVersion,
  ObservationCriterion,
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
  private observations: Observation[];
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
    this.observations = this.load('erp_observations', initialObservations);
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

      return {
        ...obs,
        instructor: ins ? { ...ins, user } : undefined,
        observer,
        group,
        track,
        templateVersion: version,
        tier,
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

    const tmplVersion = this.templateVersions.find(
      (v) => v.templateId === (payload.observationType === 'TECHNICAL' ? 'tmpl-tech' : 'tmpl-nontech')
    ) || this.templateVersions[0];

    const currentYear = new Date().getFullYear();
    const count = this.observations.length + 1;
    const code = `OBS-${currentYear}-${String(count).padStart(4, '0')}`;

    const scoreItems = payload.scores || [];
    let weightedPercentage = 0;
    let totalRaw = 0;

    scoreItems.forEach((s: any) => {
      const crit = this.criteria.find((c) => c.id === s.criterionId);
      const weight = crit ? crit.weightPercentage : 20;
      weightedPercentage += (s.score / 10) * weight;
      totalRaw += s.score;
    });

    const avgScore = scoreItems.length > 0 ? totalRaw / scoreItems.length : 8.0;
    const finalPercentage = scoreItems.length > 0 ? Number(weightedPercentage.toFixed(1)) : 80.0;
    const tier = getTierFromScore(finalPercentage);

    const grade =
      finalPercentage >= 90
        ? 'Outstanding'
        : finalPercentage >= 80
        ? 'Proficient'
        : finalPercentage >= 70
        ? 'Developing'
        : 'Needs Improvement';

    const newObservation: Observation = {
      id: `obs-${Date.now()}`,
      observationCode: code,
      templateVersionId: tmplVersion ? tmplVersion.id : 'tmpl-ver-tech-1',
      type: payload.observationType || 'TECHNICAL',
      instructorId: payload.instructorId,
      observerId: payload.observerId || this.currentUserId,
      groupId: payload.groupId,
      trackId: instructor.trackId,
      observationDate: payload.observationDate || new Date().toISOString(),
      status: payload.status || 'SUBMITTED',
      totalScore: Number(avgScore.toFixed(2)),
      weightedScore: finalPercentage,
      percentageScore: finalPercentage,
      grade,
      tier,
      scores: scoreItems.map((s: any, idx: number) => {
        const crit = this.criteria.find((c) => c.id === s.criterionId);
        const weight = crit ? crit.weightPercentage : 20;
        return {
          id: `score-${Date.now()}-${idx}`,
          observationId: `obs-${Date.now()}`,
          criterionId: s.criterionId,
          criterionName: crit?.name || 'Criterion',
          score: s.score,
          weight,
          weightedScore: Number(((s.score / 10) * weight).toFixed(2)),
          feedback: s.feedback || '',
          createdAt: new Date().toISOString(),
        };
      }),
      feedback: {
        id: `fb-${Date.now()}`,
        observationId: `obs-${Date.now()}`,
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
    this.save('erp_observations', this.observations);

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
    this.save('erp_observations', this.observations);

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
      const versions = this.templateVersions.filter((v) => v.templateId === tmpl.id);
      const currentVersion = versions.find((v) => v.id === tmpl.currentVersionId) || versions[0];
      return {
        ...tmpl,
        currentVersion,
        versions,
      };
    });
  }

  public getTemplatePreview(type: ObservationType): ObservationTemplate & { currentVersion: ObservationTemplateVersion } {
    const tmpls = this.getTemplates();
    const tmpl = tmpls.find((t) => t.type === type) || tmpls[0];
    const ver = this.templateVersions.find((v) => v.templateId === tmpl.id) || this.templateVersions[0];
    return {
      ...tmpl,
      currentVersion: ver,
    };
  }

  public createTemplate(data: { name: string; code: string; type: ObservationType; description: string }): ObservationTemplate {
    if (!data.name?.trim()) throw new Error('Template name is required.');
    if (!data.code?.trim()) throw new Error('Template code is required.');

    const id = `tmpl-${Date.now()}`;
    const verId = `tmpl-ver-${Date.now()}`;

    const defaultCrit: ObservationCriterion[] = [
      {
        id: `crit-${Date.now()}-1`,
        templateVersionId: verId,
        name: 'Technical Competence',
        description: 'Demonstrates deep mastery of the subject matter.',
        weightPercentage: 50,
        orderIndex: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `crit-${Date.now()}-2`,
        templateVersionId: verId,
        name: 'Student Communication & Clarity',
        description: 'Explains complex ideas with clarity and engagement.',
        weightPercentage: 50,
        orderIndex: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const newVersion: ObservationTemplateVersion = {
      id: verId,
      templateId: id,
      versionNumber: 'v1.0',
      changeLog: 'Initial release',
      createdById: this.currentUserId,
      isActive: true,
      criteria: defaultCrit,
      createdAt: new Date().toISOString(),
    };

    const newTmpl: ObservationTemplate = {
      id,
      code: data.code.toUpperCase().trim(),
      name: data.name.trim(),
      type: data.type,
      description: data.description || '',
      isActive: true,
      isArchived: false,
      currentVersionId: verId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.unshift(newTmpl);
    this.templateVersions.unshift(newVersion);
    this.criteria.push(...defaultCrit);

    this.save('erp_templates', this.templates);
    this.save('erp_template_versions', this.templateVersions);
    this.save('erp_criteria', this.criteria);

    this.logAction('TEMPLATE_CREATED', 'ObservationTemplate', id, { code: newTmpl.code, name: newTmpl.name });
    return newTmpl;
  }

  public deleteTemplate(id: string): boolean {
    const idx = this.templates.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Template with ID ${id} not found.`);
    const tmpl = this.templates[idx];
    this.templates.splice(idx, 1);
    this.templateVersions = this.templateVersions.filter((v) => v.templateId !== id);
    this.save('erp_templates', this.templates);
    this.save('erp_template_versions', this.templateVersions);
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
  bumpTemplateVersion: async (templateId: string, data: { versionNumber: string; changeLog: string; criteria: any[] }) => {
    return { id: `ver-${Date.now()}`, templateId, ...data };
  },
  cloneTemplate: async (templateId: string) => {
    const tmpl = (await db.getTemplates()).find((t) => t.id === templateId);
    return db.createTemplate({
      name: `${tmpl?.name || 'Template'} (Copy)`,
      code: `${tmpl?.code || 'TMPL'}-COPY`,
      type: tmpl?.type || 'TECHNICAL',
      description: tmpl?.description || '',
    });
  },
  toggleTemplateStatus: async (templateId: string, isActive: boolean) => true,
  archiveTemplate: async (templateId: string, isArchived: boolean) => true,

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
      return {
        data: obs.length > 0
          ? [
              { Criterion: 'Technical Knowledge & Architecture', AverageScore: '9.1/10', Weight: '25%', Evaluations: obs.length },
              { Criterion: 'Content Accuracy & Code Quality', AverageScore: '8.6/10', Weight: '20%', Evaluations: obs.length },
              { Criterion: 'Live Demonstration & Problem Solving', AverageScore: '8.4/10', Weight: '20%', Evaluations: obs.length },
              { Criterion: 'Student Engagement & Interaction', AverageScore: '8.7/10', Weight: '20%', Evaluations: obs.length },
              { Criterion: 'Classroom & Time Management', AverageScore: '8.2/10', Weight: '15%', Evaluations: obs.length },
            ]
          : [],
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
