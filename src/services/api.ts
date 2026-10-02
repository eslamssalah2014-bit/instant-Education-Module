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
  private currentUserId: string = 'usr-em-1';

  constructor() {
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
    if (savedUser) this.currentUserId = savedUser;

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
        // Sync any new observations from Supabase
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
              totalScore: r.totalScore || 8.0,
              weightedScore: r.weightedScore || 80.0,
              percentageScore: r.percentageScore || 80.0,
              grade: r.grade || 'Proficient',
              tier: getTierFromScore(r.percentageScore || 80.0),
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
  }

  // Users
  public getUsers(): User[] {
    return [...this.users];
  }

  public getCurrentUser(): User {
    return this.users.find((u) => u.id === this.currentUserId) || this.users[0];
  }

  // Meta
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

  // Instructors
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
          i.user?.name.toLowerCase().includes(q) ||
          i.employeeId.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.specialization.toLowerCase().includes(q)
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

  public updateInstructor(id: string, updates: Partial<Instructor>): Instructor {
    const idx = this.instructors.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Instructor not found');
    this.instructors[idx] = { ...this.instructors[idx], ...updates, updatedAt: new Date().toISOString() };
    if (updates.averageScore !== undefined) {
      this.instructors[idx].tier = getTierFromScore(updates.averageScore);
    }
    this.save('erp_instructors', this.instructors);
    this.logAction('INSTRUCTOR_UPDATED', 'Instructor', id, updates);
    return this.instructors[idx];
  }

  // Observations
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
          o.instructor?.user?.name.toLowerCase().includes(q) ||
          o.observer?.name.toLowerCase().includes(q) ||
          o.group?.name.toLowerCase().includes(q)
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

  public createObservation(payload: {
    instructorId: string;
    groupId: string;
    observationType: ObservationType;
    observationDate?: string;
    status?: ObservationStatus;
    scores: { criterionId: string; score: number; feedback: string }[];
    feedback: {
      generalComments: string;
      strengths: string;
      areasForImprovement: string;
      recommendations: string;
    };
    actionPlan?: { objective: string; actionSteps: string; deadline: string; assignedTo: string }[];
  }): Observation {
    const ins = this.instructors.find((i) => i.id === payload.instructorId);
    if (!ins) throw new Error('Instructor not found');
    const group = this.groups.find((g) => g.id === payload.groupId);
    if (!group) throw new Error('Group not found');

    const template = this.templates.find((t) => t.type === payload.observationType);
    const version = this.templateVersions.find((v) => v.id === template?.currentVersionId) || this.templateVersions[0];
    const criteria = this.criteria.filter((c) => c.templateVersionId === version.id);

    // Calculate Scores
    let totalScore = 0;
    let weightedSum = 0;
    let totalWeight = 0;

    const scoresList = payload.scores.map((s, index) => {
      const crit = criteria.find((c) => c.id === s.criterionId);
      const weight = crit ? crit.weightPercentage : 20;
      const weightedScore = (s.score / 10) * weight;
      weightedSum += weightedScore;
      totalWeight += weight;
      totalScore += s.score;

      return {
        id: `sc-${Date.now()}-${index}`,
        observationId: '',
        criterionId: s.criterionId,
        criterionName: crit?.name || 'Criterion',
        score: s.score,
        weight,
        weightedScore: Number(weightedScore.toFixed(2)),
        feedback: s.feedback || '',
        createdAt: new Date().toISOString(),
      };
    });

    const finalWeightedScore = totalWeight > 0 ? Number(((weightedSum / totalWeight) * 100).toFixed(2)) : 80;
    const finalTotalScore = scoresList.length > 0 ? Number((totalScore / scoresList.length).toFixed(2)) : 8.0;
    const tier = getTierFromScore(finalWeightedScore);

    const grade =
      finalWeightedScore >= 90
        ? 'Outstanding'
        : finalWeightedScore >= 80
        ? 'Proficient'
        : finalWeightedScore >= 70
        ? 'Developing'
        : 'Needs Improvement';

    const obsId = `obs-${Date.now()}`;
    const obsCode = `OBS-2026-${String(this.observations.length + 1).padStart(4, '0')}`;

    scoresList.forEach((s) => (s.observationId = obsId));

    const actionPlan = (payload.actionPlan || []).map((ap, i) => ({
      id: `ap-${Date.now()}-${i}`,
      objective: ap.objective,
      actionSteps: ap.actionSteps,
      deadline: ap.deadline,
      assignedTo: ap.assignedTo || ins.user?.name || 'Instructor',
      status: 'PENDING' as const,
    }));

    const newObservation: Observation = {
      id: obsId,
      observationCode: obsCode,
      templateVersionId: version.id,
      type: payload.observationType,
      instructorId: payload.instructorId,
      observerId: this.currentUserId,
      groupId: payload.groupId,
      trackId: ins.trackId,
      observationDate: payload.observationDate || new Date().toISOString(),
      status: payload.status || 'SUBMITTED',
      totalScore: finalTotalScore,
      weightedScore: finalWeightedScore,
      percentageScore: finalWeightedScore,
      grade,
      tier,
      scores: scoresList,
      feedback: {
        id: `fb-${Date.now()}`,
        observationId: obsId,
        ...payload.feedback,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      actionPlan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.observations.unshift(newObservation);
    this.save('erp_observations', this.observations);

    // Update instructor statistics
    const insObs = this.observations.filter((o) => o.instructorId === ins.id && o.status !== 'DRAFT');
    const newAvg = Number(
      (insObs.reduce((sum, o) => sum + o.percentageScore, 0) / (insObs.length || 1)).toFixed(1)
    );
    this.updateInstructor(ins.id, {
      totalObserved: insObs.length,
      averageScore: newAvg,
      lastObservedAt: newObservation.observationDate,
    });

    this.logAction('OBSERVATION_CREATED', 'Observation', obsId, {
      code: obsCode,
      instructor: ins.user?.name,
      percentageScore: finalWeightedScore,
      tier,
    });

    // Also attempt remote sync to Supabase if available
    try {
      supabase
        .from('Observation')
        .insert({
          id: obsId,
          observationCode: obsCode,
          templateVersionId: version.id,
          type: payload.observationType,
          instructorId: payload.instructorId,
          observerId: this.currentUserId,
          groupId: payload.groupId,
          trackId: ins.trackId,
          observationDate: newObservation.observationDate,
          status: newObservation.status,
          totalScore: finalTotalScore,
          weightedScore: finalWeightedScore,
          percentageScore: finalWeightedScore,
          grade,
        })
        .then(() => {});
    } catch (_) {}

    return newObservation;
  }

  public updateObservation(id: string, payload: Partial<Observation>): Observation {
    const idx = this.observations.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Observation not found');

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
    if (idx === -1) return false;
    const code = this.observations[idx].observationCode;
    this.observations.splice(idx, 1);
    this.save('erp_observations', this.observations);
    this.logAction('OBSERVATION_DELETED', 'Observation', id, { code });
    return true;
  }

  // Dashboard Analytics
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
    const avgObsScore = totalObs > 0 ? Number((obs.reduce((s, o) => s + o.percentageScore, 0) / totalObs).toFixed(1)) : 85.0;

    const totalInsts = insts.length;
    const observedInsts = insts.filter((i) => i.totalObserved > 0).length;
    const avgInstScore = totalInsts > 0 ? Number((insts.reduce((s, i) => s + i.averageScore, 0) / totalInsts).toFixed(1)) : 84.0;
    const highestScore = Math.max(...insts.map((i) => i.averageScore), 95.0);
    const lowestScore = Math.min(...insts.map((i) => i.averageScore), 68.0);

    // Tier Distribution
    const aPlus = insts.filter((i) => (i.tier || getTierFromScore(i.averageScore)) === 'A+').length;
    const a = insts.filter((i) => (i.tier || getTierFromScore(i.averageScore)) === 'A').length;
    const bPlus = insts.filter((i) => (i.tier || getTierFromScore(i.averageScore)) === 'B+').length;
    const b = insts.filter((i) => (i.tier || getTierFromScore(i.averageScore)) === 'B').length;

    // Track analytics
    const trackAnalytics = this.tracks.map((t) => {
      const trackObs = this.observations.filter((o) => o.trackId === t.id && o.status !== 'DRAFT');
      const trackInsts = this.instructors.filter((i) => i.trackId === t.id);
      const avg = trackObs.length > 0 ? Number((trackObs.reduce((s, o) => s + o.percentageScore, 0) / trackObs.length).toFixed(1)) : 82.0;

      return {
        trackId: t.id,
        trackName: t.name,
        trackCode: t.code,
        color: t.color,
        averageScore: Number((avg / 10).toFixed(1)),
        percentageScore: avg,
        numberObservations: trackObs.length,
        numberInstructors: trackInsts.length,
        performanceTrend: avg >= 85 ? '+4.2%' : '+1.8%',
      };
    });

    // Observer analytics
    const observerAnalytics = this.users
      .filter((u) => u.roleType !== 'INSTRUCTOR')
      .map((u) => {
        const uObs = this.observations.filter((o) => o.observerId === u.id);
        const avg = uObs.length > 0 ? Number((uObs.reduce((s, o) => s + o.percentageScore, 0) / uObs.length).toFixed(1)) : 88.0;
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
      .filter((i) => i.averageScore < 80)
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
    const criteriaAnalytics = [
      { criterionName: 'Technical Knowledge & Architecture', averageScore: 9.1, highestScore: 9.8, lowestScore: 7.2, evaluationsCount: totalObs, trend: '+0.4' },
      { criterionName: 'Content Accuracy & Code Quality', averageScore: 8.6, highestScore: 9.5, lowestScore: 6.5, evaluationsCount: totalObs, trend: '+0.2' },
      { criterionName: 'Live Demonstration & Debugging', averageScore: 8.4, highestScore: 9.6, lowestScore: 6.0, evaluationsCount: totalObs, trend: '+0.5' },
      { criterionName: 'Student Engagement & Interaction', averageScore: 8.7, highestScore: 9.3, lowestScore: 7.0, evaluationsCount: totalObs, trend: '+0.6' },
      { criterionName: 'Classroom & Time Management', averageScore: 8.2, highestScore: 9.3, lowestScore: 7.3, evaluationsCount: totalObs, trend: '+0.1' },
    ];

    // Monthly Trend
    const monthlyTrend = [
      { month: 'May', technical: 88.0, nonTechnical: 86.5, totalCount: 4, averageScore: 87.2 },
      { month: 'Jun', technical: 89.2, nonTechnical: 87.0, totalCount: 5, averageScore: 88.1 },
      { month: 'Jul', technical: 87.5, nonTechnical: 88.2, totalCount: 6, averageScore: 87.8 },
      { month: 'Aug', technical: 90.1, nonTechnical: 89.0, totalCount: 5, averageScore: 89.5 },
      { month: 'Sep', technical: 91.4, nonTechnical: 89.5, totalCount: 8, averageScore: 90.4 },
      { month: 'Oct', technical: 92.5, nonTechnical: 91.0, totalCount: totalObs, averageScore: avgObsScore },
    ];

    // Heatmap
    const heatmap = [
      { track: 'Frontend', technicalKnowledge: 9.4, contentAccuracy: 9.1, practicalDemo: 9.2, studentEngagement: 9.0, classroomManagement: 8.9 },
      { track: 'Backend', technicalKnowledge: 9.5, contentAccuracy: 9.2, practicalDemo: 8.8, studentEngagement: 8.4, classroomManagement: 9.1 },
      { track: 'AI & Data', technicalKnowledge: 9.8, contentAccuracy: 9.5, practicalDemo: 9.4, studentEngagement: 9.2, classroomManagement: 9.2 },
      { track: 'Mobile', technicalKnowledge: 8.5, contentAccuracy: 8.0, practicalDemo: 8.2, studentEngagement: 8.4, classroomManagement: 7.9 },
      { track: 'Cybersecurity', technicalKnowledge: 8.0, contentAccuracy: 7.4, practicalDemo: 7.0, studentEngagement: 7.8, classroomManagement: 7.6 },
      { track: 'UI/UX Design', technicalKnowledge: 8.8, contentAccuracy: 8.9, practicalDemo: 8.5, studentEngagement: 8.8, classroomManagement: 8.7 },
    ];

    return {
      statsCards: {
        observationMetrics: {
          totalObservations: totalObs,
          observationsThisMonth: Math.min(totalObs, 6),
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
        tierDistribution: { aPlus, a, bPlus, b },
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

  // Templates
  public getTemplates(): ObservationTemplate[] {
    return this.templates.map((tmpl) => ({
      ...tmpl,
      currentVersion: this.templateVersions.find((v) => v.id === tmpl.currentVersionId),
      versions: this.templateVersions.filter((v) => v.templateId === tmpl.id),
    }));
  }

  public getTemplatePreview(type: ObservationType) {
    const tmpl = this.templates.find((t) => t.type === type) || this.templates[0];
    const version = this.templateVersions.find((v) => v.id === tmpl.currentVersionId) || this.templateVersions[0];
    const criteria = this.criteria.filter((c) => c.templateVersionId === version.id);
    return {
      ...tmpl,
      currentVersion: {
        ...version,
        criteria,
      },
    };
  }

  public createTemplate(data: { name: string; code: string; type: ObservationType; description: string }): ObservationTemplate {
    const newTmpl: ObservationTemplate = {
      id: `tmpl-${Date.now()}`,
      code: data.code,
      name: data.name,
      type: data.type,
      description: data.description,
      isActive: true,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.push(newTmpl);
    this.save('erp_templates', this.templates);
    this.logAction('TEMPLATE_CREATED', 'ObservationTemplate', newTmpl.id, { name: data.name });
    return newTmpl;
  }

  // KPIs
  public getKpiDefinitions(): KpiDefinition[] {
    return [...this.kpis];
  }

  public updateKpiDefinition(id: string, updates: Partial<KpiDefinition>): KpiDefinition {
    const idx = this.kpis.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error('KPI not found');
    this.kpis[idx] = { ...this.kpis[idx], ...updates };
    this.save('erp_kpis', this.kpis);
    this.logAction('KPI_UPDATED', 'KpiDefinition', id, updates);
    return this.kpis[idx];
  }

  public getKpiScorecards(period?: string): KpiScorecard[] {
    if (period) return this.scorecards.filter((s) => s.period.includes(period));
    return [...this.scorecards];
  }

  public getKpiHistory(): KpiMonthlyHistory[] {
    return [...this.kpiHistory];
  }

  // Coaching
  public getCoachingSessions(instructorId?: string): CoachingSession[] {
    if (instructorId) return this.coachingSessions.filter((c) => c.instructorId === instructorId);
    return [...this.coachingSessions];
  }

  public createCoachingSession(data: {
    instructorId: string;
    focusArea: 'PEDAGOGY' | 'TECH_MASTERY' | 'STUDENT_ENGAGEMENT' | 'TIME_MANAGEMENT' | 'CURRICULUM';
    objectives: string;
    coachNotes: string;
    actionItems: { task: string; targetDate: string }[];
    date?: string;
    followUpDate?: string;
  }): CoachingSession {
    const ins = this.getInstructors().find((i) => i.id === data.instructorId);
    const user = this.getCurrentUser();

    const newSession: CoachingSession = {
      id: `coach-${Date.now()}`,
      instructorId: data.instructorId,
      instructorName: ins?.user?.name || 'Instructor',
      coachId: user.id,
      coachName: user.name,
      trackId: ins?.trackId || 'trk-fe',
      trackName: ins?.track?.name || 'Track',
      date: data.date || new Date().toISOString(),
      focusArea: data.focusArea,
      objectives: data.objectives,
      coachNotes: data.coachNotes,
      actionItems: data.actionItems.map((a, i) => ({
        id: `act-${Date.now()}-${i}`,
        task: a.task,
        targetDate: a.targetDate,
        isCompleted: false,
      })),
      status: 'SCHEDULED',
      followUpDate: data.followUpDate,
      createdAt: new Date().toISOString(),
    };

    this.coachingSessions.unshift(newSession);
    this.save('erp_coaching_sessions', this.coachingSessions);
    this.logAction('COACHING_SESSION_CREATED', 'CoachingSession', newSession.id, { instructor: newSession.instructorName });
    return newSession;
  }

  public updateCoachingSession(id: string, updates: Partial<CoachingSession>): CoachingSession {
    const idx = this.coachingSessions.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Session not found');
    this.coachingSessions[idx] = { ...this.coachingSessions[idx], ...updates };
    this.save('erp_coaching_sessions', this.coachingSessions);
    this.logAction('COACHING_SESSION_UPDATED', 'CoachingSession', id, updates);
    return this.coachingSessions[idx];
  }

  public getImprovementPlans(instructorId?: string): InstructorImprovementPlan[] {
    if (instructorId) return this.improvementPlans.filter((p) => p.instructorId === instructorId);
    return [...this.improvementPlans];
  }

  public createImprovementPlan(data: {
    instructorId: string;
    title: string;
    reason: string;
    startDate: string;
    targetReviewDate: string;
    milestones: { title: string; deadline: string }[];
  }): InstructorImprovementPlan {
    const ins = this.getInstructors().find((i) => i.id === data.instructorId);
    const user = this.getCurrentUser();

    const plan: InstructorImprovementPlan = {
      id: `pip-${Date.now()}`,
      instructorId: data.instructorId,
      instructorName: ins?.user?.name || 'Instructor',
      trackId: ins?.trackId || 'trk-sec',
      title: data.title,
      reason: data.reason,
      startDate: data.startDate,
      targetReviewDate: data.targetReviewDate,
      status: 'ACTIVE',
      mentorName: user.name,
      milestones: data.milestones.map((m) => ({ ...m, status: 'PENDING' })),
    };

    this.improvementPlans.unshift(plan);
    this.save('erp_improvement_plans', this.improvementPlans);
    this.logAction('IMPROVEMENT_PLAN_ACTIVATED', 'InstructorImprovementPlan', plan.id, { instructor: plan.instructorName });
    return plan;
  }

  // Feedback & Quality
  public getStudentFeedback(instructorId?: string, trackId?: string): StudentFeedbackRecord[] {
    let list = [...this.studentFeedback];
    if (instructorId) list = list.filter((f) => f.instructorId === instructorId);
    if (trackId) list = list.filter((f) => f.trackId === trackId);
    return list;
  }

  public createStudentFeedback(data: Omit<StudentFeedbackRecord, 'id' | 'submissionDate'>): StudentFeedbackRecord {
    const record: StudentFeedbackRecord = {
      ...data,
      id: `sfb-${Date.now()}`,
      submissionDate: new Date().toISOString().split('T')[0],
    };
    this.studentFeedback.unshift(record);
    this.save('erp_student_feedback', this.studentFeedback);
    return record;
  }

  public getQualityMetrics(): QualityMetric[] {
    return [...this.qualityMetrics];
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }
}

const db = new LocalDatabase();

export const setApiUserId = (id: string) => db.setUserId(id);
export const getApiUserId = () => db.getUserId();

export const api = {
  // Auth
  getUsers: async () => db.getUsers(),
  getCurrentUser: async () => db.getCurrentUser(),

  // Meta
  getMeta: async () => db.getMeta(),

  // Instructors
  getInstructors: async (params?: { search?: string; trackId?: string; tier?: string; status?: string }) =>
    db.getInstructors(params),
  getInstructorById: async (id: string) => db.getInstructorById(id),
  updateInstructor: async (id: string, updates: Partial<Instructor>) => db.updateInstructor(id, updates),

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

  // Dashboard
  getDashboardAnalytics: async (trackId?: string) => db.getDashboardAnalytics(trackId),

  // KPI Management
  getKpiDefinitions: async () => db.getKpiDefinitions(),
  updateKpiDefinition: async (id: string, updates: Partial<KpiDefinition>) => db.updateKpiDefinition(id, updates),
  getKpiScorecards: async (period?: string) => db.getKpiScorecards(period),
  getKpiHistory: async () => db.getKpiHistory(),

  // Coaching & Development
  getCoachingSessions: async (instructorId?: string) => db.getCoachingSessions(instructorId),
  createCoachingSession: async (data: any) => db.createCoachingSession(data),
  updateCoachingSession: async (id: string, updates: Partial<CoachingSession>) => db.updateCoachingSession(id, updates),
  getImprovementPlans: async (instructorId?: string) => db.getImprovementPlans(instructorId),
  createImprovementPlan: async (data: any) => db.createImprovementPlan(data),

  // Feedback & Quality
  getStudentFeedback: async (instructorId?: string, trackId?: string) => db.getStudentFeedback(instructorId, trackId),
  createStudentFeedback: async (data: any) => db.createStudentFeedback(data),
  getQualityMetrics: async () => db.getQualityMetrics(),

  // Audit Logs
  getAuditLogs: async () => db.getAuditLogs(),

  // Notifications
  getNotifications: async () => [
    {
      id: 'notif-1',
      userId: db.getCurrentUser().id,
      title: 'Observation OBS-2026-0001 Approved',
      message: 'David Miller received Tier A+ (92.5%) in React Reconciliation session.',
      type: 'OBSERVATION_SUBMITTED',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      userId: db.getCurrentUser().id,
      title: 'New Coaching Session Assigned',
      message: 'Coaching plan for Tariq Mansoor (Cybersecurity) is scheduled for follow-up.',
      type: 'COACHING_ASSIGNED',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'notif-3',
      userId: db.getCurrentUser().id,
      title: 'Quarterly KPI Scorecards Updated',
      message: 'October 2026 faculty KPI scorecards have been calculated.',
      type: 'KPI_CALCULATED',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  markNotificationAsRead: async (_id: string) => true,

  // Reports
  getReportData: async (reportType: string, filters: any) => {
    const insts = db.getInstructors();
    const obs = db.getObservations({}).items;

    if (reportType === 'INSTRUCTOR_PERFORMANCE') {
      return {
        data: insts.map((i) => ({
          Instructor: i.user?.name || i.title,
          EmployeeId: i.employeeId,
          Track: i.track?.name,
          AverageScore: `${i.averageScore.toFixed(1)}%`,
          Tier: i.tier || 'A',
          TotalObservations: i.totalObserved,
          Status: i.status,
          Hired: new Date(i.hireDate).toLocaleDateString(),
        })),
      };
    }

    if (reportType === 'TRACK_PERFORMANCE') {
      const meta = db.getMeta();
      return {
        data: meta.tracks.map((t) => {
          const trackObs = obs.filter((o) => o.trackId === t.id);
          const avg = trackObs.length > 0 ? (trackObs.reduce((s, o) => s + o.percentageScore, 0) / trackObs.length).toFixed(1) : '82.0';
          return {
            TrackName: t.name,
            Code: t.code,
            AverageScore: `${avg}%`,
            TotalEvaluations: trackObs.length,
            InstructorsCount: insts.filter((i) => i.trackId === t.id).length,
          };
        }),
      };
    }

    if (reportType === 'OBSERVER_PERFORMANCE') {
      const users = db.getUsers().filter((u) => u.roleType !== 'INSTRUCTOR');
      return {
        data: users.map((u) => {
          const userObs = obs.filter((o) => o.observerId === u.id);
          const avg = userObs.length > 0 ? (userObs.reduce((s, o) => s + o.percentageScore, 0) / userObs.length).toFixed(1) : '88.0';
          return {
            Observer: u.name,
            Role: u.roleType.replace(/_/g, ' '),
            ObservationsConducted: userObs.length,
            AverageScoreAwarded: `${avg}%`,
          };
        }),
      };
    }

    if (reportType === 'MONTHLY_OBSERVATIONS') {
      return {
        data: [
          { Month: 'May 2026', TechnicalCount: 3, PedagogicalCount: 1, TotalCount: 4, AverageScore: '87.2%' },
          { Month: 'Jun 2026', TechnicalCount: 4, PedagogicalCount: 1, TotalCount: 5, AverageScore: '88.1%' },
          { Month: 'Jul 2026', TechnicalCount: 4, PedagogicalCount: 2, TotalCount: 6, AverageScore: '87.8%' },
          { Month: 'Aug 2026', TechnicalCount: 3, PedagogicalCount: 2, TotalCount: 5, AverageScore: '89.5%' },
          { Month: 'Sep 2026', TechnicalCount: 6, PedagogicalCount: 2, TotalCount: 8, AverageScore: '90.4%' },
          { Month: 'Oct 2026', TechnicalCount: 7, PedagogicalCount: 2, TotalCount: 9, AverageScore: '90.8%' },
        ],
      };
    }

    // Default / CRITERIA_ANALYSIS
    return {
      data: [
        { Criterion: 'Technical Knowledge & Architecture', AverageScore: '9.1/10', Weight: '25%', Evaluations: obs.length },
        { Criterion: 'Content Accuracy & Code Quality', AverageScore: '8.6/10', Weight: '20%', Evaluations: obs.length },
        { Criterion: 'Live Demonstration & Problem Solving', AverageScore: '8.4/10', Weight: '20%', Evaluations: obs.length },
        { Criterion: 'Student Engagement & Interaction', AverageScore: '8.7/10', Weight: '20%', Evaluations: obs.length },
        { Criterion: 'Classroom & Time Management', AverageScore: '8.2/10', Weight: '15%', Evaluations: obs.length },
      ],
    };
  },

  // Legacy instructor portal helper
  getInstructorPortalData: async () => {
    const user = db.getCurrentUser();
    const inst = db.getInstructors().find((i) => i.userId === user.id) || db.getInstructors()[0];
    const details = db.getInstructorById(inst.id);
    return {
      instructor: inst,
      stats: {
        numberObservations: details?.observations.length || 0,
        averageScore: inst.averageScore,
        highestScore: details?.observations ? Math.max(...details.observations.map((o) => o.percentageScore), inst.averageScore) : inst.averageScore,
        lowestScore: details?.observations ? Math.min(...details.observations.map((o) => o.percentageScore), inst.averageScore) : inst.averageScore,
        lastObservationDate: inst.lastObservedAt || null,
        status: inst.status,
      },
      observations: details?.observations || [],
    };
  },

  // Template Lifecycle
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

  // Notification helpers
  markNotificationRead: async (id: string) => true,
  markAllNotificationsRead: async () => true,
};
