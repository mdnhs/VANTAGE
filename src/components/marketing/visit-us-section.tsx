import { Clock, MapPin } from 'lucide-react';
import { Map, MapControls, MapMarker, MarkerPopup } from '@/components/ui/map';
import {
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
  SectionHeader,
} from '@/components/marketing/ui/landing-primitives';
import { getSetting } from '@/server/queries/get-setting';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { formatOpeningHoursSummary } from '@/features/site-settings/lib/opening-hours';

// Coordinates aren't part of site settings (no lat/lng field on the model), so the pin
// stays hardcoded here — address and hours text below are pulled from admin-managed
// settings so they can't drift from what's shown elsewhere on the site.
const GARAGE_LOCATION: [number, number] = [-6.2603, 53.3498];

const DETAIL_ROW =
  'flex items-start gap-2.5 font-[family-name:var(--font-inter)] text-[14px] leading-[22px] text-[#b5b5b5]';

export async function VisitUsSection() {
  const [settings, microcopy] = await Promise.all([siteSettingsService.getPublic(), getSetting('microcopy')]);

  return (
    <section className={SECTION_BG.raised}>
      <div className={`${SECTION_CONTAINER} ${SECTION_PADDING} gap-12 lg:gap-16`}>
        <SectionHeader eyebrow='Find the workshop' title='Visit' accent='us.' intro={microcopy.visitUs.intro} />

        <div className='relative h-[420px] w-full overflow-hidden rounded-[20px] border border-[#2a2a30] lg:h-[520px]'>
          <Map center={GARAGE_LOCATION} zoom={14} className='h-full w-full' theme='dark'>
            <MapControls />
            <MapMarker longitude={GARAGE_LOCATION[0]} latitude={GARAGE_LOCATION[1]} color='#dc2626'>
              <MarkerPopup>
                <div className='flex flex-col gap-1 p-1 text-[#131313]'>
                  <span className='font-[family-name:var(--font-manrope)] text-sm font-semibold'>
                    {settings.businessName}
                  </span>
                  <span className='text-xs'>{settings.address}</span>
                </div>
              </MarkerPopup>
            </MapMarker>
          </Map>

          <div className='pointer-events-none absolute right-4 bottom-4 left-4 flex flex-col gap-3 rounded-2xl border border-[#2a2a30] bg-[#1b1b20]/95 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:right-auto sm:bottom-6 sm:left-6 sm:max-w-[380px] sm:p-6'>
            <span className='font-[family-name:var(--font-manrope)] text-[20px] leading-[26px] font-extrabold tracking-[-0.4px] text-white uppercase'>
              {settings.businessName}
            </span>
            <div className={DETAIL_ROW}>
              <Clock aria-hidden className='mt-[3px] size-4 shrink-0 text-[#dc2626]' />
              <span>{formatOpeningHoursSummary(settings.openingHours)}</span>
            </div>
            <div className={DETAIL_ROW}>
              <MapPin aria-hidden className='mt-[3px] size-4 shrink-0 text-[#dc2626]' />
              <span>{settings.address}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
