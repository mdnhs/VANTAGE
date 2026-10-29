import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/json-ld';
import { PlainProse } from '@/components/marketing/plain-prose';
import {
  ButtonLink,
  CARD,
  PageHero,
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
} from '@/components/marketing/ui/landing-primitives';
import { PageAnimations } from '@/components/marketing/page-animations';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';
import { projectPath, servicePath } from '@/lib/seo/detail-paths';
import { breadcrumbNode, graph } from '@/lib/seo/json-ld';
import { PUBLIC_PAGES } from '@/lib/seo/public-pages';
import { projectMetadata, publishedProject } from '@/server/queries/get-detail-pages';
import { projectService } from '@/server/services/project-service';
import { serviceService } from '@/server/services/service-service';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
// Cache Components needs at least one param at build; this one renders the 404.
const NO_PROJECTS = '_none';
const dateFormatter = new Intl.DateTimeFormat('en-IE', { year: 'numeric', month: 'long' });

export async function generateStaticParams() {
  const slugs = (await projectService.listPublished()).map((p) => ({ slug: p.slug }));
  return slugs.length ? slugs : [{ slug: NO_PROJECTS }];
}

export async function generateMetadata({ params }: PageProps<'/our-work/[slug]'>) {
  // Admin-edited search and sharing fields (Dashboard → Projects → edit → SEO).
  return (await projectMetadata((await params).slug)) ?? { title: 'Page not found', robots: { index: false } };
}

function Photo({ image, alt, label }: { image: PublicImage; alt: string; label?: string }) {
  return (
    <figure className='relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#2a2a30] bg-black'>
      <Image
        src={sizedSrc(image, 'w_1200,h_900,c_fill')}
        alt={image.alt || alt}
        fill
        sizes='(min-width: 1024px) 600px, 100vw'
        style={{ objectPosition: `${image.focal.x * 100}% ${image.focal.y * 100}%` }}
        className='object-cover'
      />
      {label && (
        <figcaption className='absolute top-4 left-4 rounded-full border border-white/12 bg-[rgba(17,17,19,0.8)] px-3 py-1.5 font-site-body text-[11px] tracking-[0.6px] text-white uppercase backdrop-blur-md'>
          {label}
        </figcaption>
      )}
    </figure>
  );
}

// One published project on its own page (Dashboard → Projects): before/after, the write-up, the gallery.
export default async function ProjectPage({ params }: PageProps<'/our-work/[slug]'>) {
  const { slug } = await params;
  const project = await publishedProject(slug);
  if (!project) notFound();

  const services = await serviceService.listPublished();
  const category = project.serviceCategory.trim().toLowerCase();
  const service = services.find((s) => s.name.trim().toLowerCase() === category);
  const path = projectPath(project.slug);

  return (
    <main className='flex flex-col'>
      <JsonLd
        schema={graph([
          breadcrumbNode(APP_URL, [
            { name: 'Home', path: '/' },
            { name: PUBLIC_PAGES['our-work'].crumb, path: '/our-work' },
            { name: project.title, path },
          ]),
        ])}
      />
      <PageHero
        page='our-work'
        current={project.title}
        eyebrow={project.serviceCategory}
        lines={[project.title]}
        subtext={project.vehicleModel}
      >
        <ButtonLink href='/get-a-quote'>Get a quote</ButtonLink>
        {service && (
          <ButtonLink href={servicePath(service.slug)} variant='secondary'>
            About {service.name}
          </ButtonLink>
        )}
      </PageHero>

      <section className={SECTION_BG.raised}>
        <div className={`${SECTION_CONTAINER} ${SECTION_PADDING} gap-12`}>
          {(project.beforeImage || project.afterImage) && (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {project.beforeImage && (
                <Photo image={project.beforeImage} alt={`${project.title}, before the repair`} label='Before' />
              )}
              {project.afterImage && (
                <Photo image={project.afterImage} alt={`${project.title}, after the repair`} label='After' />
              )}
            </div>
          )}
          <div className='grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:gap-[80px]'>
            <PlainProse text={project.description} />
            <dl className={`${CARD} flex flex-col gap-3 p-6 font-site-body`}>
              <div className='flex justify-between gap-4'>
                <dt className='text-[11px] tracking-[0.6px] text-[#999] uppercase'>Vehicle</dt>
                <dd className='text-right text-sm font-medium text-white'>{project.vehicleModel}</dd>
              </div>
              <div className='flex justify-between gap-4'>
                <dt className='text-[11px] tracking-[0.6px] text-[#999] uppercase'>Service</dt>
                <dd className='text-right text-sm font-medium text-white'>
                  {service ? (
                    <Link href={servicePath(service.slug)} className='underline-offset-4 hover:underline'>
                      {project.serviceCategory}
                    </Link>
                  ) : (
                    project.serviceCategory
                  )}
                </dd>
              </div>
              {project.completedAt && (
                <div className='flex justify-between gap-4'>
                  <dt className='text-[11px] tracking-[0.6px] text-[#999] uppercase'>Completed</dt>
                  <dd className='text-right text-sm font-medium text-white'>
                    {dateFormatter.format(new Date(project.completedAt))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          {project.gallery.length > 0 && (
            <div className='flex flex-col gap-6'>
              <h2 className='font-site-heading text-[24px] leading-[30px] font-extrabold text-white uppercase sm:text-[28px]'>
                Gallery
              </h2>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {project.gallery.map((image, i) => (
                  <Photo key={image.src} image={image} alt={`${project.title}, photo ${i + 1}`} />
                ))}
              </div>
            </div>
          )}
          <Link href='/our-work' className='font-site-body text-sm text-[#b5b5b5] transition-colors hover:text-white'>
            ← All projects
          </Link>
        </div>
      </section>
      <PageAnimations />
    </main>
  );
}
