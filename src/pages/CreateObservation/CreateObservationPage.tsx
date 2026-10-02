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
} from 'lucide-react';
import { api } from '../../services/api';
import { Instructor, Group, ObservationType, ObservationTemplateVersion, ObservationCriterion } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ScoreEntry {
  criterionId: string;
  score: number;
  feedback: string;
}

export const CreateObservationPage: React.FC<{
  onObservationCreated: (obsId: string) => void;
}> = ({ onObservationCreated }) => {
  const { currentUser, canCreateObservation, isHeadOfTrack } = useAuth();

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
  const [activeTemplateVersion, setActiveTemplateVersion] = useState<ObservationTemplateVersion | null>(null);

  // Form Fields
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [observationType, setObservationType] = useState<ObservationType>('TECHNICAL');
  const [observationDate, setObservationDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Dynamic Scores & Feedbacks
  const [criteriaScores, setCriteriaScores] = useState<Record<string, ScoreEntry>>({});

  // Overall Feedback Form
  const [generalComments, setGeneralComments] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [recommendations, setRecommendations] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Fetch Instructors
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const list = await api.getInstructors();
        setInstructors(list);
        if (list.length > 0) {
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
        const groups = await api.getInstructorGroups(selectedInstructorId);
        setAssignedGroups(groups);
        if (groups.length > 0) {
          setSelectedGroupId(groups[0].id);
        } else {
          setSelectedGroupId('');
        }
      } catch (err) {
        console.error('Failed to auto-load groups:', err);
      }
    };
    loadGroups();
  }, [selectedInstructorId]);

  // 3. Dynamic Criteria Loading when observationType changes
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const tmpl = await api.getTemplatePreview(observationType);
        setActiveTemplateVersion(tmpl.currentVersion);

        // Initialize score entries for every criterion
        const initialMap: Record<string, ScoreEntry> = {};
        tmpl.currentVersion.criteria.forEach((c) => {
          initialMap[c.id] = {
            criterionId: c.id,
            score: 8.5, // Default realistic starting score
            feedback: '',
          };
        });
        setCriteriaScores(initialMap);
      } catch (err) {
        console.error('Failed to load criteria template:', err);
      }
    };
    loadTemplate();
  }, [observationType]);

  // Live Calculations
  const criteriaList = activeTemplateVersion?.criteria || [];

  let liveRawScoreSum = 0;
  let liveWeightedScoreSum = 0;

  criteriaList.forEach((c) => {
    const entry = criteriaScores[c.id];
    const scoreVal = entry ? Number(entry.score) : 0;
    liveRawScoreSum += scoreVal;
    // Formula: (score / 10) * weight%
    const weighted = (scoreVal / 10) * c.weightPercentage;
    liveWeightedScoreSum += weighted;
  });

  const liveAverageScore = criteriaList.length > 0 ? Number((liveRawScoreSum / criteriaList.length).toFixed(2)) : 0;
  const liveWeightedScore = Number(liveWeightedScoreSum.toFixed(2));
  const livePercentage = liveWeightedScore;

  const getLiveGrade = (percentage: number) => {
    if (percentage >= 90) return { label: 'Outstanding', color: 'bg-emerald-500 text-white' };
    if (percentage >= 80) return { label: 'Proficient', color: 'bg-indigo-600 text-white' };
    if (percentage >= 70) return { label: 'Developing', color: 'bg-amber-500 text-white' };
    return { label: 'Needs Attention', color: 'bg-rose-500 text-white' };
  };

  const liveGrade = getLiveGrade(livePercentage);

  const handleScoreChange = (criterionId: string, score: number) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        criterionId,
        score,
      },
    }));
  };

  const handleFeedbackChange = (criterionId: string, feedback: string) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        criterionId,
        feedback,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedInstructorId) {
      setErrorMsg('Please select an instructor.');
      return;
    }
    if (!selectedGroupId) {
      setErrorMsg('No assigned cohort group found for this instructor.');
      return;
    }
    if (!generalComments.trim()) {
      setErrorMsg('Please enter General Comments before submitting.');
      return;
    }
    if (!strengths.trim()) {
      setErrorMsg('Please identify at least one Key Strength.');
      return;
    }
    if (!areasForImprovement.trim()) {
      setErrorMsg('Please specify Areas for Improvement.');
      return;
    }
    if (!recommendations.trim()) {
      setErrorMsg('Please provide actionable Recommendations.');
      return;
    }

    try {
      setIsSubmitting(true);

      const scoresPayload = Object.values(criteriaScores);

      const result = await api.createObservation({
        instructorId: selectedInstructorId,
        groupId: selectedGroupId,
        observationType,
        observationDate,
        scores: scoresPayload,
        feedback: {
          generalComments,
          strengths,
          areasForImprovement,
          recommendations,
        },
      });

      // Confetti celebration for successful submission
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setSuccessMsg(`Observation ${result.observationCode} successfully submitted! Scores updated.`);

      setTimeout(() => {
        onObservationCreated(result.id);
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit observation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreateObservation) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/20">
        <AlertCircle className="h-10 w-10 text-rose-600 mx-auto mb-2" />
        <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
          Authorization Restricted
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 max-w-md mx-auto">
          Instructors cannot conduct observations. Please switch to the Education Manager, Head of Track, or QA Team persona in the top navigation to create an observation.
        </p>
      </div>
    );
  }

  const selectedInstructor = instructors.find((i) => i.id === selectedInstructorId);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Conduct Instructor Observation
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Live Evaluation Session
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Structured rubric with real-time weighted calculations and qualitative development plan.
          </p>
        </div>

        {/* Live Calculation Indicator */}
        <div className="flex items-center gap-3 rounded-xl border border-indigo-200/80 bg-white px-4 py-2 shadow-sm dark:border-indigo-900/60 dark:bg-slate-900">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Live Weighted Score
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {liveWeightedScore}%
              </span>
              <span className="text-xs text-slate-400">({liveAverageScore}/10)</span>
            </div>
          </div>
          <span className={`px-2 py-1 text-[11px] font-bold rounded-lg shadow-sm ${liveGrade.color}`}>
            {liveGrade.label}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Observation Metadata & Session Selection */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Session & Instructor Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Instructor Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Instructor <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.user?.name} — {inst.track?.name} Track
                  </option>
                ))}
              </select>
              {selectedInstructor && (
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {selectedInstructor.title} • {selectedInstructor.employeeId}
                </span>
              )}
            </div>

            {/* Auto-Loaded Groups */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Assigned Group <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={assignedGroups.length === 0}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                {assignedGroups.length === 0 ? (
                  <option value="">No assigned groups found</option>
                ) : (
                  assignedGroups.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.name} ({grp.code})
                    </option>
                  ))
                )}
              </select>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 block">
                {assignedGroups.length > 0 ? `Auto-loaded from instructor roster (${assignedGroups.length} groups)` : 'Select instructor'}
              </span>
            </div>

            {/* Observation Type Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Observation Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={observationType}
                onChange={(e) => setObservationType(e.target.value as ObservationType)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="TECHNICAL">Technical Observation</option>
                <option value="NON_TECHNICAL">Non-Technical Observation</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Loads active {observationType === 'TECHNICAL' ? 'technical rubric (v1.1)' : 'pedagogical rubric (v1.0)'}
              </span>
            </div>

            {/* Observation Date */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Observation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={observationDate}
                onChange={(e) => setObservationDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Evaluator: {currentUser?.name}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Dynamic Criteria & Live Scoring */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Criteria Scoring & Specific Feedback
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Slide or enter score (1.0 - 10.0) for each rubric criterion. Weights sum to 100%.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                Template: {activeTemplateVersion?.versionNumber || 'v1.1'}
              </span>
              <span>•</span>
              <span>{criteriaList.length} Rubric Criteria</span>
            </div>
          </div>

          <div className="space-y-4">
            {criteriaList.map((criterion, index) => {
              const currentEntry = criteriaScores[criterion.id] || { score: 8.5, feedback: '' };
              const currentScore = currentEntry.score;
              const criterionWeightedScore = Number(((currentScore / 10) * criterion.weightPercentage).toFixed(2));

              return (
                <div
                  key={criterion.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/30"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Criterion Title & Description */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {criterion.name}
                        </h4>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Weight: {criterion.weightPercentage}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {criterion.description}
                      </p>
                    </div>

                    {/* Interactive Slider & Number Input */}
                    <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 shrink-0">
                      <div className="w-36">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={currentScore}
                          onChange={(e) => handleScoreChange(criterion.id, parseFloat(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>1.0</span>
                          <span>5.0</span>
                          <span>10.0</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          step="0.1"
                          value={currentScore}
                          onChange={(e) => handleScoreChange(criterion.id, parseFloat(e.target.value))}
                          className="w-16 rounded border border-slate-300 px-2 py-1 text-sm font-bold text-center text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-semibold text-slate-400">/ 10</span>
                      </div>

                      <div className="border-l border-slate-200 dark:border-slate-700 pl-3 text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Weighted</span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {criterionWeightedScore} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback text for this specific criterion */}
                  <div className="mt-3">
                    <input
                      type="text"
                      value={currentEntry.feedback}
                      onChange={(e) => handleFeedbackChange(criterion.id, e.target.value)}
                      placeholder={`Observations or specific notes on ${criterion.name.toLowerCase()}...`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Overall Qualitative Feedback (Mandatory) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Lightbulb className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Overall Feedback & Development Plan (Mandatory)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All 4 narrative sections are required to finalize and publish the evaluation to the instructor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* General Comments */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>General Comments <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400">High-level narrative of the session</span>
              </label>
              <textarea
                rows={3}
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
                placeholder="Overall summary of the classroom session, pacing, and instructor readiness..."
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                required
              />
            </div>

            {/* Strengths */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <span>Key Strengths <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400">Notable pedagogical & technical highlights</span>
              </label>
              <textarea
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Specific positive techniques, strong clarity, excellent student problem solving..."
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50/30 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-slate-200"
                required
              />
            </div>

            {/* Areas for Improvement */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>Areas for Improvement <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400">Constructive feedback on weak spots</span>
              </label>
              <textarea
                rows={3}
                value={areasForImprovement}
                onChange={(e) => setAreasForImprovement(e.target.value)}
                placeholder="Pacing bottlenecks, handling disengaged students, terminal font sizing..."
                className="w-full rounded-lg border border-amber-200 bg-amber-50/30 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-slate-200"
                required
              />
            </div>

            {/* Recommendations */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
                <span>Actionable Recommendations <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400">Concrete steps to implement in next session</span>
              </label>
              <textarea
                rows={3}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Concrete action items e.g., incorporate Socratic check-ins every 20 minutes..."
                className="w-full rounded-lg border border-indigo-200 bg-indigo-50/30 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:text-slate-200"
                required
              />
            </div>
          </div>
        </div>

        {/* Form Submission Footer Bar */}
        <div className="sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="text-left">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Evaluation ready for submission
              </span>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Final Grade: <span className="text-indigo-600 dark:text-indigo-400">{liveGrade.label}</span> ({liveWeightedScore}%)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting & Notifying Faculty...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Observation Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
