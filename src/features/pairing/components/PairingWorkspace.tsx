import React, { useState, useRef, useEffect } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { DroppableBoard } from './DroppableBoard';
import { DraggablePerson } from './DraggablePerson';
import { TemplateManager } from './TemplateManager';
import type { Person, DragItem, PairingBoard } from '../types';
import { usePairingStore } from '../store/usePairingStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useToastStore } from '../../../store/useToastStore';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import {
  Users,
  X,
  Plus,
  Sparkles,
  History,
  Loader2,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Download,
} from 'lucide-react';
import { useTutorialStore } from '../store/useTutorialStore';
import { ProductTutorial } from './ProductTutorial';
import { GettingStartedCard } from './GettingStartedCard';
import { ContextualHint } from './ContextualHint';
import { formatLocalDate } from '../utils/dateUtils';
import { useHistoryAnalytics } from '../hooks/useHistoryAnalytics';
import { PairingMatrixView } from './PairingMatrixView';
import { BarChart3 } from 'lucide-react';

export function PairingWorkspace() {
  const {
    people,
    boards,
    setBoards,
    addBoard,
    saveSession,
    recommendPairs,
    moveBoard,
    isLoading: isStoreLoading,
    isSaving,
    isRecommending,
  } = usePairingStore();
  const { user } = useAuthStore();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardIsExempt, setNewBoardIsExempt] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(
    new Set()
  );
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const {
    matrix,
    sessionCount,
    isLoading: isAnalyzing,
  } = useHistoryAnalytics(people);

  const { startTutorial } = useTutorialStore();
  const {
    hintGoalsSeen,
    setHintGoalsSeen,
    gettingStartedDismissed,
    hintHistorySeen,
    setHintHistorySeen,
    hintHeatmapSeen,
    setHintHeatmapSeen,
  } = useWorkspacePrefsStore();

  // Derive contextual hint visibility
  // Only one hint shows at a time, in priority order: goals → history → heatmap
  const hasSessionSaved = matrix && Object.keys(matrix).length > 0;
  const boardsWithNoGoals = boards.filter(
    (b) =>
      !b.isExempt &&
      (b.goals || []).length === 0 &&
      (b.assignedPersonIds || []).length > 0
  );

  const goalsHintEligible =
    !hintGoalsSeen && gettingStartedDismissed && boardsWithNoGoals.length > 0;
  const historyHintEligible =
    !hintHistorySeen && gettingStartedDismissed && !!hasSessionSaved;
  const heatmapHintEligible =
    !hintHeatmapSeen && gettingStartedDismissed && sessionCount >= 3;

  // Show only the highest-priority eligible hint
  const showGoalsHint = goalsHintEligible;
  const showHistoryHint = !goalsHintEligible && historyHintEligible;
  const showHeatmapHint =
    !goalsHintEligible && !historyHintEligible && heatmapHintEligible;

  // Keyboard support for clearing selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPersonIds(new Set());
        setLastClickedId(null);
        setIsMoveMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const username = user?.email?.split('@')[0] || 'Workspace';
  const workspaceTitle =
    username.charAt(0).toUpperCase() + username.slice(1) + ' Workspace';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const allAssignedIds = new Set(
    boards.flatMap((b) => b.assignedPersonIds || [])
  );
  const unpairedPeople = people.filter((p) => !allAssignedIds.has(p.id));

  const handlePersonClick = (personId: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      setSelectedPersonIds((prev) => {
        const next = new Set(prev);
        if (next.has(personId)) {
          next.delete(personId);
        } else {
          next.add(personId);
        }
        return next;
      });
      setLastClickedId(personId);
    } else if (e.shiftKey && lastClickedId) {
      // Range selection logic
      // Flatten all people into the visible order: Unpaired Pool -> Boards
      const allPeopleOrder = [
        ...unpairedPeople,
        ...boards.flatMap((b) =>
          (b.assignedPersonIds ?? [])
            .map((id) => people.find((p) => p.id === id))
            .filter((p): p is Person => !!p)
        ),
      ];

      const startIdx = allPeopleOrder.findIndex((p) => p.id === lastClickedId);
      const endIdx = allPeopleOrder.findIndex((p) => p.id === personId);

      if (startIdx !== -1 && endIdx !== -1) {
        const min = Math.min(startIdx, endIdx);
        const max = Math.max(startIdx, endIdx);
        const range = allPeopleOrder.slice(min, max + 1).map((p) => p.id);

        setSelectedPersonIds((prev) => {
          const next = new Set(prev);
          range.forEach((id) => next.add(id));
          return next;
        });
      }
      setLastClickedId(personId);
    } else {
      setSelectedPersonIds(new Set([personId]));
      setLastClickedId(personId);
    }
  };

  const handleBulkMove = (targetBoardId: string) => {
    if (selectedPersonIds.size === 0) return;

    setBoards((prevBoards: PairingBoard[]) => {
      return prevBoards.map((board) => {
        // Remove selected people from their current boards
        const newAssigned = (board.assignedPersonIds || []).filter(
          (id) => !selectedPersonIds.has(id)
        );

        // Add them to the new board
        if (board.id === targetBoardId && targetBoardId !== 'unpaired') {
          return {
            ...board,
            assignedPersonIds: [
              ...newAssigned,
              ...Array.from(selectedPersonIds),
            ],
          };
        }

        return {
          ...board,
          assignedPersonIds: newAssigned,
        } as PairingBoard;
      });
    }, true);

    // Clear selection after moving
    setSelectedPersonIds(new Set());
    setLastClickedId(null);
    setIsMoveMenuOpen(false);
  };

  const handleDownloadScreenshot = async () => {
    if (!dashboardRef.current) return;
    setIsDownloading(true);
    setIsExporting(true);

    try {
      // Trigger the export mode styles
      document.documentElement.setAttribute('data-exporting', 'true');

      // Wait for React and Tailwind to apply the hidden classes and re-layout
      await new Promise((r) => setTimeout(r, 150));

      const isDarkMode = document.documentElement.classList.contains('dark');
      const dataUrl = await toPng(dashboardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: isDarkMode ? '#171717' : '#ffffff',
      });

      const link = document.createElement('a');
      const username = user?.email?.split('@')[0] || 'team';
      link.download = `parrit-${username}-${formatLocalDate(new Date())}.png`;
      link.href = dataUrl;
      link.click();

      useToastStore.getState().addToast('Screenshot downloaded!', 'success');
    } catch (err) {
      console.error('Screenshot error:', err);
      useToastStore.getState().addToast('Failed to generate image.', 'error');
    } finally {
      document.documentElement.removeAttribute('data-exporting');
      setIsExporting(false);
      setIsDownloading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'PERSON') {
      setActiveDragItem(active.data.current as DragItem);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    setActiveDragItem(null);

    if (!over) return;

    // Handle Board Reordering
    if (active.data.current?.type === 'BOARD') {
      if (active.id !== over.id) {
        moveBoard(active.id.toString(), over.id.toString());
      }
      return;
    }

    // Handle Person Movement
    if (active.data.current?.type === 'PERSON') {
      const dragItem = active.data.current as DragItem;
      const targetBoardId = over.id as string;

      // If we're dragging one of the selected people, move the whole selection
      if (selectedPersonIds.has(dragItem.person.id)) {
        handleBulkMove(targetBoardId);
        return;
      }

      // Standard single-person move
      setBoards((prevBoards: PairingBoard[]) => {
        return prevBoards.map((board) => {
          const isSource = board.id === dragItem.sourceId;
          const isTarget = board.id === targetBoardId;

          let nextAssigned = [...(board.assignedPersonIds || [])];

          if (isSource) {
            nextAssigned = nextAssigned.filter(
              (id) => id !== dragItem.person.id
            );
          }

          if (isTarget && targetBoardId !== 'unpaired') {
            if (!nextAssigned.includes(dragItem.person.id)) {
              nextAssigned.push(dragItem.person.id);
            }
          }

          return { ...board, assignedPersonIds: nextAssigned } as PairingBoard;
        });
      }, true);
    }
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
  };

  const handleAddBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    await addBoard(newBoardName.trim(), newBoardIsExempt);
    setNewBoardName('');
    setNewBoardIsExempt(false);
    setIsAddingBoard(false);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start pb-24 sm:pb-0">
          {/* Main Workspaces Column */}
          <div
            ref={dashboardRef}
            className="flex-1 min-w-0 space-y-4 sm:space-y-6 [html[data-exporting='true']_&]:p-12 [html[data-exporting='true']_&]:bg-neutral-50 dark:[html[data-exporting='true']_&]:bg-neutral-950/20 [html[data-exporting='true']_&]:rounded-3xl"
          >
            {/* 
              Visible only in Screenshot: Show full workspace identity 
              Hidden in App: Prevents repetition with the page-level H1
            */}
            {isExporting && (
              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                  {workspaceTitle}
                </h2>
                <div className="h-1 w-20 bg-brand-500 mt-2" />
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8">
              {!isExporting && (
                <div className="flex flex-col">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    Active Pairing Boards
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      Live Session
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 [html[data-exporting='true']_&]:hidden">
                <button
                  id="heatmap-toggle"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`flex justify-center items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all shadow-sm
                    ${
                      showHeatmap
                        ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }
                  `}
                >
                  <BarChart3 className="h-4 w-4" />
                  {showHeatmap ? 'Hide Heatmap' : 'Heatmap'}
                </button>

                <TemplateManager />

                <div className="flex flex-col items-center gap-1 w-full sm:w-auto relative">
                  <button
                    id="recommend-btn"
                    onClick={() => recommendPairs()}
                    disabled={isStoreLoading || isRecommending}
                    className="w-full flex justify-center items-center gap-2 rounded-xl bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-700 shadow-sm border border-neutral-200 hover:bg-neutral-50 transition-all dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {isRecommending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    )}
                    {isRecommending ? 'Recommending...' : 'Recommend Pairs'}
                  </button>
                </div>

                <button
                  id="save-session-btn"
                  onClick={saveSession}
                  disabled={isSaving}
                  className="flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-brand-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <History className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Session'}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showHeatmap && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-8"
                >
                  <div className="rounded-3xl border-2 border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900/40 overflow-x-auto">
                    <div className="flex items-center gap-2 mb-8">
                      <BarChart3 className="h-4 w-4 text-brand-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">
                        Pairing Heatmap
                      </h3>
                    </div>
                    {isAnalyzing ? (
                      <div className="h-48 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                      </div>
                    ) : (
                      <PairingMatrixView matrix={matrix} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main grid region */}
            <div
              id="board-list"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            >
              {/* Loading State: Skeleton Screens */}
              {isStoreLoading && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <BoardSkeleton key={`skeleton-${i}`} index={i} />
                  ))}
                </>
              )}

              {!isStoreLoading && (
                <SortableContext
                  items={boards.map((b) => b.id)}
                  strategy={rectSortingStrategy}
                >
                  {boards.map((board) => {
                    const assignedPeople = (board.assignedPersonIds || [])
                      .map((id) => people.find((p) => p.id === id))
                      .filter((p): p is Person => !!p);

                    return (
                      <DroppableBoard
                        key={board.id}
                        board={board}
                        people={assignedPeople}
                        selectedPersonIds={selectedPersonIds}
                        onPersonClick={handlePersonClick}
                      />
                    );
                  })}
                </SortableContext>
              )}

              {/* Add Board Trigger */}
              {!isStoreLoading && !isAddingBoard && (
                <button
                  onClick={() => setIsAddingBoard(true)}
                  aria-label="Add new pairing board"
                  className="group flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 p-5 transition-all hover:border-brand-400 hover:bg-brand-50/30 dark:border-neutral-800 dark:hover:border-brand-500/50 dark:hover:bg-brand-950/10 [html[data-exporting='true']_&]:hidden"
                >
                  <div
                    className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600 dark:bg-neutral-800 dark:group-hover:bg-brand-900/40"
                    aria-hidden="true"
                  >
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-neutral-500 group-hover:text-brand-600 dark:text-neutral-300 dark:group-hover:text-brand-400">
                    Add Board
                  </span>
                </button>
              )}

              {/* Add Board Form */}
              {isAddingBoard && (
                <form
                  onSubmit={handleAddBoard}
                  className="flex min-h-[160px] flex-col rounded-2xl border-2 border-brand-400 bg-white p-5 shadow-lg ring-4 ring-brand-500/10 animate-in zoom-in-95 duration-200 dark:bg-neutral-900 dark:border-brand-500/50"
                >
                  <input
                    autoFocus
                    placeholder="Board name..."
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    className="mb-4 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
                  />
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newBoardIsExempt}
                        onChange={(e) => setNewBoardIsExempt(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500/20"
                      />
                      <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-300">
                        Exempt (Out of Office)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingBoard(false)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-600 transition-colors"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Unpaired Sidebar */}
          <div className="xl:sticky xl:top-6 w-[340px] shrink-0 [html[data-exporting='true']_&]:hidden">
            <DroppableUnpairedPool
              people={unpairedPeople}
              selectedPersonIds={selectedPersonIds}
              onPersonClick={handlePersonClick}
              isLoading={isStoreLoading}
            />
          </div>
        </div>

        {/* Global Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeDragItem ? (
            <DraggablePerson
              person={activeDragItem.person}
              sourceId={activeDragItem.sourceId}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40 [html[data-exporting='true']_&]:hidden">
        <button
          id="download-btn"
          onClick={handleDownloadScreenshot}
          disabled={isDownloading || isStoreLoading}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-500 shadow-xl border border-neutral-200 transition-all hover:text-brand-600 hover:scale-110 active:scale-95 disabled:opacity-50 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800"
          title="Download Dashboard as Image"
          aria-label="Download Dashboard as Image"
        >
          {isDownloading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
        </button>

        <button
          id="help-btn"
          onClick={() => startTutorial()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-500 shadow-xl border border-neutral-200 transition-all hover:text-brand-600 hover:scale-110 active:scale-95 dark:text-neutral-300 dark:bg-neutral-900 dark:border-neutral-800"
          title="Help & Tutorial"
          aria-label="Help & Tutorial"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>

      {selectedPersonIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-neutral-900 text-white px-6 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 border border-white/10 dark:bg-neutral-800 [html[data-exporting='true']_&]:hidden">
          <span className="text-sm font-bold flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            {selectedPersonIds.size} teammate
            {selectedPersonIds.size > 1 ? 's' : ''} selected
          </span>

          <div className="h-4 w-px bg-white/20 mx-2" />

          <div className="relative">
            <button
              onClick={() => setIsMoveMenuOpen(!isMoveMenuOpen)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${isMoveMenuOpen ? 'bg-white text-neutral-900 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}
            >
              Move to...
              <ChevronDown
                className={`h-3 w-3 transition-transform ${isMoveMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isMoveMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-full left-0 mb-3 w-56 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 py-2.5 z-[100]"
                >
                  <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-50 dark:border-neutral-800 mb-2">
                    Select Target Board
                  </p>
                  <div className="max-h-64 overflow-y-auto px-2 space-y-1">
                    {boards.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleBulkMove(b.id)}
                        className="w-full text-left px-3 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center justify-between group/item transition-colors"
                      >
                        <span className="truncate">{b.name}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                      </button>
                    ))}
                    <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-2 mx-2" />
                    <button
                      onClick={() => handleBulkMove('unpaired')}
                      className="w-full text-left px-3 py-2.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl flex items-center justify-between group/item transition-colors"
                    >
                      Unpair All Selected
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-4 w-px bg-white/20 mx-2" />

          <button
            onClick={() => {
              setSelectedPersonIds(new Set());
              setLastClickedId(null);
              setIsMoveMenuOpen(false);
            }}
            className="shrink-0 p-1 text-neutral-500 hover:text-neutral-900 border-2 border-transparent hover:border-white/20 rounded-lg transition-all"
            aria-label="Clear selection"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <ProductTutorial />

      {/* Getting Started Checklist Card (replaces auto-triggered step-by-step tutorial) */}
      <GettingStartedCard
        people={people}
        boards={boards}
        hasSessionSaved={!!hasSessionSaved}
      />

      {/* Contextual hint: Goals — appears on a board that has people but no goals yet */}
      {showGoalsHint && (
        <ContextualHint
          targetId="board-goals"
          title="Set your daily focus"
          description="Click here to add goals for this board — great for keeping the pair focused and on track."
          placement="bottom"
          onDismiss={() => setHintGoalsSeen(true)}
        />
      )}

      {/* Contextual hint: History — shown after the first session is saved */}
      {showHistoryHint && (
        <ContextualHint
          targetId="save-session-btn"
          title="Your session was saved!"
          description="Head to the History tab from the sidebar to see your pairing patterns over time."
          placement="bottom"
          onDismiss={() => setHintHistorySeen(true)}
        />
      )}

      {/* Contextual hint: Heatmap — shown after 3+ sessions, pointing to the toggle */}
      {showHeatmapHint && (
        <ContextualHint
          targetId="heatmap-toggle"
          title="Your heatmap is live"
          description="You have enough data to see pairing patterns. Toggle the heatmap to see who's been working with whom!"
          placement="bottom"
          onDismiss={() => setHintHeatmapSeen(true)}
        />
      )}
    </>
  );
}

function DroppableUnpairedPool({
  people,
  selectedPersonIds,
  onPersonClick,
  isLoading,
}: {
  people: Person[];
  selectedPersonIds?: Set<string>;
  onPersonClick?: (id: string, e: React.MouseEvent) => void;
  isLoading?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unpaired',
    data: { type: 'POOL' },
  });

  return (
    <div
      ref={setNodeRef}
      id="unpaired-pool"
      className={`
        xl:sticky xl:top-6 flex xl:min-h-[400px] flex-col rounded-2xl border p-3 sm:p-4 xl:p-5 shadow-xs transition-colors
        ${
          isOver
            ? 'border-brand-400 border-dashed bg-brand-50 dark:border-brand-500/50 dark:bg-brand-950/20'
            : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
        }
      `}
    >
      <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-neutral-400 dark:text-neutral-400" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Unpaired Pool
          </h3>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {people.length}
        </span>
      </div>

      <div className="flex max-h-[150px] overflow-y-auto no-scrollbar xl:max-h-none xl:overflow-visible flex-wrap content-start gap-2 sm:gap-3 flex-1">
        {isLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <PersonSkeleton key={`person-skeleton-${i}`} />
            ))}
          </>
        ) : (
          <AnimatePresence>
            {people.length === 0 ? (
              <span className="flex w-full items-center justify-center text-sm font-medium text-neutral-400 mt-10 dark:text-neutral-400">
                {isOver ? 'Drop to unpair' : 'Everyone is paired!'}
              </span>
            ) : (
              people.map((person) => (
                <DraggablePerson
                  key={person.id}
                  person={person}
                  sourceId="unpaired"
                  isSelected={selectedPersonIds?.has(person.id)}
                  onClick={(e) => onPersonClick?.(person.id, e)}
                />
              ))
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function BoardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex min-h-[200px] sm:min-h-[240px] flex-col rounded-3xl border-2 border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        <div className="h-4 w-32 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="h-12 w-24 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/50 animate-pulse" />
        <div className="h-12 w-32 rounded-2xl bg-neutral-100/50 dark:bg-neutral-800/50 animate-pulse" />
      </div>
      <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-neutral-800/50">
        <div className="h-3 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      </div>
    </motion.div>
  );
}

function PersonSkeleton() {
  return (
    <div className="h-12 w-32 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse border border-neutral-200/50 dark:border-neutral-700/30" />
  );
}
