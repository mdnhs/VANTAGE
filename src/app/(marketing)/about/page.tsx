import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Vantage.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className='flex flex-1 items-center justify-center p-16'>
      <h1 className='text-3xl font-semibold'>About</h1>
    </div>
  );
}
