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
} from 'lucide-react';
import { api } from '../../services/api';
import { Observation, ObservationType, Track, Group, Instructor, User } from '../../types';
import { exportObservationsToExcel, exportObservationsToPDF, exportSingleObservationPDF } from '../../utils/export';
import { ObservationDetailsModal } from './ObservationDetailsModal';
import { useAuth } from '../../context/AuthContext';

export const ObservationsPage: React.FC<{ onNavigateToCreate?: () => void }> = ({
  onNavigateToCreate,
}) => {
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
      console.error('Failed to load observations:', err);
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
    sortBy,
    sortOrder,
    teacherId,
    trackId,
    groupId,
    observerId,
    observationType,
    startDate,
    endDate,
    currentUser,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchObservations();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setTeacherId('');
    setTrackId('');
    setGroupId('');
    setObserverId('');
    setObservationType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getGradePill = (grade?: string) => {
    switch (grade) {
      case 'Outstanding':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'Proficient':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
      case 'Developing':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Observation Records Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full audit logs, criteria evaluations, and structured feedback repository.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canExportReports && (
            <>
              <button
                onClick={() => exportObservationsToExcel(observations)}
                disabled={observations.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => exportObservationsToPDF(observations)}
                disabled={observations.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200"
              >
                <FileDown className="h-4 w-4 text-rose-600" />
                <span>Export PDF</span>
              </button>
            </>
          )}

          {canCreateObservation && onNavigateToCreate && (
            <button
              onClick={onNavigateToCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create Observation</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by teacher, group, track, observer, code..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                showAdvancedFilters
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
              {(teacherId || trackId || groupId || observerId || observationType || startDate || endDate) && (
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
              )}
            </button>

            <button
              onClick={resetFilters}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Reset all filters"
            >
              Reset
            </button>

            <button
              onClick={fetchObservations}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Tray */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            {/* Teacher */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Instructor
              </label>
              <select
                value={teacherId}
                onChange={(e) => {
                  setTeacherId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Instructors</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.user?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Track */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Track
              </label>
              <select
                value={trackId}
                onChange={(e) => {
                  setTrackId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Observation Type */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Observation Type
              </label>
              <select
                value={observationType}
                onChange={(e) => {
                  setObservationType(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Types</option>
                <option value="TECHNICAL">Technical Observation</option>
                <option value="NON_TECHNICAL">Non-Technical Observation</option>
              </select>
            </div>

            {/* Observer */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Observer
              </label>
              <select
                value={observerId}
                onChange={(e) => {
                  setObserverId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Observers</option>
                {observers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleType.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Observations Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <th
                  onClick={() => handleSort('observationCode')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Observation ID</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('teacherName')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Teacher Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Group Name</th>
                <th
                  onClick={() => handleSort('trackName')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Track</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Observer</th>
                <th
                  onClick={() => handleSort('observationDate')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Type</th>
                <th
                  onClick={() => handleSort('totalScore')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Total Score</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading observations...
                  </td>
                </tr>
              ) : observations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No observations found matching the selected filters.
                  </td>
                </tr>
              ) : (
                observations.map((obs) => (
                  <tr
                    key={obs.id}
                    onClick={() => setSelectedObservation(obs)}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {obs.observationCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            obs.instructor?.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              obs.instructor?.user?.name || 'T'
                            )}&background=6366f1&color=fff`
                          }
                          alt="avatar"
                          className="h-6 w-6 rounded-full object-cover shrink-0"
                        />
                        <span>{obs.instructor?.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                      {obs.group?.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${obs.track?.color || '#4f46e5'}15`,
                          color: obs.track?.color || '#4f46e5',
                        }}
                      >
                        {obs.track?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {obs.observer?.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(obs.observationDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium font-mono ${
                          obs.type === 'TECHNICAL'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {obs.type === 'TECHNICAL' ? 'Tech' : 'Non-Tech'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {obs.totalScore}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${getGradePill(
                            obs.grade
                          )}`}
                        >
                          {obs.grade}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {obs.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedObservation(obs)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="View Evaluation Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => exportSingleObservationPDF(obs)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Export PDF Audit Report"
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <b className="text-slate-800 dark:text-slate-200">{observations.length}</b> of{' '}
            <b className="text-slate-800 dark:text-slate-200">{total}</b> observations
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Details Modal */}
      {selectedObservation && (
        <ObservationDetailsModal
          observation={selectedObservation}
          onClose={() => setSelectedObservation(null)}
        />
      )}
    </div>
  );
};
