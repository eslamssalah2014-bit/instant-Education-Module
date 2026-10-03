import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Code2,
  Users2,
  Star,
  Award,
  TrendingUp,
  UserCheck,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../services/api';
import { DashboardAnalytics, Track, getTierBadgeClass } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const DashboardPage: React.FC<{
  onNavigateToInstructors?: () => void;
  onNavigateToObservations?: () => void;
  onNavigateToCoaching?: () => void;
}> = ({ onNavigateToInstructors, onNavigateToObservations, onNavigateToCoaching }) => {
  const { currentUser, isHeadOfTrack } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const [meta, data] = await Promise.all([
        api.getMeta(),
        api.getDashboardAnalytics(selectedTrack || undefined),
      ]);
      setTracks(meta.tracks);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedTrack, currentUser]);

  if (isLoading || !analytics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-slate-500">Loading Education Executive Analytics...</span>
        </div>
      </div>
    );
  }

  const {
    statsCards,
    trackAnalytics,
    observerAnalytics,
    criteriaAnalytics,
    monthlyTrend,
    topInstructors,
    improvementInstructors,
    heatmap,
  } = analytics;

  const tierPieData = [
    { name: 'Tier A+ (Elite)', value: statsCards.tierDistribution?.aPlus ?? 0, color: '#10b981' },
    { name: 'Tier A (Accomplished)', value: statsCards.tierDistribution?.a ?? 0, color: '#6366f1' },
    { name: 'Tier B+ (Proficient)', value: statsCards.tierDistribution?.bPlus ?? 0, color: '#f59e0b' },
    { name: 'Tier B (Under Review)', value: statsCards.tierDistribution?.b ?? 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Academic Quality & Faculty Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Institutional overview of faculty evaluations, classification tiers (A+, A, B+, B), and developmental benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Academic Tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Instructors */}
        <div
          onClick={onNavigateToInstructors}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Faculty
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
              <Users2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {statsCards.instructorMetrics.totalActiveInstructors}
            </span>
            <span className="text-xs text-slate-400">active instructors</span>
          </div>
          <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium group-hover:underline">
            Manage Faculty Profiles <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* Total Observations */}
        <div
          onClick={onNavigateToObservations}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Observations
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {statsCards.observationMetrics.totalObservations}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              +{statsCards.observationMetrics.observationsThisMonth} this month
            </span>
          </div>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium group-hover:underline">
            View Evaluation Directory <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* Institutional Average Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Institutional Average
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <Star className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {statsCards.observationMetrics.averageObservationScore}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">+2.4% vs Q3</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Target benchmark: <strong className="text-slate-700 dark:text-slate-300">85.0%</strong>
          </div>
        </div>

        {/* Observations Requiring Attention */}
        <div
          onClick={onNavigateToCoaching}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Coaching Needed (Tier B)
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {statsCards.tierDistribution?.b ?? 0}
            </span>
            <span className="text-xs text-amber-600 font-medium">Under active PIP</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium group-hover:underline">
            Open Coaching Module <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Tier Classification Breakdown & Trend Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Distribution Donut & Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              Faculty Classification Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown of teaching staff by institutional tier.
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {tierPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {tierPieData.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{t.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {t.value} faculty
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Performance Trends */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Monthly Performance Trajectory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tracking technical vs pedagogical observation scores across the last 6 months.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[70, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="technical"
                  name="Technical Evaluations"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="nonTechnical"
                  name="Pedagogical Evaluations"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performers and Instructors Requiring Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performing Faculty */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Top-Performing Faculty (Tier A+)
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              Excellence Benchmarks
            </span>
          </div>

          <div className="space-y-3">
            {topInstructors.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No faculty evaluations recorded yet
              </div>
            )}
            {topInstructors.map((ins, i) => (
              <div
                key={ins.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-150 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-850/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300">
                    #{i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {ins.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {ins.trackName} • {ins.totalObserved} evaluations
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                    {ins.averageScore.toFixed(1)}%
                  </span>
                  <span
                    className={`block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadgeClass(
                      ins.tier
                    )} mt-0.5`}
                  >
                    Tier {ins.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructors Requiring Coaching / Improvement */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Faculty Requiring Coaching Support
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
              PIP Allocation
            </span>
          </div>

          <div className="space-y-3">
            {improvementInstructors.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No faculty members currently require coaching support
              </div>
            )}
            {improvementInstructors.map((ins) => (
              <div
                key={ins.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/20 dark:border-amber-900/60 dark:bg-amber-950/10"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    {ins.name}
                  </div>
                  <div className="text-xs text-slate-500">{ins.trackName}</div>
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
                    Recommendation: {ins.recommendedCoaching}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                    {ins.averageScore.toFixed(1)}%
                  </span>
                  <span
                    className={`block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadgeClass(
                      ins.tier
                    )} mt-0.5`}
                  >
                    Tier {ins.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Track Comparative Performance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-indigo-600" />
          Academic Track Performance Comparison
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {trackAnalytics.length === 0 && (
            <div className="col-span-full p-8 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              No academic tracks configured yet
            </div>
          )}
          {trackAnalytics.map((t) => (
            <div
              key={t.trackId}
              className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{t.trackName}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {t.performanceTrend}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Track Average:</span>
                <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                  {t.percentageScore}%
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span>{t.numberInstructors} instructors</span>
                <span>{t.numberObservations} observations</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
