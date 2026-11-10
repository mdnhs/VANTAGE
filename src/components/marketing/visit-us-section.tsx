import { ChevronRight, Clock, MapPin } from 'lucide-react';
import { Map, MapControls, MapMarker, MarkerContent } from '@/components/ui/map';
import { OpenNowBadge } from '@/components/marketing/open-now-badge';
import {
  SECTION_BG,
  SECTION_CONTAINER,
  SECTION_PADDING,
  SectionHeader,
} from '@/components/marketing/ui/landing-primitives';
import { getSetting } from '@/server/queries/get-setting';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { buildHoursRows } from '@/lib/content/hours-card';
import { formatOpeningHoursSummary } from '@/lib/content/opening-hours';

// Coordinates aren't part of site settings (no lat/lng field on the model), so the pin
// stays hardcoded here — address and hours below are pulled from admin-managed
// settings so they can't drift from what's shown elsewhere on the site.
const GARAGE_LOCATION: [number, number] = [-6.2603, 53.3498];

const ROW = 'flex items-start justify-between gap-4 py-[14px] font-site-body text-[14px] leading-normal';

export async function VisitUsSection() {
  const [settings, microcopy, contact] = await Promise.all([
    siteSettingsService.getPublic(),
    getSetting('microcopy'),
    getSetting('contact'),
  ]);
  const copy = microcopy.visitUs;
  const weekly = contact.hours.weekly;
  const rows = buildHoursRows(weekly, copy.closedDay);
  const bankHolidays = contact.hours.bankHolidays.trim();
  // The editor's map address if there is one; otherwise a directions search for the address.
  const directionsHref =
    contact.mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(settings.address)}`;

  return (
    <section className={`${SECTION_BG.base} sm:bg-[#20252d]`}>
      <div className={`${SECTION_CONTAINER} ${SECTION_PADDING} gap-7 sm:gap-12 lg:gap-16`}>
        <SectionHeader
          eyebrow='Find the workshop'
          title='Visit'
          accent={<span className='block'>us.</span>}
          intro={copy.intro}
        />

        <div className='flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-6'>
          <div className='relative order-1 h-[300px] w-full overflow-hidden rounded-[20px] border border-[#353c47] sm:h-[360px] lg:order-2 lg:h-[364px] lg:min-w-0 lg:flex-1'>
            <div className='absolute inset-0'>
              <Map center={GARAGE_LOCATION} zoom={14} className='h-full w-full' theme='dark'>
                <MapControls />
                <MapMarker longitude={GARAGE_LOCATION[0]} latitude={GARAGE_LOCATION[1]}>
                  <MarkerContent>
                    <div className='relative flex items-center'>
                      {/* Pulsing ring behind the pin; still for visitors who prefer reduced motion */}
                      <span
                        aria-hidden='true'
                        className='absolute top-1/2 left-1/2 size-[140px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/35 motion-safe:animate-[map-pulse_2.4s_ease-out_infinite] motion-reduce:scale-100 motion-reduce:opacity-30'
                      />
                      <span className='relative flex size-[52px] items-center justify-center rounded-full bg-brand text-[#f1f3f6] shadow-[0_8px_24px_color-mix(in_srgb,var(--color-brand)_50%,transparent)]'>
                        <MapPin aria-hidden className='size-6' />
                      </span>
                      <div className='pointer-events-none absolute top-1/2 left-full ml-3.5 flex w-max max-w-[220px] -translate-y-1/2 flex-col gap-1 rounded-xl border border-[#353c47] bg-[#262b34] px-[18px] py-3.5 text-left'>
                        <span className='font-site-heading text-[15px] leading-normal font-bold text-[#f1f3f6]'>
                          {settings.businessName}
                        </span>
                        <span className='font-site-body text-[12px] leading-normal text-[#a4abb6]'>
                          {settings.address}
                        </span>
                      </div>
                    </div>
                  </MarkerContent>
                </MapMarker>
              </Map>
            </div>
          </div>

          {/* The one opening-hours card: the address sits on the map pin */}
          <div className='order-2 flex flex-col gap-1.5 rounded-[20px] border border-[#353c47] bg-[#262b34] p-7 lg:order-1 lg:w-[380px] lg:shrink-0'>
            <div className='flex items-center justify-between gap-3 pb-2'>
              <div className='flex items-center gap-2.5'>
                <Clock aria-hidden className='size-5 shrink-0 text-brand' />
                <h3 className='font-site-heading text-[20px] leading-normal font-bold text-[#f1f3f6]'>
                  {copy.hoursTitle}
                </h3>
              </div>
              {weekly.length > 0 && (
                <OpenNowBadge weekly={weekly} openLabel={copy.openNow} closedLabel={copy.closedNow} />
              )}
            </div>

            {weekly.length > 0 ? (
              <dl className='flex flex-col'>
                {rows.map((row, index) => (
                  <div
                    key={row.label}
                    className={`${ROW} ${index < rows.length - 1 || bankHolidays ? 'border-b border-[#353c47]' : ''}`}
                  >
                    <dt className='text-[#b9bfc9]'>{row.label}</dt>
                    <dd className='font-semibold text-[#f1f3f6]'>{row.value}</dd>
                  </div>
                ))}
                {bankHolidays && (
                  <div className={ROW}>
                    <dt className='text-[#b9bfc9]'>{copy.bankHolidaysLabel}</dt>
                    <dd className='text-right font-semibold text-[#f1f3f6]'>{bankHolidays}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className='py-[14px] font-site-body text-[14px] leading-normal text-[#b9bfc9]'>
                {formatOpeningHoursSummary(settings.openingHours)}
              </p>
            )}

            <a
              href={directionsHref}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center justify-center gap-2.5 rounded-lg border border-[#3e4551] bg-[#20252d] py-4 pr-[22px] pl-6 font-site-body text-[13px] leading-normal font-semibold tracking-[1.04px] text-[#f1f3f6] uppercase transition-colors hover:border-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none'
            >
              {copy.directionsLabel}
              <ChevronRight aria-hidden className='size-[18px]' />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
