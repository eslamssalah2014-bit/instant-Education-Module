import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Copy,
  Archive,
  Power,
  History,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Calculator,
  ChevronRight,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { api } from '../../services/api';
import { ObservationTemplate, ObservationTemplateVersion, ObservationType, TemplateUsageInfo } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface EditableSubCriterion {
  id?: string;
  name: string;
  description: string;
  weightPercentage: number; // % of parent main criterion
  orderIndex: number;
  isActive: boolean;
}

interface EditableMainCriterion {
  id?: string;
  name: string;
  description: string;
  weightPercentage: number; // % of master total observation score
  orderIndex: number;
  isActive: boolean;
  subCriteria: EditableSubCriterion[];
}

export const CriteriaManagementPage: React.FC = () => {
  const { isEducationManager } = useAuth();

  const [templates, setTemplates] = useState<ObservationTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Template Master Score & Hierarchical Criteria State
  const [templateTotalScore, setTemplateTotalScore] = useState<number>(100);
  const [mainCriteriaList, setMainCriteriaList] = useState<EditableMainCriterion[]>([]);
  const [versionNumber, setVersionNumber] = useState('');
  const [changeLog, setChangeLog] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);

  // Template Filter & Safe Deletion Workflow
  const [templateFilter, setTemplateFilter] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUsageInfo, setDeleteUsageInfo] = useState<TemplateUsageInfo | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [hasDoubleConfirmed, setHasDoubleConfirmed] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  // New Template Modal state with mandatory "Total Observation Score" first step
  const [newTemplateTotalScore, setNewTemplateTotalScore] = useState<number>(100);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCode, setNewTemplateCode] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<ObservationType>('TECHNICAL');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchTemplates = async (preferredId?: string) => {
    try {
      setIsLoading(true);
      const data = await api.getTemplates();
      setTemplates(data);
      if (preferredId) {
        setSelectedTemplateId(preferredId);
      } else if (!selectedTemplateId || !data.some((t) => t.id === selectedTemplateId)) {
        const defaultTmpl =
          templateFilter === 'ACTIVE'
            ? data.find((t) => !t.isArchived) || data[0]
            : data.find((t) => t.isArchived) || data[0];
        if (defaultTmpl) {
          setSelectedTemplateId(defaultTmpl.id);
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const activeTemplates = templates.filter((t) => !t.isArchived);
  const archivedTemplates = templates.filter((t) => t.isArchived);
  const filteredTemplates = templateFilter === 'ACTIVE' ? activeTemplates : archivedTemplates;

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || filteredTemplates[0] || templates[0];

  useEffect(() => {
    if (selectedTemplate) {
      const currentVer = selectedTemplate.currentVersion;
      const masterScore = currentVer?.totalScore || selectedTemplate.totalScore || 100;
      setTemplateTotalScore(masterScore);

      if (currentVer?.mainCriteria && currentVer.mainCriteria.length > 0) {
        setMainCriteriaList(
          currentVer.mainCriteria.map((mc) => ({
            id: mc.id,
            name: mc.name,
            description: mc.description,
            weightPercentage: mc.weightPercentage,
            orderIndex: mc.orderIndex,
            isActive: mc.isActive,
            subCriteria: (mc.subCriteria || []).map((sc) => ({
              id: sc.id,
              name: sc.name,
              description: sc.description,
              weightPercentage: sc.weightPercentage,
              orderIndex: sc.orderIndex,
              isActive: sc.isActive,
            })),
          }))
        );
      } else {
        // Fallback default hierarchical criteria conforming to user specification:
        // Total = 100: Technical Competence 50%, Student Engagement 30%, Classroom Management 20%
        setMainCriteriaList([
          {
            name: 'Technical Competence',
            description: 'Demonstrates deep mastery of the subject matter and engineering architecture.',
            weightPercentage: 50,
            orderIndex: 1,
            isActive: true,
            subCriteria: [
              { name: 'Teaching Skills', description: 'Pedagogical execution and learning scaffolding', weightPercentage: 40, orderIndex: 1, isActive: true },
              { name: 'Presentation Skills', description: 'Clarity of speech, pacing, and visual aids', weightPercentage: 30, orderIndex: 2, isActive: true },
              { name: 'Subject Knowledge', description: 'Technical mastery and conceptual depth', weightPercentage: 20, orderIndex: 3, isActive: true },
              { name: 'Problem Solving', description: 'Live coding, debugging, and answering student blockers', weightPercentage: 10, orderIndex: 4, isActive: true },
            ],
          },
          {
            name: 'Student Engagement',
            description: 'Fosters active participation, inquiry-based discussions, and inclusive classroom dialogue.',
            weightPercentage: 30,
            orderIndex: 2,
            isActive: true,
            subCriteria: [
              { name: 'Interactive Questioning', description: 'Regular checks for understanding and discussion prompts', weightPercentage: 50, orderIndex: 1, isActive: true },
              { name: 'Inclusive Participation', description: 'Ensuring all student tiers contribute actively', weightPercentage: 50, orderIndex: 2, isActive: true },
            ],
          },
          {
            name: 'Classroom & Time Management',
            description: 'Manages lesson pacing, schedule milestones, and learning environment readiness.',
            weightPercentage: 20,
            orderIndex: 3,
            isActive: true,
            subCriteria: [
              { name: 'Pacing & Schedule Adherence', description: 'Covers topic agenda on time and leaves room for questions', weightPercentage: 50, orderIndex: 1, isActive: true },
              { name: 'Classroom Readiness', description: 'IDE, repositories, and learning assets ready before class', weightPercentage: 50, orderIndex: 2, isActive: true },
            ],
          },
        ]);
      }

      // Auto-suggest next version number
      const verStr = currentVer?.versionNumber || 'v1.0';
      const parts = verStr.replace('v', '').split('.');
      if (parts.length >= 2) {
        const nextMinor = parseInt(parts[1], 10) + 1;
        setVersionNumber(`v${parts[0]}.${nextMinor}`);
      } else {
        setVersionNumber('v2.0');
      }
    }
  }, [selectedTemplateId, templates]);

  // Main Criteria Weight & Validation
  const totalMainWeight = mainCriteriaList.reduce((sum, mc) => sum + Number(mc.weightPercentage || 0), 0);
  const remainingMainWeight = Number((100 - totalMainWeight).toFixed(1));
  const isMainWeightValid = Math.abs(totalMainWeight - 100) < 0.05;

  // Sub Criteria Validations
  const subCriteriaValidationStatus = mainCriteriaList.map((mc) => {
    const subSum = (mc.subCriteria || []).reduce((sum, sc) => sum + Number(sc.weightPercentage || 0), 0);
    const remaining = Number((100 - subSum).toFixed(1));
    const isValid = (mc.subCriteria || []).length > 0 && Math.abs(subSum - 100) < 0.05;
    return {
      mainCriterionName: mc.name,
      subSum,
      remaining,
      isValid,
    };
  });

  const allSubCriteriaValid = subCriteriaValidationStatus.every((s) => s.isValid);
  const isEntireRubricValid = isMainWeightValid && allSubCriteriaValid && mainCriteriaList.length > 0;

  // --- Main Criteria Handlers ---
  const handleAddMainCriterion = () => {
    const nextOrder = mainCriteriaList.length + 1;
    setMainCriteriaList((prev) => [
      ...prev,
      {
        name: `Main Criterion ${nextOrder}`,
        description: 'Describe core performance expectations for this domain...',
        weightPercentage: remainingMainWeight > 0 ? remainingMainWeight : 0,
        orderIndex: nextOrder,
        isActive: true,
        subCriteria: [
          {
            name: 'Sub Criterion 1',
            description: 'Specific observable behavioral indicators...',
            weightPercentage: 100,
            orderIndex: 1,
            isActive: true,
          },
        ],
      },
    ]);
  };

  const handleUpdateMainCriterion = (index: number, field: keyof EditableMainCriterion, val: any) => {
    setMainCriteriaList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleDeleteMainCriterion = (index: number) => {
    setMainCriteriaList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveMainUp = (index: number) => {
    if (index === 0) return;
    setMainCriteriaList((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((c, i) => ({ ...c, orderIndex: i + 1 }));
    });
  };

  const handleMoveMainDown = (index: number) => {
    if (index === mainCriteriaList.length - 1) return;
    setMainCriteriaList((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((c, i) => ({ ...c, orderIndex: i + 1 }));
    });
  };

  // --- Sub Criteria Handlers ---
  const handleAddSubCriterion = (mainIndex: number) => {
    setMainCriteriaList((prev) => {
      const copy = [...prev];
      const targetMain = copy[mainIndex];
      const nextSubOrder = targetMain.subCriteria.length + 1;
      const currentSubSum = targetMain.subCriteria.reduce((sum, sc) => sum + Number(sc.weightPercentage || 0), 0);
      const remainingSubWeight = Math.max(0, 100 - currentSubSum);

      targetMain.subCriteria = [
        ...targetMain.subCriteria,
        {
          name: `Sub Criterion ${nextSubOrder}`,
          description: 'Detailed observational checkpoint and scoring guidance...',
          weightPercentage: remainingSubWeight > 0 ? remainingSubWeight : 10,
          orderIndex: nextSubOrder,
          isActive: true,
        },
      ];
      return copy;
    });
  };

  const handleUpdateSubCriterion = (
    mainIndex: number,
    subIndex: number,
    field: keyof EditableSubCriterion,
    val: any
  ) => {
    setMainCriteriaList((prev) => {
      const copy = [...prev];
      const targetSub = copy[mainIndex].subCriteria[subIndex];
      copy[mainIndex].subCriteria[subIndex] = { ...targetSub, [field]: val };
      return copy;
    });
  };

  const handleDeleteSubCriterion = (mainIndex: number, subIndex: number) => {
    setMainCriteriaList((prev) => {
      const copy = [...prev];
      copy[mainIndex].subCriteria = copy[mainIndex].subCriteria.filter((_, idx) => idx !== subIndex);
      return copy;
    });
  };

  // Version bump save
  const handleSaveVersion = async () => {
    if (!isMainWeightValid) {
      setNotificationMsg({
        text: `Total Main Criteria weight must equal exactly 100%. Current sum: ${totalMainWeight}%`,
        type: 'error',
      });
      return;
    }

    if (!allSubCriteriaValid) {
      setNotificationMsg({
        text: 'All Sub-Criteria must equal exactly 100% inside their respective Main Criterion.',
        type: 'error',
      });
      return;
    }

    if (!changeLog.trim()) {
      setNotificationMsg({ text: 'Please enter a change log description for this version.', type: 'error' });
      return;
    }

    try {
      await api.bumpTemplateVersion(selectedTemplate.id, {
        versionNumber,
        changeLog,
        totalScore: templateTotalScore,
        mainCriteria: mainCriteriaList,
      });
      setShowVersionModal(false);
      setChangeLog('');
      setNotificationMsg({
        text: `Template upgraded to ${versionNumber} with hierarchical rubric validation!`,
        type: 'success',
      });
      await fetchTemplates();
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Failed to update template version', type: 'error' });
    }
  };

  const handleCloneTemplate = async (templateId: string) => {
    try {
      const cloned = await api.cloneTemplate(templateId);
      setNotificationMsg({ text: `Template cloned successfully as ${cloned.name}`, type: 'success' });
      await fetchTemplates();
      setSelectedTemplateId(cloned.id);
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Failed to clone template', type: 'error' });
    }
  };

  const handleToggleStatus = async (template: ObservationTemplate) => {
    try {
      await api.toggleTemplateStatus(template.id, !template.isActive);
      setNotificationMsg({
        text: `Template ${!template.isActive ? 'activated' : 'deactivated'}`,
        type: 'success',
      });
      await fetchTemplates();
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Failed to update template status', type: 'error' });
    }
  };

  const handleArchive = async (template: ObservationTemplate) => {
    try {
      await api.archiveTemplate(template.id, !template.isArchived);
      setNotificationMsg({
        text: `Template ${!template.isArchived ? 'archived' : 'restored'}`,
        type: 'success',
      });
      await fetchTemplates();
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Failed to archive template', type: 'error' });
    }
  };

  const handleOpenDeleteModal = async (template: ObservationTemplate) => {
    try {
      setIsLoadingUsage(true);
      setShowDeleteModal(true);
      setDeleteConfirmationInput('');
      setHasDoubleConfirmed(false);
      const usage = await api.getTemplateUsage(template.id);
      setDeleteUsageInfo(usage);
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Failed to inspect template dependencies', type: 'error' });
      setShowDeleteModal(false);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTemplate || deleteConfirmationInput.trim() !== 'DELETE' || !hasDoubleConfirmed) {
      return;
    }

    try {
      setIsProcessingDelete(true);
      const res = await api.deleteTemplate(selectedTemplate.id);
      setNotificationMsg({
        text: res.message,
        type: 'success',
      });
      setShowDeleteModal(false);
      await fetchTemplates();
      // Select another template in current or opposite tab
      const remaining =
        res.action === 'ARCHIVED' && templateFilter === 'ACTIVE'
          ? templates.filter((t) => !t.isArchived && t.id !== selectedTemplate.id)
          : templates.filter((t) => t.id !== selectedTemplate.id);
      if (remaining.length > 0) {
        setSelectedTemplateId(remaining[0].id);
      }
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Failed to delete template', type: 'error' });
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const handleRestoreTemplate = async (templateId: string) => {
    try {
      const restored = await api.restoreTemplate(templateId);
      setNotificationMsg({
        text: `Template "${restored.name}" has been restored to active templates.`,
        type: 'success',
      });
      await fetchTemplates(restored.id);
      setTemplateFilter('ACTIVE');
      setSelectedTemplateId(restored.id);
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Failed to restore template', type: 'error' });
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newTemplateCode.trim()) return;

    try {
      const created = await api.createTemplate({
        name: newTemplateName,
        code: newTemplateCode,
        type: newTemplateType,
        description: newTemplateDesc,
        totalScore: newTemplateTotalScore,
      });
      setShowCreateTemplateModal(false);
      setNewTemplateName('');
      setNewTemplateCode('');
      setNewTemplateDesc('');
      setNewTemplateTotalScore(100);
      setNotificationMsg({
        text: `New template "${created.name}" created with Total Score = ${created.totalScore} Points!`,
        type: 'success',
      });
      await fetchTemplates();
      setSelectedTemplateId(created.id);
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Failed to create template', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Observation Criteria Builder
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              Hierarchical Architecture
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Two-tier evaluation rubric (Main Criteria → Sub Criteria). Sub criteria weights scale exclusively from parent main criteria scores.
          </p>
        </div>

        {isEducationManager && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateTemplateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create Observation Template</span>
            </button>
          </div>
        )}
      </div>

      {notificationMsg && (
        <div
          className={`rounded-lg p-3 text-xs flex items-center justify-between ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Template Selector & Master Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {/* Active vs Archived Filters Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
            <button
              onClick={() => {
                setTemplateFilter('ACTIVE');
                const firstActive = templates.find((t) => !t.isArchived);
                if (firstActive) setSelectedTemplateId(firstActive.id);
              }}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                templateFilter === 'ACTIVE'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Active Templates</span>
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {activeTemplates.length}
              </span>
            </button>

            <button
              onClick={() => {
                setTemplateFilter('ARCHIVED');
                const firstArchived = templates.find((t) => t.isArchived);
                if (firstArchived) setSelectedTemplateId(firstArchived.id);
              }}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                templateFilter === 'ARCHIVED'
                  ? 'bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archived Templates</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {archivedTemplates.length}
              </span>
            </button>
          </div>

          {selectedTemplate?.isArchived && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Archived rubric: Preserved for historical observations and reports. Hidden from active evaluation creation.
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {templateFilter === 'ACTIVE' ? 'Active Template:' : 'Archived Template:'}
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {filteredTemplates.length === 0 ? (
                <option value="">No {templateFilter.toLowerCase()} templates available</option>
              ) : (
                filteredTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) — Total: {t.totalScore || 100} pts {t.isArchived ? '[ARCHIVED]' : ''}
                  </option>
                ))
              )}
            </select>

            {selectedTemplate && (
              <>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  {selectedTemplate?.currentVersion?.versionNumber || 'v1.0'}
                </span>

                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedTemplate.isArchived
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : selectedTemplate.isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {selectedTemplate.isArchived
                    ? 'Archived (Preserved)'
                    : selectedTemplate.isActive
                    ? 'Active Rubric'
                    : 'Inactive'}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowVersionHistoryModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <History className="h-3.5 w-3.5 text-slate-500" />
              <span>Version History</span>
            </button>

            {/* Manager-only controls: Clone, Deactivate/Activate, Restore, Delete */}
            {isEducationManager && selectedTemplate && (
              <>
                <button
                  onClick={() => handleCloneTemplate(selectedTemplate.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                  title="Clone Template"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Clone</span>
                </button>

                {!selectedTemplate.isArchived ? (
                  <button
                    onClick={() => handleToggleStatus(selectedTemplate)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                    title="Toggle Status"
                  >
                    <Power className="h-3.5 w-3.5 text-slate-500" />
                    <span>{selectedTemplate.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestoreTemplate(selectedTemplate.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
                    title="Restore Template to Active Roster"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Restore Template</span>
                  </button>
                )}

                {/* Permanent Delete Button next to Clone, Deactivate, Restore */}
                <button
                  onClick={() => handleOpenDeleteModal(selectedTemplate)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition"
                  title="Delete Template"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Delete Template</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Master Score & Weight Validation Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Total Observation Score */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
              <Calculator className="h-3.5 w-3.5" /> Total Observation Score
            </span>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min="1"
                max="1000"
                value={templateTotalScore}
                onChange={(e) => setTemplateTotalScore(Number(e.target.value) || 100)}
                disabled={!isEducationManager}
                className="w-24 rounded-lg border border-indigo-300 bg-white px-2.5 py-1 text-xl font-mono font-black text-indigo-600 dark:border-indigo-700 dark:bg-slate-800 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Master Points</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Master denominator for all criteria.
            </p>
          </div>

          {/* Main Criteria Total Weight */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Main Criteria Weight
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                {totalMainWeight}%
              </span>
              <span className="text-xs text-slate-500">of 100% target</span>
            </div>
            <div className="mt-1">
              {isMainWeightValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ✓ Valid (100% Complete)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> ✗ Invalid ({remainingMainWeight > 0 ? `${remainingMainWeight}% remaining` : `${Math.abs(remainingMainWeight)}% over`})
                </span>
              )}
            </div>
          </div>

          {/* Sub-Criteria Validation State */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sub-Criteria Integrity
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                {subCriteriaValidationStatus.filter((s) => s.isValid).length} / {mainCriteriaList.length}
              </span>
              <span className="text-xs text-slate-500">Categories Valid</span>
            </div>
            <div className="mt-1">
              {allSubCriteriaValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ✓ All Sub-Criteria 100%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> ✗ Weights Need Balancing
                </span>
              )}
            </div>
          </div>

          {/* Save Version Action */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-white p-4 dark:border-slate-800 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-slate-900 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Rubric Status
              </span>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                {isEntireRubricValid ? 'Ready to publish / bump' : 'Fix invalid weights to save'}
              </div>
            </div>

            {isEducationManager && (
              <button
                onClick={() => setShowVersionModal(true)}
                disabled={!isEntireRubricValid}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>Save New Version ({versionNumber})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Criteria Cards List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Main Criteria Cards ({mainCriteriaList.length})
            </h3>
            <span className="text-xs text-slate-500">
              Each Main Criterion has independent Sub Criteria calculated strictly from its score.
            </span>
          </div>

          {isEducationManager && (
            <button
              onClick={handleAddMainCriterion}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Main Criterion</span>
            </button>
          )}
        </div>

        {mainCriteriaList.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
            <Layers className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Main Criteria Defined</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Start building your evaluation rubric by adding your first Main Criterion card.
            </p>
            <button
              onClick={handleAddMainCriterion}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Main Criterion</span>
            </button>
          </div>
        ) : (
          mainCriteriaList.map((mc, mIdx) => {
            // Main Criterion Calculated Score
            const mainCalculatedScore = Number(((mc.weightPercentage / 100) * templateTotalScore).toFixed(2));
            const subSum = (mc.subCriteria || []).reduce((sum, sc) => sum + Number(sc.weightPercentage || 0), 0);
            const remainingSubWeight = Number((100 - subSum).toFixed(1));
            const isSubValid = (mc.subCriteria || []).length > 0 && Math.abs(subSum - 100) < 0.05;

            return (
              <div
                key={mc.id || mIdx}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Main Criterion Card Header */}
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 p-4 dark:border-slate-800 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Index & Title */}
                    <div className="flex-1 flex items-start sm:items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold shrink-0">
                        #{mIdx + 1}
                      </span>
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={mc.name}
                          onChange={(e) => handleUpdateMainCriterion(mIdx, 'name', e.target.value)}
                          disabled={!isEducationManager}
                          placeholder="Main Criterion Name (e.g. Technical Competence)"
                          className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5"
                        />
                        <input
                          type="text"
                          value={mc.description}
                          onChange={(e) => handleUpdateMainCriterion(mIdx, 'description', e.target.value)}
                          disabled={!isEducationManager}
                          placeholder="Brief description of this domain..."
                          className="w-full bg-transparent text-xs text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5"
                        />
                      </div>
                    </div>

                    {/* Weight % & Real-Time Calculated Score */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Weight Input */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                        <span className="text-xs font-bold text-slate-500">Weight:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={mc.weightPercentage}
                          onChange={(e) =>
                            handleUpdateMainCriterion(mIdx, 'weightPercentage', Number(e.target.value) || 0)
                          }
                          disabled={!isEducationManager}
                          className="w-14 text-right font-mono text-sm font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                        />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>

                      {/* Calculated Score Formula Badge */}
                      <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 dark:bg-indigo-950/60 dark:border-indigo-800">
                        <Calculator className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs text-indigo-700 dark:text-indigo-300">Score:</span>
                        <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {mainCalculatedScore}
                        </span>
                        <span className="text-[10px] text-indigo-500 dark:text-indigo-400">
                          ({mc.weightPercentage}% × {templateTotalScore})
                        </span>
                      </div>

                      {/* Sub-Criteria Status Indicator */}
                      <div
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                          isSubValid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {isSubValid ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>✓ Sub Valid (100%)</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            <span>
                              ✗ Sub: {subSum}% ({remainingSubWeight > 0 ? `${remainingSubWeight}% left` : `${Math.abs(remainingSubWeight)}% over`})
                            </span>
                          </>
                        )}
                      </div>

                      {/* Card Reordering & Delete */}
                      {isEducationManager && (
                        <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                          <button
                            onClick={() => handleMoveMainUp(mIdx)}
                            disabled={mIdx === 0}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveMainDown(mIdx)}
                            disabled={mIdx === mainCriteriaList.length - 1}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-500"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMainCriterion(mIdx)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-500 dark:hover:bg-rose-950/50"
                            title="Delete Main Criterion"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-Criteria Section Inside Card */}
                <div className="p-5 bg-slate-50/40 dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5 text-indigo-600" />
                        Sub Criteria for {mc.name || `Criterion #${mIdx + 1}`}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Weights below are calculated ONLY from this parent's score ({mainCalculatedScore} Points), NOT from total observation score.
                      </p>
                    </div>

                    {isEducationManager && (
                      <button
                        onClick={() => handleAddSubCriterion(mIdx)}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300 transition shadow-sm"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Sub Criterion</span>
                      </button>
                    )}
                  </div>

                  {/* Sub Criteria Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-850">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                          <th className="py-2.5 px-3 w-8">#</th>
                          <th className="py-2.5 px-3 w-1/3">Sub Criterion Name</th>
                          <th className="py-2.5 px-3">Description & Behavioral Checkpoints</th>
                          <th className="py-2.5 px-3 text-right w-28">Weight (%)</th>
                          <th className="py-2.5 px-3 text-right w-36">Calculated Score</th>
                          {isEducationManager && <th className="py-2.5 px-3 w-12 text-center">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(mc.subCriteria || []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400">
                              No Sub Criteria yet. Click "+ Add Sub Criterion" to add items.
                            </td>
                          </tr>
                        ) : (
                          mc.subCriteria.map((sc, sIdx) => {
                            // Sub Criterion Calculated Score = (Weight % / 100) * Main Criterion Score
                            const subCalculatedScore = Number(
                              ((sc.weightPercentage / 100) * mainCalculatedScore).toFixed(2)
                            );

                            return (
                              <tr
                                key={sc.id || sIdx}
                                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                              >
                                <td className="py-2.5 px-3 font-mono text-slate-400 font-semibold">
                                  {sIdx + 1}
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    value={sc.name}
                                    onChange={(e) =>
                                      handleUpdateSubCriterion(mIdx, sIdx, 'name', e.target.value)
                                    }
                                    disabled={!isEducationManager}
                                    placeholder="e.g. Teaching Skills"
                                    className="w-full bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 py-0.5"
                                  />
                                </td>
                                <td className="py-2.5 px-3">
                                  <input
                                    type="text"
                                    value={sc.description}
                                    onChange={(e) =>
                                      handleUpdateSubCriterion(mIdx, sIdx, 'description', e.target.value)
                                    }
                                    disabled={!isEducationManager}
                                    placeholder="Observation guidelines and milestones..."
                                    className="w-full bg-transparent text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 py-0.5"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="inline-flex items-center gap-1 justify-end">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={sc.weightPercentage}
                                      onChange={(e) =>
                                        handleUpdateSubCriterion(
                                          mIdx,
                                          sIdx,
                                          'weightPercentage',
                                          Number(e.target.value) || 0
                                        )
                                      }
                                      disabled={!isEducationManager}
                                      className="w-14 text-right font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 focus:outline-none"
                                    />
                                    <span className="text-slate-400 font-bold">%</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                                    {subCalculatedScore} Points
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {sc.weightPercentage}% of {mainCalculatedScore}
                                  </div>
                                </td>
                                {isEducationManager && (
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      onClick={() => handleDeleteSubCriterion(mIdx, sIdx)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                      title="Delete Sub Criterion"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mandatory Step Modal: Create Observation Template with Total Observation Score First */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Create Observation Template
                  </h3>
                  <p className="text-xs text-slate-500">Configure master total score and criteria hierarchy</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              {/* PRIMARY PROMPT: Total Observation Score */}
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900 dark:bg-indigo-950/40 space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  What is the Total Observation Score?
                </label>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
                  This becomes the master denominator for the entire template. All Main and Sub criteria will automatically scale from this value.
                </p>

                {/* Preset quick buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[100, 50, 20, 10].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setNewTemplateTotalScore(score)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition border ${
                        newTemplateTotalScore === score
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {score} Points
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Custom Value:</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newTemplateTotalScore}
                    onChange={(e) => setNewTemplateTotalScore(Number(e.target.value) || 100)}
                    className="w-28 rounded-lg border border-indigo-300 bg-white px-3 py-1 font-mono text-base font-bold text-indigo-600 dark:border-indigo-700 dark:bg-slate-800 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Template Metadata */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. Full-Stack Engineering Evaluation Rubric"
                    className="w-full mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Template Code *</label>
                    <input
                      type="text"
                      required
                      value={newTemplateCode}
                      onChange={(e) => setNewTemplateCode(e.target.value)}
                      placeholder="e.g. TMPL-FE-2026"
                      className="w-full mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Observation Type</label>
                    <select
                      value={newTemplateType}
                      onChange={(e) => setNewTemplateType(e.target.value as ObservationType)}
                      className="w-full mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="TECHNICAL">Technical Audit</option>
                      <option value="NON_TECHNICAL">Pedagogical / Non-Technical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    rows={2}
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    placeholder="Auditing objectives and scope..."
                    className="w-full mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  Create Template with Total: {newTemplateTotalScore} Pts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version Bump Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Publish New Template Version
                </h3>
              </div>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Version Number *</label>
                <input
                  type="text"
                  value={versionNumber}
                  onChange={(e) => setVersionNumber(e.target.value)}
                  placeholder="e.g. v1.2 or v2.0"
                  className="w-full mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Change Log & Release Notes *
                </label>
                <textarea
                  rows={3}
                  value={changeLog}
                  onChange={(e) => setChangeLog(e.target.value)}
                  placeholder="Summarize rubric modifications and pedagogical weight rebalancing..."
                  className="w-full mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50 space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Master Total Score:</span>
                  <span className="font-mono font-bold text-indigo-600">{templateTotalScore} Points</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Main Criteria:</span>
                  <span className="font-mono font-bold">{mainCriteriaList.length} Categories (100%)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Total Sub Criteria:</span>
                  <span className="font-mono font-bold">
                    {mainCriteriaList.reduce((sum, mc) => sum + (mc.subCriteria || []).length, 0)} Items
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowVersionModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVersion}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                Publish Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Safety Modal */}
      {showDeleteModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Delete Observation Template
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedTemplate.name} ({selectedTemplate.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
                disabled={isProcessingDelete}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dependency Check Banner */}
            {isLoadingUsage ? (
              <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Checking template dependencies across observations & reports...</span>
              </div>
            ) : deleteUsageInfo?.isUsed ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Historical Data Protection Active
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      This template is linked to{' '}
                      <span className="font-bold underline">
                        {deleteUsageInfo.observationCount} observation(s)
                      </span>{' '}
                      ({deleteUsageInfo.historicalCount} finalized/reviewed) and institutional quality reports.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-white/80 dark:bg-slate-900/80 p-2.5 border border-amber-200/50 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-semibold text-amber-950 dark:text-amber-100 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Safe Archival Protocol:
                  </div>
                  <p>
                    To guarantee <strong>zero data loss</strong> and preserve institutional evaluation history, this template
                    will <strong>NOT be physically deleted</strong>.
                  </p>
                  <p>
                    It will be converted to <strong>Archived Status</strong>, removed from active rosters, while keeping all historical observations and dashboards intact.
                  </p>
                </div>

                {deleteUsageInfo.linkedObservations.length > 0 && (
                  <div className="space-y-1 text-[11px]">
                    <span className="font-bold text-amber-900 dark:text-amber-200">Linked Evaluations:</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {deleteUsageInfo.linkedObservations.map((obs) => (
                        <span
                          key={obs.id}
                          className="px-2 py-0.5 rounded bg-amber-100/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-mono text-[10px]"
                        >
                          {obs.observationCode} ({obs.instructorName})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/50 dark:bg-rose-950/30 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      Permanent Deletion Allowed
                    </p>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed mt-0.5">
                      This template has <strong>0 linked observations</strong> and has never been used. Confirming will permanently erase the template and all of its hierarchical criteria from the database.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Question */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Are you sure you want to delete this template?
              </p>
              <p className="text-xs text-slate-500">
                Please type <span className="font-mono font-bold text-rose-600">DELETE</span> in the box below to authorize this action:
              </p>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Double Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasDoubleConfirmed}
                onChange={(e) => setHasDoubleConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="font-medium">
                {deleteUsageInfo?.isUsed
                  ? 'I understand that this template will be safely archived and hidden from active templates while preserving all observation records.'
                  : 'I confirm that I want to permanently delete this unused template and all associated criteria.'}
              </span>
            </label>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isProcessingDelete}
                className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={
                  deleteConfirmationInput.trim() !== 'DELETE' ||
                  !hasDoubleConfirmed ||
                  isProcessingDelete ||
                  isLoadingUsage
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessingDelete ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>
                      {deleteUsageInfo?.isUsed ? 'Confirm Archival' : 'Confirm Permanent Deletion'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
