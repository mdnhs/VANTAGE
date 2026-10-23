import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(path.join(__dirname, 'admin.css'), 'utf8');
// Tailwind roots at globals.css: theme variables and utilities must be declared there.
const globals = readFileSync(path.join(__dirname, '../../../globals.css'), 'utf8');

const SCOPE = ':root:has([data-admin-root])';

const TOKENS = [
  '--primary',
  '--primary-foreground',
  '--accent',
  '--accent-foreground',
  '--ring',
  '--background',
  '--foreground',
  '--card',
  '--popover',
  '--secondary',
  '--muted',
  '--muted-foreground',
  '--border',
  '--input',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-accent',
  '--sidebar-border',
  '--chart-1',
  '--chart-5',
  '--success',
  '--success-soft',
  '--warning',
  '--warning-soft',
  '--danger',
  '--danger-soft',
  '--skeleton',
  '--hatch',
  '--hero-from',
  '--hero-to',
  '--promo-from',
  '--promo-to',
];

/** Top-level `{ ... }` blocks as [selector, body] pairs (ignores @theme/@utility/@layer/@media). */
function ruleBlocks(source: string) {
  const blocks: Array<[string, string]> = [];
  const re = /(^|\n)([^@\n{}][^{}]*)\{([^{}]*)\}/g;
  for (const m of source.replace(/\/\*[^]*?\*\//g, '').matchAll(re)) blocks.push([m[2].trim(), m[3]]);
  return blocks;
}

describe('admin.css', () => {
  it('defines the type scale and card radius as @theme tokens', () => {
    for (const t of ['--text-title', '--text-card-title', '--text-kpi']) expect(globals).toContain(`${t}:`);
    expect(globals).toMatch(/--radius-card:\s*1\.375rem/);
  });

  it('maps the status colours and skeleton into the Tailwind palette', () => {
    for (const c of ['success', 'success-soft', 'warning', 'warning-soft', 'danger', 'danger-soft', 'skeleton']) {
      expect(globals).toContain(`--color-${c}: var(--${c})`);
    }
  });

  it('declares the bg-hero, bg-promo and bg-hatch utilities', () => {
    for (const u of ['bg-hero', 'bg-promo', 'bg-hatch']) expect(globals).toContain(`@utility ${u}`);
  });

  it('defines every colour token in a light and a dark block', () => {
    const light = css.match(new RegExp(`${escape(SCOPE)}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    const dark = css.match(new RegExp(`${escape(SCOPE)}\\.dark\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    for (const t of TOKENS) expect(light, `light ${t}`).toContain(`${t}:`);
    for (const t of ['--primary', '--primary-foreground', '--accent', '--ring', '--background', '--card', '--hatch']) {
      expect(dark, `dark ${t}`).toContain(`${t}:`);
    }
  });

  it('uses the VANTAGE brand red, not the MK green', () => {
    expect(css).toMatch(/--primary:\s*#dc2626/);
    expect(css).toMatch(/--primary:\s*#f05252/);
    expect(css).toMatch(/--ring:\s*#ef4444/);
    expect(css).toMatch(/--hero-from:\s*#3a0d0d/);
    expect(css).toMatch(/--promo-from:\s*#120707/);
    expect(css).not.toMatch(/#157d38/i);
  });

  it('scopes every token block under the admin marker', () => {
    const blocks = ruleBlocks(css).filter(([, body]) => /--(primary|background|sidebar):/.test(body));
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    for (const [selector] of blocks) expect(selector.startsWith(SCOPE)).toBe(true);
    expect(css).not.toContain('data-theme="admin"');
  });

  it('does not restyle the public site (no unscoped * or body rules)', () => {
    expect(css).not.toMatch(/^\s*body\s*\{/m);
    expect(css).not.toMatch(/@layer base\s*\{[^]*?\n\s*\*\s*\{/);
  });
});

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
