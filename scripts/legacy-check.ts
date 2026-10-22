// Read-only gate before the legacy read paths go away. Counts what is still unmigrated; never writes.
//   yarn legacy:check   prints one line per check; exits 0 and prints OK only when every count is 0
import { fail } from './lib/cli-env';

async function main() {
  const { legacyCheck } = await import('@/server/lib/legacy/legacy-check');
  const result = await legacyCheck();
  const width = Math.max(...result.items.map((i) => i.label.length));
  for (const item of result.items) {
    const fix = item.count > 0 ? `  -> ${item.fix}` : '';
    console.log(`${item.label.padEnd(width)}  ${String(item.count).padStart(5)}${fix}`);
  }
  if (!result.ok) {
    console.error('FAIL legacy data remains; run the commands above, then re-run yarn legacy:check');
    process.exit(1);
  }
  console.log('OK');
  process.exit(0);
}

main().catch(fail);
