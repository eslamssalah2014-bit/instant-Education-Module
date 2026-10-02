import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Star,
  Award,
  Calendar,
  Eye,
  FileDown,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { api } from '../../services/api';
import { Observation, Instructor } from '../../types';
import { ObservationDetailsModal } from '../Observations/ObservationDetailsModal';
import { exportSingleObservationPDF } from '../../utils/export';
import { useAuth } from '../../context/AuthContext';

export const InstructorPortalPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [portalData, setPortalData] = useState<{
    instructor: Instructor;
    stats: {
      numberObservations: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
      lastObservationDate: string | null;
      status: string;
    };
    observations: Observation[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);

  const fetchPortalData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await api.getInstructorPortalData();
      setPortalData(data);
    } catch (err: any) {
      console.warn('Could not load instructor profile for current user:', err);
      setErrorMsg(
        'Current user is not assigned an instructor profile. Please switch to an Instructor persona (e.g. David Miller, Amira Hassan, or Omar Farooq) in the top right to test the Instructor Portal.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <GraduationCap className="h-8 w-8 animate-bounce text-indigo-600" />
          <span className="text-xs font-semibold text-slate-500">Loading Instructor Performance Portal...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !portalData) {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center max-w-xl mx-auto my-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mx-auto mb-3">
          <BookOpen className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Instructor Portal Preview
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {errorMsg}
        </p>
      </div>
    );
  }

  const { instructor, stats, observations } = portalData;

  const getScoreColor = (score: number) => {
    if (score >= 9.0) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 8.0) return 'text-indigo-600 dark:text-indigo-400';
    if (score >= 7.0) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Instructor Hero Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white shadow-lg shadow-indigo-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                instructor.user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.user?.name || 'Faculty')}&background=fff&color=4f46e5`
              }
              alt="instructor"
              className="h-16 w-16 rounded-full object-cover ring-4 ring-white/20 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight">{instructor.user?.name}</h2>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  {instructor.track?.name} Track
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                {instructor.title} • {instructor.specialization}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-indigo-200">
                <span>Employee ID: {instructor.employeeId}</span>
                <span>•</span>
                <span>Status: {instructor.status}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-md border border-white/20 text-center sm:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">
              Cumulative Faculty Score
            </span>
            <div className="flex items-center justify-center sm:justify-end gap-1 mt-0.5">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span className="text-2xl font-black">{stats.averageScore}</span>
              <span className="text-xs text-indigo-200">/ 10</span>
            </div>
            <span className="text-[10px] text-indigo-200">
              {stats.numberObservations} evaluations recorded
            </span>
          </div>
        </div>
      </div>

      {/* Instructor Statistics Cards */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Faculty Performance Indicators
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Observations</span>
              <Target className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.numberObservations}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 font-medium">Full term history</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Average Score</span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.averageScore} <span className="text-xs text-slate-400 font-normal">/ 10</span>
            </div>
            <div className="mt-1 text-[11px] text-indigo-600 font-medium">
              {(stats.averageScore * 10).toFixed(1)}% Benchmark
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Highest Score</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.highestScore}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Personal peak rating</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Lowest Score</span>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats.lowestScore}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Historical lowest</div>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Last Observation</span>
              <Calendar className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white truncate">
              {stats.lastObservationDate
                ? new Date(stats.lastObservationDate).toLocaleDateString()
                : 'None yet'}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 font-medium">Current academic cycle</div>
          </div>
        </div>
      </div>

      {/* Observation History Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              My Observation Evaluation History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any observation row to review criterion-level scoring, strengths, and recommendations.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {observations.length} Sessions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <th className="py-3 px-4">Evaluation Date</th>
                <th className="py-3 px-4">Observer / Evaluator</th>
                <th className="py-3 px-4">Group Cohort</th>
                <th className="py-3 px-4">Observation Type</th>
                <th className="py-3 px-4">Calculated Score</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {observations.map((obs) => (
                <tr
                  key={obs.id}
                  onClick={() => setSelectedObservation(obs)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    {new Date(obs.observationDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          obs.observer?.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(obs.observer?.name || 'Evaluator')}&background=6366f1&color=fff`
                        }
                        alt="observer"
                        className="h-5 w-5 rounded-full object-cover shrink-0"
                      />
                      <span>{obs.observer?.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {obs.group?.name}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                        obs.type === 'TECHNICAL'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {obs.type === 'TECHNICAL' ? 'Technical' : 'Non-Technical'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <span className={getScoreColor(obs.totalScore)}>{obs.totalScore}</span> / 10
                  </td>
                  <td className="py-3 px-4">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {obs.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedObservation(obs)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                        title="View Detailed Feedback"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => exportSingleObservationPDF(obs)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                        title="Download Evaluation Report"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
