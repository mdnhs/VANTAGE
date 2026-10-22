import { GlobalEditor } from '@/features/globals/components/global-editor';

// The editor's History sheet is the rollback. `disabled` is the server's
// DISABLE_CUSTOM_SCRIPTS kill switch. Public pages are prerendered, so the
// switch only reaches them after a rebuild; removing snippets here is instant.
export function CodeView({ disabled }: { disabled: boolean }) {
  return (
    <div className='flex flex-col gap-4'>
      <p role='note' className='rounded-xl border border-warning/50 bg-warning-soft p-3 text-sm'>
        Custom code runs with full access to every visitor&apos;s page, including the enquiry forms. Only add code from
        a source you trust. Snippets never run in the admin or in previews, and each runs once per page load. To stop a
        snippet straight away, remove it here and save.
      </p>
      {disabled ? (
        <p role='note' className='rounded-xl border border-danger/50 bg-danger-soft p-3 text-sm'>
          Custom code is switched off on the server (DISABLE_CUSTOM_SCRIPTS). Saved snippets will not run until it is
          turned back on. Changing this setting takes effect on the public site after the next rebuild.
        </p>
      ) : null}
      <GlobalEditor title='Custom code' keys={['scripts']} />
    </div>
  );
}
