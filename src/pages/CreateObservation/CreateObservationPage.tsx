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
  Calculator,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Instructor,
  Group,
  ObservationType,
  ObservationTemplateVersion,
  Observation,
  SubCriterionResult,
  MainCriterionResult,
  InstructorTier,
  getTierFromScore,
  getTierBadgeClass,
} from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SubScoreEntry {
  subCriterionId: string;
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
  initialTeacherId?: string;
  initialGroupId?: string;
  onObservationCreated: (obsId: string) => void;
  onCancel?: () => void;
}> = ({ editingObservation, initialTeacherId, initialGroupId, onObservationCreated, onCancel }) => {
  const { currentUser, canCreateObservation, isHeadOfTrack } = useAuth();

  const isEditMode = Boolean(editingObservation);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
  const [activeTemplateVersion, setActiveTemplateVersion] = useState<ObservationTemplateVersion | null>(null);

  // Form Fields
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(
    editingObservation?.instructorId || initialTeacherId || ''
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    editingObservation?.groupId || initialGroupId || ''
  );
  const [observationType, setObservationType] = useState<ObservationType>(
    editingObservation?.type || 'TECHNICAL'
  );
  const [observationDate, setObservationDate] = useState<string>(
    editingObservation?.observationDate
      ? editingObservation.observationDate.split('T')[0]
      : new Date().toISOString().split('T')[0]
  );

  // Hierarchical Sub Criteria Scores & Feedback: key is subCriterionId
  const [subScores, setSubScores] = useState<Record<string, SubScoreEntry>>({});

  // Overall Qualitative Feedback
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
      : []
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
        if (initialTeacherId && list.some((i) => i.id === initialTeacherId)) {
          setSelectedInstructorId(initialTeacherId);
        } else if (!selectedInstructorId && list.length > 0) {
          setSelectedInstructorId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load instructors:', err);
      }
    };
    loadInstructors();
  }, [currentUser, initialTeacherId]);

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

        if (initialGroupId && instructorGroups.some((g) => g.id === initialGroupId)) {
          setSelectedGroupId(initialGroupId);
        } else if (!selectedGroupId || !instructorGroups.some((g) => g.id === selectedGroupId)) {
          setSelectedGroupId(instructorGroups.length > 0 ? instructorGroups[0].id : '');
        }
      } catch (err) {
        console.error('Failed to load instructor groups:', err);
      }
    };

    loadGroups();
  }, [selectedInstructorId, initialGroupId]);

  // 3. Load Template & Hierarchical Criteria for Selected Type
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const tmpl = await api.getTemplatePreview(observationType);
        if (tmpl && tmpl.currentVersion) {
          setActiveTemplateVersion(tmpl.currentVersion);

          // Pre-fill sub scores
          const initialMap: Record<string, SubScoreEntry> = {};
          (tmpl.currentVersion.mainCriteria || []).forEach((mc) => {
            (mc.subCriteria || []).forEach((sc) => {
              const existingSubResult = editingObservation?.subResults?.find(
                (sr) => sr.subCriterionId === sc.id
              );
              const existingScore = editingObservation?.scores?.find(
                (s) => s.criterionId === sc.id
              );

              // Default initial score to 85% of max if new observation
              const defaultScore = Number((sc.calculatedScore * 0.85).toFixed(1));

              initialMap[sc.id] = {
                subCriterionId: sc.id,
                score: existingSubResult
                  ? existingSubResult.score
                  : existingScore
                  ? existingScore.score
                  : defaultScore,
                feedback: existingSubResult
                  ? existingSubResult.feedback || ''
                  : existingScore
                  ? existingScore.feedback
                  : '',
              };
            });
          });

          setSubScores(initialMap);
        } else {
          setActiveTemplateVersion(null);
          setSubScores({});
        }
      } catch (err) {
        console.error('Failed to load template preview:', err);
      }
    };

    loadTemplate();
  }, [observationType]);

  // Handle Sub Criterion Score Change
  const handleScoreChange = (subCriterionId: string, val: number, maxScore: number) => {
    const clamped = Math.min(Math.max(0, val), maxScore);
    setSubScores((prev) => ({
      ...prev,
      [subCriterionId]: {
        ...prev[subCriterionId],
        score: clamped,
      },
    }));
  };

  // Handle Sub Criterion Feedback Change
  const handleFeedbackChange = (subCriterionId: string, feedback: string) => {
    setSubScores((prev) => ({
      ...prev,
      [subCriterionId]: {
        ...prev[subCriterionId],
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

  // Real-Time Calculation of Hierarchical Scores & Classification
  const calculateRealtimeScore = () => {
    if (!activeTemplateVersion || !activeTemplateVersion.mainCriteria || activeTemplateVersion.mainCriteria.length === 0) {
      return {
        masterMaxScore: 100,
        totalAchievedScore: 0,
        finalPercentage: 0,
        tier: 'B' as InstructorTier,
        grade: 'B',
        mainCategoryCalculations: [],
      };
    }

    const masterMaxScore = activeTemplateVersion.totalScore || 100;
    let totalAchievedScore = 0;

    const mainCategoryCalculations = activeTemplateVersion.mainCriteria.map((mc) => {
      const mainMax = mc.calculatedScore;
      let mainAchieved = 0;

      const subBreakdown = (mc.subCriteria || []).map((sc) => {
        const entry = subScores[sc.id];
        const achieved = entry ? entry.score : Number((sc.calculatedScore * 0.85).toFixed(1));
        mainAchieved += achieved;
        return {
          subCriterionId: sc.id,
          name: sc.name,
          maxScore: sc.calculatedScore,
          achievedScore: achieved,
          weightPercentage: sc.weightPercentage,
        };
      });

      mainAchieved = Number(mainAchieved.toFixed(2));
      const mainPercentage = mainMax > 0 ? Number(((mainAchieved / mainMax) * 100).toFixed(1)) : 0;
      totalAchievedScore += mainAchieved;

      return {
        mainCriterionId: mc.id,
        name: mc.name,
        weightPercentage: mc.weightPercentage,
        maxScore: mainMax,
        achievedScore: mainAchieved,
        percentage: mainPercentage,
        subBreakdown,
      };
    });

    totalAchievedScore = Number(totalAchievedScore.toFixed(2));
    const finalPercentage = masterMaxScore > 0
      ? Number(((totalAchievedScore / masterMaxScore) * 100).toFixed(1))
      : 80.0;

    const tier = getTierFromScore(finalPercentage);
    const grade = tier;

    return {
      masterMaxScore,
      totalAchievedScore,
      finalPercentage,
      tier,
      grade,
      mainCategoryCalculations,
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

      const subResultsPayload = Object.values(subScores).map((s) => ({
        subCriterionId: s.subCriterionId,
        score: s.score,
        feedback: s.feedback,
      }));

      const payload = {
        instructorId: selectedInstructorId,
        groupId: selectedGroupId,
        observationType,
        templateVersionId: activeTemplateVersion?.id,
        observationDate: new Date(observationDate).toISOString(),
        status,
        subResults: subResultsPayload,
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
        const formattedSubResults: SubCriterionResult[] = subResultsPayload.map((s, idx) => {
          const scMeta = activeTemplateVersion?.mainCriteria
            ?.flatMap((mc) => mc.subCriteria || [])
            .find((sc) => sc.id === s.subCriterionId);
          const mcParent = activeTemplateVersion?.mainCriteria?.find((mc) =>
            (mc.subCriteria || []).some((sc) => sc.id === s.subCriterionId)
          );

          return {
            id: `subres-${editingObservation.id}-${idx}`,
            observationId: editingObservation.id,
            mainCriterionId: mcParent?.id || '',
            subCriterionId: s.subCriterionId,
            subCriterionName: scMeta?.name || 'Sub Criterion',
            weightPercentage: scMeta?.weightPercentage || 0,
            maxScore: scMeta?.calculatedScore || 0,
            score: s.score,
            feedback: s.feedback,
          };
        });

        const formattedMainResults: MainCriterionResult[] = (activeTemplateVersion?.mainCriteria || []).map((mc, idx) => {
          const childSubs = formattedSubResults.filter((sr) => sr.mainCriterionId === mc.id);
          const mainScore = Number(childSubs.reduce((sum, sr) => sum + sr.score, 0).toFixed(2));
          const mainPct = mc.calculatedScore > 0 ? Number(((mainScore / mc.calculatedScore) * 100).toFixed(1)) : 0;

          return {
            id: `mainres-${editingObservation.id}-${idx}`,
            observationId: editingObservation.id,
            mainCriterionId: mc.id,
            mainCriterionName: mc.name,
            weightPercentage: mc.weightPercentage,
            maxScore: mc.calculatedScore,
            score: mainScore,
            percentage: mainPct,
            subResults: childSubs,
          };
        });

        const formattedFeedback = {
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
          instructorId: selectedInstructorId,
          groupId: selectedGroupId,
          type: observationType,
          templateVersionId: activeTemplateVersion?.id,
          observationDate: new Date(observationDate).toISOString(),
          status,
          totalScore: realtimeScore.totalAchievedScore,
          maxScore: realtimeScore.masterMaxScore,
          percentageScore: realtimeScore.finalPercentage,
          grade: realtimeScore.grade,
          tier: realtimeScore.tier,
          mainResults: formattedMainResults,
          subResults: formattedSubResults,
          feedback: formattedFeedback,
          actionPlan: payload.actionPlan,
        });
      } else {
        resultObservation = await api.createObservation(payload);
      }

      setSuccessMsg(
        isEditMode
          ? `Observation ${resultObservation.observationCode} updated successfully!`
          : `Observation ${resultObservation.observationCode} logged successfully with Tier ${realtimeScore.tier} (${realtimeScore.finalPercentage}%)!`
      );

      if (realtimeScore.finalPercentage >= 90) {
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
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
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
            {isEditMode
              ? `Edit Observation: ${editingObservation?.observationCode}`
              : 'Classroom Observation & Evaluation Form'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hierarchical evaluation rubric: observer enters achieved scores per Sub Criterion. System auto-calculates Sub Totals, Main Totals, Master Score, and Classification Tier.
          </p>
        </div>

        {/* Real-Time Live Score Preview Card */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Observation Score
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                {realtimeScore.finalPercentage}%
              </span>
              <span className="text-xs font-semibold text-slate-500">
                ({realtimeScore.totalAchievedScore} / {realtimeScore.masterMaxScore} pts)
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

      <form onSubmit={(e) => handleSubmit(e, 'SUBMITTED')} className="space-y-6">
        {/* Section 1: Session Meta Information & Smart Filtering */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              Observation Session Information & Teacher Alignment
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Workflow: Teacher → Assigned Group → Template
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1: Select Teacher */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Select Teacher *
              </label>
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                required
                className="w-full mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Faculty Teacher...</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.user?.name || ins.title} ({ins.employeeId || ins.teacherCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Group (Strictly Assigned Groups) */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Select Group (Assigned Only) *
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                required
                disabled={assignedGroups.length === 0}
                className="w-full mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {assignedGroups.length === 0 ? (
                  <option value="">No Groups Assigned to Teacher</option>
                ) : (
                  <>
                    <option value="">Select Assigned Cohort...</option>
                    {assignedGroups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name} ({grp.code})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Step 3: Observation Type */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                3. Observation Template *
              </label>
              <select
                value={observationType}
                onChange={(e) => setObservationType(e.target.value as ObservationType)}
                className="w-full mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TECHNICAL">Technical Audit Template</option>
                <option value="NON_TECHNICAL">Pedagogical / Non-Technical Audit Template</option>
              </select>
            </div>

            {/* Observation Date */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Observation Date *</label>
              <div className="relative mt-1.5">
                <input
                  type="date"
                  required
                  value={observationDate}
                  onChange={(e) => setObservationDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Smart Filtering Intelligence Banner */}
          {(() => {
            const currentInst = instructors.find((i) => i.id === selectedInstructorId);
            if (!currentInst) return null;

            return (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/20 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Teacher Meta Details */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Academic Track
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: currentInst.track?.color || '#4f46e5' }}
                        />
                        {currentInst.track?.name || 'Academic Track'}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Teacher Code
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                        {currentInst.employeeId || currentInst.teacherCode}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Current Classification
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${getTierBadgeClass(
                            currentInst.tier || getTierFromScore(currentInst.averageScore)
                          )}`}
                        >
                          <Award className="h-3 w-3" />
                          Tier {currentInst.tier || getTierFromScore(currentInst.averageScore)}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {currentInst.averageScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Audit History
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {currentInst.totalObserved} audits conducted
                      </span>
                    </div>
                  </div>

                  {/* Assigned Groups Tag Pills */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Assigned Cohorts ({assignedGroups.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {assignedGroups.length === 0 ? (
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 italic">
                          No groups assigned
                        </span>
                      ) : (
                        assignedGroups.map((g) => (
                          <span
                            key={g.id}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
                              selectedGroupId === g.id
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {g.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {assignedGroups.length === 0 && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      Notice: This instructor has no assigned student groups. Please create or assign a group to {currentInst.user?.name || currentInst.title} before conducting this audit.
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Section 2: Hierarchical Rubric Scoring */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                Hierarchical Rubric Evaluation
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Master Total: {realtimeScore.masterMaxScore} Points
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter achieved points for each Sub Criterion. Main Criteria and overall totals update automatically.
              </p>
            </div>

            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-indigo-600" />
              <span>
                Total Points: {realtimeScore.totalAchievedScore} / {realtimeScore.masterMaxScore} ({realtimeScore.finalPercentage}%)
              </span>
            </div>
          </div>

          {!activeTemplateVersion || !activeTemplateVersion.mainCriteria || activeTemplateVersion.mainCriteria.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
              Loading rubric template criteria...
            </div>
          ) : (
            activeTemplateVersion.mainCriteria.map((mc, mIdx) => {
              const mainCalc = realtimeScore.mainCategoryCalculations.find(
                (c) => c.mainCriterionId === mc.id
              ) || {
                achievedScore: 0,
                maxScore: mc.calculatedScore,
                percentage: 0,
              };

              return (
                <div
                  key={mc.id || mIdx}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
                >
                  {/* Main Criterion Header */}
                  <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-4 dark:border-slate-800 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold shrink-0">
                            {mIdx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {mc.name}
                          </h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Weight: {mc.weightPercentage}%
                          </span>
                        </div>
                        {mc.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-8">
                            {mc.description}
                          </p>
                        )}
                      </div>

                      {/* Main Criterion Achieved Score Display */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            Main Score
                          </div>
                          <div className="font-mono text-base font-black text-indigo-600 dark:text-indigo-400">
                            {mainCalc.achievedScore} / {mainCalc.maxScore} pts
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-mono">
                          {mainCalc.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nested Sub Criteria Evaluation Items */}
                  <div className="p-4 space-y-3 bg-slate-50/30 dark:bg-slate-900/40">
                    {(mc.subCriteria || []).map((sc, sIdx) => {
                      const entry = subScores[sc.id] || {
                        subCriterionId: sc.id,
                        score: Number((sc.calculatedScore * 0.85).toFixed(1)),
                        feedback: '',
                      };

                      return (
                        <div
                          key={sc.id || sIdx}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-850 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-400">
                                  {mIdx + 1}.{sIdx + 1}
                                </span>
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {sc.name}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  ({sc.weightPercentage}% of parent)
                                </span>
                              </div>
                              {sc.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-5">
                                  {sc.description}
                                </p>
                              )}
                            </div>

                            {/* Sub Criterion Score Input */}
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                              <div className="text-right pl-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Max: {sc.calculatedScore} pts
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Achieved Points:
                                </span>
                              </div>

                              <input
                                type="number"
                                min="0"
                                max={sc.calculatedScore}
                                step="0.5"
                                value={entry.score}
                                onChange={(e) =>
                                  handleScoreChange(sc.id, Number(e.target.value), sc.calculatedScore)
                                }
                                className="w-20 text-center font-mono text-base font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />

                              <span className="text-xs font-mono font-bold text-slate-500 pr-1">
                                / {sc.calculatedScore}
                              </span>
                            </div>
                          </div>

                          {/* Observer Qualitative Feedback Note */}
                          <div>
                            <input
                              type="text"
                              value={entry.feedback}
                              onChange={(e) => handleFeedbackChange(sc.id, e.target.value)}
                              placeholder={`Qualitative observation feedback for ${sc.name}...`}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Section 3: Structured Qualitative Feedback */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Observer Qualitative Feedback & Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Key Strengths & Mastery Highlights
              </label>
              <textarea
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="High engagement during live coding, clear architectural explanations..."
                className="w-full mt-1.5 rounded-lg border border-emerald-200 bg-emerald-50/30 p-2.5 text-xs text-slate-900 dark:border-emerald-950/60 dark:bg-emerald-950/20 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Areas for Pedagogical Improvement
              </label>
              <textarea
                rows={3}
                value={areasForImprovement}
                onChange={(e) => setAreasForImprovement(e.target.value)}
                placeholder="Pacing slowed during debugging block; allocate more time for student hands-on lab..."
                className="w-full mt-1.5 rounded-lg border border-amber-200 bg-amber-50/30 p-2.5 text-xs text-slate-900 dark:border-amber-950/60 dark:bg-amber-950/20 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                General Notes & Session Context
              </label>
              <textarea
                rows={2}
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
                placeholder="Observed during Week 4 module on React State Architecture..."
                className="w-full mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                Strategic Recommendations
              </label>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Pair with Senior Lead for interactive polling techniques..."
                className="w-full mt-1.5 rounded-lg border border-indigo-200 bg-indigo-50/30 p-2.5 text-xs text-slate-900 dark:border-indigo-950/60 dark:bg-indigo-950/20 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Corrective Action Plan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Corrective Action Plan & Milestones
              </h3>
              <p className="text-xs text-slate-500">
                Define actionable developmental goals and target completion dates for this instructor.
              </p>
            </div>
            <button
              type="button"
              onClick={addActionItem}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Action Item</span>
            </button>
          </div>

          {actionPlan.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400 dark:border-slate-800">
              No action plan items added yet. Click "+ Add Action Item" to establish formal developmental milestones.
            </div>
          ) : (
            <div className="space-y-3">
              {actionPlan.map((ap, idx) => (
                <div
                  key={ap.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      Milestone #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeActionItem(ap.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="lg:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Objective *
                      </label>
                      <input
                        type="text"
                        value={ap.objective}
                        onChange={(e) => updateActionItem(ap.id, 'objective', e.target.value)}
                        placeholder="e.g. Implement active classroom polling"
                        className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Target Deadline
                      </label>
                      <input
                        type="date"
                        value={ap.deadline}
                        onChange={(e) => updateActionItem(ap.id, 'deadline', e.target.value)}
                        className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Assigned To
                      </label>
                      <input
                        type="text"
                        value={ap.assignedTo}
                        onChange={(e) => updateActionItem(ap.id, 'assignedTo', e.target.value)}
                        placeholder="Instructor Name"
                        className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Concrete Action Steps
                    </label>
                    <input
                      type="text"
                      value={ap.actionSteps}
                      onChange={(e) => updateActionItem(ap.id, 'actionSteps', e.target.value)}
                      placeholder="e.g. Shadow Alex Vance for 2 sessions and implement Slido / Mentimeter"
                      className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Sticky Bottom Submission Bar */}
        <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Overall Score:
              </span>
              <span className="font-mono text-xl font-black text-slate-900 dark:text-white">
                {realtimeScore.finalPercentage}%
              </span>
              <span className="text-xs font-mono text-slate-500">
                ({realtimeScore.totalAchievedScore} / {realtimeScore.masterMaxScore} pts)
              </span>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold border ${getTierBadgeClass(
                realtimeScore.tier
              )}`}
            >
              Tier {realtimeScore.tier} ({realtimeScore.grade})
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, 'DRAFT')}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              Save as Draft
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Final Observation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
