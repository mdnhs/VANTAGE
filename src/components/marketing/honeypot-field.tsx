// A field only a bot fills in: off-screen, unfocusable, hidden from assistive tech and
// password managers. The DOM name is neutral; the form sends the value as `website`.
export function HoneypotField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden='true' className='absolute -left-[9999px] h-px w-px overflow-hidden'>
      <label>
        Leave this empty
        <input
          type='text'
          name='hp_x7'
          tabIndex={-1}
          autoComplete='new-password'
          data-1p-ignore
          data-lpignore='true'
          data-bwignore
          data-form-type='other'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
