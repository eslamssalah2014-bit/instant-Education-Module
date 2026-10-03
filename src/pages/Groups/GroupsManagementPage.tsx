import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  FileDown,
  Upload,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  GraduationCap,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  ArrowRight,
  ClipboardCheck,
  Clock,
  Sparkles,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Video,
  Key,
  ArrowLeft,
  Eye,
  Percent,
} from 'lucide-react';
import { api } from '../../services/api';
import { Group, Instructor, Track, GroupImportRow, ImportValidationResult, Session, SessionStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { downloadGroupsImportTemplate, parseExcelFile } from '../../utils/importTemplates';

export const GroupsManagementPage: React.FC<{
  onNavigateToObservation?: (teacherId: string, groupId: string, sessionId?: string) => void;
}> = ({ onNavigateToObservation }) => {
  const { isEducationManager, isHeadOfTrack, isQaTeam, currentUser } = useAuth();
  const canManage = isEducationManager || isHeadOfTrack || isQaTeam;

  const [groups, setGroups] = useState<Group[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dedicated Group Details / Session Management state
  const [selectedGroupForSessions, setSelectedGroupForSessions] = useState<Group | null>(null);
  const [groupSessions, setGroupSessions] = useState<Session[]>([]);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('');
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  // Session Modal state (Add / Edit)
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionFormData, setSessionFormData] = useState<{
    sessionNumber: number;
    sessionName: string;
    sessionLink: string;
    sessionPasscode: string;
    status: SessionStatus;
    scheduledDate: string;
  }>({
    sessionNumber: 1,
    sessionName: '',
    sessionLink: '',
    sessionPasscode: '',
    status: 'NOT_OBSERVED',
    scheduledDate: '',
  });
  const [sessionFormError, setSessionFormError] = useState<string | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Filters for Main Groups Page
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals for Group
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Group Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    trackId: '',
    instructorId: '',
    term: 'Q4 2026',
    startDate: '',
    endDate: '',
    studentCount: 24,
    status: 'ACTIVE' as 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult<GroupImportRow> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Clipboard copy state tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyToClipboard = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('success', `${label} copied to clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [grpList, instList, meta] = await Promise.all([
        api.getGroups({
          search: search || undefined,
          trackId: selectedTrack || undefined,
          instructorId: selectedTeacher || undefined,
          status: selectedStatus || undefined,
        }),
        api.getInstructors(),
        api.getMeta(),
      ]);
      setGroups(grpList);
      setInstructors(instList);
      setTracks(meta.tracks);

      // If a group was actively selected, refresh its details
      if (selectedGroupForSessions) {
        const refreshed = grpList.find((g) => g.id === selectedGroupForSessions.id);
        if (refreshed) {
          setSelectedGroupForSessions(refreshed);
        }
      }
    } catch (err) {
      console.error('Failed to load groups data:', err);
      showToast('error', 'Failed to load cohort groups data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedTrack, selectedTeacher, selectedStatus]);

  // Load Sessions for the selected group
  const fetchGroupSessions = async (groupId: string) => {
    try {
      setIsSessionsLoading(true);
      const [fetchedSessions, grp] = await Promise.all([
        api.getSessions({ groupId }),
        api.getGroupById(groupId),
      ]);
      setGroupSessions(fetchedSessions);
      if (grp) {
        setSelectedGroupForSessions(grp);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      showToast('error', 'Failed to load sessions for this group.');
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleOpenGroupDetails = (group: Group) => {
    setSelectedGroupForSessions(group);
    setSessionSearch('');
    setSessionStatusFilter('');
    fetchGroupSessions(group.id);
  };

  const handleBackToAllGroups = () => {
    setSelectedGroupForSessions(null);
    fetchData();
  };

  // Open Create Group Modal
  const handleOpenCreate = () => {
    setEditingGroup(null);
    const suggestedCode = api.generateGroupCode();
    setFormData({
      name: '',
      code: suggestedCode,
      trackId: tracks[0]?.id || '',
      instructorId: instructors[0]?.id || '',
      term: 'Q4 2026',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      studentCount: 24,
      status: 'ACTIVE',
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  // Open Edit Group Modal
  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      code: group.code,
      trackId: group.trackId,
      instructorId: group.instructorId,
      term: group.term || 'Q4 2026',
      startDate: group.startDate || '',
      endDate: group.endDate || '',
      studentCount: group.studentCount || 24,
      status: (group.status as any) || 'ACTIVE',
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  // Save Group (Create or Update)
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Cohort Group Name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Group Code is required.');
      return;
    }
    if (!formData.trackId) {
      setFormError('Academic Track is required.');
      return;
    }
    if (!formData.instructorId) {
      setFormError('Assigned Teacher is required.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      if (editingGroup) {
        await api.updateGroup(editingGroup.id, {
          name: formData.name.trim(),
          code: formData.code.trim(),
          trackId: formData.trackId,
          instructorId: formData.instructorId,
          term: formData.term,
          startDate: formData.startDate,
          endDate: formData.endDate,
          studentCount: Number(formData.studentCount) || 24,
          status: formData.status,
        });
        showToast('success', `Cohort group "${formData.name}" updated successfully.`);
      } else {
        await api.createGroup({
          name: formData.name.trim(),
          code: formData.code.trim(),
          trackId: formData.trackId,
          instructorId: formData.instructorId,
          term: formData.term,
          startDate: formData.startDate,
          endDate: formData.endDate,
          studentCount: Number(formData.studentCount) || 24,
          status: formData.status,
        });
        showToast('success', `Cohort group "${formData.name}" created successfully.`);
      }

      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save cohort group.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete cohort group "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteGroup(id);
      showToast('success', `Cohort group "${name}" deleted successfully.`);
      if (selectedGroupForSessions?.id === id) {
        setSelectedGroupForSessions(null);
      }
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete cohort group.');
    }
  };

  // --- Session Modal Handlers ---
  const handleOpenAddSession = () => {
    setEditingSession(null);
    const nextNum =
      groupSessions.length > 0 ? Math.max(...groupSessions.map((s) => s.sessionNumber)) + 1 : 1;
    setSessionFormData({
      sessionNumber: nextNum,
      sessionName: `Session ${nextNum}`,
      sessionLink: '',
      sessionPasscode: '',
      status: 'NOT_OBSERVED',
      scheduledDate: '',
    });
    setSessionFormError(null);
    setShowSessionModal(true);
  };

  const handleOpenEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionFormData({
      sessionNumber: session.sessionNumber,
      sessionName: session.sessionName,
      sessionLink: session.sessionLink || '',
      sessionPasscode: session.sessionPasscode || '',
      status: session.status || 'NOT_OBSERVED',
      scheduledDate: session.scheduledDate ? session.scheduledDate.split('T')[0] : '',
    });
    setSessionFormError(null);
    setShowSessionModal(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupForSessions) return;

    if (!sessionFormData.sessionName.trim()) {
      setSessionFormError('Session Name is required.');
      return;
    }
    if (!sessionFormData.sessionNumber || sessionFormData.sessionNumber < 1) {
      setSessionFormError('A valid Session Number is required.');
      return;
    }

    try {
      setIsSavingSession(true);
      setSessionFormError(null);

      if (editingSession) {
        await api.updateSession(editingSession.id, {
          sessionNumber: Number(sessionFormData.sessionNumber),
          sessionName: sessionFormData.sessionName.trim(),
          sessionLink: sessionFormData.sessionLink.trim() || undefined,
          sessionPasscode: sessionFormData.sessionPasscode.trim() || undefined,
          status: sessionFormData.status,
          scheduledDate: sessionFormData.scheduledDate || undefined,
        });
        showToast('success', `Session #${sessionFormData.sessionNumber} updated successfully.`);
      } else {
        await api.createSession({
          groupId: selectedGroupForSessions.id,
          sessionNumber: Number(sessionFormData.sessionNumber),
          sessionName: sessionFormData.sessionName.trim(),
          sessionLink: sessionFormData.sessionLink.trim() || undefined,
          sessionPasscode: sessionFormData.sessionPasscode.trim() || undefined,
          status: sessionFormData.status,
          scheduledDate: sessionFormData.scheduledDate || undefined,
        });
        showToast('success', `Session #${sessionFormData.sessionNumber} added successfully.`);
      }

      setShowSessionModal(false);
      fetchGroupSessions(selectedGroupForSessions.id);
      fetchData();
    } catch (err: any) {
      setSessionFormError(err.message || 'Failed to save session.');
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleDeleteSession = async (session: Session) => {
    if (!window.confirm(`Are you sure you want to delete Session #${session.sessionNumber} (${session.sessionName})?`)) {
      return;
    }
    try {
      await api.deleteSession(session.id);
      showToast('success', `Session #${session.sessionNumber} deleted.`);
      if (selectedGroupForSessions) {
        fetchGroupSessions(selectedGroupForSessions.id);
      }
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete session.');
    }
  };

  // Platform detector helper
  const getMeetingPlatform = (link?: string) => {
    if (!link) return null;
    const lower = link.toLowerCase();
    if (lower.includes('zoom.us')) return { name: 'Zoom', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300' };
    if (lower.includes('teams.microsoft.com')) return { name: 'Teams', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300' };
    if (lower.includes('meet.google.com')) return { name: 'Google Meet', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300' };
    if (lower.includes('webex.com')) return { name: 'Webex', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-300' };
    return { name: 'Meeting', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300' };
  };

  // Status badge helper
  const getSessionStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
            <Clock className="h-3 w-3" />
            Scheduled
          </span>
        );
      case 'MISSED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300">
            <AlertCircle className="h-3 w-3" />
            Missed
          </span>
        );
      case 'NOT_OBSERVED':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
            Not Observed
          </span>
        );
    }
  };

  // File selection for Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setValidationResult(null);
    setImportSuccessMsg(null);

    try {
      const parsedRows = await parseExcelFile(file);
      const validation = await api.validateGroupImport(parsedRows);
      setValidationResult(validation);
    } catch (err: any) {
      alert(`Error parsing Excel file: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    try {
      setIsImporting(true);
      const imported = await api.importGroups(validationResult.validRows);
      setImportSuccessMsg(`Successfully imported ${imported.length} cohort groups with session rosters!`);
      showToast('success', `Successfully imported ${imported.length} cohort groups.`);
      fetchData();
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

  // Calculations for KPI summary cards
  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.status === 'ACTIVE').length;
  const totalSessionsAcrossAll = groups.reduce((sum, g) => sum + (g.sessionsCount || 0), 0);
  const totalObservedSessions = groups.reduce((sum, g) => sum + (g.observedSessionsCount || 0), 0);
  const overallCoveragePct =
    totalSessionsAcrossAll > 0
      ? Number(((totalObservedSessions / totalSessionsAcrossAll) * 100).toFixed(1))
      : 0;

  // Filtered sessions for the selected group details page
  const filteredSessions = groupSessions.filter((s) => {
    const matchesSearch =
      !sessionSearch ||
      s.sessionName.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      String(s.sessionNumber).includes(sessionSearch) ||
      (s.sessionLink && s.sessionLink.toLowerCase().includes(sessionSearch.toLowerCase()));
    const matchesStatus = !sessionStatusFilter || s.status === sessionStatusFilter;
    return matchesSearch && matchesStatus;
  });

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

      {/* ========================================================================= */}
      {/* VIEW A: DEDICATED GROUP DETAILS & SESSION MANAGEMENT SCREEN               */}
      {/* ========================================================================= */}
      {selectedGroupForSessions ? (
        <div className="space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <button
              onClick={handleBackToAllGroups}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4 text-indigo-600" />
              <span>Back to All Cohort Groups</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                {selectedGroupForSessions.code}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {selectedGroupForSessions.name}
              </span>
            </div>
          </div>

          {/* Group Details Header Card & Session Coverage Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {selectedGroupForSessions.name}
                  </h2>
                  <span className="font-mono text-xs font-bold rounded-md bg-indigo-100 px-2 py-0.5 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {selectedGroupForSessions.code}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: selectedGroupForSessions.track?.color || '#4f46e5' }}
                    />
                    {selectedGroupForSessions.track?.name || 'Academic Track'}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      selectedGroupForSessions.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {selectedGroupForSessions.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                    <span>Faculty Teacher:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedGroupForSessions.instructor
                        ? selectedGroupForSessions.instructor.user?.name || selectedGroupForSessions.instructor.title
                        : 'Unassigned'}
                    </strong>
                    {selectedGroupForSessions.instructor?.employeeId && (
                      <span className="font-mono text-[11px] text-slate-400">
                        ({selectedGroupForSessions.instructor.employeeId})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {selectedGroupForSessions.startDate
                        ? `${selectedGroupForSessions.startDate} ${selectedGroupForSessions.endDate ? `→ ${selectedGroupForSessions.endDate}` : ''}`
                        : 'Continuous Academic Term'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedGroupForSessions.studentCount || 24} Enrolled Students</span>
                  </div>
                </div>
              </div>

              {/* Coverage Progress Card */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-950 dark:bg-indigo-950/20 min-w-[280px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-indigo-600" />
                    Observation Coverage
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {selectedGroupForSessions.observationCoverage || 0}%
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500 dark:bg-indigo-500"
                    style={{
                      width: `${Math.min(selectedGroupForSessions.observationCoverage || 0, 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>
                    Observed: <strong>{selectedGroupForSessions.observedSessionsCount || 0}</strong> /{' '}
                    {selectedGroupForSessions.sessionsCount || groupSessions.length} Sessions
                  </span>
                  <span>
                    {selectedGroupForSessions.observationsCount || 0} total audits
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search session #, topic name, or link..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={sessionStatusFilter}
                onChange={(e) => setSessionStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Observation Statuses</option>
                <option value="NOT_OBSERVED">Not Observed</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="MISSED">Missed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchGroupSessions(selectedGroupForSessions.id)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
                title="Refresh Sessions"
              >
                <RefreshCw className={`h-4 w-4 ${isSessionsLoading ? 'animate-spin' : ''}`} />
              </button>

              {canManage && (
                <button
                  onClick={handleOpenAddSession}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Sessions Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
                    <th className="py-3.5 px-4 w-28">Session #</th>
                    <th className="py-3.5 px-4">Session Name</th>
                    <th className="py-3.5 px-4">Session Link</th>
                    <th className="py-3.5 px-4">Passcode</th>
                    <th className="py-3.5 px-4">Observation Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isSessionsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        Loading sessions for {selectedGroupForSessions.code}...
                      </td>
                    </tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Video className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          No Sessions Found for this Cohort
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Add the scheduled live sessions for this group or import them with the Excel Group Template.
                        </p>
                        {canManage && (
                          <div className="mt-4 flex items-center justify-center">
                            <button
                              onClick={handleOpenAddSession}
                              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                            >
                              Add First Session
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => {
                      const platform = getMeetingPlatform(session.sessionLink);
                      const isLinkCopied = copiedKey === `${session.id}-link`;
                      const isPassCopied = copiedKey === `${session.id}-pass`;

                      return (
                        <tr
                          key={session.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition"
                        >
                          {/* Session Number */}
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 border border-indigo-200 dark:border-indigo-900">
                              Session {session.sessionNumber}
                            </span>
                          </td>

                          {/* Session Name */}
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            <div>{session.sessionName}</div>
                            {session.scheduledDate && (
                              <div className="font-mono text-[10px] text-slate-400 font-normal">
                                {session.scheduledDate.split('T')[0]}
                              </div>
                            )}
                          </td>

                          {/* Session Link (Directly Visible + Open + Copy) */}
                          <td className="py-3 px-4">
                            {session.sessionLink ? (
                              <div className="space-y-1.5 max-w-xs">
                                <div className="flex items-center gap-1.5">
                                  {platform && (
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${platform.color}`}
                                    >
                                      {platform.name}
                                    </span>
                                  )}
                                  <span
                                    className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[170px]"
                                    title={session.sessionLink}
                                  >
                                    {session.sessionLink}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={session.sessionLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                                    title="Open meeting in new tab"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>Open Session</span>
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyToClipboard(
                                        session.sessionLink!,
                                        `${session.id}-link`,
                                        'Session Link'
                                      )
                                    }
                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold transition ${
                                      isLinkCopied
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                    title="Copy session link to clipboard"
                                  >
                                    {isLinkCopied ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy Link</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No link configured</span>
                            )}
                          </td>

                          {/* Passcode (Directly Visible + 1-Click Copy) */}
                          <td className="py-3 px-4">
                            {session.sessionPasscode ? (
                              <div className="flex items-center gap-2">
                                <div className="font-mono text-xs font-bold rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                  {session.sessionPasscode}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyToClipboard(
                                      session.sessionPasscode!,
                                      `${session.id}-pass`,
                                      'Passcode'
                                    )
                                  }
                                  className={`inline-flex items-center gap-1 rounded-lg border p-1 text-xs transition ${
                                    isPassCopied
                                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                  title="1-Click Copy Passcode"
                                >
                                  {isPassCopied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">None</span>
                            )}
                          </td>

                          {/* Observation Status */}
                          <td className="py-3 px-4">
                            {getSessionStatusBadge(session.status)}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {selectedGroupForSessions.instructorId && onNavigateToObservation && (
                              <button
                                onClick={() =>
                                  onNavigateToObservation(
                                    selectedGroupForSessions.instructorId,
                                    selectedGroupForSessions.id,
                                    session.id
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                                title="Observe and evaluate this live session"
                              >
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                <span>Audit Session</span>
                              </button>
                            )}

                            {canManage && (
                              <>
                                <button
                                  onClick={() => handleOpenEditSession(session)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                  title="Edit Session Details"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(session)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                                  title="Delete Session"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW B: MAIN COHORT GROUPS LIST (DO NOT DISPLAY SESSIONS DIRECTLY)        */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <Layers className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                Cohort Groups Management
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage academic student cohorts, verify Teacher-Group assignments (1 Teacher → Many Groups), and bulk import via Excel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={downloadGroupsImportTemplate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                title="Download Excel Template with Session Support"
              >
                <FileDown className="h-4 w-4 text-emerald-600" />
                <span>Groups Template.xlsx</span>
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
                    <span>Bulk Import Groups</span>
                  </button>

                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Cohort Group</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Operational KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Cohorts</span>
                <Layers className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
                {totalGroups}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across all tracks</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active Cohorts</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {activeGroups}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Currently in session</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Live Sessions</span>
                <Video className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">
                {totalSessionsAcrossAll}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {totalObservedSessions} observed ({overallCoveragePct}%)
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Overall Session Coverage</span>
                <Percent className="h-4 w-4 text-purple-600" />
              </div>
              <div className="mt-2 font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {overallCoveragePct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Target: 100% group coverage
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search group code, cohort name, or teacher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Track Filter */}
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Academic Tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Teacher Filter */}
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Teachers</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.user?.name || ins.title} ({ins.employeeId})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <button
              onClick={fetchData}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Groups Table: Only Displays Group Code, Name, Track, Teacher, Sessions Count, Observations, Status, Actions */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
                    <th className="py-3.5 px-4">Group Code</th>
                    <th className="py-3.5 px-4">Cohort Name</th>
                    <th className="py-3.5 px-4">Academic Track</th>
                    <th className="py-3.5 px-4">Assigned Teacher</th>
                    <th className="py-3.5 px-4">Number of Sessions</th>
                    <th className="py-3.5 px-4">Observations & Coverage</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                        Loading cohort groups...
                      </td>
                    </tr>
                  ) : groups.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Layers className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          No Cohort Groups Found
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Get started by adding your first student group or using the Bulk Import Groups option with Excel.
                        </p>
                        {canManage && (
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <button
                              onClick={handleOpenCreate}
                              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                            >
                              Add Group
                            </button>
                            <button
                              onClick={() => setShowImportModal(true)}
                              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            >
                              Import from Excel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    groups.map((grp) => (
                      <tr
                        key={grp.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition cursor-pointer"
                        onClick={() => handleOpenGroupDetails(grp)}
                      >
                        {/* Group Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {grp.code}
                        </td>

                        {/* Cohort Name */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{grp.name}</div>
                          <div className="font-mono text-[10px] text-slate-400 font-normal">
                            {grp.term || 'Q4 2026'} • {grp.studentCount || 24} Students
                          </div>
                        </td>

                        {/* Track */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: grp.track?.color || '#4f46e5' }}
                            />
                            {grp.track?.name || 'Academic Track'}
                          </span>
                        </td>

                        {/* Assigned Teacher */}
                        <td className="py-3.5 px-4">
                          {grp.instructor ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 font-bold text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {(grp.instructor.user?.name || grp.instructor.title).charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                  {grp.instructor.user?.name || grp.instructor.title}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  {grp.instructor.employeeId}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Number of Sessions */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
                            <Video className="h-3 w-3" />
                            {grp.sessionsCount || 0} Sessions
                          </span>
                        </td>

                        {/* Number of Observations & Coverage */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                  (grp.observationsCount || 0) > 0
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                }`}
                              >
                                <ClipboardCheck className="h-3 w-3" />
                                {grp.observationsCount || 0} audits
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-500">
                                ({grp.observationCoverage || 0}% covered)
                              </span>
                            </div>
                            {(grp.sessionsCount || 0) > 0 && (
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
                                  style={{
                                    width: `${Math.min(grp.observationCoverage || 0, 100)}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              grp.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                                : grp.status === 'UPCOMING'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {grp.status || 'ACTIVE'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Dedicated View Sessions Button */}
                          <button
                            onClick={() => handleOpenGroupDetails(grp)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                            title="Manage sessions inside this group"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Sessions</span>
                          </button>

                          {grp.instructorId && onNavigateToObservation && (
                            <button
                              onClick={() => onNavigateToObservation(grp.instructorId, grp.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-300"
                              title="Evaluate this cohort"
                            >
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              <span>Audit</span>
                            </button>
                          )}

                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(grp)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                title="Edit Group"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(grp.id, grp.name)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                                title="Delete Group"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT SESSION MODAL                                         */}
      {/* ========================================================================= */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="h-5 w-5 text-indigo-600" />
                {editingSession ? `Edit Session #${editingSession.sessionNumber}` : 'Add Live Session'}
              </h3>
              <button
                onClick={() => setShowSessionModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {sessionFormError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{sessionFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSession} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Session # *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sessionFormData.sessionNumber}
                    onChange={(e) =>
                      setSessionFormData({ ...sessionFormData, sessionNumber: parseInt(e.target.value) || 1 })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Session Name / Topic *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Session 1 - React Components & State"
                    value={sessionFormData.sessionName}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, sessionName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Session Link (Zoom / Teams / Meet)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Directly clickable</span>
                </label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/9876543210 or https://meet.google.com/..."
                  value={sessionFormData.sessionLink}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, sessionLink: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Key className="h-3 w-3 text-slate-400" />
                    <span>Meeting Passcode</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456"
                    value={sessionFormData.sessionPasscode}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, sessionPasscode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Observation Status
                  </label>
                  <select
                    value={sessionFormData.status}
                    onChange={(e) =>
                      setSessionFormData({ ...sessionFormData, status: e.target.value as SessionStatus })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="NOT_OBSERVED">Not Observed</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="MISSED">Missed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Scheduled Date (Optional)
                </label>
                <input
                  type="date"
                  value={sessionFormData.scheduledDate}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, scheduledDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSession}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSavingSession
                    ? 'Saving...'
                    : editingSession
                    ? 'Update Session'
                    : 'Add Session to Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT GROUP MODAL                                        */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                {editingGroup ? 'Edit Cohort Group' : 'Add New Cohort Group'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGroup} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Group Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FS-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cohort Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Group 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Academic Track *
                  </label>
                  <select
                    required
                    value={formData.trackId}
                    onChange={(e) => setFormData({ ...formData, trackId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Academic Track...</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Assigned Teacher *
                  </label>
                  <select
                    required
                    value={formData.instructorId}
                    onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Faculty Teacher...</option>
                    {instructors.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.user?.name || ins.title} ({ins.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingGroup ? 'Update Cohort Group' : 'Create Cohort Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BULK IMPORT GROUPS WITH SESSION ROSTER VIA EXCEL                 */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="h-5 w-5 text-indigo-600" />
                  Bulk Import Cohort Groups & Sessions via Excel
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import multiple cohort groups and attach multi-session schedules (Zoom/Meet/Teams links and passcodes) per group.
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
                  <div className="font-bold">Excel Session-Level Formatting Rules:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-indigo-800 dark:text-indigo-300 text-[11px]">
                    <li>
                      Required group columns: <strong>Group Code, Group Name, Track, Teacher Code</strong>.
                    </li>
                    <li>
                      Session columns: <strong>Session Number, Session Name, Session Link, Session Passcode</strong>.
                    </li>
                    <li>
                      <strong>Multiple rows can belong to the same Group Code</strong> to define multiple sessions (Session 1, Session 2, Session 3...).
                    </li>
                    <li>
                      <strong>Teacher Code</strong> must match an active instructor in the system (e.g. <code>INS-0001</code>).
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={downloadGroupsImportTemplate}
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
                  id="group-file-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="group-file-input"
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
                  Validating spreadsheet rows, session numbers, and teacher references...
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

                  {/* Valid Rows Preview Table with Sessions */}
                  {validationResult.validRows.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Preview of Valid Rows & Sessions ({validationResult.validRows.length})
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400">
                            <tr>
                              <th className="py-2 px-3">Row</th>
                              <th className="py-2 px-3">Group Code</th>
                              <th className="py-2 px-3">Group Name</th>
                              <th className="py-2 px-3">Teacher</th>
                              <th className="py-2 px-3">Session #</th>
                              <th className="py-2 px-3">Session Name</th>
                              <th className="py-2 px-3">Link / Passcode</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                            {validationResult.validRows.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="py-1.5 px-3 text-slate-400">#{r.rowNumber}</td>
                                <td className="py-1.5 px-3 font-bold text-indigo-600">{r.groupCode}</td>
                                <td className="py-1.5 px-3 font-sans text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                                  {r.groupName}
                                </td>
                                <td className="py-1.5 px-3 text-emerald-600 font-sans font-semibold">
                                  {r.teacherName || r.teacherCode}
                                </td>
                                <td className="py-1.5 px-3 font-bold text-indigo-700 dark:text-indigo-300">
                                  {r.sessionNumber ? `Session ${r.sessionNumber}` : '-'}
                                </td>
                                <td className="py-1.5 px-3 font-sans text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                                  {r.sessionName || '-'}
                                </td>
                                <td className="py-1.5 px-3 text-slate-500 truncate max-w-[140px]">
                                  {r.sessionLink ? '🔗 URL' : '-'} {r.sessionPasscode ? `(🔑 ${r.sessionPasscode})` : ''}
                                </td>
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
                    <span>Importing Groups & Sessions...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Import {validationResult?.validCount || 0} Valid Rows</span>
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
