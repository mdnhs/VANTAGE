import { manrope, inter } from '@/lib/font';
import { StitchHeader } from '@/components/marketing/stitch-header';
import { StitchCta } from '@/components/marketing/stitch-cta';
import { MarketingFooter } from '@/components/marketing/footer';
import { CookieSettingsSlot } from '@/features/tracking/components/cookie-settings-slot';
import { SiteThemeStyle } from '@/features/appearance/components/site-theme-style';
import { MarketingTracking } from '@/features/tracking/components/marketing-tracking';
import { SupportWidget } from '@/features/support/components/widget/support-widget';
import { ButtonRevealLayer } from '@/components/marketing/button-reveal-layer';
import { RouteFade } from '@/components/marketing/route-fade';
import { SmoothScroll } from '@/components/providers/smooth-scroll';
import { getSetting } from '@/server/queries/get-setting';
import { getSupportRetentionMonths } from '@/server/queries/get-support-retention';
import { siteSettingsService } from '@/server/services/site-settings-service';

// One navbar + closing CTA + footer for every public page; contact details come from CMS site settings.
export default async function MarketingLayout({ children }: LayoutProps<'/'>) {
  const [settings, navigation, chatRetentionMonths] = await Promise.all([
    siteSettingsService.getPublic(),
    getSetting('navigation'),
    getSupportRetentionMonths(),
  ]);

  return (
    <div className={`${manrope.variable} ${inter.variable} min-w-0 overflow-x-clip bg-[#131313] font-site-body`}>
      <SiteThemeStyle />
      <SmoothScroll />
      <StitchHeader
        navigation={navigation}
        phone={settings.phone}
        phoneHref={settings.phoneHref}
        businessName={settings.businessName}
        logo={settings.logo}
        logoLottieJson={'logoLottieJson' in settings ? settings.logoLottieJson : null}
        logoUseLottie={'logoUseLottie' in settings ? Boolean(settings.logoUseLottie) : false}
      />
      <div data-route-content>
        {children}
        <StitchCta phone={settings.phone} />
        <MarketingFooter cookieSettings={<CookieSettingsSlot />} />
      </div>
      <MarketingTracking />
      <SupportWidget retentionMonths={chatRetentionMonths} />
      <ButtonRevealLayer />
      <RouteFade />
    </div>
  );
}
