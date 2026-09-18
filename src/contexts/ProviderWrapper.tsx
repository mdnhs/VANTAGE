'use client';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { QueryProvider } from '@/contexts/QueryProvider';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import LoadingOverlayProvider from '@/contexts/LoadingOverlayProvider';
import IntersectObserverProvider from '@/contexts/IntersectObserverProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
// import { YourAuthProvider } from 'your-auth-library'; // TODO: add auth provider when implemented
import { ReactNode } from 'react';

export default function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <QueryProvider>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          {/* TODO: wrap with your auth provider when auth is implemented */}
          <TooltipProvider>
            <LoadingOverlayProvider>
              <IntersectObserverProvider>{children}</IntersectObserverProvider>
            </LoadingOverlayProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryProvider>
    </NuqsAdapter>
  );
}
