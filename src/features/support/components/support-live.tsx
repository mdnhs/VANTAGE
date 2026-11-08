'use client';

import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { APP_ROUTES } from '@/lib/routes/app-routes';
import type { SupportEvent } from '@/lib/support/types';

import { ADMIN_STREAM_URL } from '../services/api';
import { SUPPORT_QUERY_KEYS as keys } from '../utils/query-keys';

// Mounted once in the admin shell, so an agent is "online" on any dashboard page they are
// looking at and hears about new messages there. EventSource reconnects by itself.
export function SupportLive() {
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const inInbox = useRef(false);
  useEffect(() => {
    inInbox.current = pathname.startsWith(APP_ROUTES.leads.support.index);
  }, [pathname]);

  useEffect(() => {
    const connect = () => {
      const stream = new EventSource(ADMIN_STREAM_URL, { withCredentials: true });

      // `ready` comes on every (re)connect and `resync` when the server's own event link recovers:
      // anything from the gap is re-read here.
      for (const name of ['ready', 'resync']) {
        stream.addEventListener(name, () => void client.invalidateQueries({ queryKey: keys.all }));
      }

      const onChange = (raw: Event) => {
        const event = JSON.parse((raw as MessageEvent<string>).data) as SupportEvent;
        void client.invalidateQueries({ queryKey: keys.lists() });
        void client.invalidateQueries({ queryKey: keys.unread() });
        void client.invalidateQueries({ queryKey: keys.detail(event.conversationId) });
        if (event.type === 'message' && event.from === 'visitor' && !inInbox.current) {
          toast('New chat message', {
            id: `support-${event.conversationId}`,
            action: {
              label: 'Open',
              onClick: () => router.push(APP_ROUTES.leads.support.conversation(event.conversationId)),
            },
          });
        }
      };
      stream.addEventListener('message', onChange);
      stream.addEventListener('conversation', onChange);
      return stream;
    };

    // The stream is what makes an agent "online", so it only runs while they can see the tab.
    let stream: EventSource | null = null;
    const sync = () => {
      if (document.visibilityState === 'visible') stream ??= connect();
      else {
        stream?.close();
        stream = null;
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      stream?.close();
    };
  }, [client, router]);

  return null;
}
