// Read-only: what the live chat AI is given, and how recent chats ended. No keys, no message text.
import { fail } from './lib/cli-env';

async function main() {
  const { db } = await import('@/server/db');
  const { sql } = await import('drizzle-orm');
  const { buildKnowledge } = await import('@/server/lib/support/bot-knowledge');
  const { serviceRepository } = await import('@/server/repositories/service-repository');
  const { testimonialRepository } = await import('@/server/repositories/testimonial-repository');
  const { readEffectiveGlobal } = await import('@/server/services/globals-service');
  const { siteNameFrom } = await import('@/lib/content/site-name');

  const [site, contact, services, reviews] = await Promise.all([
    readEffectiveGlobal('site').then((s) => s.value),
    readEffectiveGlobal('contact').then((s) => s.value),
    serviceRepository.listPublished(),
    testimonialRepository.listPublished({ limit: 5 }),
  ]);
  const text = buildKnowledge({
    siteName: siteNameFrom(site.name),
    services: services.map((s) => ({
      name: s.name,
      description: s.description,
      checklist: s.checklist,
      startingPrice: s.startingPrice,
    })),
    contact: {
      phone: contact.phone.display,
      emergencyPhone: contact.emergencyPhone,
      email: contact.email,
      whatsapp: contact.whatsapp,
      address: [...contact.address.lines, contact.address.city, contact.address.eircode, contact.address.country]
        .filter(Boolean)
        .join(', '),
      hours: contact.hours.summary,
    },
    reviews: reviews.map((r) => ({ author: r.customerName, body: r.reviewText })),
  });
  console.log(`[bot] services=${services.length} reviews=${reviews.length} knowledgeChars=${text.length}`);
  console.log('[bot] KNOWLEDGE START\n' + text + '\n[bot] KNOWLEDGE END');
  const chats = await db.execute(sql`
    select c.status, c.ai_enabled, c.needs_human, c.created_at,
      count(*) filter (where m.sender='visitor') visitor, count(*) filter (where m.sender='ai') ai,
      count(*) filter (where m.sender='system') system
    from support_conversations c left join support_messages m on m.conversation_id = c.id
    group by c.id order by c.created_at desc limit 4`);
  console.table(chats.rows);
  process.exit(0);
}
main().catch(fail);
