import { readFileSync } from 'node:fs';

export type Snapshot = Record<string, Record<string, string>>;
export type StyleDifference = { path: string; property: string; before: string | null; after: string | null };

// Every element/property whose computed value differs, plus elements that exist on one side only.
export function diffSnapshots(before: Snapshot, after: Snapshot): StyleDifference[] {
  const differences: StyleDifference[] = [];
  for (const path of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const a = before[path];
    const b = after[path];
    if (!a || !b) {
      differences.push({ path, property: '(element)', before: a ? 'present' : null, after: b ? 'present' : null });
      continue;
    }
    for (const property of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[property] !== b[property]) {
        differences.push({ path, property, before: a[property] ?? null, after: b[property] ?? null });
      }
    }
  }
  return differences;
}

export function formatReport(differences: StyleDifference[]): string {
  return differences.map((d) => `${d.path} ${d.property}: ${d.before} -> ${d.after}`).join('\n');
}

// CLI: tsx scripts/theme/diff-computed-styles.ts <before.json> <after.json>; exit 1 on any difference.
export function run(beforeFile: string, afterFile: string): number {
  const differences = diffSnapshots(
    JSON.parse(readFileSync(beforeFile, 'utf8')) as Snapshot,
    JSON.parse(readFileSync(afterFile, 'utf8')) as Snapshot,
  );
  if (differences.length === 0) return 0;
  console.log(formatReport(differences));
  return 1;
}

if (process.argv[1]?.endsWith('diff-computed-styles.ts') && process.argv.length >= 4) {
  process.exit(run(process.argv[2]!, process.argv[3]!));
}
