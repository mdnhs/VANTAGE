'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { ManualLinkNotice } from './manual-link-notice';

export type ManualLink = { email: string; link: string };

export function ManualLinkDialog({ value, onClose }: { value: ManualLink | null; onClose(): void }) {
  return (
    <Dialog open={value !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Share the invite link</DialogTitle>
          <DialogDescription>Copy it now. It isn&apos;t shown again.</DialogDescription>
        </DialogHeader>
        {value ? <ManualLinkNotice email={value.email} link={value.link} /> : null}
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
