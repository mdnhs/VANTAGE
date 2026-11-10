import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  insurance: false,
  core: [] as { title: string; body: string; source: string; sourceKey: string }[],
  found: [] as { title: string; body: string; source: string; sourceKey: string }[],
}));

vi.mock('server-only', () => ({}));
vi.mock('@/server/queries/get-features', () => ({ getInsuranceEnabled: async () => h.insurance }));
vi.mock('@/server/repositories/support-knowledge-repository', () => ({
  supportKnowledgeRepository: {
    core: async () => h.core,
    search: async () => h.found,
    ofSource: async () => [],
  },
}));
vi.mock('@/server/repositories/homepage-process-step-repository', () => ({ homepageProcessStepRepository: {} }));
vi.mock('@/server/repositories/project-repository', () => ({ projectRepository: {} }));
vi.mock('@/server/repositories/service-repository', () => ({ serviceRepository: {} }));
vi.mock('@/server/repositories/testimonial-repository', () => ({ testimonialRepository: {} }));
vi.mock('@/server/services/enquiry-notify', () => ({ runAfterResponse: () => {} }));
vi.mock('@/server/services/globals-service', () => ({ readEffectiveGlobal: async () => ({ value: {} }) }));

const row = (sourceKey: string, body: string) => ({
  title: `Website page: ${sourceKey}`,
  body,
  source: 'page',
  sourceKey,
});

beforeEach(() => {
  h.insurance = false;
  h.core = [row('page.home', 'We repair dents.')];
  h.found = [row('page.insurance', 'We deal with your insurer.'), row('page.services', 'Respray from 2200.')];
});

describe('supportKnowledgeService.contextFor', () => {
  it('leaves Insurance page knowledge out while the admin switch is off, even if it was synced earlier', async () => {
    const { supportKnowledgeService } = await import('./support-knowledge-service');
    const text = (await supportKnowledgeService.contextFor('what about insurance?')) ?? '';
    expect(text).toContain('Respray from 2200.');
    expect(text).not.toContain('insurer');
  });

  it('includes it when the switch is on', async () => {
    h.insurance = true;
    const { supportKnowledgeService } = await import('./support-knowledge-service');
    expect((await supportKnowledgeService.contextFor('what about insurance?')) ?? '').toContain('insurer');
  });
});
