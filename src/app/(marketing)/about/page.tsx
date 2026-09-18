import type { Metadata } from 'next';
import { AboutHero } from '@/components/marketing/about-hero';
import { HeritageSection } from '@/components/marketing/heritage-section';
import { TeamSection } from '@/components/marketing/team-section';
import { StandardsSection } from '@/components/marketing/standards-section';
import { resolveAboutContent } from '@/features/about-page/defaults';
import { siteSettingsService } from '@/server/services/site-settings-service';

export const metadata: Metadata = {
  title: 'About',
  description:
    "Founded in 1998, Vantage Autobody has evolved into Ireland's premier high-end collision and repair facility.",
  alternates: { canonical: '/about' },
};

// Content is CMS-driven (Dashboard → About page); blank fields fall back to the design copy.
export default async function AboutPage() {
  const settings = await siteSettingsService.getPublic();
  const content = resolveAboutContent(settings);

  return (
    <>
      <main>
        <AboutHero
          eyebrow={content.heroEyebrow}
          line1={content.heroLine1}
          accent1={content.heroAccent1}
          line2={content.heroLine2}
          accent2={content.heroAccent2}
          imagePublicId={content.heroImagePublicId}
        />
        <HeritageSection
          title={content.heritageTitle}
          text={content.heritageText}
          stat1={{ value: content.heritageStat1Value, label: content.heritageStat1Label }}
          stat2={{ value: content.heritageStat2Value, label: content.heritageStat2Label }}
          imagePublicId={content.heritageImagePublicId}
          quote={content.heritageQuote}
        />
        <TeamSection title={content.teamTitle} subtext={content.teamSubtext} members={content.teamMembers} />
        <StandardsSection
          eyebrow={content.standardsEyebrow}
          title={content.standardsTitle}
          imagePublicId={content.standardsImagePublicId}
          items={content.standardsItems}
        />
      </main>
    </>
  );
}
