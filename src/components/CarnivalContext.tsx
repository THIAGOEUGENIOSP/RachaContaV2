import React, { createContext, useContext, ReactNode } from 'react';
import { useActiveCarnival } from '../hooks/useActiveCarnival';

interface CarnivalContextType {
  carnival: {
    id: string;
    name: string;
    year: number;
    start_date: string;
    end_date: string;
  } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CarnivalContext = createContext<CarnivalContextType | undefined>(undefined);

export function CarnivalProvider({ children }: { children: ReactNode }) {
  const carnivalData = useActiveCarnival();

  return (
    <CarnivalContext.Provider value={carnivalData}>
      {children}
    </CarnivalContext.Provider>
  );
}

export function useCarnivalContext() {
  const context = useContext(CarnivalContext);
  if (context === undefined) {
    throw new Error('useCarnivalContext must be used within a CarnivalProvider');
  }
  return context;
}