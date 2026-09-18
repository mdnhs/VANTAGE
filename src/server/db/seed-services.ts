import { db } from './index';
import { services } from './schema/services';

const SEED_SERVICES = [
  {
    name: 'Crash & Collision Repair',
    slug: 'crash-collision-repair',
    description: 'Major accident reconstruction, hydraulic bench pull, and laser structural chassis realignment.',
    startingPrice: 450,
    displayOrder: 0,
    isEnabled: true,
  },
  {
    name: 'Dent Repair & PDR',
    slug: 'dent-repair-pdr',
    description: 'Paintless dent removal for parking dings and creases preserving factory original paint integrity.',
    startingPrice: 95,
    displayOrder: 1,
    isEnabled: true,
  },
  {
    name: 'Precision Spray Painting',
    slug: 'precision-spray-painting',
    description:
      'Computerized spectrophotometer color scanning, multi-stage pearls, metallic lacquers and infrared curing.',
    startingPrice: 250,
    displayOrder: 2,
    isEnabled: true,
  },
  {
    name: 'Full Vehicle Resprays',
    slug: 'full-vehicle-resprays',
    description: 'Complete bare-metal strip downs, glass-out color changes, matte transitions and bespoke finishes.',
    startingPrice: 2200,
    displayOrder: 3,
    isEnabled: true,
  },
  {
    name: 'Scratch & Scuff Correction',
    slug: 'scratch-scuff-correction',
    description: 'Targeted bumper corner scuffs, vandal key scratches, and localized high-blend micro-repairs.',
    startingPrice: 120,
    displayOrder: 4,
    isEnabled: true,
  },
  {
    name: 'Panel Replacement',
    slug: 'panel-replacement',
    description: 'Original quarter panels, bonnets, wings, door skins and spot-welding according to factory bulletins.',
    startingPrice: 350,
    displayOrder: 5,
    isEnabled: true,
  },
  {
    name: 'Alloy Wheel Refurbishment',
    slug: 'alloy-wheel-refurbishment',
    description: 'Diamond-cut CNC resurfacing, severe kerb rash weld repairs, straightening, and powder coating.',
    startingPrice: 85,
    displayOrder: 6,
    isEnabled: true,
  },
  {
    name: 'Ceramic Coating & Detailing',
    slug: 'ceramic-coating-detailing',
    description:
      'Multi-stage machine paint de-swirling, ultra-hard 9H ceramic hydrophobic sealants, and leather rejuvenation.',
    startingPrice: 395,
    displayOrder: 7,
    isEnabled: true,
  },
];

async function seed() {
  const existing = await db.query.services.findMany();
  if (existing.length > 0) {
    console.log(`Services table already has ${existing.length} rows, skipping seed.`);
    return;
  }

  console.log('Seeding default services...');
  for (const item of SEED_SERVICES) {
    await db.insert(services).values(item);
  }
  console.log(`Successfully seeded ${SEED_SERVICES.length} services.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
