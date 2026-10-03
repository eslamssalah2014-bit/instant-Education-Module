import React, { useState, useEffect } from 'react';
import {
  Target,
  Award,
  Layers,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Sparkles,
  Calculator,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { KpiDefinition, KpiScorecard, KpiMonthlyHistory, getTierBadgeClass } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const KpiManagementPage: React.FC = () => {
  const { isEducationManager } = useAuth();

  const [kpis, setKpis] = useState<KpiDefinition[]>([]);
  const [scorecards, setScorecards] = useState<KpiScorecard[]>([]);
  const [history, setHistory] = useState<KpiMonthlyHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit KPI state
  const [editingKpi, setEditingKpi] = useState<KpiDefinition | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchKpis = async () => {
    try {
      setIsLoading(true);
      const [kpiList, cards, hist] = await Promise.all([
        api.getKpiDefinitions(),
        api.getKpiScorecards(),
        api.getKpiHistory(),
      ]);
      setKpis(kpiList);
      setScorecards(cards);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const totalWeight = kpis.reduce((sum, k) => sum + k.weight, 0);

  const handleSaveKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKpi) return;

    try {
      await api.updateKpiDefinition(editingKpi.id, {
        weight: Number(editingKpi.weight),
        targetValue: Number(editingKpi.targetValue),
        description: editingKpi.description,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setEditingKpi(null);
      fetchKpis();
    } catch (err) {
      console.error('Failed to update KPI:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Target className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Academic KPI & Scorecard Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure institutional weights, evaluate composite faculty performance, and track quarterly targets.
          </p>
        </div>
      </div>

      {/* KPI Weight Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600" />
              Weight Balance Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Institutional academic KPIs must sum exactly to 100% for composite scoring integrity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                totalWeight === 100
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {totalWeight === 100 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              Total Weight: {totalWeight}% {totalWeight === 100 ? '(Balanced)' : '(Requires adjustment)'}
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
          {kpis.map((k, i) => {
            const colors = ['bg-indigo-600', 'bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600'];
            return (
              <div
                key={k.id}
                title={`${k.name}: ${k.weight}%`}
                className={`h-full ${colors[i % colors.length]}`}
                style={{ width: `${k.weight}%` }}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-3">
          {kpis.map((k, i) => {
            const colors = ['bg-indigo-600', 'bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600'];
            return (
              <div key={k.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className={`h-2.5 w-2.5 rounded-full ${colors[i % colors.length]}`} />
                <span className="font-medium">{k.name}</span>
                <span className="font-mono text-slate-400">({k.weight}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Definitions Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            KPI Definitions & Benchmark Thresholds
          </h3>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Changes saved successfully
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/20 dark:text-slate-400">
                <th className="px-6 py-3">Code & Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Institutional Weight</th>
                <th className="px-6 py-3">Benchmark Target</th>
                <th className="px-6 py-3">Description</th>
                {isEducationManager && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {kpis.length === 0 && (
                <tr>
                  <td colSpan={isEducationManager ? 6 : 5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Target className="mx-auto h-10 w-10 text-slate-400 mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No KPI definitions configured</p>
                    <p className="text-xs text-slate-400 mt-1">All KPI benchmarks have been reset in this clean environment.</p>
                  </td>
                </tr>
              )}
              {kpis.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 block">{k.code}</span>
                    {k.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {k.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {k.weight}%
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                    ≥ {k.targetValue}{k.unit}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    {k.description}
                  </td>
                  {isEducationManager && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingKpi({ ...k })}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Historical Trend Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
          Historical KPI Composite Trend (6 Months)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Aggregated faculty performance trajectory vs institutional 85% benchmark.
        </p>

        {history.length === 0 ? (
          <div className="h-48 w-full flex flex-col items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No historical KPI composite data available
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[75, 100]} stroke="#94a3b8" fontSize={12} />
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
                  dataKey="averageKpi"
                  name="Average KPI Score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="targetKpi"
                  name="Target Benchmark (85%)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Faculty Scorecards Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Current Quarter Faculty KPI Scorecards (Oct 2026)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/20 dark:text-slate-400">
                <th className="px-6 py-3">Instructor</th>
                <th className="px-6 py-3">Academic Track</th>
                <th className="px-6 py-3">Composite KPI Score</th>
                <th className="px-6 py-3">Classification Tier</th>
                <th className="px-6 py-3">Objectives Achieved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {scorecards.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Award className="mx-auto h-10 w-10 text-slate-400 mb-2 opacity-50" />
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No faculty scorecards available</p>
                    <p className="text-xs text-slate-400 mt-1">Scorecards will be calculated once faculty observations and KPI metrics are recorded.</p>
                  </td>
                </tr>
              )}
              {scorecards.map((sc) => {
                const metCount = sc.kpiScores.filter((k) => k.achieved).length;
                return (
                  <tr key={sc.instructorId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {sc.instructorName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {sc.trackName}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-base text-slate-900 dark:text-white">
                      {sc.compositeScore}%
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${getTierBadgeClass(
                          sc.tier
                        )}`}
                      >
                        Tier {sc.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {metCount} of {sc.kpiScores.length} targets met
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit KPI Modal */}
      {editingKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Edit KPI: {editingKpi.name}
              </h3>
              <button
                onClick={() => setEditingKpi(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKpi} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Weight Percentage (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={editingKpi.weight}
                  onChange={(e) => setEditingKpi({ ...editingKpi, weight: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Benchmark Target ({editingKpi.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingKpi.targetValue}
                  onChange={(e) => setEditingKpi({ ...editingKpi, targetValue: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description & Rubric Guidance
                </label>
                <textarea
                  rows={3}
                  value={editingKpi.description}
                  onChange={(e) => setEditingKpi({ ...editingKpi, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingKpi(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Save KPI Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
