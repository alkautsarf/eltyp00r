const COMMON = [
  "the", "and", "that", "have", "for", "not", "with", "you", "this", "but",
  "his", "from", "they", "been", "one", "had", "her", "all", "she", "there",
  "would", "their", "will", "each", "about", "how", "when", "which", "more",
  "make", "like", "time", "very", "your", "just", "know", "take", "come",
  "could", "good", "him", "into", "over", "such", "after", "year", "also",
  "back", "some", "them", "than", "then", "now", "look", "only", "way",
  "find", "here", "thing", "many", "well", "down", "should", "still", "hand",
  "high", "life", "keep", "work", "long", "day", "much", "great", "old",
  "tell", "does", "set", "want", "point", "part", "most", "home", "show",
  "place", "world", "where", "really", "case", "turn", "right", "house",
  "let", "same", "both", "run", "under", "last", "side", "put", "own",
  "never", "use", "off", "new", "two", "three", "say", "got", "too",
  "end", "water", "help", "made", "may", "going", "need", "city", "small",
  "few", "might", "call", "get", "line", "close", "open", "seem", "left",
  "live", "real", "best", "name", "play", "sure", "read", "head", "face",
  "girl", "plan", "kind", "five", "once", "done", "gave", "else", "stop",
  "move", "give", "went", "mean", "door", "must", "told", "next", "miss",
  "fire", "boy", "land", "mind", "hard", "true", "full", "team", "food",
  "feel", "far", "seen", "room", "love", "talk", "hear", "care", "dark",
  "pick", "rest", "grow", "word", "test", "eye", "less", "air", "war",
  "half", "near", "late", "able", "note", "mark", "south", "west", "east",
  "draw", "warm", "sign", "age", "paid", "view", "bill", "lost", "save",
  "free", "fact", "list", "sort", "meet", "fast", "sent", "wait", "deal",
  "rise", "hold", "step", "cold", "deep", "fall", "clear", "lead", "rule",
  "pass", "cost", "risk", "drive", "act", "hit", "tree", "wall", "song",
  "road", "cup", "bed", "sun", "sit", "sea", "red", "bit", "try", "car",
  "dog", "cat", "ten", "ask", "job", "add", "six", "top", "cut", "hot",
  "key", "law", "oil", "big", "nor", "pay", "per", "ran", "arm", "eat",
  "fit", "fly", "lay", "lot", "low", "map", "net", "raw", "row", "sat",
  "win", "bar", "box", "dry", "fix", "fun", "gap", "gun", "hat", "mix",
];

const MEDIUM = [
  "standing", "managed", "following", "reason", "consider", "account",
  "question", "morning", "surface", "together", "several", "already",
  "moment", "reached", "believe", "product", "brought", "picture",
  "student", "million", "country", "number", "family", "process",
  "system", "program", "father", "mother", "market", "second",
  "church", "office", "single", "during", "member", "behind",
  "simple", "within", "center", "around", "happen", "common",
  "enough", "street", "garden", "window", "return", "letter",
  "figure", "ground", "nature", "report", "action", "toward",
  "public", "school", "power", "early", "night", "light",
  "young", "story", "charm", "paper", "group", "music",
  "party", "front", "woman", "money", "child", "occur",
  "order", "level", "table", "board", "human", "month",
  "class", "learn", "honor", "build", "field", "watch",
  "think", "begin", "white", "write", "black", "stand",
  "start", "large", "green", "brown", "river", "horse",
  "enter", "serve", "dress", "spoke", "break", "cause",
  "court", "force", "plant", "cover", "space", "price",
  "color", "piece", "ready", "happy", "final", "known",
  "above", "study", "shown", "carry", "floor", "until",
  "whole", "bring", "check", "blood", "visit", "leave",
  "share", "moved", "train", "clean", "total", "allow",
  "cross", "sound", "prove", "touch", "image", "plain",
  "spend", "store", "range", "stage", "match", "shape",
  "offer", "basic", "wrong", "teach", "heavy", "broad",
  "equal", "stick", "guide", "labor", "block", "sweet",
  "fresh", "tired", "truck", "beach", "solid", "fight",
  "metal", "sleep", "quiet", "quick", "cloud", "frame",
  "worth", "raise", "crowd", "march", "grace", "faith",
  "judge", "youth", "apply", "claim", "minor", "score",
  "sharp", "avoid", "angry", "birth", "treat", "spare",
  "trust", "shirt", "strip", "craft", "waste", "grant",
  "brush", "knock", "shift", "sweep", "count", "print",
  "magic", "steel", "pride", "tower", "ghost", "union",
];

const CHALLENGING = [
  "strength", "through", "quarter", "withdraw", "thought", "beautiful",
  "knowledge", "different", "government", "important", "remember",
  "headline", "something", "magnetic", "children", "business",
  "national", "possible", "happened", "industry", "probably",
  "congress", "interest", "position", "although", "computer",
  "standard", "security", "hospital", "material", "shoulder",
  "physical", "practice", "economic", "complete", "continue",
  "building", "increase", "decision", "powerful", "exchange",
  "pressure", "daughter", "cultural", "straight", "personal",
  "discover", "thousand", "previous", "argument", "movement",
  "evidence", "actually", "majority", "struggle", "southern",
  "relative", "customer", "violence", "campaign", "research",
  "purchase", "identify", "analysis", "strategy", "election",
  "district", "language", "whatever", "response", "official",
  "religion", "external", "criminal", "audience", "progress",
  "terrible", "property", "chairman", "surprise", "conflict",
  "training", "document", "magazine", "military", "transfer",
  "approach", "opposite", "familiar", "treasure", "presence",
  "maintain", "numerous", "pleasant", "entirely", "overcome",
  "pleasure", "separate", "unlikely", "creative", "neighbor",
  "educated", "elephant", "literary", "absolute", "dialogue",
  "generate", "frequent", "enormous", "equality", "fragment",
  "internal", "judgement", "organize", "quantity", "relation",
  "behavior", "dynamite", "umbrella", "accident", "platform",
  "schedule", "balanced", "champion", "describe", "critical",
  "evaluate", "generous", "homepage", "imperial", "keyboard",
];

const ALL_WORDS = [...COMMON, ...MEDIUM, ...CHALLENGING];

// Score a word by how many weak-key characters it contains.
// Higher score = more valuable for practice.
function scoreWord(word: string, weaknessMap: Map<string, number>): number {
  let score = 1; // baseline so every word has some chance
  for (const ch of word.toLowerCase()) {
    const weakness = weaknessMap.get(ch);
    if (weakness) score += weakness;
  }
  return score;
}

// Weighted random pick from an array of [item, weight] pairs
function weightedPick(items: { word: string; weight: number }[]): string {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.word;
  }
  return items[items.length - 1].word;
}

export interface KeyWeakness {
  key: string;
  accuracy: number;
  total: number;
}

// Build a weakness map: keys with <95% accuracy get a weight inversely proportional to accuracy.
// Keys with very few samples (< 5) are ignored to avoid noise.
function buildWeaknessMap(keyAccuracies: KeyWeakness[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const ka of keyAccuracies) {
    if (ka.total < 5) continue;
    if (ka.accuracy < 95) {
      // Lower accuracy = higher weakness weight
      // 50% accuracy → weight 5, 80% → weight 2, 94% → weight 0.6
      map.set(ka.key, Math.max(0.5, (100 - ka.accuracy) / 10));
    }
  }
  return map;
}

export function generateRoundText(targetChars: number = 120, keyAccuracies?: KeyWeakness[]): string {
  const weaknessMap = keyAccuracies ? buildWeaknessMap(keyAccuracies) : new Map();
  const hasWeakKeys = weaknessMap.size > 0;

  // Pre-score all words if we have weakness data
  const scored = ALL_WORDS.map((word) => ({
    word,
    weight: hasWeakKeys ? scoreWord(word, weaknessMap) : 1,
  }));

  const words: string[] = [];
  let length = 0;

  while (length < targetChars) {
    const word = hasWeakKeys ? weightedPick(scored) : ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];
    words.push(word);
    length += word.length + 1;
  }

  return words.join(" ");
}

export function generateWarmupText(targetChars: number, keyAccuracies: KeyWeakness[]): string {
  const qualified = keyAccuracies
    .filter((ka) => ka.total >= 5)
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakestKeys = new Set(qualified.slice(0, 5).map((ka) => ka.key));

  if (weakestKeys.size === 0) {
    return generateRoundText(targetChars);
  }

  const candidates = ALL_WORDS.filter((word) =>
    word.split("").some((ch) => weakestKeys.has(ch.toLowerCase()))
  );

  if (candidates.length < 10) {
    return generateRoundText(targetChars, keyAccuracies);
  }

  const weaknessMap = new Map<string, number>();
  for (const ka of qualified.slice(0, 5)) {
    weaknessMap.set(ka.key, Math.max(0.5, (100 - ka.accuracy) / 10));
  }

  const scored = candidates.map((word) => ({
    word,
    weight: scoreWord(word, weaknessMap),
  }));

  const words: string[] = [];
  let length = 0;
  while (length < targetChars) {
    const word = weightedPick(scored);
    words.push(word);
    length += word.length + 1;
  }

  return words.join(" ");
}

export function splitIntoLines(text: string, maxWidth: number = 55): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxWidth) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return lines;
}
