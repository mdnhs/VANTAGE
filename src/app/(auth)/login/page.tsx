import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';
import { siteSettingsService } from '@/server/services/site-settings-service';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false, nocache: true },
};

export default async function LoginPage() {
  const settings = await siteSettingsService.getPublic();

  return (
    <LoginForm
      businessName={settings.businessName?.trim() || 'Vantage Admin'}
      logoPublicId={'logoPublicId' in settings ? settings.logoPublicId : null}
      logoLottieJson={'logoLottieJson' in settings ? settings.logoLottieJson : null}
      logoUseLottie={'logoUseLottie' in settings ? Boolean(settings.logoUseLottie) : false}
    />
  );
}
