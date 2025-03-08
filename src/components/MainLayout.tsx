import React, { useState } from 'react';
import { SideMenu } from './SideMenu';
import { CarnivalManager } from './CarnivalManager';
import { CarnivalMenu } from './CarnivalMenu';
import { Overview } from './Overview';
import { Participants } from './Participants';
import { Expenses } from './Expenses';
import { Balances } from './Balances';
import { Payments } from './Payments';
import { Contributions } from './Contributions';
import { RegisteredParticipants } from './RegisteredParticipants';
import { ShoppingList } from './ShoppingList';
import { Reports } from './Reports';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { useCarnivalContext } from './CarnivalContext';
import { supabase } from '../lib/supabase';

export const MainLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState('carnivals');
  const [selectedCarnivalId, setSelectedCarnivalId] = useState<string | null>(null);
  const { carnival, loading, error } = useCarnivalContext();

  const handleCarnivalSelect = (carnivalId: string | null) => {
    setSelectedCarnivalId(carnivalId);
    if (carnivalId) {
      setActiveSection('overview');
    } else {
      setActiveSection('carnivals');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner message="Carregando..." />;
    }

    if (error) {
      return <ErrorMessage message={error} />;
    }

    if (activeSection === 'carnivals') {
      return <CarnivalManager onCarnivalSelect={handleCarnivalSelect} />;
    }

    if (activeSection === 'registered-participants') {
      return <RegisteredParticipants />;
    }

    if (activeSection === 'contributions') {
      return <Contributions supabase={supabase} />;
    }

    if (!selectedCarnivalId && !carnival && activeSection !== 'contributions' && activeSection !== 'registered-participants') {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Selecione um carnaval para começar</p>
        </div>
      );
    }

    const carnivalId = selectedCarnivalId || carnival?.id;

    return (
      <>
        <CarnivalMenu 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          carnivalName={carnival?.name}
        />

        <div className="container mx-auto px-4">
          {(() => {
            switch (activeSection) {
              case 'overview':
                return <Overview carnivalId={carnivalId} />;
              case 'participants':
                return <Participants carnivalId={carnivalId} />;
              case 'expenses':
                return <Expenses carnivalId={carnivalId} supabase={supabase} />;
              case 'balances':
                return <Balances carnivalId={carnivalId} supabase={supabase} />;
              case 'payments':
                return <Payments carnivalId={carnivalId} supabase={supabase} />;
              case 'shopping-list':
                return <ShoppingList carnivalId={carnivalId} supabase={supabase} />;
              case 'reports':
                return <Reports carnivalId={carnivalId} supabase={supabase} />;
              default:
                return <Overview carnivalId={carnivalId} />;
            }
          })()}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <SideMenu 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
      
      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <main className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};