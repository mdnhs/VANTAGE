import 'server-only';

import { oneLine } from '@/server/services/ai/prompt';

// Everything the live chat assistant may state as fact. Small on purpose: a workshop's whole
// service list fits, so the model needs no lookups, and it can never see more than this.
export const KNOWLEDGE_MAX = 6000;

export type KnowledgeInput = {
  siteName: string;
  services: { name: string; description: string; checklist: string[]; startingPrice: number | null }[];
  contact: { phone: string; emergencyPhone: string; email: string; whatsapp: string; address: string; hours: string };
  reviews: { author: string; body: string }[];
};

const SERVICE_DESCRIPTION_MAX = 400;
const REVIEW_MAX = 200;
const MAX_REVIEWS = 5;

const line = (label: string, value: string) => {
  const text = oneLine(value, 300);
  return text ? `- ${label}: ${text}` : null;
};

function contactSection(c: KnowledgeInput['contact']) {
  return [
    'CONTACT AND OPENING HOURS',
    line('Phone', c.phone),
    line('Emergency phone', c.emergencyPhone),
    line('Email', c.email),
    line('WhatsApp', c.whatsapp),
    line('Address', c.address),
    line('Opening hours', c.hours),
  ]
    .filter((l): l is string => l !== null)
    .join('\n');
}

function serviceBlock(s: KnowledgeInput['services'][number], descriptionMax: number) {
  const price = s.startingPrice != null ? ` (from €${s.startingPrice})` : '';
  const checklist = s.checklist.map((c) => oneLine(c, 100)).filter(Boolean);
  return [
    `- ${oneLine(s.name, 120)}${price}: ${oneLine(s.description, descriptionMax)}`,
    ...(checklist.length ? [`  Includes: ${checklist.join('; ')}`] : []),
  ].join('\n');
}

export function buildKnowledge(input: KnowledgeInput): string {
  const head = `BUSINESS: ${oneLine(input.siteName) || 'a car body repair workshop'}`;
  const contact = contactSection(input.contact);
  const fixed = [head, contact].join('\n\n');

  // Services always come first; their descriptions shrink before any service is dropped.
  let descriptionMax = SERVICE_DESCRIPTION_MAX;
  let services = '';
  for (;;) {
    const blocks = input.services.map((s) => serviceBlock(s, descriptionMax));
    services = blocks.length ? `SERVICES\n${blocks.join('\n')}` : '';
    if (fixed.length + services.length + 4 <= KNOWLEDGE_MAX || descriptionMax <= 40) break;
    descriptionMax = Math.floor(descriptionMax / 2);
  }
  let text = [fixed, services].filter(Boolean).join('\n\n');
  if (text.length > KNOWLEDGE_MAX) text = text.slice(0, KNOWLEDGE_MAX);

  // Reviews only fill whatever room is left.
  const reviews = input.reviews
    .slice(0, MAX_REVIEWS)
    .map((r) => `- ${oneLine(r.author, 60)}: "${oneLine(r.body, REVIEW_MAX)}"`);
  const section = reviews.length ? `\n\nCUSTOMER REVIEWS\n${reviews.join('\n')}` : '';
  return text.length + section.length <= KNOWLEDGE_MAX ? text + section : text;
}
