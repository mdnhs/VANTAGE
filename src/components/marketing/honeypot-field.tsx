// A field only a bot fills in: off-screen, unfocusable, hidden from assistive tech.
export function HoneypotField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden='true' className='absolute -left-[9999px] h-px w-px overflow-hidden'>
      <label>
        Website
        <input
          type='text'
          name='website'
          tabIndex={-1}
          autoComplete='off'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
