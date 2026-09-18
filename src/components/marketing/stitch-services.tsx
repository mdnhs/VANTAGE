import Image from 'next/image';
import Link from 'next/link';
import {
  CarFront,
  Bandage,
  PaintRoller,
  Palette,
  Wand2,
  Wrench,
  Disc,
  ShieldCheck,
  Car,
  Sparkles,
  Shield,
  Flame,
  ArrowRight,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { cldUrl } from '@/lib/cloudinary/url';
import type { ServicePublic } from '@/features/services/types';
import type { HomepageCatalogPublic } from '@/features/homepage-catalogs/types';

// Shown for services created without an uploaded icon, cycled by position.
const FALLBACK_ICONS = [CarFront, Bandage, PaintRoller, Palette, Wand2, Wrench, Disc, ShieldCheck];

const ICON_MAP: Record<string, LucideIcon> = {
  'car-front': CarFront,
  bandage: Bandage,
  'paint-roller': PaintRoller,
  palette: Palette,
  wand2: Wand2,
  wrench: Wrench,
  disc: Disc,
  'shield-check': ShieldCheck,
  car: Car,
  sparkles: Sparkles,
  shield: Shield,
  flame: Flame,
};

interface ServiceCard {
  key: string;
  name: string;
  description: string;
  badge: string | null;
  footnote: string;
  icon: LucideIcon;
  iconPublicId: string | null;
}

// Design catalogue, rendered until items are published from the CMS.
const DEFAULT_SERVICES: ServiceCard[] = [
  [
    'Crash & Collision Repair',
    'Major accident reconstruction, hydraulic bench pull, and laser structural chassis realignment.',
    'OEM Certified',
    'Insurance Approved',
  ],
  [
    'Dent Repair & PDR',
    'Paintless dent removal for parking dings and creases preserving factory original paint integrity.',
    'Same Day PDR',
    'Zero Filler Used',
  ],
  [
    'Precision Spray Painting',
    'Computerized spectrophotometer color scanning, multi-stage pearls, metallic lacquers and infrared curing.',
    'Spectral Match',
    '100% Match Guarantee',
  ],
  [
    'Full Vehicle Resprays',
    'Complete bare-metal strip downs, glass-out color changes, matte transitions and bespoke finishes.',
    'Concours Grade',
    'Bespoke & Classic',
  ],
  [
    'Scratch & Scuff Correction',
    'Targeted bumper corner scuffs, vandal key scratches, and localized high-blend micro-repairs.',
    'SMART Repair',
    'Express Turnaround',
  ],
  [
    'Panel Replacement',
    'Original quarter panels, bonnets, wings, door skins and spot-welding according to factory bulletins.',
    'Genuine Parts',
    'Factory Tolerance',
  ],
  [
    'Alloy Wheel Refurbishment',
    'Diamond-cut CNC resurfacing, severe kerb rash weld repairs, straightening, and powder coating.',
    'CNC Lathe',
    'All Wheel Sizes',
  ],
  [
    'Ceramic Coating & Detailing',
    'Multi-stage machine paint de-swirling, ultra-hard 9H ceramic hydrophobic sealants, and leather rejuvenation.',
    'Gtechniq Accredited',
    'Up to 7 Year Protection',
  ],
].map(([name, description, badge, footnote], i) => ({
  key: name,
  name,
  description,
  badge,
  footnote,
  icon: FALLBACK_ICONS[i],
  iconPublicId: null,
}));

function toCard(service: ServicePublic, index: number): ServiceCard {
  return {
    key: service.id,
    name: service.name,
    description: service.description,
    badge: service.startingPrice != null ? `From €${service.startingPrice}` : null,
    footnote: 'Free Estimate',
    icon: FALLBACK_ICONS[index % FALLBACK_ICONS.length],
    iconPublicId: service.iconPublicId,
  };
}

function catalogItemToCard(item: HomepageCatalogPublic, index: number): ServiceCard {
  return {
    key: item.id,
    name: item.title,
    description: item.description,
    badge: item.badge,
    footnote: item.footnote || 'Free Estimate',
    icon: (item.icon && ICON_MAP[item.icon]) || FALLBACK_ICONS[index % FALLBACK_ICONS.length],
    iconPublicId: item.iconPublicId,
  };
}

interface StitchServicesProps {
  catalogItems?: HomepageCatalogPublic[];
  services?: ServicePublic[];
  eyebrow?: string | null;
  headlineLine1?: string | null;
  headlineAccent?: string | null;
  subtext?: string | null;
}

export function StitchServices({
  catalogItems,
  services,
  eyebrow,
  headlineLine1,
  headlineAccent,
  subtext,
}: StitchServicesProps) {
  const cards =
    catalogItems && catalogItems.length > 0
      ? catalogItems.map(catalogItemToCard)
      : services && services.length > 0
        ? services.map(toCard)
        : DEFAULT_SERVICES;

  const displayEyebrow = eyebrow || 'Specialist Autobody Divisions';
  const displayLine1 = headlineLine1 || 'From Damage To';
  const displayAccent = headlineAccent || 'Showroom Finish.';
  const displaySubtext =
    subtext ||
    'Comprehensive automotive bodywork, structural restoration, and cosmetic refinement using factory-approved techniques.';

  return (
    <section id='services' className='container mx-auto px-6 py-24 sm:px-12'>
      {/* Header */}
      <div className='mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <span className='flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-[#dc2626] uppercase'>
            <span className='h-px w-6 bg-[#dc2626]' />
            {displayEyebrow}
          </span>
          <h2 className='font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-tight text-white uppercase lg:text-[40px] lg:leading-[48px]'>
            {displayLine1} <br />
            <span className='text-[#dc2626]'>{displayAccent}</span>
          </h2>
          <p className='text-base leading-6 text-neutral-400'>{displaySubtext}</p>
        </div>

        <div className='flex items-center gap-3'>
          <Link
            href='/services'
            className='flex items-center gap-2 rounded border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs tracking-widest text-neutral-300 uppercase transition-all hover:border-[#dc2626] hover:text-white'
          >
            <span>Browse Full Catalog</span>
            <ArrowUpRight className='size-3.5' />
          </Link>
        </div>
      </div>

      {/* Services Grid */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className='group relative flex flex-col justify-between rounded-lg border border-white/10 bg-[#161616] p-6 transition-all duration-300 hover:border-[#dc2626]/60 hover:shadow-[0_8px_30px_rgba(220,38,38,0.15)]'
            >
              <div>
                <div className='mb-5 flex items-center justify-between'>
                  <div className='flex size-12 items-center justify-center rounded-md bg-[#2a2a2a] text-[#dc2626] transition-all group-hover:scale-105 group-hover:bg-[#dc2626] group-hover:text-white'>
                    {card.iconPublicId ? (
                      <Image
                        src={cldUrl(card.iconPublicId, { width: 48, height: 48 })}
                        alt=''
                        width={24}
                        height={24}
                        className='size-6'
                      />
                    ) : (
                      <Icon className='size-6' />
                    )}
                  </div>
                  {card.badge && (
                    <span className='rounded border border-white/5 bg-white/5 px-2 py-1 font-mono text-[10px] text-neutral-400 uppercase'>
                      {card.badge}
                    </span>
                  )}
                </div>

                <h3 className='mb-2 font-[family-name:var(--font-manrope)] text-2xl leading-8 font-semibold text-white transition-colors group-hover:text-[#ffb4ab]'>
                  {card.name}
                </h3>
                <p className='mb-4 text-base leading-6 text-neutral-400'>{card.description}</p>
              </div>

              <div className='flex items-center justify-between border-t border-white/5 pt-4 text-xs'>
                <span className='font-mono text-[11px] text-neutral-500'>{card.footnote}</span>
                <a
                  href='#estimator'
                  className='flex items-center gap-1 font-semibold text-[#dc2626] transition-transform group-hover:translate-x-1'
                >
                  Quote <ArrowRight className='size-3' />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
