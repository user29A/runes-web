export type Rune = {
  name: string;
  imageFile: string;
};

export const RUNES: Rune[] = [
  { name: "Fe", imageFile: "fe.jpg" },
  { name: "Uraz", imageFile: "Uraz.jpg" },
  { name: "Thyth", imageFile: "Thyth.jpg" },
  { name: "Aza", imageFile: "Aza.jpg" },
  { name: "Reda", imageFile: "Reda.jpg" },
  { name: "Chozma", imageFile: "Chozma.jpg" },
  { name: "Geuua", imageFile: "Geuua.jpg" },
  { name: "Uuinne", imageFile: "Uuinne.jpg" },
  { name: "Haal", imageFile: "Haal.jpg" },
  { name: "Noicz", imageFile: "Noicz.jpg" },
  { name: "Icz", imageFile: "Icz.jpg" },
  { name: "Gaar", imageFile: "Gaar.jpg" },
  { name: "Ezck", imageFile: "Ezck.jpg" },
  { name: "Pertra", imageFile: "Pertra.jpg" },
  { name: "Algis", imageFile: "Algis.jpg" },
  { name: "Sugil", imageFile: "Sugil.jpg" },
  { name: "Tys", imageFile: "Tys.jpg" },
  { name: "Bercna", imageFile: "Bercna.jpg" },
  { name: "Eys", imageFile: "Eys.jpg" },
  { name: "Manna", imageFile: "Manna.jpg" },
  { name: "Laaz", imageFile: "Laaz.jpg" },
  { name: "Enguz", imageFile: "Enguz.jpg" },
  { name: "Daaz", imageFile: "Daaz.jpg" },
  { name: "Utal", imageFile: "Utal.jpg" },
];

export function getRuneImagePath(rune: Rune): string {
  return `/runes/images/${rune.imageFile}`;
}

export function getRuneTextPath(name: string): string {
  return `/runes/text/${name}.txt`;
}

export function getRuneAudioPath(name: string): string {
  return `/runes/audio/${name}.mp3`;
}