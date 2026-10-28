import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { PROSE } from '@/components/marketing/rich-text-prose';
import { PageAnimations } from '@/components/marketing/page-animations';
import {
  ButtonLink,
  CARD,
  PageHero,
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
} from '@/components/marketing/ui/landing-primitives';
import { JsonLd } from '@/components/seo/json-ld';
import { renderLegalHtml } from '@/lib/legal-pages/render';
import { sizedSrc } from '@/lib/media/public-image';
import { breadcrumbNode, graph, serviceNode } from '@/lib/seo/json-ld';
import { PUBLIC_PAGES } from '@/lib/seo/public-pages';
import { serviceService } from '@/server/services/service-service';

// One service's detail page (Dashboard → Services → edit → Detail page content). Slugs are only
// known at request time, so the page is not prerendered; the row comes from the tag-cached
// service, so a request costs no database hit.
export const instant = false;

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

type Props = { params: Promise<{ slug: string }> };

function clip(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 0) || max).trimEnd()}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await serviceService.getPublishedBySlug(slug);
  if (!service) return { title: 'Page not found', robots: { index: false } };
  const image = service.image ? sizedSrc(service.image, 'w_1200,h_630,c_fill') : null;
  return {
    title: service.name,
    description: clip(service.description),
    alternates: { canonical: `/services/${service.slug}` },
    ...(image ? { openGraph: { images: [{ url: image, alt: service.name }] } } : {}),
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await serviceService.getPublishedBySlug(slug);
  if (!service) notFound();

  const path = `/services/${service.slug}`;
  const html = service.content ? renderLegalHtml(service.content) : '';
  const image = service.image ? sizedSrc(service.image, 'w_1600,h_1000,c_fill') : null;
  const imageUrl = image && image.startsWith('/') ? `${APP_URL}${image}` : image;

  return (
    <main className='flex flex-col'>
      <JsonLd
        schema={graph([
          breadcrumbNode(APP_URL, [
            { name: 'Home', path: '/' },
            { name: PUBLIC_PAGES.services.title, path: PUBLIC_PAGES.services.path },
            { name: service.name, path },
          ]),
          serviceNode({ origin: APP_URL, path, name: service.name, description: service.description, imageUrl }),
        ])}
      />
      <PageHero
        page='services'
        current={service.name}
        eyebrow='Specialist Service'
        lines={[service.name]}
        subtext={service.description}
      >
        <ButtonLink href='/get-a-quote'>Get a quote</ButtonLink>
        <ButtonLink href='/services' variant='secondary'>
          All services
        </ButtonLink>
      </PageHero>

      <section className={SECTION_BG.raised}>
        <div className={`${SECTION_CONTAINER} ${SECTION_PADDING}`}>
          <div className='grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16'>
            <article className='flex min-w-0 flex-col gap-10'>
              {image && (
                <div className='relative aspect-16/10 overflow-hidden rounded-[20px] border border-[#2a2a30] bg-[#1b1b20]'>
                  <Image
                    src={image}
                    alt={service.name}
                    fill
                    sizes='(min-width: 1024px) 760px, 100vw'
                    className='object-cover'
                    style={{ objectPosition: `${service.image!.focal.x * 100}% ${service.image!.focal.y * 100}%` }}
                  />
                </div>
              )}
              {/* `html` comes from renderLegalHtml, which renders only the allowlisted, escaped Tiptap nodes. */}
              {html && <div className={`max-w-[760px] ${PROSE}`} dangerouslySetInnerHTML={{ __html: html }} />}
            </article>

            <aside className='lg:sticky lg:top-28 lg:self-start'>
              <div className={`${CARD} flex flex-col gap-6 rounded-[20px] p-7`}>
                {service.startingPrice != null && (
                  <p className='font-site-body text-sm tracking-[0.04em] text-[#8a8a93] uppercase'>
                    From{' '}
                    <span className='font-site-heading text-[32px] font-extrabold text-white normal-case'>
                      €{service.startingPrice}
                    </span>
                  </p>
                )}
                {service.checklist.length > 0 && (
                  <div className='flex flex-col gap-4'>
                    <h2 className='font-site-heading text-lg font-bold text-white uppercase'>What&apos;s included</h2>
                    <ul className='flex flex-col gap-3'>
                      {service.checklist.map((item) => (
                        <li key={item} className='flex items-start gap-3'>
                          <span className='mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-[#055e45] p-1'>
                            <Check aria-hidden className='size-3.5 text-white' />
                          </span>
                          <span className='font-site-body text-[15px] leading-[22px] text-white'>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className='font-site-body text-[15px] leading-[24px] text-[#b5b5b5]'>
                  Send us your vehicle details and photos for a free, no-obligation estimate.
                </p>
                <ButtonLink href='/get-a-quote' className='w-full'>
                  Get a quote
                </ButtonLink>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <PageAnimations />
    </main>
  );
}
