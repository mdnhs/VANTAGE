import 'server-only';

import { siteNameFrom } from '@/lib/content/site-name';
import type { SupportKnowledgeStatusDto } from '@/lib/support/types';
import type { Actor } from '@/server/lib/auth/actor';
import { ApiError } from '@/server/lib/errors';
import { KNOWLEDGE_MAX } from '@/server/lib/support/bot-knowledge';
import { pageText } from '@/server/lib/support/knowledge-text';
import { homepageProcessStepRepository } from '@/server/repositories/homepage-process-step-repository';
import { projectRepository } from '@/server/repositories/project-repository';
import { serviceRepository } from '@/server/repositories/service-repository';
import {
  supportKnowledgeRepository,
  type KnowledgeChunk,
  type KnowledgeRow,
} from '@/server/repositories/support-knowledge-repository';
import { testimonialRepository } from '@/server/repositories/testimonial-repository';
import { oneLine } from '@/server/services/ai/prompt';
import { runAfterResponse } from '@/server/services/enquiry-notify';
import { readEffectiveGlobal } from '@/server/services/globals-service';

const PAGE_KEYS = [
  'page.home',
  'page.services',
  'page.our-work',
  'page.about',
  'page.process',
  'page.contact',
  'page.get-a-quote',
] as const;
const RELEVANT_LIMIT = 6;
const MAX_PROJECTS = 40;
const MAX_REVIEWS = 20;

type Step = { label: string; run: () => Promise<KnowledgeChunk[]> };

const price = (n: number | null) => (n != null ? ` (from €${n})` : '');

// One entry per source. Adding a new kind of website content to the AI's memory is one more step here.
const STEPS: Step[] = [
  {
    label: 'Business details and opening hours',
    async run() {
      const [site, contact] = await Promise.all([
        readEffectiveGlobal('site').then((s) => s.value),
        readEffectiveGlobal('contact').then((s) => s.value),
      ]);
      const address = [...contact.address.lines, contact.address.city, contact.address.eircode, contact.address.country]
        .filter(Boolean)
        .join(', ');
      const line = (label: string, v: string) => (oneLine(v, 300) ? `${label}: ${oneLine(v, 300)}` : null);
      const body = [
        line('Business', siteNameFrom(site.name)),
        line('Phone', contact.phone.display),
        line('Emergency phone', contact.emergencyPhone),
        line('Email', contact.email),
        line('WhatsApp', contact.whatsapp),
        line('Address', address),
        line('Opening hours', contact.hours.summary),
      ]
        .filter((l): l is string => l !== null)
        .join('\n');
      return [
        { source: 'business', sourceKey: 'main', title: 'Business, contact and opening hours', body, core: true },
      ];
    },
  },
  {
    label: 'Services and prices',
    async run() {
      const services = await serviceRepository.listPublished();
      return services.map((s) => ({
        source: 'service',
        sourceKey: s.id,
        title: s.name,
        body: [
          `${oneLine(s.name, 120)}${price(s.startingPrice)}: ${oneLine(s.description, 800)}`,
          s.checklist.length ? `Includes: ${s.checklist.map((c) => oneLine(c, 100)).join('; ')}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      }));
    },
  },
  {
    label: 'How we work (process steps)',
    async run() {
      const steps = await homepageProcessStepRepository.listEnabled();
      if (!steps.length) return [];
      const body = steps.map((s, i) => `${i + 1}. ${oneLine(s.title, 120)}: ${oneLine(s.description, 400)}`).join('\n');
      return [{ source: 'process', sourceKey: 'steps', title: 'Our repair process, step by step', body }];
    },
  },
  {
    label: 'Our work (published projects)',
    async run() {
      const projects = await projectRepository.listPublished({ limit: MAX_PROJECTS });
      return projects.map((p) => ({
        source: 'project',
        sourceKey: p.id,
        title: `${oneLine(p.title, 120)} (${oneLine(p.vehicleModel, 80)})`,
        body: `${oneLine(p.title, 160)}. Vehicle: ${oneLine(p.vehicleModel, 80)}. Service: ${oneLine(p.serviceCategory, 80)}. ${oneLine(p.description, 800)}`,
      }));
    },
  },
  {
    label: 'Customer reviews',
    async run() {
      const reviews = await testimonialRepository.listPublished({ limit: MAX_REVIEWS });
      return reviews.map((r) => ({
        source: 'review',
        sourceKey: r.id,
        title: `Review by ${oneLine(r.customerName, 60)}`,
        body: `${oneLine(r.customerName, 60)}: "${oneLine(r.reviewText, 400)}"`,
      }));
    },
  },
  {
    label: 'Website pages (about, insurance, FAQ and more)',
    async run() {
      const chunks: KnowledgeChunk[] = [];
      for (const key of PAGE_KEYS) {
        const { value } = await readEffectiveGlobal(key);
        const body = pageText(value);
        if (body) chunks.push({ source: 'page', sourceKey: key, title: `Website page: ${key.slice(5)}`, body });
      }
      return chunks;
    },
  },
];

export const SYNC_STEP_COUNT = STEPS.length;

async function runSync(startedAt: Date) {
  let chunks = 0;
  try {
    for (const [i, step] of STEPS.entries()) {
      await supportKnowledgeRepository.progress({ step: step.label, done: i });
      const found = await step.run();
      await supportKnowledgeRepository.upsert(found, startedAt);
      chunks += found.length;
      await supportKnowledgeRepository.progress({ done: i + 1, chunks });
    }
    await supportKnowledgeRepository.progress({ step: 'Removing content that is no longer on the site' });
    await supportKnowledgeRepository.deleteOlderThan(startedAt);
    await supportKnowledgeRepository.finish({ ok: true, chunks: await supportKnowledgeRepository.count() });
  } catch (error) {
    console.error('[support] knowledge sync failed', error instanceof Error ? error.name : 'error');
    await supportKnowledgeRepository.finish({ ok: false, error: 'The sync stopped before it finished. Try again.' });
  }
}

function render(rows: KnowledgeRow[]): string {
  return rows.map((r) => `- ${r.title}\n${r.body}`).join('\n\n');
}

export const supportKnowledgeService = {
  async status(): Promise<SupportKnowledgeStatusDto> {
    const [row, changedAt] = await Promise.all([
      supportKnowledgeRepository.syncRow(),
      supportKnowledgeRepository.contentChangedAt(),
    ]);
    const running = row?.status === 'running';
    const finishedAt = row?.finishedAt ?? null;
    return {
      status: (row?.status as SupportKnowledgeStatusDto['status']) ?? 'idle',
      step: row?.step ?? null,
      total: row?.total ?? STEPS.length,
      done: row?.done ?? 0,
      chunks: row?.chunks ?? 0,
      error: row?.error ?? null,
      lastSyncedAt: row?.status === 'done' && finishedAt ? finishedAt.toISOString() : null,
      // Never synced, or the site's content changed after the last sync.
      stale: !running && (!finishedAt || row?.status !== 'done' || (changedAt !== null && changedAt > finishedAt)),
    };
  },

  // Returns at once; the work continues on the server and the page polls status().
  async start(actor: Actor): Promise<SupportKnowledgeStatusDto> {
    const startedAt = await supportKnowledgeRepository.tryStart(STEPS.length, actor.userId);
    if (!startedAt) throw ApiError.conflict('A sync is already running');
    runAfterResponse(() => runSync(startedAt));
    return this.status();
  },

  // What the AI is told for this question. Null when the site has never been synced, so the
  // caller falls back to reading the live content.
  async contextFor(question: string): Promise<string | null> {
    const core = await supportKnowledgeRepository.core();
    if (!core.length) return null;
    let relevant = await supportKnowledgeRepository.search(question, RELEVANT_LIMIT);
    // Nothing matched (a vague "hi, can you help?"): the service list is the best general answer.
    if (!relevant.length) relevant = await supportKnowledgeRepository.ofSource('service', RELEVANT_LIMIT * 2);
    let text = `${render(core)}\n\nRELEVANT INFORMATION FROM THE WEBSITE\n${render(relevant)}`;
    if (text.length > KNOWLEDGE_MAX) text = text.slice(0, KNOWLEDGE_MAX);
    return text;
  },
};
