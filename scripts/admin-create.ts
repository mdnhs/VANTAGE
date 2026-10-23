// First owner bootstrap: yarn admin:create --email you@example.com --name "Your Name"
import { parseArgs } from 'node:util';

import { fail } from './lib/cli-env';

async function main() {
  const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' } } });
  if (!values.email || !values.name) {
    console.error('Usage: yarn admin:create --email you@example.com --name "Your Name"');
    process.exit(1);
  }
  const { createOwner } = await import('@/server/lib/auth/bootstrap');
  const { manualLink } = await createOwner({ email: values.email, name: values.name });
  if (manualLink) {
    console.log('Owner created. SMTP is not configured, so no email was sent.');
    console.log(`Set-password link (single use, treat as a secret): ${manualLink}`);
  } else {
    console.log(`Owner created. A set-password link was sent to ${values.email}.`);
  }
  process.exit(0);
}

main().catch(fail);
