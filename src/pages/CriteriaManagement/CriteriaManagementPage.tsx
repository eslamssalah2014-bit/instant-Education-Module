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
} from 'lucide-react';
import { api } from '../../services/api';
import { ObservationTemplate, ObservationTemplateVersion, ObservationCriterion, ObservationType } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface EditableCriterion {
  id?: string;
  name: string;
  description: string;
  weightPercentage: number;
  orderIndex: number;
  isActive: boolean;
}

export const CriteriaManagementPage: React.FC = () => {
  const { isEducationManager } = useAuth();

  const [templates, setTemplates] = useState<ObservationTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Criteria editing state
  const [criteriaList, setCriteriaList] = useState<EditableCriterion[]>([]);
  const [versionNumber, setVersionNumber] = useState('');
  const [changeLog, setChangeLog] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);

  // New Template state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCode, setNewTemplateCode] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<ObservationType>('TECHNICAL');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTemplates();
      setTemplates(data);
      if (data.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(data[0].id);
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

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  useEffect(() => {
    if (selectedTemplate?.currentVersion?.criteria) {
      setCriteriaList(
        selectedTemplate.currentVersion.criteria.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          weightPercentage: c.weightPercentage,
          orderIndex: c.orderIndex,
          isActive: c.isActive,
        }))
      );
      // Auto-suggest next version number (e.g., v1.1 -> v1.2)
      const currentVer = selectedTemplate.currentVersion.versionNumber;
      const parts = currentVer.replace('v', '').split('.');
      if (parts.length >= 2) {
        const nextMinor = parseInt(parts[1], 10) + 1;
        setVersionNumber(`v${parts[0]}.${nextMinor}`);
      } else {
        setVersionNumber('v2.0');
      }
    }
  }, [selectedTemplateId, templates]);

  // Total weight calculation
  const totalWeight = criteriaList.reduce((sum, c) => sum + Number(c.weightPercentage || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  // Criteria Actions
  const handleAddCriterion = () => {
    const nextOrder = criteriaList.length + 1;
    setCriteriaList((prev) => [
      ...prev,
      {
        name: `New Evaluation Criterion ${nextOrder}`,
        description: 'Provide explicit observational criteria expectations...',
        weightPercentage: 10,
        orderIndex: nextOrder,
        isActive: true,
      },
    ]);
  };

  const handleUpdateCriterion = (index: number, field: keyof EditableCriterion, val: any) => {
    setCriteriaList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleDeleteCriterion = (index: number) => {
    setCriteriaList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setCriteriaList((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((c, i) => ({ ...c, orderIndex: i + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === criteriaList.length - 1) return;
    setCriteriaList((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((c, i) => ({ ...c, orderIndex: i + 1 }));
    });
  };

  // Version bump save
  const handleSaveVersion = async () => {
    if (!isWeightValid) {
      setNotificationMsg({
        text: `Total weights must equal exactly 100%. Current sum: ${totalWeight}%`,
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
        criteria: criteriaList,
      });
      setShowVersionModal(false);
      setChangeLog('');
      setNotificationMsg({ text: `Template upgraded to ${versionNumber} with version control!`, type: 'success' });
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

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName || !newTemplateCode) return;

    try {
      const created = await api.createTemplate({
        name: newTemplateName,
        code: newTemplateCode,
        type: newTemplateType,
        description: newTemplateDesc,
        criteria: [
          { name: 'Core Subject Matter Expertise', description: 'Demonstrates deep concept mastery', weightPercentage: 30, orderIndex: 1 },
          { name: 'Clarity of Explanation', description: 'Explains complex topics clearly', weightPercentage: 30, orderIndex: 2 },
          { name: 'Student Engagement & Interaction', description: 'Involves class in discussion', weightPercentage: 20, orderIndex: 3 },
          { name: 'Pacing & Time Management', description: 'Covers agenda on schedule', weightPercentage: 20, orderIndex: 4 },
        ],
      });
      setShowCreateTemplateModal(false);
      setNewTemplateName('');
      setNewTemplateCode('');
      setNewTemplateDesc('');
      setNotificationMsg({ text: `New template "${created.name}" created!`, type: 'success' });
      await fetchTemplates();
      setSelectedTemplateId(created.id);
    } catch (err: any) {
      setNotificationMsg({ text: err.message || 'Failed to create template', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Observation Criteria & Template Builder
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              Version Controlled
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Design rubrics, enforce 100% weight integrity, and maintain immutable audit versions for past evaluations.
          </p>
        </div>

        {isEducationManager && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateTemplateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Template</span>
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

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Templates Sidebar / Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Evaluation Templates ({templates.length})
            </h3>

            <div className="space-y-2">
              {templates.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/40'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                            {tmpl.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                          {tmpl.code} • {tmpl.type}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                          tmpl.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {tmpl.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {tmpl.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800/80 text-[10px]">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <GitBranch className="h-3 w-3" /> {tmpl.currentVersion?.versionNumber || 'v1.0'}
                      </span>
                      <span className="text-slate-400">
                        {tmpl.currentVersion?.criteria?.length || 0} criteria
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Template Editor */}
        {selectedTemplate && (
          <div className="lg:col-span-8 space-y-5">
            {/* Header info bar of the selected template */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedTemplate.name}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {selectedTemplate.currentVersion?.versionNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedTemplate.description}
                  </p>
                </div>

                {isEducationManager && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setShowVersionHistoryModal(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      title="View Version Audit History"
                    >
                      <History className="h-3.5 w-3.5 text-slate-500" />
                      <span>History</span>
                    </button>

                    <button
                      onClick={() => handleCloneTemplate(selectedTemplate.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      title="Duplicate Template"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(selectedTemplate)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                        selectedTemplate.isActive
                          ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                      }`}
                      title="Toggle Active State"
                    >
                      <Power className="h-3.5 w-3.5" />
                      <span>{selectedTemplate.isActive ? 'Active' : 'Deactivated'}</span>
                    </button>

                    <button
                      onClick={() => handleArchive(selectedTemplate)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:bg-rose-950/30"
                      title="Archive Template"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>{selectedTemplate.isArchived ? 'Unarchive' : 'Archive'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Weight Management Validation Progress Bar */}
              <div className="mt-4 rounded-xl border p-4 transition-colors bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    Weight Distribution Integrity
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-black ${
                        isWeightValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {totalWeight}% / 100%
                    </span>
                    {isWeightValid ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Valid 100%
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        Weights Must Sum to 100%
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isWeightValid ? 'bg-emerald-500' : totalWeight > 100 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, totalWeight)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Criteria List Builder */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Criteria Builder ({criteriaList.length} criteria)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add, edit, reorder, or adjust weight percentages.
                  </p>
                </div>

                {isEducationManager && (
                  <button
                    onClick={handleAddCriterion}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-indigo-400 bg-indigo-50/60 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Criterion</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {criteriaList.map((criterion, index) => (
                  <div
                    key={criterion.id || `crit-${index}`}
                    className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30"
                  >
                    {/* Reordering Up/Down controls */}
                    <div className="flex sm:flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || !isEducationManager}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-700"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono text-xs font-bold text-slate-400">{index + 1}</span>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === criteriaList.length - 1 || !isEducationManager}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-700"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Inputs for Name & Description */}
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={criterion.name}
                        disabled={!isEducationManager}
                        onChange={(e) => handleUpdateCriterion(index, 'name', e.target.value)}
                        placeholder="Criterion Name..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <textarea
                        rows={2}
                        value={criterion.description}
                        disabled={!isEducationManager}
                        onChange={(e) => handleUpdateCriterion(index, 'description', e.target.value)}
                        placeholder="Detailed rubrics description..."
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      />
                    </div>

                    {/* Weight Input & Actions */}
                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Weight %</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={criterion.weightPercentage}
                          disabled={!isEducationManager}
                          onChange={(e) =>
                            handleUpdateCriterion(index, 'weightPercentage', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-xs font-mono font-bold text-indigo-600 dark:border-slate-600 dark:bg-slate-700 dark:text-indigo-400"
                        />
                      </div>

                      {isEducationManager && (
                        <button
                          onClick={() => handleDeleteCriterion(index)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title="Delete Criterion"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Version Bump Action Bar */}
              {isEducationManager && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Saving modifications will publish a new immutable version in the version control registry.
                  </span>

                  <button
                    onClick={() => setShowVersionModal(true)}
                    disabled={!isWeightValid}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    <Save className="h-4 w-4" />
                    <span>Publish Version ({versionNumber})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Version Bump Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-indigo-600" />
              Publish New Rubric Version
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Historical evaluations will preserve older versions. Future evaluations will utilize this new release.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Version Number
                </label>
                <input
                  type="text"
                  value={versionNumber}
                  onChange={(e) => setVersionNumber(e.target.value)}
                  placeholder="e.g. v1.2"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Change Log Narrative <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={changeLog}
                  onChange={(e) => setChangeLog(e.target.value)}
                  placeholder="Describe criteria updates, rebalanced weights, or pedagogical adjustments..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowVersionModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVersion}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Confirm & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer / Modal */}
      {showVersionHistoryModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                Template Version Registry
              </h3>
              <button
                onClick={() => setShowVersionHistoryModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-3">
              {(selectedTemplate.versions || []).map((ver) => (
                <div
                  key={ver.id}
                  className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {ver.versionNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ver.createdAt).toLocaleDateString()} by {ver.createdBy?.name || 'Administrator'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300 italic">
                    "{ver.changeLog}"
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400">
                    {ver.criteria?.length || 0} criteria assigned to this immutable release
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowVersionHistoryModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 dark:bg-slate-700"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Create Evaluation Template
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Initialize a new rubric category for technical or non-technical assessments.
            </p>

            <form onSubmit={handleCreateTemplate} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. AI & Machine Learning Evaluation Template"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTemplateCode}
                    onChange={(e) => setNewTemplateCode(e.target.value)}
                    placeholder="e.g. TMPL-AI-EVAL"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTemplateType}
                    onChange={(e) => setNewTemplateType(e.target.value as ObservationType)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="NON_TECHNICAL">NON_TECHNICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Purpose of this rubric..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
