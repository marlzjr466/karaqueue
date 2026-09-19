"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import type { PlaylistItemWithVideo } from "@/lib/playlists/get-playlists";
import {
  removeFromPlaylistAction,
  reorderPlaylistItemsAction
} from "@/app/actions/playlists";
import { PlaylistSongRow } from "@/components/ui/playlist-song-row";
import { EmptyState } from "@/components/ui/empty-state";

function SortableRow({
  item,
  index,
  onRemove
}: {
  item: PlaylistItemWithVideo;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: item.id
    });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <PlaylistSongRow
        item={item}
        index={index}
        onRemove={onRemove}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function PlaylistItemsList({
  playlistId,
  initialItems
}: {
  playlistId: string;
  initialItems: PlaylistItemWithVideo[];
}) {
  const [items, setItems] = useState(initialItems);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const result = await reorderPlaylistItemsAction(
      playlistId,
      reordered.map((i) => i.id)
    );
    if (!result.success) {
      toast.error(result.message ?? "Could not save the new order.");
      setItems(items);
    }
  }

  async function handleRemove(id: string) {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));

    const result = await removeFromPlaylistAction(id, playlistId);
    if (!result.success) {
      toast.error(result.message ?? "Could not remove this song.");
      setItems(previous);
    } else {
      router.refresh();
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="🎵"
        title="No songs yet."
        description="Search for a song and add it to this playlist."
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
            <SortableRow
              key={item.id}
              item={item}
              index={index}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
