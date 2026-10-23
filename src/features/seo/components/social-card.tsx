import { GENERATED_OG, pageOgPath } from '@/lib/seo/metadata';
import type { PublicPageId } from '@/lib/seo/public-pages';

export function SocialCard({
  siteHost,
  title,
  description,
  imageSrc,
  legacyImage,
  pageId,
}: {
  siteHost: string;
  title: string;
  description: string;
  // An uploaded image URL; without one the generated card is drawn here.
  imageSrc?: string;
  // A legacy (Cloudinary) image is set: it has no preview here.
  legacyImage?: boolean;
  // The page whose generated card is shown when no image is set.
  pageId?: PublicPageId;
}) {
  return (
    <div className='overflow-hidden rounded-xl border bg-background'>
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt='Share image preview' className='aspect-[1.91/1] w-full bg-muted object-cover' />
      ) : legacyImage ? (
        <div
          role='img'
          aria-label='Share image preview'
          className='flex aspect-[1.91/1] w-full items-center justify-center bg-muted text-sm text-muted-foreground'
        >
          Legacy image — no preview
        </div>
      ) : (
        // The generated share card the site serves when a page has no image of its own.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pageId ? pageOgPath(pageId) : GENERATED_OG}
          alt='Share image preview'
          className='aspect-[1.91/1] w-full bg-muted object-cover'
        />
      )}
      <div className='flex flex-col gap-1 border-t p-3'>
        <p className='text-xs tracking-wide text-muted-foreground uppercase'>{siteHost}</p>
        <p className='line-clamp-1 text-sm font-semibold'>{title}</p>
        <p className='line-clamp-2 text-sm text-muted-foreground'>{description}</p>
      </div>
    </div>
  );
}
