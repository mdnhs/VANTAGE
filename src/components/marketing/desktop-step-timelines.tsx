import { SECTION_BG, SECTION_CONTAINER, SectionHeader } from '@/components/marketing/ui/landing-primitives';

// Desktop (lg+) layouts for the Insurance and Process step sequences. The phone/tablet layouts
// stay on StitchProcess (rendered `lg:hidden` by the callers); these render the same step data the
// way the 1440px Figma frames lay it out.

interface DesktopStep {
  title: string;
  description: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Same Figma phase icons StitchProcess uses, assigned by display position.
const ICONS = [
  {
    src: '/assets/landing/7014327f3b3a28044c6d83372f3ae7ed2338cdb9.svg',
    w: 19.5,
    h: 19.5,
    g: 'inset-[12.5%]',
    b: 'inset-[-4.17%]',
  },
  {
    src: '/assets/landing/a040ac963b45b1fbfa1c62b72c7c3c132b362d22.svg',
    w: 19.5,
    h: 19.5,
    g: 'inset-[12.5%]',
    b: 'inset-[-4.17%]',
  },
  {
    src: '/assets/landing/afb104c65bc9dcaca299d4dbe2986eddd95db7b1.svg',
    w: 19.5,
    h: 21.5,
    g: 'inset-[8.33%_12.5%]',
    b: 'inset-[-3.75%_-4.17%]',
  },
  {
    src: '/assets/landing/27dd4d145d77b85cea2b2c70831eff96b56c1c0e.svg',
    w: 20.5,
    h: 20.5,
    g: 'inset-[10.42%]',
    b: 'inset-[-3.95%]',
  },
  {
    src: '/assets/landing/83723bbec597669a0a605222191e572d60945817.svg',
    w: 15.5,
    h: 12.5,
    g: 'inset-[27.08%_20.83%]',
    b: 'inset-[-6.82%_-5.36%]',
  },
];

function splitAccent(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length < 3) return { head: title, accent: undefined };
  return { head: words.slice(0, -2).join(' '), accent: words.slice(-2).join(' ') };
}

// Insurance: seven compact columns, each a numbered badge on a connecting rail.
export function InsuranceStepsDesktop({
  eyebrow,
  title,
  steps,
}: {
  eyebrow: string;
  title: string;
  steps: DesktopStep[];
}) {
  const { head, accent } = splitAccent(title);
  return (
    <section className={`hidden py-[120px] lg:block ${SECTION_BG.base}`}>
      <div className={`${SECTION_CONTAINER} gap-16`}>
        <SectionHeader eyebrow={eyebrow} title={head} accent={accent} />
        <ol data-steps-h className='flex items-start gap-3'>
          {steps.map((step, index) => (
            <li key={`${index}-${step.title}`} data-timeline-step className='flex min-w-0 flex-1 flex-col gap-[18px]'>
              <div className='flex items-center gap-3'>
                <span
                  data-timeline-dot
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full border font-site-heading text-[15px] font-extrabold text-[#f1f3f6] ${
                    index === 0 ? 'border-brand bg-brand' : 'border-[#3e4551] bg-[#262b34]'
                  }`}
                >
                  {pad(index + 1)}
                </span>
                {index < steps.length - 1 && (
                  <span aria-hidden='true' className='relative h-px min-w-px flex-1 overflow-hidden bg-[#353c47]'>
                    {/* Drawn left to right in brand red by the scroll animation (PageAnimations) */}
                    <span data-timeline-fill className='absolute inset-0 origin-left scale-x-0 bg-brand' />
                  </span>
                )}
              </div>
              <div data-timeline-body className='flex flex-col gap-2'>
                <h3 className='font-site-heading text-[17px] leading-6 font-bold text-[#f1f3f6]'>{step.title}</h3>
                <p className='font-site-body text-[13px] leading-5 text-[#a4abb6]'>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Process: a vertical timeline — large number badge on a rail, a wide card per phase.
export function ProcessTimelineDesktop({
  eyebrow,
  title,
  steps,
}: {
  eyebrow: string;
  title: string;
  steps: DesktopStep[];
}) {
  const { head, accent } = splitAccent(title);
  return (
    <section className={`hidden py-[120px] lg:block ${SECTION_BG.base}`}>
      <div className={`${SECTION_CONTAINER} gap-16`}>
        <SectionHeader eyebrow={eyebrow} title={head} accent={accent} />
        <ol data-steps-v className='flex flex-col'>
          {steps.map((step, index) => {
            const icon = ICONS[index % ICONS.length];
            const isLast = index === steps.length - 1;
            return (
              <li
                key={`${index}-${step.title}`}
                data-timeline-step
                className={`flex items-start gap-10 ${isLast ? '' : 'pb-6'}`}
              >
                <div className='flex flex-col items-center gap-3 self-stretch'>
                  <span
                    data-timeline-dot
                    className={`flex size-16 shrink-0 items-center justify-center rounded-full border font-site-heading text-[22px] font-extrabold text-[#f1f3f6] ${
                      index === 0 ? 'border-brand bg-brand' : 'border-[#3e4551] bg-[#262b34]'
                    }`}
                  >
                    {pad(index + 1)}
                  </span>
                  {!isLast && (
                    <span aria-hidden='true' className='relative min-h-px w-0.5 flex-1 overflow-hidden bg-[#353c47]'>
                      {/* Filled downwards in brand red by the scroll animation (PageAnimations) */}
                      <span data-timeline-fill className='absolute inset-0 origin-top scale-y-0 bg-brand' />
                    </span>
                  )}
                </div>
                <div
                  data-timeline-body
                  className='flex min-w-0 flex-1 flex-col gap-[18px] rounded-[20px] border border-[#353c47] bg-[#262b34] p-9'
                >
                  <div className='flex items-center gap-4'>
                    <span className='flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#f1f3f6]'>
                      <span className='relative size-6 shrink-0 overflow-hidden'>
                        <span className={`absolute ${icon.g}`}>
                          <span className={`absolute ${icon.b}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={icon.src}
                              alt=''
                              width={icon.w}
                              height={icon.h}
                              className='block size-full max-w-none'
                            />
                          </span>
                        </span>
                      </span>
                    </span>
                    <h3 className='font-site-heading text-[26px] font-bold tracking-[-0.26px] text-[#f1f3f6]'>
                      {step.title}
                    </h3>
                  </div>
                  <p className='font-site-body text-base leading-[26px] text-[#b9bfc9]'>{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
