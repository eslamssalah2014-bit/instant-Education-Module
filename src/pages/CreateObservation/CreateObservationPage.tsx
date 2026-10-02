import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Sparkles,
  Award,
  Layers,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Send,
  HelpCircle,
  Lightbulb,
  FileCheck2,
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Instructor,
  Group,
  ObservationType,
  ObservationTemplateVersion,
  ObservationCriterion,
  Observation,
  InstructorTier,
  getTierFromScore,
  getTierBadgeClass,
} from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ScoreEntry {
  criterionId: string;
  score: number;
  feedback: string;
}

interface ActionPlanDraft {
  id: string;
  objective: string;
  actionSteps: string;
  deadline: string;
  assignedTo: string;
}

export const CreateObservationPage: React.FC<{
  editingObservation?: Observation | null;
  onObservationCreated: (obsId: string) => void;
  onCancel?: () => void;
}> = ({ editingObservation, onObservationCreated, onCancel }) => {
  const { currentUser, canCreateObservation, isHeadOfTrack } = useAuth();

  const isEditMode = Boolean(editingObservation);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
  const [activeTemplateVersion, setActiveTemplateVersion] = useState<ObservationTemplateVersion | null>(null);

  // Form Fields
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(
    editingObservation?.instructorId || ''
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    editingObservation?.groupId || ''
  );
  const [observationType, setObservationType] = useState<ObservationType>(
    editingObservation?.type || 'TECHNICAL'
  );
  const [observationDate, setObservationDate] = useState<string>(
    editingObservation?.observationDate
      ? editingObservation.observationDate.split('T')[0]
      : new Date().toISOString().split('T')[0]
  );

  // Dynamic Scores & Feedbacks
  const [criteriaScores, setCriteriaScores] = useState<Record<string, ScoreEntry>>({});

  // Overall Feedback Form
  const [generalComments, setGeneralComments] = useState(
    editingObservation?.feedback?.generalComments || ''
  );
  const [strengths, setStrengths] = useState(
    editingObservation?.feedback?.strengths || ''
  );
  const [areasForImprovement, setAreasForImprovement] = useState(
    editingObservation?.feedback?.areasForImprovement || ''
  );
  const [recommendations, setRecommendations] = useState(
    editingObservation?.feedback?.recommendations || ''
  );

  // Action Plan Items
  const [actionPlan, setActionPlan] = useState<ActionPlanDraft[]>(
    editingObservation?.actionPlan && editingObservation.actionPlan.length > 0
      ? editingObservation.actionPlan.map((ap) => ({
          id: ap.id,
          objective: ap.objective,
          actionSteps: ap.actionSteps,
          deadline: ap.deadline,
          assignedTo: ap.assignedTo,
        }))
      : [
          {
            id: '1',
            objective: 'Implement recommended code review standards',
            actionSteps: 'Provide structured PR feedback checklists during group sprint reviews.',
            deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            assignedTo: 'Lead Instructor',
          },
        ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Fetch Instructors
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const list = await api.getInstructors();
        setInstructors(list);
        if (!selectedInstructorId && list.length > 0) {
          setSelectedInstructorId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load instructors:', err);
      }
    };
    loadInstructors();
  }, [currentUser]);

  // 2. Auto-load groups assigned to selected instructor
  useEffect(() => {
    if (!selectedInstructorId) {
      setAssignedGroups([]);
      setSelectedGroupId('');
      return;
    }

    const loadGroups = async () => {
      try {
        const meta = await api.getMeta();
        const instructorGroups = meta.groups.filter((g) => g.instructorId === selectedInstructorId);
        setAssignedGroups(instructorGroups);

        if (!selectedGroupId && instructorGroups.length > 0) {
          setSelectedGroupId(instructorGroups[0].id);
        } else if (instructorGroups.length === 0) {
          setSelectedGroupId('');
        }
      } catch (err) {
        console.error('Failed to load instructor groups:', err);
      }
    };

    loadGroups();
  }, [selectedInstructorId]);

  // 3. Load Template & Criteria for Selected Type
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const tmpl = await api.getTemplatePreview(observationType);
        setActiveTemplateVersion(tmpl.currentVersion);

        // Pre-fill score entries
        const initialMap: Record<string, ScoreEntry> = {};
        tmpl.currentVersion.criteria.forEach((crit: ObservationCriterion) => {
          const existing = editingObservation?.scores?.find((s) => s.criterionId === crit.id);
          initialMap[crit.id] = {
            criterionId: crit.id,
            score: existing ? existing.score : 8,
            feedback: existing ? existing.feedback : '',
          };
        });
        setCriteriaScores(initialMap);
      } catch (err) {
        console.error('Failed to load template preview:', err);
      }
    };

    loadTemplate();
  }, [observationType]);

  // Handle Score Change
  const handleScoreChange = (criterionId: string, val: number) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        score: val,
      },
    }));
  };

  // Handle Criterion Feedback Change
  const handleFeedbackChange = (criterionId: string, feedback: string) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        feedback,
      },
    }));
  };

  // Action plan helpers
  const addActionItem = () => {
    const selectedIns = instructors.find((i) => i.id === selectedInstructorId);
    setActionPlan((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        objective: '',
        actionSteps: '',
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        assignedTo: selectedIns?.user?.name || 'Instructor',
      },
    ]);
  };

  const removeActionItem = (id: string) => {
    setActionPlan((prev) => prev.filter((a) => a.id !== id));
  };

  const updateActionItem = (id: string, field: keyof ActionPlanDraft, value: string) => {
    setActionPlan((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  // Real-time calculation of overall score & tier
  const calculateRealtimeScore = () => {
    if (!activeTemplateVersion || activeTemplateVersion.criteria.length === 0) {
      return { totalScore: 0, weightedPercentage: 0, tier: 'A' as InstructorTier, grade: 'Proficient' };
    }

    let weightedSum = 0;
    let totalWeight = 0;
    let rawSum = 0;

    activeTemplateVersion.criteria.forEach((crit) => {
      const entry = criteriaScores[crit.id];
      const score = entry ? entry.score : 8;
      const weight = crit.weightPercentage;

      weightedSum += (score / 10) * weight;
      totalWeight += weight;
      rawSum += score;
    });

    const percentage = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 80;
    const avgRaw = activeTemplateVersion.criteria.length > 0 ? rawSum / activeTemplateVersion.criteria.length : 8;
    const tier = getTierFromScore(percentage);

    const grade =
      percentage >= 90
        ? 'Outstanding'
        : percentage >= 80
        ? 'Proficient'
        : percentage >= 70
        ? 'Developing'
        : 'Needs Improvement';

    return {
      totalScore: Number(avgRaw.toFixed(2)),
      weightedPercentage: Number(percentage.toFixed(1)),
      tier,
      grade,
    };
  };

  const realtimeScore = calculateRealtimeScore();

  // Submission handler
  const handleSubmit = async (e: React.FormEvent, status: 'SUBMITTED' | 'DRAFT' = 'SUBMITTED') => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedInstructorId) {
      setErrorMsg('Please select an instructor.');
      return;
    }

    if (!selectedGroupId) {
      setErrorMsg('Please select a student cohort group.');
      return;
    }

    try {
      setIsSubmitting(true);

      const scorePayload = Object.values(criteriaScores);

      const payload = {
        instructorId: selectedInstructorId,
        groupId: selectedGroupId,
        observationType,
        observationDate: new Date(observationDate).toISOString(),
        status,
        scores: scorePayload,
        feedback: {
          generalComments,
          strengths,
          areasForImprovement,
          recommendations,
        },
        actionPlan: actionPlan
          .filter((a) => a.objective.trim() !== '')
          .map((a) => ({
            id: a.id,
            objective: a.objective,
            actionSteps: a.actionSteps,
            deadline: a.deadline,
            assignedTo: a.assignedTo,
            status: 'PENDING' as const,
          })),
      };

      let resultObservation: Observation;

      if (isEditMode && editingObservation) {
        const formattedScores = scorePayload.map((s, idx) => {
          const crit = activeTemplateVersion?.criteria.find((c) => c.id === s.criterionId);
          const weight = crit?.weightPercentage || 20;
          return {
            id: `sc-${editingObservation.id}-${idx}`,
            observationId: editingObservation.id,
            criterionId: s.criterionId,
            criterionName: crit?.name || 'Criterion',
            score: s.score,
            weight,
            weightedScore: Number(((s.score / 10) * weight).toFixed(2)),
            feedback: s.feedback,
            createdAt: new Date().toISOString(),
          };
        });

        const feedbackObj = {
          id: editingObservation.feedback?.id || `fb-${editingObservation.id}`,
          observationId: editingObservation.id,
          generalComments,
          strengths,
          areasForImprovement,
          recommendations,
          createdAt: editingObservation.feedback?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        resultObservation = await api.updateObservation(editingObservation.id, {
          ...payload,
          feedback: feedbackObj,
          scores: formattedScores,
          totalScore: realtimeScore.totalScore,
          weightedScore: realtimeScore.weightedPercentage,
          percentageScore: realtimeScore.weightedPercentage,
          grade: realtimeScore.grade,
          tier: realtimeScore.tier,
        });
      } else {
        resultObservation = await api.createObservation(payload);
      }

      setSuccessMsg(
        isEditMode
          ? `Observation ${resultObservation.observationCode} updated successfully!`
          : `Observation ${resultObservation.observationCode} logged successfully with Tier ${realtimeScore.tier}!`
      );

      if (realtimeScore.weightedPercentage >= 90) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setTimeout(() => {
        onObservationCreated(resultObservation.id);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit observation evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedInstructor = instructors.find((i) => i.id === selectedInstructorId);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Observations
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileCheck2 className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            {isEditMode ? `Edit Observation: ${editingObservation?.observationCode}` : 'Conduct Classroom Observation & Evaluation'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Standardized institutional evaluation rubric with automated weighted scoring, classification tier allocation, and action planning.
          </p>
        </div>

        {/* Live Score Preview Card */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Live Score Calculation
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                {realtimeScore.weightedPercentage}%
              </span>
              <span className="text-xs text-slate-500">
                ({realtimeScore.totalScore}/10 raw)
              </span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${getTierBadgeClass(
              realtimeScore.tier
            )}`}
          >
            <Award className="h-3.5 w-3.5" />
            Tier {realtimeScore.tier}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'SUBMITTED')} className="space-y-8">
        {/* Section 1: Session Metadata */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              1. Session & Faculty Context
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Instructor Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Instructor Being Evaluated *
              </label>
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              >
                <option value="">Select Instructor...</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.user?.name || ins.title} ({ins.track?.name} - Tier {ins.tier || 'A'})
                  </option>
                ))}
              </select>
            </div>

            {/* Student Group Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Classroom Cohort / Group *
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              >
                <option value="">Select Cohort...</option>
                {assignedGroups.map((grp) => (
                  <option key={grp.id} value={grp.id}>
                    {grp.name} ({grp.studentCount} students)
                  </option>
                ))}
              </select>
            </div>

            {/* Evaluation Rubric Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Observation Evaluation Type *
              </label>
              <select
                value={observationType}
                onChange={(e) => setObservationType(e.target.value as ObservationType)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              >
                <option value="TECHNICAL">Technical Deep-Dive Evaluation</option>
                <option value="NON_TECHNICAL">Pedagogical & Communication Evaluation</option>
              </select>
            </div>

            {/* Observation Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Observation Date *
              </label>
              <input
                type="date"
                value={observationDate}
                onChange={(e) => setObservationDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Rubric Evaluation Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2. Rubric Criteria Scoring (1 - 10 Scale)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Version: {activeTemplateVersion?.versionNumber || 'v1.1'}
            </span>
          </div>

          <div className="space-y-6">
            {activeTemplateVersion?.criteria.map((crit, idx) => {
              const currentScore = criteriaScores[crit.id]?.score ?? 8;
              const currentFeedback = criteriaScores[crit.id]?.feedback ?? '';

              return (
                <div
                  key={crit.id}
                  className="rounded-xl border border-slate-150 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-850/40 space-y-4 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          {crit.name}
                        </h3>
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Weight: {crit.weightPercentage}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 pl-8 max-w-3xl">
                        {crit.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-8 sm:pl-0">
                      <span className="font-mono text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {currentScore}/10
                      </span>
                    </div>
                  </div>

                  <div className="pl-8 space-y-3">
                    {/* Range Slider */}
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={currentScore}
                        onChange={(e) => handleScoreChange(crit.id, parseFloat(e.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                      />
                    </div>

                    {/* Criteria Specific Feedback */}
                    <input
                      type="text"
                      placeholder={`Observations or evidence for ${crit.name}...`}
                      value={currentFeedback}
                      onChange={(e) => handleFeedbackChange(crit.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Action Plan Builder */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                3. Corrective Action Plan & Target Milestones
              </h2>
            </div>
            <button
              type="button"
              onClick={addActionItem}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300"
            >
              <Plus className="h-3.5 w-3.5" /> Add Action Item
            </button>
          </div>

          <div className="space-y-3">
            {actionPlan.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-850/40 items-center"
              >
                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Objective #{index + 1}
                  </label>
                  <input
                    type="text"
                    placeholder="Action objective..."
                    value={item.objective}
                    onChange={(e) => updateActionItem(item.id, 'objective', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Implementation Steps
                  </label>
                  <input
                    type="text"
                    placeholder="Specific actionable task..."
                    value={item.actionSteps}
                    onChange={(e) => updateActionItem(item.id, 'actionSteps', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={item.deadline}
                    onChange={(e) => updateActionItem(item.id, 'deadline', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-4 sm:pt-0">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      value={item.assignedTo}
                      onChange={(e) => updateActionItem(item.id, 'assignedTo', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  {actionPlan.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActionItem(item.id)}
                      className="mt-4 p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Qualitative Feedback & Synthesis */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              4. Evaluator Synthesis & Recommendations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Key Instructional Strengths
              </label>
              <textarea
                rows={3}
                placeholder="Specific positive instructional techniques observed..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Areas for Development / Weaknesses
              </label>
              <textarea
                rows={3}
                placeholder="Pacing, student engagement opportunities, code clarity..."
                value={areasForImprovement}
                onChange={(e) => setAreasForImprovement(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Executive Synthesis & General Comments
              </label>
              <textarea
                rows={3}
                placeholder="Overall summary of the classroom observation session..."
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Strategic Recommendations & Next Steps
              </label>
              <textarea
                rows={2}
                placeholder="Specific workshops, dry-runs, or coaching recommended..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Assigned Evaluator: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, 'DRAFT')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm"
            >
              <Save className="h-4 w-4" /> Save as Draft
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {isEditMode ? 'Update & Finalize Observation' : 'Submit Formal Observation'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
