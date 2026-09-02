import { manrope, inter } from '@/lib/font';

export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className={`${manrope.variable} ${inter.variable} bg-[#131313] font-[family-name:var(--font-inter)]`}>
      {children}
    </div>
  );
}
