'use client';

import { createContext, useContext, type ReactNode } from 'react';

const InsuranceContext = createContext(false);

// The admin's "Show the Insurance page" switch, for client components (the server reads it with
// getInsuranceEnabled). Off outside a provider.
export function InsuranceProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <InsuranceContext.Provider value={enabled}>{children}</InsuranceContext.Provider>;
}

export const useInsuranceEnabled = (): boolean => useContext(InsuranceContext);
