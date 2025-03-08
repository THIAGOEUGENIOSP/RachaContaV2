import React from 'react';
import { CarnivalProvider } from './components/CarnivalContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MainLayout } from './components/MainLayout';

function App() {
  return (
    <ErrorBoundary>
      <CarnivalProvider>
        <MainLayout />
      </CarnivalProvider>
    </ErrorBoundary>
  );
}

export default App;