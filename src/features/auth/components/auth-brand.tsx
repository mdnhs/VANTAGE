import Image from 'next/image';
import { LayoutDashboard } from 'lucide-react';
import { LottieLogo } from '@/components/ui/lottie-logo';
import { cldUrl } from '@/lib/cloudinary/url';

export interface AuthBrandProps {
  businessName: string;
  logoPublicId: string | null;
  logoLottieJson?: string | null;
  logoUseLottie?: boolean;
}

function Mark({ businessName, logoPublicId }: Pick<AuthBrandProps, 'businessName' | 'logoPublicId'>) {
  return logoPublicId ? (
    <Image
      src={cldUrl(logoPublicId, { width: 80, height: 80, crop: 'fit' })}
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
export function AuthBrand({ businessName, logoPublicId, logoLottieJson, logoUseLottie }: AuthBrandProps) {
  return (
    <div className='flex items-center gap-3'>
      {logoUseLottie && logoLottieJson ? (
        <LottieLogo
          data={logoLottieJson}
          alt={businessName}
          className='size-10 object-contain'
          fallback={<Mark businessName={businessName} logoPublicId={logoPublicId} />}
        />
      ) : (
        <Mark businessName={businessName} logoPublicId={logoPublicId} />
      )}
      <div className='flex flex-col leading-tight'>
        <span className='text-base font-semibold tracking-tight'>{businessName}</span>
        <span className='text-xs opacity-70'>Admin</span>
      </div>
    </div>
  );
}
