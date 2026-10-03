import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart3,
  FileSpreadsheet,
  FileDown,
  Filter,
  RefreshCw,
  TrendingUp,
  Award,
  Users,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../../services/api';
import { Track } from '../../types';
import { useAuth } from '../../context/AuthContext';

type ReportType =
  | 'INSTRUCTOR_PERFORMANCE'
  | 'TRACK_PERFORMANCE'
  | 'OBSERVER_PERFORMANCE'
  | 'MONTHLY_OBSERVATIONS'
  | 'CRITERIA_ANALYSIS';

export const ReportsPage: React.FC = () => {
  const { canExportReports, isHeadOfTrack } = useAuth();

  const [activeReport, setActiveReport] = useState<ReportType>('INSTRUCTOR_PERFORMANCE');
  const [reportData, setReportData] = useState<any[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Hierarchical Criteria Report State
  const [criteriaMeta, setCriteriaMeta] = useState<{
    mainCriteriaBreakdown?: any[];
    subCriteriaBreakdown?: any[];
    weakestAreas?: any[];
    strongestAreas?: any[];
  }>({});
  const [criteriaFilter, setCriteriaFilter] = useState<'ALL' | 'MAIN' | 'SUB'>('ALL');

  const fetchMetaAndReport = async () => {
    try {
      setIsLoading(true);
      const [meta, res] = await Promise.all([
        api.getMeta(),
        api.getReportData(activeReport, {
          trackId: selectedTrack || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      ]);
      setTracks(meta.tracks);
      setReportData(res.data);
      if (activeReport === 'CRITERIA_ANALYSIS') {
        setCriteriaMeta({
          mainCriteriaBreakdown: res.mainCriteriaBreakdown,
          subCriteriaBreakdown: res.subCriteriaBreakdown,
          weakestAreas: res.weakestAreas,
          strongestAreas: res.strongestAreas,
        });
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetaAndReport();
  }, [activeReport, selectedTrack, startDate, endDate]);

  // Export to Excel handler
  const handleExportExcel = () => {
    if (!reportData || reportData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeReport.replace(/_/g, ' '));
    XLSX.writeFile(workbook, `Instant_ERP_${activeReport}.xlsx`);
  };

  // Export to PDF handler
  const handleExportPDF = () => {
    if (!reportData || reportData.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(`Instant ERP - ${activeReport.replace(/_/g, ' ')}`, 40, 40);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Instant ERP Education Suite`, 40, 56);

    const keys = Object.keys(reportData[0] || {});
    const headers = keys.map((k) => k.replace(/([A-Z])/g, ' $1').toUpperCase());
    const body = reportData.map((row) => keys.map((k) => String(row[k] ?? '')));

    autoTable(doc, {
      startY: 70,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`Instant_ERP_${activeReport}.pdf`);
  };

  const reportsConfig: { id: ReportType; label: string; icon: any; desc: string }[] = [
    {
      id: 'INSTRUCTOR_PERFORMANCE',
      label: 'Instructor Performance',
      icon: Users,
      desc: 'Individual faculty scoring, evaluation frequencies, and mastery ranking',
    },
    {
      id: 'TRACK_PERFORMANCE',
      label: 'Track Performance',
      icon: Layers,
      desc: 'Comparative academic track benchmarks, student cohort progress, and health metrics',
    },
    {
      id: 'OBSERVER_PERFORMANCE',
      label: 'Observer Activity',
      icon: Award,
      desc: 'Evaluator calibration, number of audits conducted, and scoring parity',
    },
    {
      id: 'MONTHLY_OBSERVATIONS',
      label: 'Monthly Observation Report',
      icon: Calendar,
      desc: 'Monthly throughput trends comparing technical vs pedagogical audits',
    },
    {
      id: 'CRITERIA_ANALYSIS',
      label: 'Criteria Analysis',
      icon: TrendingUp,
      desc: 'Rubric criteria variance, high/low scoring points, and pedagogical gaps',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Academic Reports Center
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Executive Analytics
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Institutional intelligence, audit compliance, and multi-format reporting with Excel & PDF exports.
          </p>
        </div>

        {canExportReports && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={reportData.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={reportData.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50"
            >
              <FileDown className="h-4 w-4 text-rose-600" />
              <span>Export PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportsConfig.map((r) => {
          const Icon = r.icon;
          const isActive = activeReport === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`rounded-xl border p-3.5 text-left transition ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/60 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/40'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}
                />
                {isActive && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
              </div>
              <div
                className={`mt-2 font-bold text-xs ${
                  isActive ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {r.label}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {r.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          {!isHeadOfTrack && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Track:</span>
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">All Tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <button
          onClick={fetchMetaAndReport}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
          title="Refresh Report Data"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Hierarchical Criteria Intelligence (when CRITERIA_ANALYSIS is selected) */}
      {activeReport === 'CRITERIA_ANALYSIS' && (
        <div className="space-y-4">
          {/* Weakest & Strongest Areas Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Strongest Competency Areas (Top 3)
              </div>
              {criteriaMeta.strongestAreas && criteriaMeta.strongestAreas.length > 0 ? (
                <div className="space-y-1.5">
                  {criteriaMeta.strongestAreas.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.Criterion}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{item.AveragePercentage}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No observation data recorded yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-2 mb-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                Priority Development Areas (Weakest 3)
              </div>
              {criteriaMeta.weakestAreas && criteriaMeta.weakestAreas.length > 0 ? (
                <div className="space-y-1.5">
                  {criteriaMeta.weakestAreas.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.Criterion}</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{item.AveragePercentage}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No observation data recorded yet.</p>
              )}
            </div>
          </div>

          {/* Hierarchy Filter Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Display Level:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => setCriteriaFilter('ALL')}
                className={`rounded px-3 py-1 font-medium transition ${
                  criteriaFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                All Hierarchies
              </button>
              <button
                onClick={() => setCriteriaFilter('MAIN')}
                className={`rounded px-3 py-1 font-medium transition ${
                  criteriaFilter === 'MAIN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Main Criteria Only
              </button>
              <button
                onClick={() => setCriteriaFilter('SUB')}
                className={`rounded px-3 py-1 font-medium transition ${
                  criteriaFilter === 'SUB'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sub Criteria Only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Chart Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          Report Visual Analytics
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeReport === 'MONTHLY_OBSERVATIONS' ? (
              <LineChart data={reportData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="technical" name="Technical" stroke="#6366f1" strokeWidth={2} />
                <Line type="monotone" dataKey="nonTechnical" name="Non-Technical" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart
                data={
                  activeReport === 'CRITERIA_ANALYSIS'
                    ? (criteriaFilter === 'MAIN'
                        ? criteriaMeta.mainCriteriaBreakdown || []
                        : criteriaFilter === 'SUB'
                        ? criteriaMeta.subCriteriaBreakdown || []
                        : reportData)
                    : reportData
                }
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey={
                    activeReport === 'INSTRUCTOR_PERFORMANCE'
                      ? 'name'
                      : activeReport === 'TRACK_PERFORMANCE'
                      ? 'trackName'
                      : activeReport === 'OBSERVER_PERFORMANCE'
                      ? 'observerName'
                      : 'Criterion'
                  }
                  stroke="#64748b"
                  fontSize={10}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  domain={activeReport === 'CRITERIA_ANALYSIS' ? [0, 100] : [0, 10]}
                  stroke="#64748b"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey={
                    activeReport === 'CRITERIA_ANALYSIS'
                      ? 'rawPct'
                      : activeReport === 'INSTRUCTOR_PERFORMANCE' ||
                        activeReport === 'TRACK_PERFORMANCE'
                      ? 'averageScore'
                      : 'averageScoreIssued'
                  }
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  name={
                    activeReport === 'CRITERIA_ANALYSIS'
                      ? 'Average Mastery (%)'
                      : 'Average Score (out of 10)'
                  }
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabular Report Section */}
      {(() => {
        const displayedRows =
          activeReport === 'CRITERIA_ANALYSIS'
            ? criteriaFilter === 'MAIN'
              ? criteriaMeta.mainCriteriaBreakdown || []
              : criteriaFilter === 'SUB'
              ? criteriaMeta.subCriteriaBreakdown || []
              : reportData
            : reportData;

        return (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tabular Report Data ({displayedRows.length} records)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                    {displayedRows.length > 0 &&
                      Object.keys(displayedRows[0])
                        .filter((k) => !k.startsWith('raw'))
                        .map((key) => (
                          <th key={key} className="py-3 px-4 capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-600 mb-1" />
                        Loading report...
                      </td>
                    </tr>
                  ) : displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        No report data matching selected parameters.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row: any, idx: number) => {
                      const visibleKeys = Object.keys(row).filter((k) => !k.startsWith('raw'));
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          {visibleKeys.map((k, valIdx) => {
                            const val = row[k];
                            return (
                              <td key={valIdx} className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                                {typeof val === 'number' ? (
                                  <span className="font-mono">{val}</span>
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
