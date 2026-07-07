const SYNONYMS: Record<string, string[]> = {
  intelligence: ["intellect", "knowledge", "logic", "wisdom", "mind", "memory"],
  intellect: ["intelligence", "knowledge", "logic", "wisdom", "mind", "memory"],
  knowledge: ["intellect", "intelligence", "logic", "wisdom", "learning"],
  wisdom: ["knowledge", "intellect", "intelligence", "odin"],
  logic: ["intellect", "intelligence", "knowledge", "mind"],
  mind: ["intellect", "intelligence", "knowledge", "logic", "memory"],
  memory: ["intellect", "intelligence", "knowledge", "mind"],
  wealth: ["money", "possessions", "property", "riches", "prosperity", "honors"],
  money: ["wealth", "possessions", "property", "riches", "prosperity"],
  property: ["wealth", "possessions", "money", "riches"],
  possessions: ["wealth", "property", "money", "riches"],
  prosperity: ["wealth", "money", "riches", "growth"],
  protection: ["protect", "protected", "shield", "shielding", "guard", "defend"],
  protect: ["protection", "shield", "shielding", "guard", "defend"],
  shield: ["protection", "shielding", "guard", "defend"],
  guard: ["protection", "shield", "defend"],
  defend: ["protection", "shield", "guard"],
  banish: ["banishing", "protection", "negative"],
  courage: ["bold", "boldness", "bravery", "brave", "fearless"],
  brave: ["courage", "bold", "boldness", "bravery"],
  bold: ["courage", "bravery", "boldness", "brave"],
  strength: ["power", "endurance", "athleticism", "spirit", "will", "strong"],
  power: ["strength", "energy", "potency", "empower"],
  will: ["strength", "confidence", "determination", "spirit"],
  confidence: ["will", "strength", "spirit", "leadership"],
  leadership: ["leader", "inspire", "inspires", "confidence"],
  fear: ["coward", "cowardly", "cowardliness", "afraid"],
  love: ["friendship", "loyalty", "partnership", "relationship"],
  friendship: ["love", "loyalty", "partnership"],
  loyalty: ["love", "friendship", "partnership"],
  fertility: ["fertile", "growth", "grow", "sexual", "potency"],
  growth: ["grow", "fertility", "expansion", "increase"],
  travel: ["wander", "mobility", "journey", "movement"],
  journey: ["travel", "wander", "mobility", "movement"],
  sun: ["solar", "light", "sowilo"],
  light: ["sun", "solar", "illumination"],
  death: ["dying", "passing", "resurrection", "afterlife"],
  resurrection: ["death", "life", "rebirth"],
  healing: ["heal", "health", "harmony", "restoration"],
  health: ["healing", "harmony", "vitality"],
  harmony: ["healing", "health", "balance"],
  justice: ["law", "legal", "truth", "fairness"],
  truth: ["justice", "honesty", "clarity"],
  communication: ["speech", "language", "breath", "speaking"],
  speech: ["communication", "language", "breath"],
  language: ["communication", "speech", "writing"],
  binding: ["bind", "binds", "bound", "restrict"],
  destruction: ["destroy", "destroying", "threatening", "ruin"],
  destroy: ["destruction", "destroying", "ruin"],
  sex: ["sexual", "sexuality", "potency", "phallus", "fertility"],
  sexual: ["sex", "sexuality", "potency", "phallus"],
  luck: ["fortune", "fate", "chance"],
  fate: ["luck", "fortune", "destiny"],
  magic: ["magick", "ritual", "rituals", "spell"],
  magick: ["magic", "ritual", "rituals", "spell"],
  ritual: ["magic", "magick", "rituals", "ceremony"],
  enemy: ["enemies", "foe", "adversary"],
  victory: ["triumph", "success", "win", "invincibility"],
  triumph: ["victory", "success", "invincibility"],
  action: ["movement", "activity", "mobility", "motion"],
  meditation: ["meditate", "contemplation", "focus"],
  chakras: ["chakra", "kundalini", "energy"],
  energy: ["power", "forces", "potency", "chakras"],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expandSearchTerm(term: string): string[] {
  const normalized = term.toLowerCase().trim();
  if (!normalized) return [];

  const related = SYNONYMS[normalized] ?? [];
  return Array.from(new Set([normalized, ...related]));
}

export function parseSearchQuery(query: string): string[][] {
  return query
    .split(/[\s,]+/)
    .map((term) => expandSearchTerm(term))
    .filter((group) => group.length > 0);
}

function termGroupMatches(description: string, group: string[]): boolean {
  const haystack = description.toLowerCase();
  return group.some((term) => {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i");
    return pattern.test(haystack);
  });
}

export function findMatchingRuneNames(
  query: string,
  descriptions: Record<string, string>,
): Set<string> {
  const termGroups = parseSearchQuery(query);
  if (termGroups.length === 0) {
    return new Set(Object.keys(descriptions));
  }

  const matches = new Set<string>();

  for (const [name, description] of Object.entries(descriptions)) {
    const isMatch = termGroups.every((group) =>
      termGroupMatches(description, group),
    );
    if (isMatch) {
      matches.add(name);
    }
  }

  return matches;
}