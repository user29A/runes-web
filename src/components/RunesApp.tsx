"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(() => {
    if (!selectedRune) return;

    if (!audioRef.current) {
      const audio = new Audio(getRuneAudioPath(selectedRune.name));
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
    }

    audioRef.current.currentTime = 0;
    void audioRef.current.play().then(() => setIsPlaying(true));
  }, [selectedRune]);

  const selectRune = useCallback(
    async (rune: Rune) => {
      stopAudio();
      audioRef.current = null;
      setSelectedRune(rune);
      setLoadingText(true);

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
    [stopAudio],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-200">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <section>
          <h1 className="mb-4 text-2xl font-normal text-slate-100">Runes</h1>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 md:gap-3">
            {RUNES.map((rune) => {
              const isSelected = selectedRune?.name === rune.name;

              return (
                <button
                  key={rune.name}
                  type="button"
                  onClick={() => void selectRune(rune)}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center gap-1.5 rounded-md border p-2 transition-colors sm:p-2.5 ${
                    isSelected
                      ? "border-slate-400 bg-slate-700 ring-1 ring-slate-400"
                      : "border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-700"
                  }`}
                >
                  <img
                    src={getRuneImagePath(rune)}
                    alt=""
                    width={40}
                    height={40}
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

        <section className="min-h-[240px] flex-1">
          {!selectedRune ? (
            <div className="rounded-md border border-dashed border-slate-700 bg-slate-800/50 p-8 text-center">
              <p className="text-sm text-slate-400">
                Select a rune above to view its description and play its
                pronunciation.
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
                    disabled={isPlaying}
                    className="rounded-md border border-slate-600 bg-slate-700 px-4 py-1.5 text-sm text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Play
                  </button>
                  <button
                    type="button"
                    onClick={stopAudio}
                    disabled={!isPlaying}
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