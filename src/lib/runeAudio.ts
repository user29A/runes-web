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