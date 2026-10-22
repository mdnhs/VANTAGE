import type { CheckId } from './checks';

export type SeoIssue = {
  kind: 'page' | 'media';
  id: string;
  title: string;
  path: string | null;
  check: CheckId;
  message: string;
  fixHref: string;
};

export type SeoHealth = {
  score: number;
  passed: number;
  total: number;
  entities: number;
  issues: SeoIssue[];
  alt: { images: number; described: number; decorative: number; missing: number };
};
