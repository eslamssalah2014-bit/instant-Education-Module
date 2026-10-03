import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Award,
  X,
  Target,
} from 'lucide-react';
import { api } from '../../services/api';
import { CoachingSession, InstructorImprovementPlan, Instructor } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const CoachingPage: React.FC = () => {
  const { currentUser, isEducationManager, isQaTeam, isHeadOfTrack } = useAuth();

  const [coachingSessions, setCoachingSessions] = useState<CoachingSession[]>([]);
  const [improvementPlans, setImprovementPlans] = useState<InstructorImprovementPlan[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [activeTab, setActiveTab] = useState<'sessions' | 'pips'>('sessions');
  const [isLoading, setIsLoading] = useState(true);

  // New Coaching Session Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSession, setNewSession] = useState<{
    instructorId: string;
    focusArea: 'PEDAGOGY' | 'TECH_MASTERY' | 'STUDENT_ENGAGEMENT' | 'TIME_MANAGEMENT' | 'CURRICULUM';
    objectives: string;
    coachNotes: string;
    actionTasks: string;
    followUpDate: string;
  }>({
    instructorId: '',
    focusArea: 'PEDAGOGY',
    objectives: '',
    coachNotes: '',
    actionTasks: '',
    followUpDate: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [sessions, pips, instList] = await Promise.all([
        api.getCoachingSessions(),
        api.getImprovementPlans(),
        api.getInstructors(),
      ]);
      setCoachingSessions(sessions);
      setImprovementPlans(pips);
      setInstructors(instList);
      if (instList.length > 0 && !newSession.instructorId) {
        setNewSession((prev) => ({ ...prev, instructorId: instList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load coaching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.instructorId) return;

    try {
      const tasks = newSession.actionTasks
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => ({ task: t, targetDate: newSession.followUpDate || '2026-10-30' }));

      await api.createCoachingSession({
        instructorId: newSession.instructorId,
        focusArea: newSession.focusArea,
        objectives: newSession.objectives,
        coachNotes: newSession.coachNotes,
        actionItems: tasks,
        followUpDate: newSession.followUpDate,
      });

      setShowCreateModal(false);
      setNewSession({
        instructorId: instructors[0]?.id || '',
        focusArea: 'PEDAGOGY',
        objectives: '',
        coachNotes: '',
        actionTasks: '',
        followUpDate: '',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create coaching session:', err);
    }
  };

  const toggleTaskCompletion = async (sessionId: string, taskId: string) => {
    const session = coachingSessions.find((s) => s.id === sessionId);
    if (!session) return;

    const updatedItems = session.actionItems.map((a) =>
      a.id === taskId ? { ...a, isCompleted: !a.isCompleted } : a
    );

    const allCompleted = updatedItems.every((a) => a.isCompleted);
    const updatedStatus = allCompleted ? 'COMPLETED' : 'IN_PROGRESS';

    await api.updateCoachingSession(sessionId, {
      actionItems: updatedItems,
      status: updatedStatus,
    });
    fetchData();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Faculty Coaching & Development
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Facilitate 1-on-1 pedagogical mentorship, monitor corrective action plans, and track milestone resolutions.
          </p>
        </div>

        {(isEducationManager || isQaTeam || isHeadOfTrack) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Schedule Coaching Session
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Users2 className="h-4 w-4" />
          Coaching Sessions ({coachingSessions.length})
        </button>
        <button
          onClick={() => setActiveTab('pips')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pips'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Improvement Plans (PIP) ({improvementPlans.length})
        </button>
      </div>

      {/* Tab 1: Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {coachingSessions.length === 0 && (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
              <Users2 className="mx-auto h-10 w-10 text-slate-400 mb-2 opacity-50" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No active coaching sessions</p>
              <p className="text-xs text-slate-400 mt-1">All coaching records have been reset. Click "Schedule Coaching Session" to schedule a session.</p>
            </div>
          )}
          {coachingSessions.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {s.instructorName}
                    </h3>
                    <span className="text-xs text-slate-500">• {s.trackName}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        s.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : s.status === 'IN_PROGRESS'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Coach: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.coachName}</span> • Date: {new Date(s.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Focus: {s.focusArea.replace(/_/g, ' ')}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Session Target Objectives
                </h4>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {s.objectives}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold block mb-1">Mentor Guidance Notes:</span>
                {s.coachNotes}
              </div>

              {/* Action Items */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Follow-up Action Items
                </h4>
                <div className="space-y-1.5">
                  {s.actionItems.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => toggleTaskCompletion(s.id, act.id)}
                      className="cursor-pointer flex items-center justify-between p-2 rounded-lg border border-slate-150 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={act.isCompleted}
                          onChange={() => {}} // handled by parent div click
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span
                          className={`text-xs ${
                            act.isCompleted
                              ? 'line-through text-slate-400'
                              : 'font-medium text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {act.task}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Target: {act.targetDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Improvement Plans */}
      {activeTab === 'pips' && (
        <div className="space-y-4">
          {improvementPlans.length === 0 && (
            <div className="p-12 text-center rounded-xl border border-dashed border-amber-200 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-950/5">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-2 opacity-50" />
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No active performance improvement plans</p>
              <p className="text-xs text-slate-400 mt-1">There are currently no instructors assigned to an improvement plan (PIP).</p>
            </div>
          )}
          {improvementPlans.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-amber-200 bg-amber-50/20 p-5 dark:border-amber-900/60 dark:bg-amber-950/10 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/40 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {p.instructorName}
                    </h3>
                    <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 text-xs font-bold">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Lead Mentor: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.mentorName}</span>
                  </div>
                </div>

                <div className="text-xs font-mono text-slate-500">
                  Cycle: {p.startDate} to {p.targetReviewDate}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Plan Scope: {p.title}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300">{p.reason}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Target Milestones
                </h4>
                {p.milestones.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {m.title}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400">Due: {m.deadline}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          m.status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Schedule 1-on-1 Coaching Session
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Select Faculty Member
                </label>
                <select
                  value={newSession.instructorId}
                  onChange={(e) => setNewSession({ ...newSession, instructorId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                >
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.user?.name || i.title} ({i.track?.name} - Tier {i.tier || 'A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Focus Domain
                </label>
                <select
                  value={newSession.focusArea}
                  onChange={(e) => setNewSession({ ...newSession, focusArea: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="PEDAGOGY">Pedagogical Methods & Student Retention</option>
                  <option value="TECH_MASTERY">Technical Deep Dive & Tooling</option>
                  <option value="STUDENT_ENGAGEMENT">Active Engagement & Concept Checks</option>
                  <option value="TIME_MANAGEMENT">Time Pacing & Lab Pre-Warm</option>
                  <option value="CURRICULUM">Curriculum Alignment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Target Objectives
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eliminate simulator delays by establishing 15m pre-warm routine"
                  value={newSession.objectives}
                  onChange={(e) => setNewSession({ ...newSession, objectives: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Mentor Advice & Feedback Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Concrete tips and frameworks discussed..."
                  value={newSession.coachNotes}
                  onChange={(e) => setNewSession({ ...newSession, coachNotes: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Action Tasks (1 item per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="Create checklist sandbox&#10;Conduct mock dry-run with QA"
                  value={newSession.actionTasks}
                  onChange={(e) => setNewSession({ ...newSession, actionTasks: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Follow-up Review Date
                </label>
                <input
                  type="date"
                  value={newSession.followUpDate}
                  onChange={(e) => setNewSession({ ...newSession, followUpDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
