/**
 * Text Utilities
 * Normalization, tokenization, and array helpers for text processing.
 */

/**
 * Normalize a string: lowercase, trim, remove extra spaces.
 */
export function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Normalize an array of skill strings.
 */
export function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  const tokens = skills
    .map((s) => normalizeText(String(s)))
    .filter((s) => s.length > 0);
  const seen = new Set();
  const deduped = [];
  for (const s of tokens) {
    if (!seen.has(s)) {
      seen.add(s);
      deduped.push(s);
    }
  }
  return deduped;
}

/**
 * Compute intersection of two arrays (case-insensitive, after normalization).
 */
export function getIntersection(arrA, arrB) {
  const setA = new Set(normalizeSkills(arrA));
  const setB = new Set(normalizeSkills(arrB));
  const intersection = [];
  for (const item of setA) {
    if (setB.has(item)) {
      intersection.push(item);
    }
  }
  return intersection;
}

/**
 * Compute difference: items in arrA but not in arrB.
 */
export function getDifference(arrA, arrB) {
  const setB = new Set(normalizeSkills(arrB));
  return normalizeSkills(arrA).filter((item) => !setB.has(item));
}

