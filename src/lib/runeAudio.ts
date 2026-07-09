import { getSequenceFilename, saveBlobWithPicker } from "@/lib/fileSave";
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

export async function saveSequenceMp3(runeNames: string[]): Promise<void> {
  if (runeNames.length === 0) {
    return;
  }

  const blob = await buildSequenceMp3Blob(runeNames);
  await saveBlobWithPicker(blob, getSequenceFilename(runeNames, ".mp3"), {
    description: "MP3 Audio",
    mimeType: "audio/mpeg",
    extension: ".mp3",
  });
}