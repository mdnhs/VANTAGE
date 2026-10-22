import Module from 'node:module';

import { loadEnvConfig } from '@next/env';

// CLI scripts run outside Next: `server-only` would throw, and .env.local must be loaded by hand.
const m = Module as unknown as { _load: (request: string, ...rest: unknown[]) => unknown };
const origLoad = m._load;
m._load = function (this: unknown, request: string, ...rest: unknown[]) {
  return request === 'server-only' ? {} : origLoad.call(this, request, ...rest);
};

loadEnvConfig(process.cwd());

export function fail(error: unknown): never {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`FAIL ${msg.slice(0, 300)}`);
  process.exit(1);
}
