// Same footprint as a two-field form, so the panel does not jump while the
// request-time part of a page streams in.
export function AuthFormSkeleton() {
  return (
    <div aria-hidden className='flex flex-col gap-5'>
      {[0, 1].map((key) => (
        <div key={key} className='flex flex-col gap-2'>
          <div className='h-4 w-20 rounded-md bg-muted' />
          <div className='h-11 rounded-xl bg-muted motion-safe:animate-pulse' />
        </div>
      ))}
      <div className='h-11 rounded-xl bg-muted motion-safe:animate-pulse' />
    </div>
  );
}
