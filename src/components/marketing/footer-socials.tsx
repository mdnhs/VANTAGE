import Image from 'next/image';

import type { PublicImage } from '@/lib/media/public-image';

export type FooterSocial = { name: string; url: string; icon: PublicImage | null };

// The footer's social icons (Settings > Footer > Social media). The icon sits on a white tile, like
// the site's other icon tiles, so dark and coloured artwork both read on the dark footer. A profile
// without an icon shows the first letter of its name instead.
export function FooterSocials({ socials }: { socials: FooterSocial[] }) {
  if (socials.length === 0) return null;
  return (
    <ul className='flex flex-wrap items-center gap-2.5' aria-label='Social media'>
      {socials.map((social, index) => {
        const name = social.name.trim() || hostOf(social.url);
        return (
          <li key={`${social.url}-${index}`}>
            <a
              href={social.url}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={name}
              title={name}
              className='flex size-10 items-center justify-center rounded-[10px] bg-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113] focus-visible:outline-none'
            >
              {social.icon ? (
                // unoptimized: uploads are often SVG, which next/image will not optimise.
                <Image
                  src={social.icon.src}
                  alt=''
                  width={20}
                  height={20}
                  unoptimized
                  className='size-5 object-contain'
                />
              ) : (
                <span aria-hidden='true' className='text-[15px] leading-none font-semibold text-[#111113] uppercase'>
                  {name.charAt(0)}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
