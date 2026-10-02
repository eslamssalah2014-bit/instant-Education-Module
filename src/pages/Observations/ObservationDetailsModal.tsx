import React from 'react';
import {
  X,
  FileDown,
  CheckCircle2,
  Calendar,
  User,
  GraduationCap,
  Layers,
  Award,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  FileText,
  BadgePercent,
} from 'lucide-react';
import { Observation } from '../../types';
import { exportSingleObservationPDF } from '../../utils/export';

interface ObservationDetailsModalProps {
  observation: Observation | null;
  onClose: () => void;
}

export const ObservationDetailsModal: React.FC<ObservationDetailsModalProps> = ({
  observation,
  onClose,
}) => {
  if (!observation) return null;

  const getGradeBadge = (grade?: string) => {
    switch (grade) {
      case 'Outstanding':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
      case 'Proficient':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300';
      case 'Developing':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Observation Audit Details
                </h3>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  {observation.observationCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation recorded under template version {observation.templateVersion?.versionNumber || 'v1.0'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportSingleObservationPDF(observation)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <FileDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Observation Information Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">Instructor</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                {observation.instructor?.user?.name}
              </span>
              <span className="text-[10px] text-slate-500">{observation.instructor?.title}</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">Group & Track</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                {observation.group?.name}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                {observation.track?.name} Track
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">Observer</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                {observation.observer?.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {observation.observer?.roleType.replace(/_/g, ' ')}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">Evaluation Type</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                {observation.type === 'TECHNICAL' ? 'Technical Observation' : 'Non-Technical Observation'}
              </span>
              <span className="text-[10px] text-slate-500">
                {new Date(observation.observationDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Score Summary Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-purple-500/10 p-4 dark:border-indigo-900/50">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                <span className="text-xl font-extrabold">{observation.totalScore}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Overall Performance Index
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getGradeBadge(observation.grade)}`}>
                    {observation.grade}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Calculated from 100% weighted rubric criteria with rubric version{' '}
                  {observation.templateVersion?.versionNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase tracking-wide block">Weighted Score</span>
                <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {observation.weightedScore}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase tracking-wide block">Status</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {observation.status}
                </span>
              </div>
            </div>
          </div>

          {/* Criteria Results Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-600" />
              Criteria Results Breakdown
            </h4>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                    <th className="py-2.5 px-4 font-semibold">Criterion Name</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Weight</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Score (1-10)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Weighted Score</th>
                    <th className="py-2.5 px-4 font-semibold">Evaluator Notes & Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(observation.scores || []).map((score) => (
                    <tr key={score.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {score.criterionName}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">
                        {score.weight}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-1 font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                          {score.score} / 10
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {score.weightedScore} pts
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 italic">
                        "{score.feedback || 'Satisfactory execution.'}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Qualitative Overall Feedback Sections */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-indigo-600" />
              Overall Feedback & Academic Action Plan
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strengths */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Key Strengths
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {observation.feedback?.strengths || 'No specific strengths entered.'}
                </p>
              </div>

              {/* Areas for Improvement */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Areas for Improvement
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {observation.feedback?.areasForImprovement || 'None noted.'}
                </p>
              </div>

              {/* Recommendations */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs mb-2">
                  <Lightbulb className="h-4 w-4 text-indigo-600" />
                  Actionable Recommendations
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {observation.feedback?.recommendations || 'Maintain current instructional pace.'}
                </p>
              </div>
            </div>

            {/* General Comments */}
            {observation.feedback?.generalComments && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Evaluator General Observations
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {observation.feedback.generalComments}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-3 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Close Observation
          </button>
        </div>
      </div>
    </div>
  );
};
