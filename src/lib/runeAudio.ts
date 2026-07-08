import { getRuneAudioPath } from "@/lib/runes";

export function getRuneSequenceAudioPath(name: string): string {
  return `/runes/audio/${name}_only.mp3`;
}

const sequenceAudioAvailability = new Map<string, boolean>();

async function hasSequenceOnlyAudio(name: string): Promise<boolean> {
  if (sequenceAudioAvailability.has(name)) {
    return sequenceAudioAvailability.get(name)!;
  }

  const response = await fetch(getRuneSequenceAudioPath(name), { method: "HEAD" });
  const available = response.ok;
  sequenceAudioAvailability.set(name, available);
  return available;
}

export async function resolveSequenceAudioPath(name: string): Promise<string> {
  if (await hasSequenceOnlyAudio(name)) {
    return getRuneSequenceAudioPath(name);
  }

  return getRuneAudioPath(name);
}

export function playAudioClip(
  url: string,
  onEnded: () => void,
): HTMLAudioElement {
  const audio = new Audio(url);
  audio.onended = onEnded;
  audio.onerror = onEnded;
  void audio.play().catch(onEnded);
  return audio;
}

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

export function getSequenceFilename(runeNames: string[]): string {
  const base = runeNames
    .map((name) => name.replace(INVALID_FILENAME_CHARS, "_").trim())
    .filter(Boolean)
    .join("-");

  return `${base || "sequence"}.mp3`;
}

async function fetchAudioBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load audio from ${url}`);
  }

  return response.arrayBuffer();
}

export async function buildSequenceMp3Blob(runeNames: string[]): Promise<Blob> {
  const chunks: ArrayBuffer[] = [];

  for (const name of runeNames) {
    const url = await resolveSequenceAudioPath(name);
    chunks.push(await fetchAudioBuffer(url));
  }

  return new Blob(chunks, { type: "audio/mpeg" });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

type SaveFilePickerWindow = Window &
  typeof globalThis & {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  };

export async function saveSequenceMp3(runeNames: string[]): Promise<void> {
  if (runeNames.length === 0) {
    return;
  }

  const blob = await buildSequenceMp3Blob(runeNames);
  const suggestedName = getSequenceFilename(runeNames);
  const savePicker = (window as SaveFilePickerWindow).showSaveFilePicker;

  if (!savePicker) {
    downloadBlob(blob, suggestedName);
    return;
  }

  try {
    const handle = await savePicker({
      suggestedName,
      types: [
        {
          description: "MP3 Audio",
          accept: { "audio/mpeg": [".mp3"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    throw error;
  }
}