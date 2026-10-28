import { JsonLd } from '@/components/seo/json-ld';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  CARD,
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
  SectionHeader,
} from '@/components/marketing/ui/landing-primitives';
import type { GlobalValue } from '@/lib/content/globals';
import { faqNode, graph } from '@/lib/seo/json-ld';

type ServicesFaqProps = { faq: GlobalValue<'page.services'>['faq'] };

// CMS-driven (Dashboard → Services → Services page → FAQ). Blank rows are skipped so a
// half-filled question never reaches the page or the FAQPage markup.
export function ServicesFaq({ faq }: ServicesFaqProps) {
  const items = faq.items.filter((item) => item.question && item.answer);
  if (items.length === 0) return null;

  return (
    <section className={SECTION_BG.base}>
      <JsonLd schema={graph([faqNode(items)])} />
      <div className={`${SECTION_CONTAINER} ${SECTION_PADDING} gap-12 lg:gap-16`}>
        <SectionHeader eyebrow={faq.eyebrow} title={faq.title} accent={faq.accent} />
        <Accordion className='gap-4'>
          {items.map((item, index) => (
            <AccordionItem key={index} value={index} className={CARD}>
              <AccordionTrigger className='items-center gap-6 px-6 py-5 font-site-heading text-lg font-bold text-white hover:no-underline **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-brand sm:px-8 sm:py-6 sm:text-xl'>
                {item.question}
              </AccordionTrigger>
              <AccordionContent className='max-w-[860px] px-6 pb-5 font-site-body text-base leading-[26px] whitespace-pre-line text-[#b5b5b5] sm:px-8 sm:pb-6'>
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
