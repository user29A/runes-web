"use client";

import { useState } from "react";
import {
  insertSequenceItem,
  moveSequenceItem,
  parseDragPayload,
  removeSequenceItem,
  setDragPayload,
  type SequenceItem,
} from "@/lib/sequenceDrag";
import { RUNES, type Rune, getRuneImagePath } from "@/lib/runes";

type SequenceBuilderProps = {
  sequence: SequenceItem[];
  onSequenceChange: (sequence: SequenceItem[]) => void;
  isRuneEnabled: (rune: Rune) => boolean;
  isPlayingSequence: boolean;
  onPlaySequence: () => void;
  onStopSequence: () => void;
};

function getRuneByName(name: string): Rune | undefined {
  return RUNES.find((rune) => rune.name === name);
}

export default function SequenceBuilder({
  sequence,
  onSequenceChange,
  isRuneEnabled,
  isPlayingSequence,
  onPlaySequence,
  onStopSequence,
}: SequenceBuilderProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDropAtIndex = (event: React.DragEvent, targetIndex: number) => {
    event.preventDefault();
    setDragOverIndex(null);

    const payload = parseDragPayload(event);
    if (!payload) return;

    if (payload.source === "grid") {
      const rune = getRuneByName(payload.name);
      if (!rune || !isRuneEnabled(rune)) return;
      onSequenceChange(insertSequenceItem(sequence, rune, targetIndex));
      return;
    }

    onSequenceChange(moveSequenceItem(sequence, payload.id, targetIndex));
  };

  const handleDropAppend = (event: React.DragEvent) => {
    handleDropAtIndex(event, sequence.length);
  };

  const handleClear = () => {
    onStopSequence();
    onSequenceChange([]);
  };

  const sequenceLabel = sequence.map((item) => item.rune.name).join(" → ");

  return (
    <section className="rounded-md border border-slate-700 bg-slate-800 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-normal text-slate-100">Sequence Builder</h2>
          <p className="text-xs text-slate-400">
            Drag enabled runes here, then reorder them to build a pronunciation
            sequence.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPlaySequence}
            disabled={sequence.length === 0 || isPlayingSequence}
            className="rounded-md border border-slate-600 bg-slate-700 px-4 py-1.5 text-sm text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Play Sequence
          </button>
          <button
            type="button"
            onClick={onStopSequence}
            disabled={!isPlayingSequence}
            className="rounded-md border border-slate-600 bg-slate-700 px-4 py-1.5 text-sm text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Stop
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={sequence.length === 0}
            className="rounded-md border border-slate-600 bg-slate-700 px-4 py-1.5 text-sm text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {sequenceLabel && (
        <p className="mb-3 text-sm text-slate-300">
          <span className="text-slate-400">Sequence: </span>
          {sequenceLabel}
        </p>
      )}

      <div
        onDragOver={handleDragOver}
        onDrop={handleDropAppend}
        className={`min-h-[88px] rounded-md border border-dashed p-3 transition-colors ${
          dragOverIndex === sequence.length
            ? "border-slate-400 bg-slate-700/50"
            : "border-slate-600 bg-slate-900/40"
        }`}
      >
        {sequence.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Drag enabled runes into this area to start a sequence.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {sequence.map((item, index) => (
              <div
                key={item.id}
                onDragOver={(event) => {
                  handleDragOver(event);
                  setDragOverIndex(index);
                }}
                onDragLeave={() =>
                  setDragOverIndex((current) =>
                    current === index ? null : current,
                  )
                }
                onDrop={(event) => handleDropAtIndex(event, index)}
                className={`rounded-md transition-colors ${
                  dragOverIndex === index ? "bg-slate-700/60" : ""
                }`}
              >
                <div
                  draggable
                  onDragStart={(event) => {
                    setDragPayload(event, {
                      source: "sequence",
                      id: item.id,
                    });
                  }}
                  onDragEnd={() => setDragOverIndex(null)}
                  className="flex cursor-grab items-center gap-2 rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 active:cursor-grabbing"
                >
                  <img
                    src={getRuneImagePath(item.rune)}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                  <span className="text-sm text-slate-200">{item.rune.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onSequenceChange(removeSequenceItem(sequence, item.id))
                    }
                    className="ml-1 rounded px-1 text-xs text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
                    aria-label={`Remove ${item.rune.name} from sequence`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            <div
              onDragOver={(event) => {
                handleDragOver(event);
                setDragOverIndex(sequence.length);
              }}
              onDragLeave={() =>
                setDragOverIndex((current) =>
                  current === sequence.length ? null : current,
                )
              }
              onDrop={handleDropAppend}
              className={`flex h-[46px] min-w-[72px] items-center justify-center rounded-md border border-dashed px-3 text-xs text-slate-500 transition-colors ${
                dragOverIndex === sequence.length
                  ? "border-slate-400 bg-slate-700/50 text-slate-300"
                  : "border-slate-700"
              }`}
            >
              Drop here
            </div>
          </div>
        )}
      </div>
    </section>
  );
}