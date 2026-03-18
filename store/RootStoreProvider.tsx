'use client';

import { ReactNode, createContext, useContext } from 'react';
import { rootStore } from './rootStore';

const StoreContext = createContext<typeof rootStore | null>(null);

export function RootStoreProvider({ children }: { children: ReactNode }) {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>;
}

export function useStores() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStores must be used within RootStoreProvider');
  return context;
}