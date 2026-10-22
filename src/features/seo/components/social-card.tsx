export function SocialCard({
  siteHost,
  title,
  description,
  imageSrc,
  siteName,
}: {
  siteHost: string;
  title: string;
  description: string;
  // An uploaded image URL; without one the generated card is drawn here.
  imageSrc?: string;
  siteName: string;
}) {
  return (
    <div className='overflow-hidden rounded-xl border bg-background'>
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt='Share image preview' className='aspect-[1.91/1] w-full bg-muted object-cover' />
      ) : (
        <div
          role='img'
          aria-label='Share image preview'
          className='flex aspect-[1.91/1] w-full flex-col justify-end gap-1 bg-neutral-900 p-5 text-white'
        >
          <p className='text-xs tracking-widest uppercase opacity-70'>{siteName}</p>
          <p className='line-clamp-2 text-xl leading-tight font-semibold'>{title}</p>
        </div>
      )}
      <div className='flex flex-col gap-1 border-t p-3'>
        <p className='text-xs tracking-wide text-muted-foreground uppercase'>{siteHost}</p>
        <p className='line-clamp-1 text-sm font-semibold'>{title}</p>
        <p className='line-clamp-2 text-sm text-muted-foreground'>{description}</p>
      </div>
    </div>
  );
}
