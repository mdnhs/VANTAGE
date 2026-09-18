import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { projects } from './schema/projects';
import { services } from './schema/services';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ASSET_DIR = path.join(process.cwd(), 'public/assets/marketing');
const FOLDER = 'vantage/seed';

// Fixed public_id + overwrite:false makes re-runs reuse the same asset instead of duplicating.
async function upload(file: string): Promise<string> {
  const publicId = file.replace(/\.[^.]+$/, '');
  const res = await cloudinary.uploader.upload(path.join(ASSET_DIR, file), {
    folder: FOLDER,
    public_id: publicId,
    overwrite: false,
    resource_type: 'image',
  });
  return res.public_id;
}

const SERVICE_CONTENT: Record<string, { image: string; checklist: string[] }> = {
  'crash-collision-repair': {
    image: 'service-crash-repair.jpg',
    checklist: ['Structural Realignment', 'Laser Chassis Measuring', 'Factory Panel Welding'],
  },
  'dent-repair-pdr': {
    image: 'service-dent-repair.jpg',
    checklist: ['Paintless Dent Removal', 'Zero Filler Used', 'Same Day Turnaround'],
  },
  'precision-spray-painting': {
    image: 'service-paintwork.jpg',
    checklist: ['Computerized Color Matching', 'Multi-stage Clearcoat', 'Infrared Curing'],
  },
  'full-vehicle-resprays': {
    image: 'service-paintwork.jpg',
    checklist: ['Bare-metal Strip Down', 'Colour Change Resprays', 'Concours Grade Finish'],
  },
  'scratch-scuff-correction': {
    image: 'service-scratch-repair.jpg',
    checklist: ['Bumper Scuff Repair', 'Key Scratch Removal', 'Express Turnaround'],
  },
  'panel-replacement': {
    image: 'service-crash-repair.jpg',
    checklist: ['Genuine OEM Panels', 'Spot-welding to Factory Spec', 'Factory Panel Gaps'],
  },
  'alloy-wheel-refurbishment': {
    image: 'service-scratch-repair.jpg',
    checklist: ['Diamond-cut CNC Resurfacing', 'Kerb Rash Weld Repair', 'Powder Coating'],
  },
  'ceramic-coating-detailing': {
    image: 'service-paintwork.jpg',
    checklist: ['Multi-stage Paint Correction', '9H Ceramic Coating', 'Leather Rejuvenation'],
  },
};

const PROJECTS = [
  {
    slug: 'audi-rs6-avant-full-respray',
    title: 'Audi RS6 Avant Full Respray',
    vehicleModel: '2022 Audi RS6 Avant',
    serviceCategory: 'Respray',
    before: 'project-audi-rs6-before.jpg',
    after: 'project-audi-rs6-after.jpg',
    description: 'Complete bare-metal respray in Nardo Grey with multi-stage clearcoat and infrared curing.',
    completedAt: '2026-06-12',
    isFeatured: true,
  },
  {
    slug: 'bmw-3-series-collision-repair',
    title: 'BMW 3 Series Collision Repair',
    vehicleModel: '2021 BMW 330e',
    serviceCategory: 'Crash Repair',
    before: 'project-bmw-3-series-before.jpg',
    after: 'project-bmw-3-series-after.jpg',
    description: 'Front-end structural repair with laser chassis realignment and OEM panel replacement.',
    completedAt: '2026-05-03',
    isFeatured: true,
  },
  {
    slug: 'land-rover-defender-bodywork',
    title: 'Land Rover Defender Bodywork',
    vehicleModel: '2023 Land Rover Defender 110',
    serviceCategory: 'Bodywork',
    before: 'project-defender-before.jpg',
    after: 'project-defender-after.jpg',
    description: 'Side impact panel repair and colour-matched blend across three panels.',
    completedAt: '2026-04-18',
    isFeatured: true,
  },
  {
    slug: 'porsche-911-paint-restoration',
    title: 'Porsche 911 Paint Restoration',
    vehicleModel: '1998 Porsche 911 Carrera',
    serviceCategory: 'Restoration',
    before: 'project-porsche-911-before.jpg',
    after: 'project-porsche-911-after.jpg',
    description: 'Classic restoration with rust treatment, bare-metal prep and a factory-correct Guards Red finish.',
    completedAt: '2026-03-07',
    isFeatured: false,
  },
];

async function seed() {
  console.log('Uploading seed images to Cloudinary...');
  const files = new Set<string>();
  Object.values(SERVICE_CONTENT).forEach((c) => files.add(c.image));
  PROJECTS.forEach((p) => {
    files.add(p.before);
    files.add(p.after);
  });
  const ids = new Map<string, string>();
  for (const file of files) ids.set(file, await upload(file));

  for (const [slug, content] of Object.entries(SERVICE_CONTENT)) {
    await db
      .update(services)
      .set({ imagePublicId: ids.get(content.image), checklist: content.checklist })
      .where(eq(services.slug, slug));
  }
  console.log(`Updated ${Object.keys(SERVICE_CONTENT).length} services with image + checklist.`);

  const existing = await db.query.projects.findMany();
  if (existing.length > 0) {
    console.log(`Projects table already has ${existing.length} rows, skipping project seed.`);
    return;
  }
  for (const [index, p] of PROJECTS.entries()) {
    await db.insert(projects).values({
      slug: p.slug,
      title: p.title,
      vehicleModel: p.vehicleModel,
      serviceCategory: p.serviceCategory,
      beforeImagePublicId: ids.get(p.before)!,
      afterImagePublicId: ids.get(p.after)!,
      description: p.description,
      completedAt: new Date(p.completedAt),
      isFeatured: p.isFeatured,
      status: 'published',
      displayOrder: index,
    });
  }
  console.log(`Seeded ${PROJECTS.length} projects.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
