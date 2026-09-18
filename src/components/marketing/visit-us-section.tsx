import Image from 'next/image';
import { Map, MapControls, MapMarker, MarkerPopup } from '@/components/ui/map';
import { siteSettingsService } from '@/server/services/site-settings-service';

// Coordinates aren't part of site settings (no lat/lng field on the model), so the pin
// stays hardcoded here — address and hours text below are pulled from admin-managed
// settings so they can't drift from what's shown elsewhere on the site.
const GARAGE_LOCATION: [number, number] = [-6.2603, 53.3498];

export async function VisitUsSection() {
  const settings = await siteSettingsService.getPublic();

  return (
    <div className='intersect-once relative h-[400px] w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] lg:h-[500px] intersect:motion-preset-slide-up'>
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

      <div className='pointer-events-none absolute bottom-6 left-6 flex flex-col gap-2 rounded-xl border border-white/10 bg-[#131313]/90 p-6 shadow-lg backdrop-blur-md'>
        <span className='font-[family-name:var(--font-manrope)] text-2xl font-semibold tracking-[-0.6px] text-[#e5e2e1] uppercase'>
          Visit Us
        </span>
        <div className='flex items-center gap-2'>
          <Image src='/assets/marketing/icon-visit-clock.svg' alt='' width={12} height={12} className='size-3' />
          <span className='text-base text-[#e6bdb8]'>{settings.openingHours}</span>
        </div>
        <div className='flex items-center gap-2'>
          <Image src='/assets/marketing/icon-visit-pin.svg' alt='' width={11} height={12} className='h-3 w-[11px]' />
          <span className='text-base text-[#e6bdb8]'>{settings.address}</span>
        </div>
      </div>
    </div>
  );
}
