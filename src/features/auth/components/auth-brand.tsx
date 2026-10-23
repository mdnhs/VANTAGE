import Image from 'next/image';
import { LayoutDashboard } from 'lucide-react';
import { LottieLogo } from '@/components/ui/lottie-logo';
import { sizedSrc, type PublicImage } from '@/lib/media/public-image';

export interface AuthBrandProps {
  businessName: string;
  logo: PublicImage | null;
  logoLottieJson?: string | null;
  logoUseLottie?: boolean;
}

function Mark({ businessName, logo }: Pick<AuthBrandProps, 'businessName' | 'logo'>) {
  return logo ? (
    <Image
      src={sizedSrc(logo, 'w_80,h_80,c_fit')}
      alt={businessName}
      width={40}
      height={40}
      className='size-10 object-contain'
    />
  ) : (
    <div className='flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
      <LayoutDashboard className='size-5' />
    </div>
  );
}

// The site's logo (Cloudinary image or Lottie, from site settings) with the business name.
export function AuthBrand({ businessName, logo, logoLottieJson, logoUseLottie }: AuthBrandProps) {
  return (
    <div className='flex items-center gap-3'>
      {logoUseLottie && logoLottieJson ? (
        <LottieLogo
          data={logoLottieJson}
          alt={businessName}
          className='size-10 object-contain'
          fallback={<Mark businessName={businessName} logo={logo} />}
        />
      ) : (
        <Mark businessName={businessName} logo={logo} />
      )}
      <div className='flex flex-col leading-tight'>
        <span className='text-base font-semibold tracking-tight'>{businessName}</span>
        <span className='text-xs opacity-70'>Admin</span>
      </div>
    </div>
  );
}
