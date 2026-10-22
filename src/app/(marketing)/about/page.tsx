import { getPageMetadata } from '@/server/queries/get-page-seo';
import { PageJsonLd } from '@/components/seo/page-json-ld';
import { AboutHero } from '@/components/marketing/about-hero';
import { HeritageSection } from '@/components/marketing/heritage-section';
import { TeamSection } from '@/components/marketing/team-section';
import { StandardsSection } from '@/components/marketing/standards-section';
import { resolveAboutPageContent } from '@/features/about-page/content';
import { siteSettingsService } from '@/server/services/site-settings-service';
import { PageAnimations } from '@/components/marketing/page-animations';

export async function generateMetadata() {
  return getPageMetadata('about');
}

// Content is CMS-driven (Dashboard → About page); blank fields fall back to the design copy.
export default async function AboutPage() {
  const settings = await siteSettingsService.getPublic();
  const content = resolveAboutPageContent(settings);

  return (
    <>
      <PageJsonLd id='about' />
      <main>
        <AboutHero
          eyebrow={content.heroEyebrow}
          line1={content.heroLine1}
          accent1={content.heroAccent1}
          line2={content.heroLine2}
          accent2={content.heroAccent2}
          image={content.heroImage}
        />
        <HeritageSection
          title={content.heritageTitle}
          text={content.heritageText}
          stat1={{ value: content.heritageStat1Value, label: content.heritageStat1Label }}
          stat2={{ value: content.heritageStat2Value, label: content.heritageStat2Label }}
          image={content.heritageImage}
          quote={content.heritageQuote}
        />
        <TeamSection title={content.teamTitle} subtext={content.teamSubtext} members={content.teamMembers} />
        <StandardsSection
          eyebrow={content.standardsEyebrow}
          title={content.standardsTitle}
          image={content.standardsImage}
          items={content.standardsItems}
        />
        <PageAnimations />
      </main>
    </>
  );
}
