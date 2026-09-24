import { manrope, inter } from '@/lib/font';
import { StitchHeader } from '@/components/marketing/stitch-header';
import { StitchCta } from '@/components/marketing/stitch-cta';
import { MarketingFooter } from '@/components/marketing/footer';
import { siteSettingsService } from '@/server/services/site-settings-service';

// One navbar + closing CTA + footer for every public page; contact details come from CMS site settings.
export default async function MarketingLayout({ children }: LayoutProps<'/'>) {
  const settings = await siteSettingsService.getPublic();

  return (
    <div
      className={`${manrope.variable} ${inter.variable} min-w-0 overflow-x-clip bg-[#131313] font-[family-name:var(--font-inter)]`}
    >
      <StitchHeader
        phone={settings.phone}
        businessName={settings.businessName}
        logoPublicId={settings.logoPublicId}
        logoLottieUrl={settings.logoLottieUrl}
        logoUseLottie={'logoUseLottie' in settings ? Boolean(settings.logoUseLottie) : false}
      />
      {children}
      <StitchCta phone={settings.phone} />
      <MarketingFooter />
    </div>
  );
}
