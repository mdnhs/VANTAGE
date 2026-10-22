// SEED_DEMO_USERS=true yarn db:seed-demo-users  (local/staging only)
import { fail } from './lib/cli-env';

async function main() {
  const { seedDemoUsers } = await import('@/server/db/seed-demo-users');
  const { created, skipped } = await seedDemoUsers();
  console.log(`Demo users: created ${created}, already present ${skipped}`);
  process.exit(0);
}

main().catch(fail);
