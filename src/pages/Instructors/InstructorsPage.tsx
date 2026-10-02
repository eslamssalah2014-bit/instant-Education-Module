import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  Award,
  Star,
  ChevronRight,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  BookOpen,
  ClipboardList,
  Target,
  Sparkles,
  Layers,
  X,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { Instructor, Track, InstructorTier, getTierBadgeClass, Observation, KpiScorecard, CoachingSession, InstructorImprovementPlan, StudentFeedbackRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ObservationDetailsModal } from '../Observations/ObservationDetailsModal';

export const InstructorsPage: React.FC<{
  onNavigateToObservation?: (instructorId: string) => void;
}> = ({ onNavigateToObservation }) => {
  const { currentUser, isEducationManager, isHeadOfTrack, isQaTeam } = useAuth();

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected instructor for detailed profile modal/drawer
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [instructorProfile, setInstructorProfile] = useState<{
    instructor: Instructor;
    groups: any[];
    observations: Observation[];
    scorecard?: KpiScorecard;
    coachingSessions: CoachingSession[];
    improvementPlans: InstructorImprovementPlan[];
    studentFeedback: StudentFeedbackRecord[];
  } | null>(null);

  const [activeProfileTab, setActiveProfileTab] = useState<
    'overview' | 'classification' | 'kpis' | 'observations' | 'coaching' | 'pip' | 'feedback'
  >('overview');

  const [inspectObservation, setInspectObservation] = useState<Observation | null>(null);

  const fetchInstructors = async () => {
    try {
      setIsLoading(true);
      const [meta, list] = await Promise.all([
        api.getMeta(),
        api.getInstructors({
          search: search || undefined,
          trackId: selectedTrack || undefined,
          tier: selectedTier || undefined,
          status: selectedStatus || undefined,
        }),
      ]);
      setTracks(meta.tracks);
      setInstructors(list);
    } catch (err) {
      console.error('Failed to load instructors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, [search, selectedTrack, selectedTier, selectedStatus]);

  const openProfile = async (id: string) => {
    setSelectedInstructorId(id);
    setActiveProfileTab('overview');
    try {
      const data = await api.getInstructorById(id);
      setInstructorProfile(data);
    } catch (err) {
      console.error('Failed to load instructor profile:', err);
    }
  };

  const closeProfile = () => {
    setSelectedInstructorId(null);
    setInstructorProfile(null);
  };

  // Stats calculation
  const totalInst = instructors.length;
  const eliteCount = instructors.filter((i) => i.tier === 'A+').length;
  const accomplishedCount = instructors.filter((i) => i.tier === 'A').length;
  const needsImpCount = instructors.filter((i) => i.tier === 'B' || i.tier === 'B+').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Instructor Management & Performance
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor academic staff performance, classification tiers (A+, A, B+, B), observation history, and individual coaching plans.
          </p>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Instructors
            </span>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalInst}</span>
            <span className="text-xs text-slate-500">active faculty members</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Tier A+ (Elite Masters)
            </span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{eliteCount}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Score ≥ 90%</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Tier A (Accomplished)
            </span>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
              <Star className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{accomplishedCount}</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Score 80-89%</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Needs Coaching (B / B+)
            </span>
            <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{needsImpCount}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Under review / PIP</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by instructor name, employee ID, specialization, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-indigo-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Academic Tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Tiers (A+, A, B+, B)</option>
            <option value="A+">Tier A+ (Elite)</option>
            <option value="A">Tier A (Accomplished)</option>
            <option value="B+">Tier B+ (Proficient)</option>
            <option value="B">Tier B (Needs Improvement)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Employment Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>

          {(search || selectedTrack || selectedTier || selectedStatus) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedTrack('');
                setSelectedTier('');
                setSelectedStatus('');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Instructors Table / Cards */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-6 py-3.5">Instructor</th>
                <th className="px-6 py-3.5">Track & Title</th>
                <th className="px-6 py-3.5">Classification Tier</th>
                <th className="px-6 py-3.5">Average Score</th>
                <th className="px-6 py-3.5">Observations</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {instructors.map((ins) => {
                const tier = ins.tier || 'A';
                return (
                  <tr
                    key={ins.id}
                    className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            ins.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(ins.user?.name || ins.title)}&background=6366f1&color=fff`
                          }
                          alt={ins.user?.name}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {ins.user?.name || ins.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {ins.employeeId} • {ins.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {ins.track?.name || 'Academic Track'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {ins.specialization}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${getTierBadgeClass(
                          tier
                        )}`}
                      >
                        <Award className="h-3 w-3" />
                        Tier {tier}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                          {ins.averageScore.toFixed(1)}%
                        </span>
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ins.averageScore >= 90
                                ? 'bg-emerald-500'
                                : ins.averageScore >= 80
                                ? 'bg-indigo-500'
                                : ins.averageScore >= 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, ins.averageScore)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-white font-medium">
                        {ins.totalObserved} sessions
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Last: {ins.lastObservedAt ? new Date(ins.lastObservedAt).toLocaleDateString() : 'None'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          ins.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : ins.status === 'PROBATION'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {ins.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openProfile(ins.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 shadow-sm transition-colors"
                        >
                          View Profile
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Instructor Profile Modal */}
      {selectedInstructorId && instructorProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 text-white dark:border-slate-800">
              <button
                onClick={closeProfile}
                className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      instructorProfile.instructor.user?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        instructorProfile.instructor.user?.name || instructorProfile.instructor.title
                      )}&background=6366f1&color=fff`
                    }
                    alt=""
                    className="h-16 w-16 rounded-full object-cover ring-4 ring-white/20 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold">
                        {instructorProfile.instructor.user?.name || instructorProfile.instructor.title}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${getTierBadgeClass(
                          instructorProfile.instructor.tier || 'A'
                        )}`}
                      >
                        Tier {instructorProfile.instructor.tier || 'A'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-0.5">
                      {instructorProfile.instructor.title} • {instructorProfile.instructor.track?.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      ID: {instructorProfile.instructor.employeeId} • Hired:{' '}
                      {new Date(instructorProfile.instructor.hireDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/10 rounded-xl p-3 backdrop-blur-md">
                  <div className="text-center px-3 border-r border-white/10">
                    <div className="text-2xl font-mono font-bold">
                      {instructorProfile.instructor.averageScore.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-slate-300 uppercase">Composite Score</div>
                  </div>
                  <div className="text-center px-3">
                    <div className="text-2xl font-mono font-bold">
                      {instructorProfile.observations.length}
                    </div>
                    <div className="text-[11px] text-slate-300 uppercase">Observations</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 mt-6 overflow-x-auto text-xs font-semibold pb-1">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'classification', label: 'Classification & History' },
                  { id: 'kpis', label: 'KPI Scorecard' },
                  { id: 'observations', label: 'Observations List' },
                  { id: 'coaching', label: 'Coaching Sessions' },
                  { id: 'pip', label: 'Improvement Plans' },
                  { id: 'feedback', label: 'Student Feedback' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveProfileTab(t.id as any)}
                    className={`rounded-lg px-3.5 py-2 transition-all shrink-0 ${
                      activeProfileTab === t.id
                        ? 'bg-white text-slate-900 shadow-md'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeProfileTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Instructor Profile & Specialization
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {instructorProfile.instructor.user?.email}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Phone:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {instructorProfile.instructor.user?.phone || '+1 (555) 000-0000'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Department:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {instructorProfile.instructor.user?.department || 'Education'}
                        </span>
                      </div>
                      <div className="py-2">
                        <span className="text-slate-500 block mb-1">Core Tech & Methodologies:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {instructorProfile.instructor.specialization}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Assigned Cohorts & Groups
                    </h3>
                    {instructorProfile.groups.length === 0 ? (
                      <p className="text-sm text-slate-400">No active groups currently assigned.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {instructorProfile.groups.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center justify-between rounded-lg border border-slate-150 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                          >
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{g.name}</div>
                              <div className="text-xs text-slate-500">{g.code} • {g.term}</div>
                            </div>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {g.studentCount} Students
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeProfileTab === 'classification' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                      Academic Faculty Classification Structure
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Instructors are evaluated and placed into institutional quality bands based on weighted classroom observation metrics and KPI achievement.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {[
                        { tier: 'A+', range: '90 - 100%', title: 'Elite Master', desc: 'Exemplary teaching, high student retention, masterclasses & peer mentoring.' },
                        { tier: 'A', range: '80 - 89.9%', title: 'Accomplished', desc: 'Consistently high standard, solid live coding delivery, full syllabus coverage.' },
                        { tier: 'B+', range: '70 - 79.9%', title: 'Proficient / Developing', desc: 'Sound technical knowledge; opportunities for tighter pacing and student engagement.' },
                        { tier: 'B', range: '< 70%', title: 'Needs Improvement (PIP)', desc: 'Requires structured 1-on-1 mentoring, sandbox lab rehearsals, and re-evaluation.' },
                      ].map((t) => {
                        const isCurrent = (instructorProfile.instructor.tier || 'A') === t.tier;
                        return (
                          <div
                            key={t.tier}
                            className={`rounded-xl border p-4 transition-all ${
                              isCurrent
                                ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-sm font-bold px-2 py-0.5 rounded-full border ${getTierBadgeClass(
                                  t.tier as any
                                )}`}
                              >
                                Tier {t.tier}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                  Current Status
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              {t.range}
                            </div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white mt-1">
                              {t.title}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                              {t.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'kpis' && (
                <div className="space-y-4">
                  {instructorProfile.scorecard ? (
                    <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-800">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            Quarterly Scorecard • {instructorProfile.scorecard.period}
                          </div>
                          <div className="text-xs text-slate-500">
                            Evaluated across pedagogical, technical, and delivery KPIs
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {instructorProfile.scorecard.compositeScore}%
                          </span>
                        </div>
                      </div>
                      <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
                        {instructorProfile.scorecard.kpiScores.map((k) => (
                          <div key={k.kpiId} className="pt-3 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {k.kpiName}
                              </div>
                              <div className="text-xs text-slate-400">Weight: {k.weight}%</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-slate-500">Target: {k.target}%</span>
                              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                                {k.actual}%
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  k.achieved
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {k.achieved ? 'Met' : 'Below'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No quarterly scorecard generated yet.</p>
                  )}
                </div>
              )}

              {activeProfileTab === 'observations' && (
                <div className="space-y-3">
                  {instructorProfile.observations.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => setInspectObservation(o)}
                      className="cursor-pointer flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:border-indigo-400 transition-all dark:border-slate-800 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 flex items-center justify-center font-mono font-bold text-xs">
                          {o.percentageScore.toFixed(0)}%
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            {o.observationCode}
                            <span className="text-xs text-slate-400">({o.type})</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Evaluated by {o.observer?.name} on {new Date(o.observationDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {o.grade}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeProfileTab === 'coaching' && (
                <div className="space-y-4">
                  {instructorProfile.coachingSessions.length === 0 ? (
                    <p className="text-sm text-slate-500">No 1-on-1 coaching sessions recorded.</p>
                  ) : (
                    instructorProfile.coachingSessions.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Focus: {c.focusArea.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(c.date).toLocaleDateString()} with {c.coachName}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {c.objectives}
                        </p>
                        <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg">
                          {c.coachNotes}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeProfileTab === 'pip' && (
                <div className="space-y-4">
                  {instructorProfile.improvementPlans.length === 0 ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 text-center dark:border-emerald-900/60 dark:bg-emerald-950/20">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                        No Active Performance Improvement Plan (PIP)
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                        Instructor is in good standing and meeting expected benchmark metrics.
                      </p>
                    </div>
                  ) : (
                    instructorProfile.improvementPlans.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-amber-200 bg-amber-50/30 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white">{p.title}</h4>
                          <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 px-2.5 py-0.5 text-xs font-bold">
                            {p.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{p.reason}</p>
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-500 uppercase">Target Milestones:</div>
                          {p.milestones.map((m, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-xs p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                            >
                              <span>{m.title}</span>
                              <span className="font-mono text-slate-400">Due: {m.deadline}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeProfileTab === 'feedback' && (
                <div className="space-y-3">
                  {instructorProfile.studentFeedback.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 font-bold text-sm">★ {f.overallRating.toFixed(1)}/5</span>
                          <span className="text-xs text-slate-400">• {f.groupName}</span>
                        </div>
                        <span className="text-xs text-slate-400">{f.submissionDate}</span>
                      </div>
                      <p className="text-xs italic text-slate-700 dark:text-slate-300">
                        "{f.studentComments}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Observation Modal inspection */}
      {inspectObservation && (
        <ObservationDetailsModal
          observation={inspectObservation}
          onClose={() => setInspectObservation(null)}
        />
      )}
    </div>
  );
};
