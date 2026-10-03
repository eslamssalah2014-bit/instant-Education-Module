import React, { useState } from 'react';
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
  Clock,
  ArrowRight,
  TrendingUp,
  Archive,
  Edit,
} from 'lucide-react';
import { Observation, ObservationStatus, getTierBadgeClass } from '../../types';
import { exportSingleObservationPDF } from '../../utils/export';
import { api } from '../../services/api';

interface ObservationDetailsModalProps {
  observation: Observation | null;
  onClose: () => void;
  onEdit?: (obs: Observation) => void;
  onStatusChange?: (obsId: string, newStatus: ObservationStatus) => void;
}

export const ObservationDetailsModal: React.FC<ObservationDetailsModalProps> = ({
  observation,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  if (!observation) return null;

  const [currentStatus, setCurrentStatus] = useState<ObservationStatus>(observation.status);
  const [actionPlanItems, setActionPlanItems] = useState(observation.actionPlan || []);
  const [isUpdating, setIsUpdating] = useState(false);

  const tier = observation.tier || 'A';

  const handleUpdateStatus = async (status: ObservationStatus) => {
    try {
      setIsUpdating(true);
      await api.updateObservationStatus(observation.id, status);
      setCurrentStatus(status);
      if (onStatusChange) onStatusChange(observation.id, status);
    } catch (err) {
      console.error('Failed to update observation status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: ObservationStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'REVIEWED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'ARCHIVED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
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
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(currentStatus)}`}>
                  {currentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation recorded under template version {observation.templateVersion?.versionNumber || 'v1.1'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(observation);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
            )}

            <button
              onClick={() => exportSingleObservationPDF(observation)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 shadow-sm"
              title="Export Formal Audit PDF"
            >
              <FileDown className="h-3.5 w-3.5 text-indigo-600" /> Export PDF
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Summary Banner */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white p-5 dark:border-slate-800 dark:from-indigo-950/30 dark:via-purple-950/10 dark:to-slate-900">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Instructor</span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {observation.instructor?.user?.name || 'Academic Faculty'}
                </div>
                <div className="text-xs text-slate-500">
                  {observation.instructor?.employeeId} • {observation.track?.name}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Classroom Cohort</span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {observation.group?.name || 'Cohort'}
                </div>
                <div className="text-xs text-slate-500">
                  {observation.group?.code} • {observation.type}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lead Observer</span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {observation.observer?.name || 'Auditor'}
                </div>
                <div className="text-xs text-slate-500">
                  {observation.observer?.roleType?.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Score & Classification</span>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                    {observation.percentageScore.toFixed(1)}%
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getTierBadgeClass(tier)}`}>
                    Tier {tier}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  {observation.totalScore} / {observation.maxScore || 100} pts • {observation.grade || tier}
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Status Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-850">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Observation Workflow Status Transitions:
            </span>
            <div className="flex items-center gap-2">
              {currentStatus === 'DRAFT' && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('SUBMITTED')}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Submit for Formal Review
                </button>
              )}
              {currentStatus === 'SUBMITTED' && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('REVIEWED')}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Mark as Reviewed & Approved
                </button>
              )}
              {currentStatus !== 'ARCHIVED' && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('ARCHIVED')}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 flex items-center gap-1"
                >
                  <Archive className="h-3.5 w-3.5" /> Archive
                </button>
              )}
            </div>
          </div>

          {/* Hierarchical Rubric Criteria Score Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" /> Hierarchical Evaluation Rubric Breakdown
              </h4>
              <span className="text-xs font-mono font-bold text-slate-500">
                Master Score: {observation.totalScore} / {observation.maxScore || 100} pts
              </span>
            </div>

            {observation.mainResults && observation.mainResults.length > 0 ? (
              <div className="space-y-3">
                {observation.mainResults.map((mr, mIdx) => (
                  <div
                    key={mr.id || mIdx}
                    className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-850 overflow-hidden shadow-sm"
                  >
                    {/* Main Criterion Header */}
                    <div className="border-b border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-white font-mono text-[10px] font-bold">
                          {mIdx + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {mr.mainCriterionName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          (Weight: {mr.weightPercentage}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {mr.score} / {mr.maxScore} pts
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-mono">
                          {mr.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Sub Criteria Rows */}
                    <div className="p-3 space-y-2 bg-white dark:bg-slate-900/40">
                      {(mr.subResults || []).map((sr, sIdx) => (
                        <div
                          key={sr.id || sIdx}
                          className="rounded-lg border border-slate-150 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/30 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-slate-400 font-semibold">
                                {mIdx + 1}.{sIdx + 1}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {sr.subCriterionName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({sr.weightPercentage}% of parent)
                              </span>
                            </div>
                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              {sr.score} / {sr.maxScore} pts
                            </span>
                          </div>
                          {sr.feedback && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic pl-2 border-l-2 border-indigo-400 mt-1">
                              "{sr.feedback}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {observation.scores?.map((sc, i) => (
                  <div
                    key={sc.id || i}
                    className="rounded-xl border border-slate-150 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        {sc.criterionName}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono">Weight: {sc.weight}%</span>
                        <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                          {sc.score} pts
                        </span>
                      </div>
                    </div>
                    {sc.feedback && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic pl-2 border-l-2 border-indigo-400">
                        "{sc.feedback}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Corrective Action Plan */}
          {actionPlanItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-600" /> Corrective Action Plan & Target Milestones
              </h4>
              <div className="space-y-2">
                {actionPlanItems.map((ap) => (
                  <div
                    key={ap.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-850 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">
                        {ap.objective}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {ap.actionSteps}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-400 block">Due: {ap.deadline}</span>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        Owner: {ap.assignedTo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Qualitative Synthesis Feedback */}
          {observation.feedback && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Evaluator Feedback & Strategic Recommendations
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Key Strengths Observed:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {observation.feedback.strengths}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                    Areas for Development:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {observation.feedback.areasForImprovement}
                  </p>
                </div>

                <div className="md:col-span-2 p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    General Comments:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {observation.feedback.generalComments}
                  </p>
                </div>

                {observation.feedback.recommendations && (
                  <div className="md:col-span-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40">
                    <span className="font-bold text-indigo-800 dark:text-indigo-300 block mb-1">
                      Actionable Recommendations:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">
                      {observation.feedback.recommendations}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
