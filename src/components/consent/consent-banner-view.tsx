import type { GlobalValue } from '@/lib/content/globals';
import type { ConsentChoice } from '@/lib/tracking/consent';

export type ConsentCopy = Pick<
  GlobalValue<'consent'>,
  'title' | 'body' | 'accept' | 'reject' | 'customise' | 'save' | 'policyLabel' | 'policyHref' | 'categories'
>;

// One class for every choice: equal prominence, no primary styling.
const BUTTON =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-transparent px-6 font-[family-name:var(--font-inter)] text-sm font-semibold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none';

const ROWS = [
  ['necessary', 'Necessary'],
  ['analytics', 'Analytics'],
  ['marketing', 'Marketing'],
] as const;

export function ConsentBannerView({
  copy,
  mode,
  choice,
  onAccept,
  onReject,
  onCustomise,
  onSave,
  onToggle,
  headingRef,
  inline,
}: {
  copy: ConsentCopy;
  mode: 'first' | 'custom';
  choice: ConsentChoice;
  onAccept: () => void;
  onReject: () => void;
  onCustomise: () => void;
  onSave: () => void;
  onToggle: (category: 'analytics' | 'marketing', on: boolean) => void;
  headingRef?: React.Ref<HTMLHeadingElement>;
  // Admin preview: positioned inside its box instead of the viewport.
  inline?: boolean;
}) {
  return (
    <div
      role='dialog'
      aria-modal='false'
      aria-labelledby='vantage-consent-title'
      aria-describedby='vantage-consent-body'
      className={`${inline ? 'absolute' : 'fixed'} inset-x-0 bottom-0 z-50`}
    >
      <div className='mx-auto w-full max-w-360 px-4 pb-4 sm:px-6'>
        <div className='flex max-h-[85vh] flex-col gap-4 overflow-y-auto rounded-[20px] border border-[#232328] bg-[#161616] p-5 text-white shadow-lg sm:p-6'>
          <h2
            id='vantage-consent-title'
            ref={headingRef}
            tabIndex={-1}
            className='font-[family-name:var(--font-manrope)] text-xl font-semibold outline-none'
          >
            {copy.title}
          </h2>
          <p
            id='vantage-consent-body'
            className='font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/80'
          >
            {copy.body}
            {copy.policyHref ? (
              <>
                {' '}
                <a href={copy.policyHref} className='underline'>
                  {copy.policyLabel}
                </a>
              </>
            ) : null}
          </p>
          {mode === 'custom' ? (
            <div className='flex flex-col gap-3'>
              {ROWS.map(([key, name]) => (
                <label key={key} className='flex min-h-11 items-start gap-3 text-sm'>
                  <input
                    type='checkbox'
                    className='mt-0.5 size-5 shrink-0 accent-white'
                    checked={key === 'necessary' ? true : choice[key]}
                    disabled={key === 'necessary'}
                    onChange={key === 'necessary' ? undefined : (e) => onToggle(key, e.target.checked)}
                  />
                  <span>
                    <span className='font-semibold'>{name}</span>
                    <br />
                    {copy.categories[key]}
                  </span>
                </label>
              ))}
            </div>
          ) : null}
          <div className='flex flex-col gap-3 sm:flex-row'>
            {mode === 'first' ? (
              <>
                <button type='button' className={BUTTON} onClick={onAccept}>
                  {copy.accept}
                </button>
                <button type='button' className={BUTTON} onClick={onReject}>
                  {copy.reject}
                </button>
                <button type='button' className={BUTTON} onClick={onCustomise}>
                  {copy.customise}
                </button>
              </>
            ) : (
              <>
                <button type='button' className={BUTTON} onClick={onSave}>
                  {copy.save}
                </button>
                <button type='button' className={BUTTON} onClick={onReject}>
                  {copy.reject}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
