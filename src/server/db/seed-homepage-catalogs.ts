import { db } from './index';
import { homepageCatalogs } from './schema/homepage-catalogs';
import type { HomepageCatalogIcon } from '@/validations/homepage-catalog-schema';

const SEED_CATALOG_ITEMS: Array<{
  title: string;
  description: string;
  badge: string;
  footnote: string;
  icon: HomepageCatalogIcon;
  displayOrder: number;
  isEnabled: boolean;
}> = [
  {
    title: 'Crash & Collision Repair',
    description: 'Major accident reconstruction, hydraulic bench pull, and laser structural chassis realignment.',
    badge: 'OEM Certified',
    footnote: 'Insurance Approved',
    icon: 'car-front',
    displayOrder: 0,
    isEnabled: true,
  },
  {
    title: 'Dent Repair & PDR',
    description: 'Paintless dent removal for parking dings and creases preserving factory original paint integrity.',
    badge: 'Same Day PDR',
    footnote: 'Zero Filler Used',
    icon: 'bandage',
    displayOrder: 1,
    isEnabled: true,
  },
  {
    title: 'Precision Spray Painting',
    description:
      'Computerized spectrophotometer color scanning, multi-stage pearls, metallic lacquers and infrared curing.',
    badge: 'Spectral Match',
    footnote: '100% Match Guarantee',
    icon: 'paint-roller',
    displayOrder: 2,
    isEnabled: true,
  },
  {
    title: 'Full Vehicle Resprays',
    description: 'Complete bare-metal strip downs, glass-out color changes, matte transitions and bespoke finishes.',
    badge: 'Concours Grade',
    footnote: 'Bespoke & Classic',
    icon: 'palette',
    displayOrder: 3,
    isEnabled: true,
  },
  {
    title: 'Scratch & Scuff Correction',
    description: 'Targeted bumper corner scuffs, vandal key scratches, and localized high-blend micro-repairs.',
    badge: 'SMART Repair',
    footnote: 'Express Turnaround',
    icon: 'wand2',
    displayOrder: 4,
    isEnabled: true,
  },
  {
    title: 'Panel Replacement',
    description: 'Original quarter panels, bonnets, wings, door skins and spot-welding according to factory bulletins.',
    badge: 'Genuine Parts',
    footnote: 'Factory Tolerance',
    icon: 'wrench',
    displayOrder: 5,
    isEnabled: true,
  },
  {
    title: 'Alloy Wheel Refurbishment',
    description: 'Diamond-cut CNC resurfacing, severe kerb rash weld repairs, straightening, and powder coating.',
    badge: 'CNC Lathe',
    footnote: 'All Wheel Sizes',
    icon: 'disc',
    displayOrder: 6,
    isEnabled: true,
  },
  {
    title: 'Ceramic Coating & Detailing',
    description:
      'Multi-stage machine paint de-swirling, ultra-hard 9H ceramic hydrophobic sealants, and leather rejuvenation.',
    badge: 'Gtechniq Accredited',
    footnote: 'Up to 7 Year Protection',
    icon: 'shield-check',
    displayOrder: 7,
    isEnabled: true,
  },
];

async function seed() {
  const existing = await db.query.homepageCatalogs.findMany();
  if (existing.length > 0) {
    console.log(`Homepage catalogs table already has ${existing.length} rows, skipping seed.`);
    return;
  }

  console.log('Seeding default homepage catalog items...');
  for (const item of SEED_CATALOG_ITEMS) {
    await db.insert(homepageCatalogs).values(item);
  }
  console.log(`Successfully seeded ${SEED_CATALOG_ITEMS.length} homepage catalog items.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
