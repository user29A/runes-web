"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SequenceBuilder from "@/components/SequenceBuilder";
import { RUNE_DESCRIPTIONS } from "@/lib/runeDescriptions";
import { findMatchingRuneNames } from "@/lib/runeSearch";
import { setDragPayload, type SequenceItem } from "@/lib/sequenceDrag";
import {
  playAudioClip,
  resolveSequenceAudioPath,
  saveSequenceMp3,
} from "@/lib/runeAudio";
import { saveSequenceImage } from "@/lib/sequenceImage";
import {
  RUNES,
  type Rune,
  getRuneAudioPath,
  getRuneImagePath,
  getRuneTextPath,
} from "@/lib/runes";

export default function RunesApp() {
  const [selectedRune, setSelectedRune] = useState<Rune | null>(null);
  const [runeText, setRuneText] = useState("");
  const [loadingText, setLoadingText] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [isSavingSequence, setIsSavingSequence] = useState(false);
  const [isSavingCompositeImage, setIsSavingCompositeImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sequence, setSequence] = useState<SequenceItem[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceAudioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceAbortRef = useRef(false);
  const dragOccurredRef = useRef(false);

  const matchingRuneNames = useMemo(
    () => findMatchingRuneNames(searchQuery, RUNE_DESCRIPTIONS),
    [searchQuery],
  );

  const isSearchActive = searchQuery.trim().length > 0;
  const matchCount = matchingRuneNames.size;

  const isRuneEnabled = useCallback(
    (rune: Rune) => !isSearchActive || matchingRuneNames.has(rune.name),
    [isSearchActive, matchingRuneNames],
  );

  const stopAllAudio = useCallback(() => {
    sequenceAbortRef.current = true;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (sequenceAudioRef.current) {
      sequenceAudioRef.current.pause();
      sequenceAudioRef.current.currentTime = 0;
      sequenceAudioRef.current = null;
    }

    setIsPlaying(false);
    setIsPlayingSequence(false);
  }, []);

  const stopAudio = stopAllAudio;

  const playAudio = useCallback(() => {
    if (!selectedRune) return;

    stopAllAudio();
    sequenceAbortRef.current = false;

    const audio = new Audio(getRuneAudioPath(selectedRune.name));
    audio.onended = () => setIsPlaying(false);
    audioRef.current = audio;
    audio.currentTime = 0;
    void audio.play().then(() => setIsPlaying(true));
  }, [selectedRune, stopAllAudio]);

  const saveCompositeImage = useCallback(
    async (blob: Blob) => {
      if (sequence.length === 0 || isSavingCompositeImage) return;

      setIsSavingCompositeImage(true);

      try {
        const runeNames = sequence.map((item) => item.rune.name);
        await saveSequenceImage(runeNames, blob);
      } catch {
        window.alert("Unable to save the composite image. Please try again.");
      } finally {
        setIsSavingCompositeImage(false);
      }
    },
    [sequence, isSavingCompositeImage],
  );

  const saveSequence = useCallback(async () => {
    if (sequence.length === 0 || isSavingSequence) return;

    setIsSavingSequence(true);

    try {
      const runeNames = sequence.map((item) => item.rune.name);
      await saveSequenceMp3(runeNames);
    } catch {
      window.alert("Unable to save the sequence. Please try again.");
    } finally {
      setIsSavingSequence(false);
    }
  }, [sequence, isSavingSequence]);

  const playSequence = useCallback(async () => {
    if (sequence.length === 0) return;

    stopAllAudio();
    sequenceAbortRef.current = false;
    setIsPlayingSequence(true);

    for (const item of sequence) {
      if (sequenceAbortRef.current) break;

      const audioUrl = await resolveSequenceAudioPath(item.rune.name);

      await new Promise<void>((resolve) => {
        sequenceAudioRef.current = playAudioClip(audioUrl, resolve);
      });
    }

    sequenceAudioRef.current = null;
    setIsPlayingSequence(false);
  }, [sequence, stopAllAudio]);

  const selectRune = useCallback(
    async (rune: Rune) => {
      if (!isRuneEnabled(rune)) {
        return;
      }

      stopAllAudio();
      setSelectedRune(rune);
      setLoadingText(true);

      const cachedText = RUNE_DESCRIPTIONS[rune.name];
      if (cachedText) {
        setRuneText(cachedText);
        setLoadingText(false);
        return;
      }

      try {
        const response = await fetch(getRuneTextPath(rune.name));
        if (!response.ok) {
          throw new Error("Failed to load rune text");
        }
        setRuneText(await response.text());
      } catch {
        setRuneText("Unable to load rune description.");
      } finally {
        setLoadingText(false);
      }
    },
    [isRuneEnabled, stopAllAudio],
  );

  useEffect(() => {
    return () => {
      sequenceAbortRef.current = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (sequenceAudioRef.current) {
        sequenceAudioRef.current.pause();
        sequenceAudioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-200">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-2xl font-normal text-slate-100">Runes</h1>
            <div className="flex w-full flex-col gap-2 sm:max-w-sm">
              <label htmlFor="rune-search" className="text-sm text-slate-400">
                Search by concept
              </label>
              <div className="flex gap-2">
                <input
                  id="rune-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="e.g. wealth, protection, intelligence"
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
                />
                {isSearchActive && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="shrink-0 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 transition-colors hover:bg-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              {isSearchActive && (
                <p className="text-xs text-slate-400">
                  {matchCount === 0
                    ? "No runes match this search."
                    : `${matchCount} rune${matchCount === 1 ? "" : "s"} match this search.`}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 md:gap-3">
            {RUNES.map((rune) => {
              const isSelected = selectedRune?.name === rune.name;
              const isMatch = matchingRuneNames.has(rune.name);
              const isDisabled = isSearchActive && !isMatch;

              return (
                <button
                  key={rune.name}
                  type="button"
                  draggable={!isDisabled}
                  onDragStart={(event) => {
                    if (isDisabled) return;
                    dragOccurredRef.current = true;
                    setDragPayload(event, { source: "grid", name: rune.name });
                  }}
                  onDragEnd={() => {
                    window.setTimeout(() => {
                      dragOccurredRef.current = false;
                    }, 0);
                  }}
                  onClick={() => {
                    if (dragOccurredRef.current) return;
                    void selectRune(rune);
                  }}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  aria-disabled={isDisabled}
                  className={`flex flex-col items-center gap-1.5 rounded-md border p-2 transition-colors sm:p-2.5 ${
                    isDisabled
                      ? "cursor-not-allowed border-slate-800 bg-slate-900/60 opacity-35"
                      : isSelected
                        ? "border-slate-400 bg-slate-700 ring-1 ring-slate-400"
                        : isSearchActive && isMatch
                          ? "border-slate-500 bg-slate-800 ring-1 ring-slate-500/60 hover:bg-slate-700"
                          : "border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-700"
                  } ${!isDisabled ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <img
                    src={getRuneImagePath(rune)}
                    alt=""
                    width={40}
                    height={40}
                    draggable={false}
                    className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                  />
                  <span className="text-xs text-slate-300 sm:text-sm">
                    {rune.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <SequenceBuilder
          sequence={sequence}
          onSequenceChange={setSequence}
          isRuneEnabled={isRuneEnabled}
          isPlayingSequence={isPlayingSequence}
          isSavingSequence={isSavingSequence}
          isSavingCompositeImage={isSavingCompositeImage}
          onPlaySequence={() => void playSequence()}
          onStopSequence={stopAllAudio}
          onSaveSequence={() => void saveSequence()}
          onSaveCompositeImage={(blob) => void saveCompositeImage(blob)}
        />

        <section className="min-h-[240px] flex-1">
          {!selectedRune ? (
            <div className="rounded-md border border-dashed border-slate-700 bg-slate-800/50 p-8 text-center">
              <p className="text-sm text-slate-400">
                {isSearchActive && matchCount === 0
                  ? "Try a different concept, or clear the search to browse all runes."
                  : "Select a rune above to view its description and play its pronunciation."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-slate-700 bg-slate-800 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-slate-700 pb-4">
                <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-sm border border-slate-600 bg-slate-900">
                  <img
                    src={getRuneImagePath(selectedRune)}
                    alt={selectedRune.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <h2 className="text-2xl font-normal text-slate-100">
                  {selectedRune.name}
                </h2>
                <div className="flex gap-2 sm:ml-auto">
                  <button
                    type="button"
                    onClick={playAudio}
                    disabled={isPlaying || isPlayingSequence}
                    className="rounded-md border border-slate-600 bg-slate-700 px-4 py-1.5 text-sm text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    onClick={stopAudio}
                    disabled={!isPlaying && !isPlayingSequence}
                    className="rounded-md border border-slate-600 bg-slate-700 px-4 py-1.5 text-sm text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Stop
                  </button>
                </div>
              </div>

              {loadingText ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300 md:text-base">
                  {runeText}
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}