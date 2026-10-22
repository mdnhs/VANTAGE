import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { diffSnapshots, formatReport, run, type Snapshot } from './diff-computed-styles';

const base: Snapshot = {
  'body/div[0]': { color: 'rgb(0, 0, 0)', 'background-color': 'rgb(220, 38, 38)' },
  'body/div[0]/p[0]': { color: 'rgb(255, 255, 255)', 'background-color': 'rgba(0, 0, 0, 0)' },
};

function files(a: Snapshot, b: Snapshot) {
  const dir = mkdtempSync(join(tmpdir(), 'diff-'));
  writeFileSync(join(dir, 'a.json'), JSON.stringify(a));
  writeFileSync(join(dir, 'b.json'), JSON.stringify(b));
  return [join(dir, 'a.json'), join(dir, 'b.json')] as const;
}

describe('diff-computed-styles', () => {
  it('identical snapshots exit 0 with an empty report', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(run(...files(base, structuredClone(base)))).toBe(0);
    expect(log).not.toHaveBeenCalled();
    expect(formatReport(diffSnapshots(base, base))).toBe('');
    log.mockRestore();
  });

  it('a changed background-color exits 1 and names the path and both values', () => {
    const changed = structuredClone(base);
    changed['body/div[0]']!['background-color'] = 'rgb(37, 99, 235)';
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(run(...files(base, changed))).toBe(1);
    const report = String(log.mock.calls[0]![0]);
    expect(report).toContain('body/div[0]');
    expect(report).toContain('rgb(220, 38, 38)');
    expect(report).toContain('rgb(37, 99, 235)');
    log.mockRestore();
  });

  it('reports an element present on one side only', () => {
    const fewer = structuredClone(base);
    delete fewer['body/div[0]/p[0]'];
    expect(diffSnapshots(base, fewer)).toEqual([
      { path: 'body/div[0]/p[0]', property: '(element)', before: 'present', after: null },
    ]);
  });
});
