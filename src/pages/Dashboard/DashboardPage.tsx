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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { api } from '../../services/api';
import { DashboardAnalytics, Track } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const DashboardPage: React.FC = () => {
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
          <span className="text-sm font-medium text-slate-500">Loading Executive Analytics...</span>
        </div>
      </div>
    );
  }

  const { statsCards, trackAnalytics, observerAnalytics, criteriaAnalytics, monthlyTrend, heatmap } = analytics;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Academic Performance Overview
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Sparkles className="h-3 w-3" /> Live ERP Sync
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quarterly performance metrics, track diagnostics, observer calibration, and criterion trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isHeadOfTrack && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Tracks (Global)</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} Track
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchDashboard}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Observation Metrics Group */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Observation Metrics
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Total Observations */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Observations</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <ClipboardCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {statsCards.observationMetrics.totalObservations}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="mr-1 h-3 w-3" /> +12.4% vs last term
            </div>
          </div>

          {/* Observations This Month */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">This Month</span>
              <div className="rounded-lg bg-sky-50 p-2 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {statsCards.observationMetrics.observationsThisMonth}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              On track for QA target
            </div>
          </div>

          {/* Technical Observations */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Technical Audits</span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <Code2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {statsCards.observationMetrics.technicalObservations}
            </div>
            <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
              {Math.round(
                (statsCards.observationMetrics.technicalObservations /
                  (statsCards.observationMetrics.totalObservations || 1)) *
                  100
              )}
              % of evaluation volume
            </div>
          </div>

          {/* Non-Technical Observations */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pedagogical Audits</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Users2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {statsCards.observationMetrics.nonTechnicalObservations}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Soft skills & engagement
            </div>
          </div>

          {/* Average Observation Score */}
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 p-4 shadow-sm dark:border-indigo-900/60 dark:from-indigo-950/40 dark:to-indigo-900/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Average Obs. Score</span>
              <div className="rounded-lg bg-indigo-600 p-2 text-white">
                <Star className="h-4 w-4 fill-white" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-indigo-700 dark:text-indigo-300">
              {statsCards.observationMetrics.averageObservationScore}{' '}
              <span className="text-sm font-normal text-indigo-500">/ 10</span>
            </div>
            <div className="mt-1 text-[11px] text-indigo-800 dark:text-indigo-300 font-semibold">
              {(statsCards.observationMetrics.averageObservationScore * 10).toFixed(1)}% Performance Index
            </div>
          </div>
        </div>
      </div>

      {/* Instructor Metrics Group */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Faculty & Instructor Analytics
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Instructors</span>
              <UserCheck className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {statsCards.instructorMetrics.totalActiveInstructors}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Across 6 academic tracks</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Observed Faculty</span>
              <Target className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {statsCards.instructorMetrics.numberObservedInstructors}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 font-medium">
              {Math.round(
                (statsCards.instructorMetrics.numberObservedInstructors /
                  (statsCards.instructorMetrics.totalActiveInstructors || 1)) *
                  100
              )}
              % evaluation coverage
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Avg Instructor Score</span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {statsCards.instructorMetrics.averageInstructorScore}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Normative cohort baseline</div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Highest Score</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {statsCards.instructorMetrics.highestInstructorScore}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600">Peak performance mark</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Lowest Score</span>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {statsCards.instructorMetrics.lowestInstructorScore}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Coaching intervention point</div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph: Monthly Observation Quality */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Observation Score Progression & Activity Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly average ratings for technical vs pedagogical evaluations
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded dark:bg-indigo-950 dark:text-indigo-400">
              2026 Academic Term
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis domain={[7, 10]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="technical"
                  name="Technical Evaluations"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="nonTechnical"
                  name="Pedagogical Evaluations"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Track Score Comparison Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Track Score Benchmarks</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Average score out of 10</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trackAnalytics} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 10]} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="trackName" type="category" stroke="#64748b" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} / 10`, 'Average Score']}
                />
                <Bar dataKey="averageScore" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Track Analytics Grid */}
      <div>
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Track Performance Diagnostics</span>
          <span className="text-[11px] font-normal text-slate-400">All Tracks Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trackAnalytics.map((track) => (
            <div
              key={track.trackId}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: track.color || '#4f46e5' }}
                  />
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {track.trackName}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">{track.trackCode}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Avg Score</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {track.averageScore}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Observations</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {track.numberObservations}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Instructors</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {track.numberInstructors}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">Performance Index</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" /> {track.percentageScore}% ({track.performanceTrend})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observer Analytics & Criteria Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Observer Analytics */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Observer Activity & Calibration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit load distribution and average scoring behavior
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                  <th className="pb-2 font-medium">Observer</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium text-center">Conducted</th>
                  <th className="pb-2 font-medium text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {observerAnalytics.map((obs) => (
                  <tr key={obs.observerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 flex items-center gap-2">
                      <img
                        src={
                          obs.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(obs.observerName)}&background=6366f1&color=fff`
                        }
                        alt={obs.observerName}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {obs.observerName}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      {obs.observerRole.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 text-center font-bold text-slate-700 dark:text-slate-300">
                      {obs.observationsCount}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                      {obs.averageScoreGiven} / 10
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Criteria Analytics */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Criteria Analytics & Trends</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rubric performance across all evaluated sessions
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {criteriaAnalytics.slice(0, 5).map((crit) => (
              <div
                key={crit.criterionName}
                className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {crit.criterionName}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {crit.trend}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Avg: <b className="text-indigo-600 dark:text-indigo-400">{crit.averageScore}</b>
                  </span>
                  <span>
                    Peak: <b className="text-slate-700 dark:text-slate-300">{crit.highestScore}</b>
                  </span>
                  <span>
                    Low: <b className="text-slate-700 dark:text-slate-300">{crit.lowestScore}</b>
                  </span>
                  <span>
                    Evaluations: <b className="text-slate-700 dark:text-slate-300">{crit.evaluationsCount}</b>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
                    style={{ width: `${(crit.averageScore / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Heatmap Matrix */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Track x Criteria Performance Heatmap</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Color intensity indicates criterion score strength across tracks
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                <th className="pb-3 text-left font-medium">Track Domain</th>
                <th className="pb-3 font-medium">Technical Knowledge</th>
                <th className="pb-3 font-medium">Content Accuracy</th>
                <th className="pb-3 font-medium">Practical Demo</th>
                <th className="pb-3 font-medium">Student Engagement</th>
                <th className="pb-3 font-medium">Class Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {heatmap.map((row) => {
                const getHeatBg = (val: number) => {
                  if (val >= 9.2) return 'bg-emerald-500 text-white font-bold';
                  if (val >= 8.8) return 'bg-emerald-100 text-emerald-900 font-semibold dark:bg-emerald-900/60 dark:text-emerald-200';
                  if (val >= 8.4) return 'bg-indigo-100 text-indigo-900 font-semibold dark:bg-indigo-950/70 dark:text-indigo-200';
                  return 'bg-amber-100 text-amber-900 font-medium dark:bg-amber-950/60 dark:text-amber-200';
                };

                return (
                  <tr key={row.track} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 text-left font-semibold text-slate-800 dark:text-slate-200">
                      {row.track}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block w-14 rounded py-1 ${getHeatBg(row.technicalKnowledge)}`}>
                        {row.technicalKnowledge}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block w-14 rounded py-1 ${getHeatBg(row.contentAccuracy)}`}>
                        {row.contentAccuracy}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block w-14 rounded py-1 ${getHeatBg(row.practicalDemo)}`}>
                        {row.practicalDemo}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block w-14 rounded py-1 ${getHeatBg(row.studentEngagement)}`}>
                        {row.studentEngagement}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-block w-14 rounded py-1 ${getHeatBg(row.classroomManagement)}`}>
                        {row.classroomManagement}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
