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
              className='group relative flex size-10 items-center justify-center overflow-hidden rounded-[10px] bg-[#f1f3f6] transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:shadow-[0_8px_16px_rgb(var(--brand-rgb)/0.35)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1f26] focus-visible:outline-none'
            >
              {/* Brand red rises from the bottom of the tile on hover and the icon turns white. */}
              <span
                aria-hidden
                className='absolute inset-0 translate-y-full bg-brand transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0'
              />
              {social.icon ? (
                // unoptimized: uploads are often SVG, which next/image will not optimise.
                <Image
                  src={social.icon.src}
                  alt=''
                  width={20}
                  height={20}
                  unoptimized
                  className='relative size-5 object-contain transition-[filter] duration-300 group-hover:brightness-0 group-hover:invert'
                />
              ) : (
                <span
                  aria-hidden='true'
                  className='relative text-[15px] leading-none font-semibold text-[#1b1f26] uppercase transition-colors duration-300 group-hover:text-white'
                >
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
