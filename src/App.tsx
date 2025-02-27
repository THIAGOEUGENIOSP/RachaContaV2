import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SideMenu } from './components/SideMenu';
import { Overview } from './components/Overview';
import { Participants } from './components/Participants';
import { Expenses } from './components/Expenses';
import { Balances } from './components/Balances';
import { Payments } from './components/Payments';
import { ShoppingList } from './components/ShoppingList';
import { Reports } from './components/Reports';
import { Database } from './types/supabase';
import { AlertCircle } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    // Check if Supabase connection is working
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('participants').select('count');
        if (!error) {
          setIsSupabaseConnected(true);
        } else {
          console.error('Supabase connection error:', error);
        }
      } catch (error) {
        console.error('Supabase connection error:', error);
      }
    };

    checkConnection();
  }, []);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview supabase={supabase} />;
      case 'participants':
        return <Participants supabase={supabase} />;
      case 'expenses':
        return <Expenses supabase={supabase} />;
      case 'balances':
        return <Balances supabase={supabase} />;
      case 'payments':
        return <Payments supabase={supabase} />;
      case 'shopping-list':
        return <ShoppingList supabase={supabase} />;
      case 'reports':
        return <Reports supabase={supabase} />;
      default:
        return <Overview supabase={supabase} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <SideMenu activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        {!isSupabaseConnected && (
          <div className="bg-yellow-100 p-4 flex items-center text-yellow-800 mb-4">
            <AlertCircle className="mr-2 flex-shrink-0" size={20} />
            <p className="text-sm">
              Conecte-se ao Supabase para usar todas as funcionalidades. Clique no botão "Connect to Supabase" no canto superior direito.
            </p>
          </div>
        )}
        
        <main className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}

export default App;