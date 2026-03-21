/** Only pass ISO-like dates to Next metadata / OG (invalid strings can break metadata). */
export function safeOgDate(iso: string | null | undefined): string | undefined {
  if (!iso || typeof iso !== "string") return undefined;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return undefined;
  return new Date(t).toISOString();
}
