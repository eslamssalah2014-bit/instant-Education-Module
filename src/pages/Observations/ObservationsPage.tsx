import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RefreshCw,
  X,
  Calendar,
  Layers,
  Sparkles,
  Edit2,
  Award,
  Archive,
  Trash2,
  ClipboardCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Observation,
  ObservationType,
  ObservationStatus,
  InstructorTier,
  Track,
  Group,
  Instructor,
  User,
  getTierBadgeClass,
} from '../../types';
import { exportObservationsToExcel, exportObservationsToPDF } from '../../utils/export';
import { ObservationDetailsModal } from './ObservationDetailsModal';
import { useAuth } from '../../context/AuthContext';

export const ObservationsPage: React.FC<{
  onNavigateToCreate?: () => void;
  onNavigateToEdit?: (obs: Observation) => void;
}> = ({ onNavigateToCreate, onNavigateToEdit }) => {
  const { currentUser, canCreateObservation, canExportReports } = useAuth();

  const [observations, setObservations] = useState<Observation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [trackId, setTrackId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [observerId, setObserverId] = useState('');
  const [observationType, setObservationType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('observationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Metadata dropdowns
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [observers, setObservers] = useState<User[]>([]);

  // Selected for Details Modal
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);

  const fetchMeta = async () => {
    try {
      const [meta, instList, usersList] = await Promise.all([
        api.getMeta(),
        api.getInstructors(),
        api.getUsers(),
      ]);
      setTracks(meta.tracks);
      setGroups(meta.groups);
      setInstructors(instList);
      setObservers(usersList.filter((u) => u.roleType !== 'INSTRUCTOR'));
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const fetchObservations = async () => {
    try {
      setIsLoading(true);
      const res = await api.getObservations({
        search: search || undefined,
        teacherId: teacherId || undefined,
        trackId: trackId || undefined,
        groupId: groupId || undefined,
        observerId: observerId || undefined,
        observationType: (observationType as ObservationType) || undefined,
        status: (selectedStatus as ObservationStatus) || undefined,
        tier: (selectedTier as InstructorTier) || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      setObservations(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch observations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchObservations();
  }, [
    page,
    limit,
    search,
    teacherId,
    trackId,
    groupId,
    observerId,
    observationType,
    selectedStatus,
    selectedTier,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setTeacherId('');
    setTrackId('');
    setGroupId('');
    setObserverId('');
    setObservationType('');
    setSelectedStatus('');
    setSelectedTier('');
    setStartDate('');
    setEndDate('');
    setSortBy('observationDate');
    setSortOrder('desc');
    setPage(1);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this observation record?')) {
      await api.deleteObservation(id);
      fetchObservations();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Classroom Observations Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Comprehensive audit log of evaluations, rubrics, classification tiers, and action plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canExportReports && (
            <>
              <button
                onClick={() => exportObservationsToExcel(observations)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-sm transition-colors"
                title="Export Filtered Observations to Excel"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Excel Export
              </button>

              <button
                onClick={() => exportObservationsToPDF(observations)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-sm transition-colors"
                title="Export Filtered Observations to PDF"
              >
                <FileDown className="h-4 w-4 text-rose-600" />
                PDF Report
              </button>
            </>
          )}

          {canCreateObservation && onNavigateToCreate && (
            <button
              onClick={onNavigateToCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Observation
            </button>
          )}
        </div>
      </div>

      {/* Primary Search and Quick Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code (e.g. OBS-2026-0001), instructor, observer, or cohort..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={trackId}
              onChange={(e) => {
                setTrackId(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">All Tracks</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">All Tiers</option>
              <option value="A+">Tier A+ (≥90%)</option>
              <option value="A">Tier A (80-89%)</option>
              <option value="B+">Tier B+ (70-79%)</option>
              <option value="B">Tier B (&lt;70%)</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                showAdvancedFilters
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Instructor</label>
              <select
                value={teacherId}
                onChange={(e) => {
                  setTeacherId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Faculty</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.user?.name || ins.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Evaluator / Observer</label>
              <select
                value={observerId}
                onChange={(e) => {
                  setObserverId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Evaluators</option>
                {observers.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {obs.name} ({obs.roleType.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Observation Type</label>
              <select
                value={observationType}
                onChange={(e) => {
                  setObservationType(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Types</option>
                <option value="TECHNICAL">Technical Deep-Dive</option>
                <option value="NON_TECHNICAL">Pedagogical</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleResetFilters}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Observations Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <th className="px-6 py-3.5">Code & Date</th>
                <th className="px-6 py-3.5">Instructor</th>
                <th className="px-6 py-3.5">Cohort & Track</th>
                <th className="px-6 py-3.5">Evaluator</th>
                <th className="px-6 py-3.5">Score & Tier</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {observations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <ClipboardCheck className="mx-auto h-10 w-10 text-slate-400 mb-2 opacity-50" />
                    <p className="font-medium text-base text-slate-700 dark:text-slate-300">No observations found</p>
                    <p className="text-xs text-slate-400 mt-1">All observation records have been purged. Conduct a new evaluation to start recording data.</p>
                  </td>
                </tr>
              )}
              {observations.map((obs) => {
                const tier = obs.tier || 'A';
                return (
                  <tr
                    key={obs.id}
                    onClick={() => setSelectedObservation(obs)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {obs.observationCode}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(obs.observationDate).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {obs.instructor?.user?.name || 'Academic Faculty'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {obs.instructor?.employeeId}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {obs.group?.name || 'Cohort'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {obs.track?.name} • {obs.type}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-white font-medium">
                        {obs.observer?.name || 'Observer'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {obs.observer?.roleType?.replace(/_/g, ' ')}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                          {obs.percentageScore.toFixed(1)}%
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border ${getTierBadgeClass(
                            tier
                          )}`}
                        >
                          Tier {tier}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{obs.grade}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          obs.status === 'REVIEWED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : obs.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : obs.status === 'ARCHIVED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {obs.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedObservation(obs)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {onNavigateToEdit && (
                          <button
                            onClick={() => onNavigateToEdit(obs)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Observation"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDelete(obs.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Observation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <div className="text-xs text-slate-500">
            Showing {observations.length} of {total} total observations
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Observation Details Modal */}
      {selectedObservation && (
        <ObservationDetailsModal
          observation={selectedObservation}
          onClose={() => setSelectedObservation(null)}
          onEdit={onNavigateToEdit}
          onStatusChange={() => fetchObservations()}
        />
      )}
    </div>
  );
};
