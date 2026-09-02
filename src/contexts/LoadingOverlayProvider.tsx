'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingOverlayContextValue {
  show: () => void;
  hide: () => void;
  isVisible: boolean;
}

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(null);

export function useLoadingOverlay() {
  const ctx = useContext(LoadingOverlayContext);
  if (!ctx) throw new Error('useLoadingOverlay must be used within LoadingOverlayProvider');
  return ctx;
}

export default function LoadingOverlayProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <LoadingOverlayContext.Provider
      value={{ show: () => setIsVisible(true), hide: () => setIsVisible(false), isVisible }}
    >
      {children}
      {isVisible && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </div>
      )}
    </LoadingOverlayContext.Provider>
  );
}
