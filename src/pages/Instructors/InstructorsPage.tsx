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
  Upload,
  FileSpreadsheet,
  FileDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Instructor,
  Track,
  InstructorTier,
  getTierBadgeClass,
  Observation,
  KpiScorecard,
  CoachingSession,
  InstructorImprovementPlan,
  StudentFeedbackRecord,
  TeacherImportRow,
  ImportValidationResult,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ObservationDetailsModal } from '../Observations/ObservationDetailsModal';
import { downloadTeachersImportTemplate, parseExcelFile } from '../../utils/importTemplates';

export const InstructorsPage: React.FC<{
  onNavigateToObservation?: (instructorId: string) => void;
  onNavigateToGroups?: (teacherId?: string) => void;
}> = ({ onNavigateToObservation, onNavigateToGroups }) => {
  const { currentUser, isEducationManager, isHeadOfTrack, isQaTeam } = useAuth();
  const canManage = isEducationManager || isHeadOfTrack || isQaTeam;

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teacherCode: '',
    trackId: '',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE' as const,
  });
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);

  // Bulk Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult<TeacherImportRow> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  const handleOpenAddTeacher = () => {
    const suggestedCode = api.generateTeacherCode();
    setAddFormData({
      name: '',
      email: '',
      phone: '',
      teacherCode: suggestedCode,
      trackId: tracks[0]?.id || '',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    });
    setAddFormError(null);
    setShowAddModal(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.name.trim()) {
      setAddFormError('Teacher Name is required.');
      return;
    }
    if (!addFormData.email.trim()) {
      setAddFormError('Email address is required.');
      return;
    }
    if (!addFormData.trackId) {
      setAddFormError('Academic Track is required.');
      return;
    }

    try {
      setIsSavingTeacher(true);
      setAddFormError(null);
      await api.createInstructor({
        name: addFormData.name.trim(),
        email: addFormData.email.trim(),
        phone: addFormData.phone.trim(),
        teacherCode: addFormData.teacherCode.trim(),
        trackId: addFormData.trackId,
        employmentType: addFormData.employmentType,
        status: addFormData.status,
      });
      showToast('success', `Teacher "${addFormData.name}" added successfully.`);
      setShowAddModal(false);
      fetchInstructors();
    } catch (err: any) {
      setAddFormError(err.message || 'Failed to create instructor.');
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setValidationResult(null);
    setImportSuccessMsg(null);

    try {
      const parsedRows = await parseExcelFile(file);
      const validation = await api.validateTeacherImport(parsedRows);
      setValidationResult(validation);
    } catch (err: any) {
      alert(`Error parsing Excel file: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    try {
      setIsImporting(true);
      const imported = await api.importTeachers(validationResult.validRows);
      setImportSuccessMsg(`Successfully imported ${imported.length} teachers!`);
      showToast('success', `Successfully imported ${imported.length} teachers.`);
      fetchInstructors();
      setTimeout(() => {
        setShowImportModal(false);
        setImportFile(null);
        setValidationResult(null);
        setImportSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Stats calculation
  const totalInst = instructors.length;
  const eliteCount = instructors.filter((i) => i.tier === 'A+').length;
  const accomplishedCount = instructors.filter((i) => i.tier === 'A').length;
  const needsImpCount = instructors.filter((i) => i.tier === 'B' || i.tier === 'B+').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl border animate-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Instructor Management & Performance
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor academic staff performance, classification tiers (A+, A, B+, B), assigned groups, and bulk import teachers via Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={downloadTeachersImportTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            title="Download Excel Template"
          >
            <FileDown className="h-4 w-4 text-emerald-600" />
            <span>Teachers Template.xlsx</span>
          </button>

          {canManage && (
            <>
              <button
                onClick={() => {
                  setImportFile(null);
                  setValidationResult(null);
                  setImportSuccessMsg(null);
                  setShowImportModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300"
              >
                <Upload className="h-4 w-4 text-indigo-600" />
                <span>Bulk Import Teachers</span>
              </button>

              <button
                onClick={handleOpenAddTeacher}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none"
              >
                <Plus className="h-4 w-4" />
                <span>Add Teacher</span>
              </button>
            </>
          )}
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
                <th className="px-5 py-3.5">Teacher Code</th>
                <th className="px-5 py-3.5">Instructor & Contacts</th>
                <th className="px-5 py-3.5">Track & Role</th>
                <th className="px-5 py-3.5">Assigned Groups</th>
                <th className="px-5 py-3.5">Classification Tier</th>
                <th className="px-5 py-3.5">Average Score</th>
                <th className="px-5 py-3.5">Observations</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {instructors.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <GraduationCap className="mx-auto h-10 w-10 text-slate-400 mb-2 opacity-50" />
                    <p className="font-medium text-base text-slate-700 dark:text-slate-300">No instructors found</p>
                    <p className="text-xs text-slate-400 mt-1">Get started by clicking "Add Teacher" or "Bulk Import Teachers".</p>
                  </td>
                </tr>
              )}
              {instructors.map((ins) => {
                const tier = ins.tier || 'A';
                return (
                  <tr
                    key={ins.id}
                    className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40"
                  >
                    {/* Teacher Code */}
                    <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {ins.employeeId || ins.teacherCode}
                    </td>

                    {/* Instructor & Contacts */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            ins.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(ins.user?.name || ins.title)}&background=6366f1&color=fff`
                          }
                          alt={ins.user?.name}
                          className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-500/20"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {ins.user?.name || ins.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {ins.user?.email || ins.email}
                            {(ins.phone || ins.user?.phone) && (
                              <span className="ml-1.5 text-slate-400">• {ins.phone || ins.user?.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Track & Role */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {ins.track?.name || 'Academic Track'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {ins.employmentType ? ins.employmentType.replace(/_/g, ' ') : 'Full Time'} • {ins.specialization}
                      </div>
                    </td>

                    {/* Assigned Groups */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          (ins.groupsCount || 0) > 0
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        <Layers className="h-3 w-3" />
                        {ins.groupsCount || 0} {(ins.groupsCount === 1) ? 'Group' : 'Groups'}
                      </span>
                    </td>

                    {/* Classification Tier */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${getTierBadgeClass(
                          tier
                        )}`}
                      >
                        <Award className="h-3 w-3" />
                        Tier {tier}
                      </span>
                    </td>

                    {/* Average Score */}
                    <td className="px-5 py-4">
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

                    {/* Observations */}
                    <td className="px-5 py-4">
                      <div className="text-slate-900 dark:text-white font-medium">
                        {ins.totalObserved} sessions
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Last: {ins.lastObservedAt ? new Date(ins.lastObservedAt).toLocaleDateString() : 'None'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
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

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onNavigateToObservation && (
                          <button
                            onClick={() => onNavigateToObservation(ins.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                            title="Conduct observation audit"
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                            Audit
                          </button>
                        )}
                        <button
                          onClick={() => openProfile(ins.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          Profile
                          <ChevronRight className="h-3 w-3" />
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

      {/* ADD SINGLE TEACHER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                Add New Faculty Teacher
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addFormError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{addFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Teacher Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INS-0001"
                    value={addFormData.teacherCode}
                    onChange={(e) => setAddFormData({ ...addFormData, teacherCode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">Auto-suggested sequentially</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmed Mohamed"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ahmed@scalora.com"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+20 100 123 4567"
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Track *
                  </label>
                  <select
                    required
                    value={addFormData.trackId}
                    onChange={(e) => setAddFormData({ ...addFormData, trackId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select...</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Employment
                  </label>
                  <select
                    value={addFormData.employmentType}
                    onChange={(e) => setAddFormData({ ...addFormData, employmentType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={addFormData.status}
                    onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PROBATION">Probation</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeacher}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSavingTeacher ? 'Saving...' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT TEACHERS MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="h-5 w-5 text-indigo-600" />
                  Bulk Import Teachers via Excel
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import teachers spreadsheet with automatic code generation (e.g. INS-0001, INS-0002) and pre-import validation.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Instructions banner */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-950 dark:bg-indigo-950/30">
                <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                  <div className="font-bold">Required Columns:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-indigo-800 dark:text-indigo-300 text-[11px]">
                    <li>
                      <strong>Teacher Name, Email, Track</strong> (Required)
                    </li>
                    <li>
                      <strong>Teacher Code</strong>: Optional. If blank, system auto-generates <code>INS-0001</code>, <code>INS-0002</code>...
                    </li>
                    <li>Optional columns: Phone Number, Employment Type, Status.</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={downloadTeachersImportTemplate}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300"
                >
                  <FileDown className="h-4 w-4 text-emerald-600" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* File upload dropzone */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition dark:border-slate-700">
                <input
                  type="file"
                  id="teacher-file-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="teacher-file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <FileSpreadsheet className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {importFile ? importFile.name : 'Click to browse Excel spreadsheet'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Supports .xlsx, .xls, and .csv files
                  </span>
                </label>
              </div>

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  Validating spreadsheet rows, emails, and codes...
                </div>
              )}

              {/* Validation Summary */}
              {validationResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border p-3 bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Total Rows: {validationResult.totalRows}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Valid: {validationResult.validCount}
                      </span>
                      {validationResult.errorCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                          <AlertCircle className="h-4 w-4" />
                          Errors: {validationResult.errorCount}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        validationResult.isValid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {validationResult.isValid ? '✓ All Rows Valid' : '✗ Errors Detected'}
                    </span>
                  </div>

                  {/* Errors List */}
                  {validationResult.errors.length > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-1.5 dark:border-rose-900/60 dark:bg-rose-950/20 max-h-36 overflow-y-auto">
                      <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                        Validation Errors ({validationResult.errors.length}):
                      </div>
                      {validationResult.errors.map((err, i) => (
                        <div key={i} className="text-[11px] text-rose-700 dark:text-rose-300 font-mono">
                          • Row {err.row}: <strong>[{err.field}]</strong> {err.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Valid Rows Preview Table */}
                  {validationResult.validRows.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Preview of Valid Teachers ({validationResult.validRows.length})
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400">
                            <tr>
                              <th className="py-2 px-3">Row</th>
                              <th className="py-2 px-3">Code</th>
                              <th className="py-2 px-3">Name</th>
                              <th className="py-2 px-3">Email</th>
                              <th className="py-2 px-3">Track</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                            {validationResult.validRows.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="py-1.5 px-3 text-slate-400">#{r.rowNumber}</td>
                                <td className="py-1.5 px-3 font-bold text-indigo-600">
                                  {r.teacherCode || <span className="text-slate-400 font-normal italic">[Auto-Gen]</span>}
                                </td>
                                <td className="py-1.5 px-3 font-sans text-slate-800 dark:text-slate-200">{r.teacherName}</td>
                                <td className="py-1.5 px-3 text-slate-500">{r.email}</td>
                                <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">{r.track}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importSuccessMsg && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>{importSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 p-5 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </button>

              <button
                type="button"
                disabled={
                  !validationResult ||
                  validationResult.validCount === 0 ||
                  isImporting
                }
                onClick={handleExecuteImport}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Import {validationResult?.validCount || 0} Valid Teachers</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
