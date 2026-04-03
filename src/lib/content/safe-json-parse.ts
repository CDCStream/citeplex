/**
 * Attempts to parse potentially malformed JSON from LLM responses.
 * Applies progressive repair strategies before falling back to null.
 */
export function safeJsonParse<T = unknown>(raw: string): T | null {
  // Strip markdown code fences
  let s = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // 1. Direct parse
  try {
    return JSON.parse(s) as T;
  } catch {
    // continue to repair
  }

  // 2. Remove trailing commas before ] or }
  s = s.replace(/,\s*([\]}])/g, "$1");

  try {
    return JSON.parse(s) as T;
  } catch {
    // continue
  }

  // 3. Fix truncated JSON — find the last complete object in an array
  const firstBrace = s.indexOf("{");
  if (firstBrace >= 0) {
    // Find the outermost opening brace
    let depth = 0;
    let lastValidEnd = -1;
    let inString = false;
    let escape = false;

    for (let i = firstBrace; i < s.length; i++) {
      const ch = s[i];

      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === "{" || ch === "[") depth++;
      if (ch === "}" || ch === "]") {
        depth--;
        if (depth === 0) {
          lastValidEnd = i;
          break;
        }
      }
    }

    if (lastValidEnd > 0) {
      const candidate = s.slice(firstBrace, lastValidEnd + 1);
      try {
        return JSON.parse(candidate) as T;
      } catch {
        // continue
      }
    }

    // 4. Try to close truncated structures
    let repaired = s.slice(firstBrace);

    // Remove the last incomplete object/value if it ends mid-string
    const lastCompleteObj = repaired.lastIndexOf("}");
    if (lastCompleteObj > 0) {
      repaired = repaired.slice(0, lastCompleteObj + 1);
    }

    // Remove trailing commas again
    repaired = repaired.replace(/,\s*$/g, "");

    // Count unclosed brackets and braces
    let braces = 0;
    let brackets = 0;
    inString = false;
    escape = false;
    for (const ch of repaired) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") braces++;
      if (ch === "}") braces--;
      if (ch === "[") brackets++;
      if (ch === "]") brackets--;
    }

    // Close any remaining open structures
    for (let i = 0; i < brackets; i++) repaired += "]";
    for (let i = 0; i < braces; i++) repaired += "}";

    // Remove trailing commas one more time
    repaired = repaired.replace(/,\s*([\]}])/g, "$1");

    try {
      return JSON.parse(repaired) as T;
    } catch {
      // continue
    }
  }

  // 5. Regex extraction — try to pull an array of objects
  const objects: Record<string, unknown>[] = [];
  const objRegex = /\{[^{}]*\}/g;
  let match;
  while ((match = objRegex.exec(s)) !== null) {
    try {
      objects.push(JSON.parse(match[0]));
    } catch {
      // skip malformed individual objects
    }
  }
  if (objects.length > 0) {
    return objects as unknown as T;
  }

  return null;
}
