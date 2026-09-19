"use client";

import Image from "next/image";
import { GripVertical, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { QueueItemWithVideo } from "@/lib/queue/get-queue";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDuration } from "@/lib/format-duration";

function SortableQueueRow({
  item,
  index,
  onRemove
}: {
  item: QueueItemWithVideo;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: item.id
    });

  const duration = formatDuration(item.video.durationSeconds);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group"
    >
      <div
        className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition ${
          isDragging ? "opacity-50" : ""
        }`}
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          className="cursor-grab touch-none text-white/30 hover:text-white/60 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <span className="w-5 flex-shrink-0 text-center text-sm text-white/30">
          {index + 1}
        </span>

        <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md bg-stage-800">
          {item.video.thumbnailUrl ? (
            <Image
              src={item.video.thumbnailUrl}
              alt={item.video.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : null}
          {duration && (
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] text-white">
              {duration}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{item.video.title}</p>
          <p className="truncate text-xs text-white/40">
            {item.video.channelTitle}
            {duration ? ` · ${duration}` : ""}
          </p>
        </div>

        <button
          type="button"
          aria-label={`Remove ${item.video.title} from queue`}
          onClick={() => onRemove(item.id)}
          className="flex-shrink-0 rounded-full p-1.5 text-white/30 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Purely presentational + drag mechanics. The caller owns the item list
 * and is responsible for persisting reorders/removals (via
 * `onReorder`/`onRemove`) — this component never talks to the server
 * directly, so it can share state cleanly with the player it sits next
 * to in KaraokeWorkspace.
 */
export function QueueStrip({
  items,
  onRemove,
  onReorder
}: {
  items: QueueItemWithVideo[];
  onRemove: (id: string) => void;
  onReorder: (reordered: QueueItemWithVideo[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="🎤"
        title="Your queue is empty"
        description="Search for a karaoke song on the right to get started."
        className="border-none py-8"
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableQueueRow
              key={item.id}
              item={item}
              index={index}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
