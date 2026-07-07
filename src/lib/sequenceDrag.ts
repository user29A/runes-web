import type { Rune } from "@/lib/runes";

export type SequenceItem = {
  id: string;
  rune: Rune;
};

export type DragPayload =
  | { source: "grid"; name: string }
  | { source: "sequence"; id: string };

const DRAG_MIME = "application/x-rune-drag";

export function createSequenceItem(rune: Rune): SequenceItem {
  return {
    id: crypto.randomUUID(),
    rune,
  };
}

export function parseDragPayload(event: React.DragEvent): DragPayload | null {
  const raw = event.dataTransfer.getData(DRAG_MIME);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

export function setDragPayload(
  event: React.DragEvent,
  payload: DragPayload,
): void {
  event.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
  event.dataTransfer.effectAllowed = "copyMove";
}

export function insertSequenceItem(
  items: SequenceItem[],
  rune: Rune,
  index: number,
): SequenceItem[] {
  const next = [...items];
  next.splice(index, 0, createSequenceItem(rune));
  return next;
}

export function moveSequenceItem(
  items: SequenceItem[],
  itemId: string,
  targetIndex: number,
): SequenceItem[] {
  const fromIndex = items.findIndex((item) => item.id === itemId);
  if (fromIndex === -1) return items;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  const adjustedIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
  next.splice(adjustedIndex, 0, moved);
  return next;
}

export function removeSequenceItem(
  items: SequenceItem[],
  itemId: string,
): SequenceItem[] {
  return items.filter((item) => item.id !== itemId);
}