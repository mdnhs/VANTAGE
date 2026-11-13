import { describe, expect, it } from 'vitest';

import { permissionFor } from '@/lib/admin/route-permissions';
import { ROLE_NAMES } from '@/lib/auth/permissions';

import {
  articleLinks,
  canFollow,
  groupedArticles,
  HELP_ARTICLES,
  HELP_GROUPS,
  headingId,
  helpArticle,
  neighbours,
  tocFor,
  visibleArticles,
} from './registry';

describe('help registry', () => {
  it('gives every article a unique slug and a known group', () => {
    const slugs = HELP_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const groups = new Set(HELP_GROUPS.map((g) => g.id));
    for (const article of HELP_ARTICLES) expect(groups.has(article.group)).toBe(true);
  });

  it('has articles in every group and a getting-started guide everyone can read', () => {
    for (const group of HELP_GROUPS) expect(HELP_ARTICLES.some((a) => a.group === group.id)).toBe(true);
    expect(helpArticle('getting-started')?.permission).toBeUndefined();
  });

  it('gives each section heading a unique anchor within its article', () => {
    for (const article of HELP_ARTICLES) {
      const ids = tocFor(article).map((e) => e.id);
      expect(new Set(ids).size, article.slug).toBe(ids.length);
      expect(ids.every(Boolean), article.slug).toBe(true);
    }
  });

  it('only links to real admin screens and help articles', () => {
    for (const article of HELP_ARTICLES) {
      for (const href of articleLinks(article)) {
        // The owner opens every screen, so anything they cannot follow is a broken link.
        expect(canFollow(['owner'], href), `${article.slug} -> ${href}`).toBe(true);
        expect(() => permissionFor(href), href).not.toThrow();
      }
    }
  });

  it('hides articles about screens a role cannot open', () => {
    const viewer = visibleArticles(['viewer']).map((a) => a.slug);
    expect(viewer).toContain('getting-started');
    expect(viewer).not.toContain('people');
    expect(visibleArticles(['owner'])).toHaveLength(HELP_ARTICLES.length);
    for (const role of ROLE_NAMES) {
      expect(groupedArticles([role]).every((g) => g.articles.length > 0)).toBe(true);
    }
  });

  it('pages through articles in sidebar order', () => {
    const [first, second] = HELP_ARTICLES;
    expect(neighbours(['owner'], first!.slug)).toEqual({ prev: undefined, next: second });
    expect(neighbours(['owner'], 'missing')).toEqual({ prev: undefined, next: undefined });
  });

  it('turns headings into anchors', () => {
    expect(headingId('Menus, footer & forms')).toBe('menus-footer-and-forms');
  });
});
