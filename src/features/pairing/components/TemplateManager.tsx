import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Trash2,
  Download,
  Plus,
  Loader2,
  X,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { usePairingStore } from '../store/usePairingStore';
import { supabase } from '../../../lib/supabase';
import { useToastStore } from '../../../store/useToastStore';

/** Hardcoded preset templates — no DB required */
const BUILTIN_TEMPLATES: {
  name: string;
  description: string;
  boards: { name: string; isExempt: boolean }[];
}[] = [
  {
    name: '3-Board Starter',
    description: 'Board 1, Board 2, Board 3 + OOO exempt',
    boards: [
      { name: 'Board 1', isExempt: false },
      { name: 'Board 2', isExempt: false },
      { name: 'Board 3', isExempt: false },
      { name: 'OOO', isExempt: true },
    ],
  },
  {
    name: 'Domain Teams',
    description: 'Frontend, Backend, Platform + OOO exempt',
    boards: [
      { name: 'Frontend', isExempt: false },
      { name: 'Backend', isExempt: false },
      { name: 'Platform', isExempt: false },
      { name: 'OOO', isExempt: true },
    ],
  },
];

interface TemplateBoard {
  name: string;
  goals: string[];
  isExempt: boolean;
}

interface Template {
  id: string;
  name: string;
  boards: TemplateBoard[];
}

export function TemplateManager() {
  const { saveCurrentAsTemplate, applyTemplate, applyBuiltinTemplate } =
    usePairingStore();
  const { addToast } = useToastStore();

  type PendingTemplate =
    | {
        type: 'builtin';
        name: string;
        boards: { name: string; isExempt: boolean }[];
      }
    | { type: 'saved'; id: string; name: string }
    | null;

  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<PendingTemplate>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('pairing_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load templates.', 'error');
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    setIsSaving(true);
    try {
      await saveCurrentAsTemplate(newTemplateName.trim());
      setNewTemplateName('');
      fetchTemplates();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('pairing_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      addToast('Template deleted.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to delete template.', 'error');
    }
  };

  return (
    <div className="relative">
      <button
        id="template-manager-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Manage Templates"
        aria-expanded={isOpen}
        aria-controls="template-manager-menu"
        aria-haspopup="true"
        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-neutral-700 shadow-sm border border-neutral-200 hover:bg-neutral-50 transition-all dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        <Copy className="h-4 w-4 text-brand-500" />
        Templates
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="template-manager-menu"
            aria-labelledby="template-manager-trigger"
            className="fixed inset-x-4 top-[15%] z-50 overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-neutral-800 dark:bg-neutral-900 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:rounded-2xl sm:zoom-in-100 sm:slide-in-from-top-2"
          >
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                  Board Templates
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Preset Templates */}
              <div className="mb-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Presets
                </p>
                <div className="space-y-1.5">
                  {BUILTIN_TEMPLATES.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setPendingTemplate({
                          type: 'builtin',
                          name: preset.name,
                          boards: preset.boards,
                        });
                      }}
                      className="group flex w-full items-start gap-2.5 rounded-xl border border-neutral-100 bg-gradient-to-r from-brand-50 to-white p-3 text-left transition-all hover:border-brand-300 hover:from-brand-100 hover:to-brand-50 dark:border-neutral-800 dark:from-brand-900/20 dark:to-neutral-900 dark:hover:border-brand-500/50"
                    >
                      <Layers className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                      <div>
                        <p className="text-xs font-bold text-neutral-900 group-hover:text-brand-700 dark:text-neutral-100 dark:group-hover:text-brand-300">
                          {preset.name}
                        </p>
                        <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4 border-t border-neutral-100 dark:border-neutral-800" />
              <form onSubmit={handleSaveTemplate} className="mb-6">
                <div className="flex gap-2">
                  <input
                    placeholder="New template name..."
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
                  />
                  <button
                    disabled={isSaving || !newTemplateName.trim()}
                    className="flex aspect-square h-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                    title="Save Current as Template"
                    aria-label="Save Current as Template"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                  Save your current boards and goals as a template.
                </p>
              </form>

              {/* Template List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {isLoadingTemplates ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-500 mb-2" />
                    <span className="text-xs font-medium text-neutral-500">
                      Loading templates...
                    </span>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-neutral-400">
                    <Download className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-xs italic font-medium">
                      No templates saved yet.
                    </p>
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setPendingTemplate({
                          type: 'saved',
                          id: template.id,
                          name: template.name,
                        });
                      }}
                      className="group flex flex-col cursor-pointer rounded-xl border border-neutral-100 bg-neutral-50 p-3 transition-all hover:border-brand-300 hover:bg-brand-50 dark:border-neutral-800 dark:bg-neutral-950/50 dark:hover:border-brand-500/50 dark:hover:bg-brand-900/10"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {template.name}
                        </span>
                        <button
                          onClick={(e) => handleDeleteTemplate(template.id, e)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-white hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all dark:text-neutral-300 dark:hover:bg-neutral-800"
                          aria-label="Delete template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {template.boards.map((b, i) => (
                          <span
                            key={i}
                            className="rounded bg-white/50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-tighter text-neutral-600 dark:text-neutral-400 dark:bg-neutral-800/50"
                          >
                            {b.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Apply Template Confirmation Dialog */}
      {pendingTemplate !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-neutral-900 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/20">
              <Layers className="h-6 w-6 text-brand-500" />
            </div>
            <h3 className="mt-4 text-lg font-black text-neutral-900 dark:text-neutral-100">
              Apply Template?
            </h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-300">
              Applying{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                {pendingTemplate.name}
              </span>{' '}
              will replace your current boards and goals. People will be
              unassigned. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  if (pendingTemplate.type === 'builtin') {
                    applyBuiltinTemplate(
                      pendingTemplate.name,
                      pendingTemplate.boards
                    );
                  } else {
                    applyTemplate(pendingTemplate.id);
                  }
                  setPendingTemplate(null);
                  setIsOpen(false);
                }}
                className="flex-1 rounded-xl bg-brand-600 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-brand-700 transition-colors"
              >
                Apply Template
              </button>
              <button
                onClick={() => setPendingTemplate(null)}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
