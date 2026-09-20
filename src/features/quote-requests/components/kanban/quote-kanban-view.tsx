'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  rectIntersection,
  defaultDropAnimationSideEffects,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DropAnimation,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { PIPELINE_STATUSES, type PipelineStatus, type QuoteRequest, type QuoteStatus } from '../../types';
import { STATUS_CONFIG } from '../quote-status-badge';

interface QuoteKanbanViewProps {
  quotes: QuoteRequest[];
  onSelectQuote: (id: string) => void;
  onStatusChange: (id: string, newStatus: QuoteStatus) => Promise<void>;
  isUpdating?: boolean;
}

function normalizeStatus(rawStatus: string): PipelineStatus {
  if (rawStatus === 'quoted') return 'quote_sent';
  if (rawStatus === 'archived') return 'cancelled';
  if (PIPELINE_STATUSES.includes(rawStatus as PipelineStatus)) {
    return rawStatus as PipelineStatus;
  }
  return 'new';
}

function buildColumnsState(quotesList: QuoteRequest[]): Record<PipelineStatus, QuoteRequest[]> {
  const initial: Record<PipelineStatus, QuoteRequest[]> = {
    new: [],
    contacted: [],
    waiting_response: [],
    quote_sent: [],
    approved: [],
    in_progress: [],
    completed: [],
    cancelled: [],
  };

  for (const quote of quotesList) {
    const status = normalizeStatus(quote.status);
    if (initial[status]) {
      initial[status].push(quote);
    } else {
      initial.new.push(quote);
    }
  }

  return initial;
}

const dropAnimationConfig: DropAnimation = {
  duration: 220,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

export function QuoteKanbanView({ quotes, onSelectQuote, onStatusChange }: QuoteKanbanViewProps) {
  // Local optimistic state for all columns to enable 0ms real-time dragging & displacement
  const [columns, setColumns] = useState<Record<PipelineStatus, QuoteRequest[]>>(() => buildColumnsState(quotes));
  const [activeQuote, setActiveQuote] = useState<QuoteRequest | null>(null);
  const [overColumnStatus, setOverColumnStatus] = useState<PipelineStatus | null>(null);

  // Ref to columns so drag handlers always inspect the latest state (synced after
  // render/commit, not during render - mutating a ref mid-render is disallowed).
  const columnsRef = useRef(columns);
  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // Track the container where the drag started and an immutable snapshot for rollback
  const initialContainerRef = useRef<PipelineStatus | null>(null);
  const snapshotRef = useRef<Record<PipelineStatus, QuoteRequest[]> | null>(null);

  // Signature of server data content (not array identity) - refetches give new
  // array refs w/ identical content, which previously reset columns mid-drag
  // and broke the first drag attempt after a refetch landed
  const quotesSignature = quotes.map((q) => `${q.id}:${q.status}`).join('|');
  const lastSyncedSignatureRef = useRef<string | null>(null);

  // Keep local state in sync only when server data actually changed content-wise,
  // and never while a drag is in progress
  useEffect(() => {
    if (!activeQuote && quotesSignature !== lastSyncedSignatureRef.current) {
      lastSyncedSignatureRef.current = quotesSignature;
      setColumns(buildColumnsState(quotes));
    }
  }, [quotesSignature, activeQuote, quotes]);

  // Mouse sensor (5px movement threshold prevents accidental drag on click)
  // Touch sensor (200ms hold delay allows regular vertical scrolling on mobile)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Resolves whether an ID is a column status or a card within a column
  const findContainer = useCallback(
    (id: string, currentCols: Record<PipelineStatus, QuoteRequest[]>): PipelineStatus | null => {
      if (PIPELINE_STATUSES.includes(id as PipelineStatus)) {
        return id as PipelineStatus;
      }
      for (const status of PIPELINE_STATUSES) {
        if (currentCols[status]?.some((item) => item.id === id)) {
          return status;
        }
      }
      return null;
    },
    [],
  );

  // Hybrid collision detection: pointer-within first, rect intersection second, closest corners fallback
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    return closestCorners(args);
  }, []);

  const handleDragStart = ({ active }: DragStartEvent) => {
    const activeId = String(active.id);
    const startContainer = findContainer(activeId, columnsRef.current);
    initialContainerRef.current = startContainer;
    snapshotRef.current = columnsRef.current;

    let foundQuote: QuoteRequest | null = null;
    if (startContainer && columnsRef.current[startContainer]) {
      foundQuote = columnsRef.current[startContainer].find((q) => q.id === activeId) ?? null;
    }
    setActiveQuote(foundQuote);
    setOverColumnStatus(startContainer);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) {
      setOverColumnStatus(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = findContainer(activeId, columnsRef.current);
    const overContainer = findContainer(overId, columnsRef.current);

    setOverColumnStatus(overContainer);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Move item across columns optimistically in state so other cards part way smoothly
    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];

      const activeIndex = activeItems.findIndex((item) => item.id === activeId);
      if (activeIndex === -1) return prev;

      const activeItem = activeItems[activeIndex];
      const updatedItem: QuoteRequest = {
        ...activeItem,
        status: overContainer,
      };

      let newIndex: number;
      if (PIPELINE_STATUSES.includes(overId as PipelineStatus)) {
        newIndex = overItems.length;
      } else {
        const overIndex = overItems.findIndex((item) => item.id === overId);
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
      }

      return {
        ...prev,
        [activeContainer]: activeItems.filter((item) => item.id !== activeId),
        [overContainer]: [...overItems.slice(0, newIndex), updatedItem, ...overItems.slice(newIndex)],
      };
    });
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    const activeId = String(active.id);
    const startContainer = initialContainerRef.current;
    const snapshot = snapshotRef.current;

    setActiveQuote(null);
    setOverColumnStatus(null);
    initialContainerRef.current = null;
    snapshotRef.current = null;

    if (!over) {
      // Released outside: restore snapshot
      if (snapshot) setColumns(snapshot);
      return;
    }

    const overId = String(over.id);
    const currentCols = columnsRef.current;
    const activeContainer = findContainer(activeId, currentCols);
    const overContainer = findContainer(overId, currentCols);

    if (!activeContainer || !overContainer) {
      if (snapshot) setColumns(snapshot);
      return;
    }

    // Reorder cards inside the same column if dropped on a specific card
    if (
      activeContainer === overContainer &&
      activeId !== overId &&
      !PIPELINE_STATUSES.includes(overId as PipelineStatus)
    ) {
      const items = currentCols[activeContainer];
      const oldIndex = items.findIndex((q) => q.id === activeId);
      const newIndex = items.findIndex((q) => q.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setColumns((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], oldIndex, newIndex),
        }));
      }
    }

    // If moved to a different column from where it started, sync with backend
    if (startContainer && activeContainer !== startContainer) {
      try {
        await onStatusChange(activeId, activeContainer);
      } catch (err) {
        console.error('Failed to update quote status after drag:', err);
        // Roll back to pre-drag state on failure
        if (snapshot) {
          setColumns(snapshot);
        }
      }
    }
  };

  const handleDragCancel = () => {
    if (snapshotRef.current) {
      setColumns(snapshotRef.current);
    }
    setActiveQuote(null);
    setOverColumnStatus(null);
    initialContainerRef.current = null;
    snapshotRef.current = null;
  };

  // Optimistic handler for quick advance chevron and dropdown menu clicks
  const handleStatusChangeWithOptimistic = useCallback(
    async (id: string, newStatus: QuoteStatus) => {
      const targetStatus = normalizeStatus(newStatus);
      const snapshot = columnsRef.current;

      setColumns((prev) => {
        let movingQuote: QuoteRequest | null = null;
        const next = { ...prev };
        for (const col of PIPELINE_STATUSES) {
          const idx = next[col].findIndex((q) => q.id === id);
          if (idx !== -1) {
            movingQuote = { ...next[col][idx], status: targetStatus };
            next[col] = next[col].filter((q) => q.id !== id);
            break;
          }
        }
        if (movingQuote) {
          next[targetStatus] = [movingQuote, ...next[targetStatus]];
        }
        return next;
      });

      try {
        await onStatusChange(id, newStatus);
      } catch (err) {
        console.error('Failed to advance quote status:', err);
        setColumns(snapshot);
      }
    },
    [onStatusChange],
  );

  // Group columns data for render
  const columnsData = PIPELINE_STATUSES.map((status) => {
    const colQuotes = columns[status] ?? [];
    const totalVal = colQuotes.reduce((sum, q) => {
      const val = q.estimatedCost ? parseFloat(q.estimatedCost) : 0;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    return {
      status,
      config: STATUS_CONFIG[status],
      quotes: colQuotes,
      totalVal,
    };
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className='flex h-full w-full gap-3.5 overflow-x-auto pt-1 pb-4'>
        {columnsData.map(({ status, quotes: colQuotes, totalVal }) => (
          <KanbanColumn
            key={status}
            status={status}
            quotes={colQuotes}
            totalVal={totalVal}
            onSelectQuote={onSelectQuote}
            onStatusChange={handleStatusChangeWithOptimistic}
            isOverColumn={overColumnStatus === status}
          />
        ))}
      </div>

      {/* Smooth, elevated DragOverlay while moving cards across columns */}
      <DragOverlay dropAnimation={dropAnimationConfig}>
        {activeQuote ? <KanbanCard quote={activeQuote} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
