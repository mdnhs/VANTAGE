import 'server-only';

import { runAiRetention } from '@/server/repositories/ai-conversation-repository';
import { countDuePurges, purgeMediaObjects } from '@/server/services/media-purge-service';
import { runRetention } from '@/server/services/retention-service';
import { runSupportRetention } from '@/server/services/support-service';

// The daily clean-up, as the production container runs it. Only counts ever come back.
export async function runDailyRetention({ dryRun = false } = {}) {
  const [enquiries, chats] = [await runRetention({ dryRun }), await runSupportRetention({ dryRun })];
  if (dryRun) return { dryRun, enquiries, chats, mediaDue: await countDuePurges() };
  return { dryRun, enquiries, chats, ai: await runAiRetention(new Date()), media: await purgeMediaObjects() };
}
